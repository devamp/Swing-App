import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassSurface from '../../components/GlassSurface';
import MyMatchCard from '../../components/MyMatchCard';
import type { MyMatch } from '../../data/myMatches';
import { matchService } from '../../services';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import Theme from '../../theme';

const TABS = ['Upcoming Matches', 'Hosted Matches', 'Joined Matches'] as const;
const HEADINGS = ['Next on court', 'Your home-court advantage', 'You’re on the list'];
const DESCRIPTIONS = [
  'Good games and great company ahead.',
  'Bring your people together for a game.',
  'Your spot is saved. See you at the court.',
];

export function MyMatches() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState(0);
  const userId = authService.getCurrentUser()?.uid;
  const {
    data: allMatches = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['myMatches', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<MyMatch[]> => {
      const matches = await matchService.getMatchesForUser(userId!);
      const playerIds = [
        ...new Set(matches.flatMap((match) => [match.userId, ...(match.members ?? [])])),
      ];
      // Profile access can fail independently; keep the user's matches available.
      const profiles = await Promise.allSettled(playerIds.map((id) => userService.getUserById(id)));
      const names = new Map(
        playerIds.map((id, index) => {
          const result = profiles[index];
          return [id, result.status === 'fulfilled' ? result.value?.username?.trim() : undefined];
        }),
      );
      return matches.map((match) => ({
        match,
        role: match.userId === userId ? 'hosted' : 'joined',
        players: [...new Set([match.userId, ...(match.members ?? [])])].map((id) => ({
          id,
          name:
            names.get(id) ||
            (id === userId ? authService.getCurrentUser()?.displayName?.trim() : undefined) ||
            (id === match.userId ? match.hostName?.trim() : undefined) ||
            'Player',
        })),
      }));
    },
  });
  useFocusEffect(
    useCallback(() => {
      if (userId) void refetch();
    }, [refetch, userId]),
  );
  const now = Date.now();
  const matches = allMatches.filter(({ match, role }) =>
    selected === 0
      ? match.startsAt.toMillis() > now
      : role === (selected === 1 ? 'hosted' : 'joined'),
  );
  const list = useRef<ScrollView>(null);

  const selectTab = (index: number) => {
    setSelected(index);
    list.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() =>
            navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')
          }
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="arrow-left" size={23} color={Theme.PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          My Matches
        </Text>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="tennis" size={23} color={Theme.PRIMARY} />
        </View>
      </View>
      <View style={styles.tabsContainer}>
        <MatchTabs selected={selected} onSelect={selectTab} />
      </View>
      <ScrollView
        ref={list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              if (userId) void refetch();
            }}
            tintColor={Theme.PRIMARY}
          />
        }
      >
        <View style={styles.sectionHeader} accessibilityLiveRegion="polite">
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {HEADINGS[selected]}
            </Text>
            <Text style={styles.sectionSubtitle}>{DESCRIPTIONS[selected]}</Text>
          </View>
          <View style={styles.count}>
            <Text style={styles.countText}>{matches.length}</Text>
          </View>
        </View>
        {!userId ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Sign in to see your matches.</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={Theme.PRIMARY} accessibilityLabel="Loading your matches" />
          </View>
        ) : isError ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Couldn’t load your matches.</Text>
            <Button onPress={() => void refetch()}>Try again</Button>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.state}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={32} color={Theme.PRIMARY} />
            <Text style={styles.stateTitle}>
              {
                [
                  'No upcoming matches yet.',
                  'You haven’t hosted a match yet.',
                  'You haven’t joined a match yet.',
                ][selected]
              }
            </Text>
            <Button
              onPress={() =>
                selected === 1
                  ? navigation.navigate('CreateMatch')
                  : navigation.navigate('Home', { screen: 'FindMatches' })
              }
            >
              {selected === 1 ? 'Create a match' : 'Find a match'}
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.cards}>
              {matches.map((item) => (
                <MyMatchCard
                  key={item.match.id}
                  item={item}
                  onPress={() => navigation.navigate('MatchDetail', { matchId: item.match.id })}
                />
              ))}
            </View>
            <View style={styles.endNote}>
              <MaterialCommunityIcons name="tennis-ball" size={15} color={Theme.PRIMARY} />
              <Text style={styles.endNoteText}>
                {selected === 0
                  ? 'Your next good game is on the calendar.'
                  : 'Good games. Great company.'}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MatchTabs({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (index: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const { fontScale } = useWindowDimensions();
  const position = useRef(new Animated.Value(selected)).current;
  const rail = useRef<View>(null);
  const railX = useRef(0);
  const segmentWidth = Math.max(0, (width - 8) / 3);
  const railHeight = Math.max(58, 42 * fontScale);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const segmentWidthRef = useRef(segmentWidth);
  segmentWidthRef.current = segmentWidth;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (active) setReduceTransparency(value);
    });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const transparency = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      active = false;
      motion.remove();
      transparency.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.timing(position, {
      toValue: selected,
      duration: reduceMotion ? 0 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [position, reduceMotion, selected]);

  const drag = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (_, gesture) => {
        const index = Math.min(
          2,
          Math.max(0, Math.floor((gesture.x0 - railX.current - 4) / segmentWidthRef.current)),
        );
        if (Number.isFinite(index)) selectRef.current(index);
      },
      onPanResponderMove: (_, gesture) => {
        const index = Math.min(
          2,
          Math.max(0, Math.floor((gesture.moveX - railX.current - 4) / segmentWidthRef.current)),
        );
        if (Number.isFinite(index)) selectRef.current(index);
      },
    }),
  ).current;
  const Surface = reduceTransparency ? View : GlassSurface;

  return (
    <View
      ref={rail}
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
        rail.current?.measureInWindow((x) => {
          railX.current = x;
        });
      }}
      style={[styles.tabRail, { minHeight: railHeight }]}
      {...drag.panHandlers}
    >
      <Surface pointerEvents="none" style={[StyleSheet.absoluteFill, styles.railSurface]} />
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              transform: [{ translateX: Animated.multiply(position, segmentWidth) }],
            },
          ]}
        >
          <Surface style={styles.selectedSurface} />
        </Animated.View>
      ) : null}
      {TABS.map((label, index) => (
        <Pressable
          key={label}
          accessibilityRole="tab"
          accessibilityState={{ selected: selected === index }}
          accessibilityLabel={label}
          onPress={() => onSelect(index)}
          style={[styles.tab, { minHeight: railHeight - 8 }]}
        >
          <Text style={[styles.tabText, selected === index && styles.selectedText]}>
            {label.split(' ')[0]}
            {'\n'}Matches
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.BACKGROUND },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.SURFACE,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
  },
  pressed: { opacity: 0.65 },
  headerTitle: {
    flex: 1,
    color: Theme.PRIMARY,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
    paddingHorizontal: 22,
  },
  tabsContainer: { paddingHorizontal: 20, marginTop: 22, marginBottom: 5 },
  tabRail: {
    flexDirection: 'row',
    borderRadius: 30,
    padding: 4,
    backgroundColor: '#E7EDE5',
    borderWidth: 0.5,
    borderColor: '#D4DFD2',
  },
  railSurface: { borderRadius: 30 },
  indicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 26,
    shadowColor: Theme.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedSurface: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: '#FFFFFFD9',
    borderWidth: 1,
    borderColor: '#FFFFFFE6',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 3,
    borderRadius: 26,
  },
  tabText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: Theme.SUB_TEXT_COLOR,
    textAlign: 'center',
  },
  selectedText: { color: Theme.PRIMARY, fontWeight: '800' },
  list: { padding: 20, paddingTop: 25, paddingBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: Theme.PRIMARY, fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  sectionSubtitle: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, lineHeight: 18, marginTop: 5 },
  count: {
    minWidth: 30,
    minHeight: 30,
    padding: 6,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  countText: { color: Theme.PRIMARY, fontSize: 12, fontWeight: '700' },
  cards: { gap: 12 },
  state: { alignItems: 'center', gap: 12, paddingVertical: 36 },
  stateTitle: { color: Theme.PRIMARY, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  endNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 26,
  },
  endNoteText: { flexShrink: 1, color: Theme.SUB_TEXT_COLOR, fontSize: 11, lineHeight: 17 },
});
