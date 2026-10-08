import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Theme from '../../../theme';
import SelectableChip from '../../../components/SelectableChip';
import { ResultCard, initials } from '../../../components/playMap/ResultCard';
import { FilterSheet } from '../../../components/playMap/FilterSheet';
import { AreaSheet } from '../../../components/playMap/AreaSheet';
import { PlayerPreview } from '../../../components/playMap/PlayerPreview';
import { clusterResults, DEFAULT_FILTERS, regionChanged } from '../../../services/playMap/model';
import { discoveryReducer, initialModeState } from '../../../services/playMap/state';
import { mockScenario, playMapService } from '../../../services/playMap/service';
import type {
  Area,
  Filters,
  MapRegion,
  Mode,
  PlayPlayer,
  PlayResult,
} from '../../../services/playMap/types';

export function FindMatches() {
  const navigation = useNavigation();
  const { fontScale } = useWindowDimensions();
  const [mode, setMode] = useState<Mode>('matches');
  const [states, dispatch] = useReducer(discoveryReducer, undefined, () => ({
    matches: initialModeState(),
    players: initialModeState(),
  }));
  const state = states[mode];
  const [sheet, setSheet] = useState<'filters' | 'area' | null>(null);
  const [preview, setPreview] = useState<PlayPlayer | null>(null);
  const resumePreview = useRef<PlayPlayer | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (resumePreview.current) {
        setPreview(resumePreview.current);
        resumePreview.current = null;
      }
    }, []),
  );
  const cameraInitialized = useRef({ matches: false, players: false });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(
    mockScenario === 'location-unavailable' ? 'Device location is unavailable.' : '',
  );
  const [mapSize, setMapSize] = useState({ width: 390, height: 600 });
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList<PlayResult>>(null);
  const requests = useRef({ matches: 0, players: 0 });
  const started = useRef({ matches: false, players: false });
  const alive = useRef(true);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [snapIndex, setSnapIndex] = useState(1);
  const panelHeight = useRef(new Animated.Value(240)).current;
  const dragStart = useRef(240);
  const snaps = useMemo(
    () => [
      Math.min(100 * fontScale, mapSize.height * 0.35),
      Math.max(160, mapSize.height * 0.48),
      mapSize.height * 0.9,
    ],
    [mapSize.height, fontScale],
  );
  const snap = (index: number) => {
    setSnapIndex(index);
    Animated.spring(panelHeight, {
      toValue: snaps[index],
      useNativeDriver: false,
      damping: 25,
      stiffness: 240,
      mass: 1,
    }).start();
  };
  useEffect(() => {
    panelHeight.setValue(snaps[snapIndex]);
  }, [snaps]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(scrollTimer.current);
    };
  }, []);
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () =>
      panelHeight.stopAnimation((value) => {
        dragStart.current = value;
      }),
    onPanResponderMove: (_, gesture) =>
      panelHeight.setValue(Math.max(snaps[0], Math.min(snaps[2], dragStart.current - gesture.dy))),
    onPanResponderRelease: (_, gesture) => {
      const target = dragStart.current - gesture.dy - gesture.vy * 80;
      snap(
        snaps.reduce(
          (best, value, i) =>
            Math.abs(value - target) < Math.abs(snaps[best] - target) ? i : best,
          0,
        ),
      );
    },
    onPanResponderTerminate: () => snap(snapIndex),
  });
  const search = async (targetMode: Mode, region: MapRegion, filters: Filters) => {
    clearTimeout(scrollTimer.current);
    const token = ++requests.current[targetMode];
    started.current[targetMode] = true;
    dispatch({
      mode: targetMode,
      patch: {
        status: 'loading',
        searchedRegion: region,
        filters,
        groupIds: null,
        selectedId: null,
        results: [],
      },
    });
    try {
      const results = await playMapService.search({ mode: targetMode, region, filters });
      if (alive.current && requests.current[targetMode] === token)
        dispatch({ mode: targetMode, patch: { results, status: 'success' } });
    } catch {
      if (alive.current && requests.current[targetMode] === token)
        dispatch({ mode: targetMode, patch: { results: [], status: 'error' } });
    }
  };
  useEffect(() => {
    if (!started.current[mode])
      void search(mode, states[mode].searchedRegion, states[mode].filters);
  }, [mode]);
  const groups = useMemo(
    () => clusterResults(state.results, state.region, mapSize.width, mapSize.height),
    [state.results, state.region, mapSize],
  );
  const visibleResults = state.groupIds
    ? state.results.filter((item) => state.groupIds!.includes(item.id))
    : state.results;
  const dirty = regionChanged(state.region, state.searchedRegion);
  const activeFilters = (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).filter(
    (key) =>
      state.filters[key] !== DEFAULT_FILTERS[key] &&
      (mode === 'matches' ? key !== 'availability' : key !== 'date' && key !== 'time'),
  );
  const patch = (value: Parameters<typeof discoveryReducer>[1]['patch']) =>
    dispatch({ mode, patch: value });
  const applyFilters = (filters: Filters) => {
    setSheet(null);
    void search(mode, state.searchedRegion, filters);
    snap(1);
  };
  const chooseArea = (area: Area) => {
    const region = {
      latitude: area.latitude,
      longitude: area.longitude,
      latitudeDelta: 0.14,
      longitudeDelta: 0.14,
    };
    patch({ region, area: area.label });
    mapRef.current?.animateToRegion(region, 350);
    setSheet(null);
    void search(mode, region, state.filters);
  };
  const locate = async () => {
    setLocating(true);
    setLocationError('');
    try {
      if (mockScenario === 'location-unavailable') throw new Error();
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error();
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!alive.current) return;
      // Recenter moves the camera only. Search this area explicitly commits the new results.
      const region = {
        ...state.region,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      dispatch({ mode, patch: { region } });
      mapRef.current?.animateToRegion(region, 350);
      setSheet(null);
    } catch {
      if (alive.current) {
        setLocationError('Device location is unavailable.');
        setSheet('area');
      }
    } finally {
      if (alive.current) setLocating(false);
    }
  };
  const scrollTo = (index: number) => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(
      () => listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 }),
      200,
    );
  };
  const openResult = (result: PlayResult) => {
    patch({ selectedId: result.id });
    if (result.kind === 'matches')
      navigation.navigate('PlayMapMatchDetail', { matchId: result.id });
    else setPreview(result);
  };
  const create = () => {
    resumePreview.current = preview;
    setPreview(null);
    navigation.navigate('PlayMapCreateMatch', {
      sport:
        preview?.sport ?? (state.filters.sport === 'All sports' ? 'Tennis' : state.filters.sport),
    });
  };
  const expandArea = () => {
    const region = {
      ...state.searchedRegion,
      latitudeDelta: Math.min(state.searchedRegion.latitudeDelta * 2, 4),
      longitudeDelta: Math.min(state.searchedRegion.longitudeDelta * 2, 4),
    };
    patch({ region });
    mapRef.current?.animateToRegion(region, 350);
    void search(mode, region, {
      ...state.filters,
      distance: Math.min(50, state.filters.distance * 2),
    });
  };
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Play Map
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change search area, ${state.area}`}
          onPress={() => setSheet('area')}
          style={styles.area}
        >
          <MaterialCommunityIcons name="map-marker-outline" size={18} color={Theme.PRIMARY} />
          <Text style={styles.areaText}>{state.area}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={Theme.PRIMARY} />
        </Pressable>
        <View style={styles.switch}>
          {(['matches', 'players'] as Mode[]).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              disabled={locating}
              accessibilityState={{ selected: value === mode }}
              accessibilityLabel={value === 'matches' ? 'Matches' : 'Players'}
              onPress={() => {
                cameraInitialized.current[value] = false;
                setMode(value);
                clearTimeout(scrollTimer.current);
              }}
              style={[styles.mode, value === mode && styles.activeMode]}
            >
              <MaterialCommunityIcons
                name={value === 'matches' ? 'tennis' : 'account-group-outline'}
                size={20}
                color={value === mode ? Theme.SURFACE : Theme.PRIMARY}
              />
              <Text style={[styles.modeText, value === mode && { color: Theme.SURFACE }]}>
                {value === 'matches' ? 'Matches' : 'Players'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filters}
      >
        <SelectableChip
          label={`Filters${activeFilters.length ? ` · ${activeFilters.length}` : ''}`}
          icon="tune-variant"
          selected={activeFilters.length > 0}
          onPress={() => setSheet('filters')}
        />
        {(['All sports', 'Tennis', 'Pickleball'] as const).map((sport) => (
          <SelectableChip
            key={sport}
            label={sport}
            selected={state.filters.sport === sport}
            onPress={() => applyFilters({ ...state.filters, sport })}
          />
        ))}
        <SelectableChip
          label={`${state.filters.distance} mi`}
          selected={state.filters.distance !== 10}
          onPress={() => setSheet('filters')}
        />
        {activeFilters
          .filter((key) => key !== 'sport' && key !== 'distance')
          .map((key) => (
            <Button
              key={key}
              icon="close"
              mode="outlined"
              accessibilityLabel={`Clear ${state.filters[key]} filter`}
              onPress={() => applyFilters({ ...state.filters, [key]: DEFAULT_FILTERS[key] })}
            >
              {state.filters[key]}
            </Button>
          ))}
        {!!activeFilters.length && (
          <Button onPress={() => applyFilters({ ...DEFAULT_FILTERS })}>Clear all</Button>
        )}
      </ScrollView>
      <View style={styles.mapContainer} onLayout={(event) => setMapSize(event.nativeEvent.layout)}>
        <MapView
          key={mode}
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={state.region}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          loadingEnabled
          loadingIndicatorColor={Theme.PRIMARY}
          moveOnMarkerPress={false}
          rotateEnabled={false}
          pitchEnabled={false}
          onRegionChangeComplete={(region) => {
            if (!cameraInitialized.current[mode]) {
              cameraInitialized.current[mode] = true;
              patch({
                region,
                ...(!regionChanged(state.region, state.searchedRegion)
                  ? { searchedRegion: region }
                  : {}),
              });
            } else patch({ region });
          }}
        >
          {groups.map((group) => {
            const selected =
              (!!state.selectedId && group.results.some((item) => item.id === state.selectedId)) ||
              (!!state.groupIds && group.results.some((item) => state.groupIds!.includes(item.id)));
            const first = group.results[0];
            return (
              <Marker
                key={`${group.id}-${selected}`}
                coordinate={group.coordinate}
                accessibilityLabel={`${group.results.length} ${mode} at ${group.label}. ${group.results.length > 1 ? 'Open all results at this location' : 'Show result'}`}
                title={`${group.results.length} ${mode} · ${group.label}`}
                zIndex={selected ? 10 : 1}
                onPress={() => {
                  if (group.results.length > 1) {
                    patch({
                      groupIds: group.results.map((item) => item.id),
                      groupLabel: group.label,
                      selectedId: null,
                    });
                    snap(2);
                    scrollTo(0);
                  } else {
                    patch({ groupIds: null, selectedId: first.id });
                    snap(1);
                    scrollTo(state.results.findIndex((item) => item.id === first.id));
                  }
                }}
              >
                <View style={[styles.marker, selected && styles.selectedMarker]}>
                  {group.results.length > 1 ? (
                    <Text style={[styles.markerCount, selected && { color: Theme.SURFACE }]}>
                      {group.results.length}
                    </Text>
                  ) : first.kind === 'players' ? (
                    <Text style={[styles.markerInitials, selected && { color: Theme.SURFACE }]}>
                      {initials(first.name)}
                    </Text>
                  ) : (
                    <MaterialCommunityIcons
                      name={first.sport === 'Tennis' ? 'tennis' : 'table-tennis'}
                      size={23}
                      color={selected ? Theme.SURFACE : Theme.PRIMARY}
                    />
                  )}
                </View>
                <Callout tooltip>
                  <View />
                </Callout>
              </Marker>
            );
          })}
        </MapView>
        {snapIndex < 2 && (
          <View pointerEvents="box-none" style={styles.mapTools}>
            {dirty ? (
              <Button
                mode="contained"
                icon="magnify"
                style={styles.searchButton}
                onPress={() => {
                  patch({
                    area: `Map area (${state.region.latitude.toFixed(2)}, ${state.region.longitude.toFixed(2)})`,
                  });
                  void search(mode, state.region, state.filters);
                }}
              >
                Search this area
              </Button>
            ) : (
              <View pointerEvents="none" style={styles.mapHint}>
                <Text style={styles.mapHintText}>
                  {mode === 'matches'
                    ? 'Find your next game'
                    : 'Approximate areas · not live locations'}
                </Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recenter on current location"
              disabled={locating}
              style={styles.recenter}
              onPress={locate}
            >
              {locating ? (
                <ActivityIndicator size={22} />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color={Theme.PRIMARY} />
              )}
            </Pressable>
          </View>
        )}
        <Animated.View style={[styles.panel, { height: panelHeight }]}>
          <View {...pan.panHandlers}>
            <Pressable
              accessibilityRole="adjustable"
              accessibilityLabel="Results panel"
              accessibilityValue={{
                text: ['Collapsed', 'Partially expanded', 'Expanded'][snapIndex],
              }}
              accessibilityActions={[
                { name: 'increment', label: 'Expand results' },
                { name: 'decrement', label: 'Collapse results' },
              ]}
              onAccessibilityAction={(event) =>
                snap(
                  Math.max(
                    0,
                    Math.min(
                      2,
                      snapIndex + (event.nativeEvent.actionName === 'increment' ? 1 : -1),
                    ),
                  ),
                )
              }
              onPress={() => snap((snapIndex + 1) % 3)}
              style={styles.handleTouch}
            >
              <View style={styles.handle} />
              <View style={styles.panelTitleRow}>
                <Text accessibilityLiveRegion="polite" style={styles.panelTitle}>
                  {state.status === 'loading'
                    ? mode === 'matches'
                      ? 'Finding your next game…'
                      : 'Finding nearby players…'
                    : state.status === 'error'
                      ? 'Let’s reconnect'
                      : `${visibleResults.length} ${mode}${state.groupIds ? ' here' : ' nearby'}`}
                </Text>
                <MaterialCommunityIcons
                  name={snapIndex === 2 ? 'chevron-down' : 'chevron-up'}
                  size={23}
                  color={Theme.PRIMARY}
                />
              </View>
            </Pressable>
          </View>
          {snapIndex !== 0 && state.groupIds && (
            <View style={[styles.groupHeading, { paddingHorizontal: 20 }]}>
              <Text style={styles.locationTitle}>{state.groupLabel}</Text>
              <Button
                icon="arrow-left"
                onPress={() => {
                  patch({ groupIds: null, selectedId: null });
                  scrollTo(0);
                }}
              >
                All {mode}
              </Button>
            </View>
          )}
          {snapIndex !== 0 && (
            <FlatList
              key={mode + (state.groupIds ? '-group' : '-all')}
              ref={listRef}
              data={visibleResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.results}
              extraData={state.selectedId}
              onScrollToIndexFailed={(info) => {
                listRef.current?.scrollToOffset({
                  offset: info.averageItemLength * info.index,
                  animated: false,
                });
                scrollTo(info.index);
              }}
              ListHeaderComponent={
                <>
                  {!state.groupIds && (
                    <Text style={styles.listHint}>
                      {mode === 'players'
                        ? 'Meet someone new. Player pins show approximate areas.'
                        : 'Good games, great company. Pick a match to see more.'}
                    </Text>
                  )}
                  {!!locationError && (
                    <Button icon="map-marker-alert-outline" onPress={() => setSheet('area')}>
                      Location unavailable · Choose area
                    </Button>
                  )}
                </>
              }
              renderItem={({ item }) => (
                <ResultCard
                  result={item}
                  selected={state.selectedId === item.id}
                  onPress={() => openResult(item)}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  {state.status === 'loading' ? (
                    <>
                      <ActivityIndicator size="large" />
                      <Text style={styles.emptyText}>Looking for {mode} in this area…</Text>
                    </>
                  ) : state.status === 'error' ? (
                    <>
                      <MaterialCommunityIcons name="wifi-off" size={32} color={Theme.PRIMARY} />
                      <Text style={styles.emptyTitle}>Couldn’t load {mode}</Text>
                      <Text style={styles.emptyText}>
                        Check your connection and give it another try.
                      </Text>
                      <Button
                        mode="contained"
                        onPress={() => search(mode, state.searchedRegion, state.filters)}
                      >
                        Retry
                      </Button>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="map-search-outline"
                        size={34}
                        color={Theme.PRIMARY}
                      />
                      <Text style={styles.emptyTitle}>A little quiet here</Text>
                      <Text style={styles.emptyText}>
                        No {mode} match this search. Try a little more room or fewer filters.
                      </Text>
                      <Button mode="contained" onPress={() => setSheet('filters')}>
                        Adjust Filters
                      </Button>
                      <Button mode="outlined" onPress={expandArea}>
                        Expand Search Area
                      </Button>
                      {mode === 'matches' && (
                        <Button icon="plus" onPress={create}>
                          Create Match
                        </Button>
                      )}
                    </>
                  )}
                </View>
              }
            />
          )}
        </Animated.View>
      </View>
      {sheet === 'filters' && (
        <FilterSheet
          mode={mode}
          filters={state.filters}
          onApply={applyFilters}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'area' && (
        <AreaSheet
          onSelect={chooseArea}
          onClose={() => setSheet(null)}
          onLocate={locate}
          locating={locating}
          locationError={locationError}
        />
      )}
      {preview && (
        <PlayerPreview
          key={preview.id}
          player={preview}
          onClose={() => setPreview(null)}
          onCreate={create}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.BACKGROUND },
  header: { paddingHorizontal: 20, paddingTop: 8, gap: 2 },
  title: { fontSize: 26, fontWeight: '800', color: Theme.PRIMARY },
  area: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  areaText: { fontSize: 14, fontWeight: '600', color: Theme.SUB_TEXT_COLOR, flexShrink: 1 },
  switch: {
    flexDirection: 'row',
    backgroundColor: '#EAF5F5',
    padding: 4,
    borderRadius: 16,
    marginTop: 3,
  },
  mode: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    gap: 8,
  },
  activeMode: { backgroundColor: Theme.PRIMARY },
  modeText: { fontSize: 15, fontWeight: '700', color: Theme.PRIMARY, flexShrink: 1 },
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filters: { paddingHorizontal: 20, paddingVertical: 12, gap: 8, alignItems: 'center' },
  mapContainer: { flex: 1, minHeight: 220, overflow: 'hidden', backgroundColor: '#EAF5F5' },
  mapTools: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  searchButton: { flexShrink: 1, elevation: 3 },
  mapHint: {
    flexShrink: 1,
    backgroundColor: Theme.SURFACE,
    padding: 12,
    borderRadius: 14,
    elevation: 2,
  },
  mapHintText: { color: Theme.PRIMARY, fontSize: 12, fontWeight: '700' },
  recenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  marker: {
    minWidth: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: Theme.SURFACE,
    backgroundColor: '#DCECEC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  selectedMarker: { backgroundColor: Theme.PRIMARY, borderColor: '#B8DEDE' },
  markerCount: { color: Theme.PRIMARY, fontSize: 18, fontWeight: '800' },
  markerInitials: { color: Theme.PRIMARY, fontSize: 14, fontWeight: '800' },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.BACKGROUND,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  handleTouch: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, minHeight: 68 },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B4CACA',
    marginBottom: 12,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  panelTitle: { color: Theme.PRIMARY, fontSize: 18, fontWeight: '800', flex: 1 },
  results: { paddingHorizontal: 16, paddingBottom: 24 },
  listHint: { fontSize: 13, color: Theme.SUB_TEXT_COLOR, marginBottom: 14 },
  groupHeading: { gap: 2, alignItems: 'flex-start', marginBottom: 8 },
  locationTitle: { fontSize: 16, fontWeight: '700', color: Theme.TEXT },
  empty: { alignItems: 'center', paddingVertical: 18, gap: 12, paddingHorizontal: 10 },
  emptyTitle: { color: Theme.TEXT, fontSize: 18, fontWeight: '700' },
  emptyText: { color: Theme.SUB_TEXT_COLOR, fontSize: 14, textAlign: 'center' },
});
