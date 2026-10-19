import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Searchbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, type LatLng, type Region } from 'react-native-maps';
import SelectableChip from '../../components/SelectableChip';
import Theme from '../../theme';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, courtService, matchService, SwingError } from '../../services';
import type { CourtLocation, CourtType, SkillLevel, Sport } from '../../types';
import { CreateMatchForm } from '../../services/matchService/types';
import { distanceMiles } from '../../services/distance';

const CARD_BORDER = Theme.PRIMARY_BORDER;
const DIVIDER = Theme.PRIMARY_BORDER;
const PRIMARY_TINT = Theme.PRIMARY_LIGHT;
const ERROR = Theme.paperTheme.colors.error;

const SKILL_LEVELS: Array<{ value: SkillLevel; label: string }> = [
  { value: 'any', label: 'Any Skill' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'casual', label: 'Casual' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'competitive', label: 'Competitive' },
];

const GAME_TYPES: Record<Sport, string[]> = {
  tennis: ['Rally', 'Singles', 'Doubles', 'Casual Match'],
  pickleball: ['Singles', 'Doubles', 'Open Play', 'Casual Match'],
};

const FEATURED_COURT_COUNT = 3;
const DEFAULT_COURT_REGION: Region = {
  latitude: 45.51512,
  longitude: -122.67948,
  latitudeDelta: 0.14,
  longitudeDelta: 0.14,
};

function getCourtCoordinate(court: CourtLocation): LatLng | null {
  const latitude = court.courtLocation?.latitude ?? court.latitude;
  const longitude = court.courtLocation?.longitude ?? court.longitude;

  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function getCourtDistance(court: CourtLocation, userLocation: LatLng | null) {
  const coordinate = getCourtCoordinate(court);
  return coordinate && userLocation ? distanceMiles(userLocation, coordinate) : undefined;
}

function formatCourtDetails(court: CourtLocation, userLocation: LatLng | null) {
  const distance = getCourtDistance(court, userLocation);
  return `${distance != null ? `${distance.toFixed(1)} mi away · ` : ''}${formatCourtType(court.courtType)}`;
}

function getRegionForCoordinates(coordinates: LatLng[]): Region {
  if (coordinates.length === 0) return DEFAULT_COURT_REGION;
  if (coordinates.length === 1) {
    return { ...coordinates[0], latitudeDelta: 0.025, longitudeDelta: 0.025 };
  }

  const latitudes = coordinates.map(({ latitude }) => latitude);
  const longitudes = coordinates.map(({ longitude }) => longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.45, 0.025),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.45, 0.025),
  };
}

const INITIAL_FORM: CreateMatchForm = {
  sport: null,
  location: null,
  dateLabel: null,
  timeLabel: null,
  matchDate: null,
  matchTime: null,
  skillLevel: 'any',
  gameType: null,
  playersNeeded: 2,
  note: '',
  matchName: '',
};

function defaultMatchTime() {
  const time = new Date(Date.now() + 60 * 60 * 1000);
  time.setSeconds(0, 0);
  time.setMinutes(Math.ceil(time.getMinutes() / 15) * 15);
  return time;
}

function combineMatchDateAndTime(matchDate: Date | null, matchTime: Date | null) {
  if (!matchDate || !matchTime) return null;

  const startsAt = new Date(matchDate);
  startsAt.setHours(matchTime.getHours(), matchTime.getMinutes(), 0, 0);
  return startsAt;
}

function formatTime(time: Date) {
  return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatCourtType(courtType?: CourtType) {
  const labels: Record<CourtType, string> = {
    public_outdoor: 'Public outdoor court',
    public_indoor: 'Public indoor court',
    private: 'Private court',
    unknown: 'Court details unavailable',
  };
  return labels[courtType ?? 'unknown'];
}

function SectionCard({
  title,
  icon,
  optional = false,
  complete,
  children,
}: {
  title: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  optional?: boolean;
  complete: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, complete && styles.sectionCardComplete]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialCommunityIcons name={icon} size={19} color={Theme.PRIMARY} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View
          accessible
          accessibilityLabel={`${title}: ${complete ? 'Complete' : optional ? 'Optional' : 'Required'}`}
          accessibilityLiveRegion="polite"
          style={styles.sectionStatus}
        >
          {complete ? (
            <View style={styles.completionBadge}>
              <MaterialCommunityIcons name="check" size={20} color={Theme.PRIMARY} />
            </View>
          ) : (
            <Text style={styles.requirementLabel}>{optional ? 'Optional' : 'Required'}</Text>
          )}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function PlayerStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.stepperRow}>
      <View>
        <Text style={styles.fieldLabel}>Players needed</Text>
        <Text style={styles.helperText}>How many more players can join?</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove one player"
          disabled={value <= 1}
          onPress={() => onChange(Math.max(1, value - 1))}
          style={({ pressed }) => [
            styles.stepperButton,
            value <= 1 && styles.stepperButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="minus" size={20} color={Theme.TEXT} />
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={styles.stepperValue}>
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add one player"
          disabled={value >= 8}
          onPress={() => onChange(Math.min(8, value + 1))}
          style={({ pressed }) => [
            styles.stepperButton,
            value >= 8 && styles.stepperButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={20} color={Theme.TEXT} />
        </Pressable>
      </View>
    </View>
  );
}

function PreviewMatchCard({ form }: { form: CreateMatchForm }) {
  const skillLabel = SKILL_LEVELS.find(({ value }) => value === form.skillLevel)?.label;
  const dateTime = [form.dateLabel, form.timeLabel].filter(Boolean).join(' · ');
  const details = [
    { icon: 'calendar-outline' as const, label: dateTime || 'Date and time not selected' },
    { icon: 'map-marker-outline' as const, label: form.location?.name || 'Location not selected' },
    { icon: 'signal-cellular-2' as const, label: skillLabel ?? 'Any Skill' },
    { icon: 'flag-outline' as const, label: form.gameType ?? 'Game type not selected' },
    {
      icon: 'account-group-outline' as const,
      label: `${form.playersNeeded} ${form.playersNeeded === 1 ? 'player' : 'players'} needed`,
    },
  ];

  const { data: authUser } = useQuery({
    queryKey: ['getAuthUser'],
    queryFn: () => authService.getCurrentUser(),
  });

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewTopRow}>
        <View style={styles.previewSportIcon}>
          <MaterialCommunityIcons
            name={form.sport === 'pickleball' ? 'table-tennis' : 'tennis'}
            size={24}
            color={Theme.PRIMARY}
          />
        </View>
        <View style={styles.previewHeading}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {form.matchName || `${authUser?.displayName}'s Match`}
          </Text>
          <Text style={styles.previewSubtitle}>
            {form.sport
              ? `${form.sport === 'tennis' ? 'Tennis' : 'Pickleball'} match`
              : 'Choose a sport'}
          </Text>
        </View>
        {form.gameType ? (
          <View style={styles.gameBadge}>
            <Text style={styles.gameBadgeText}>{form.gameType}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.previewDivider} />
      {details.map((detail) => (
        <View key={detail.icon} style={styles.previewDetailRow}>
          <MaterialCommunityIcons name={detail.icon} size={17} color={Theme.PRIMARY} />
          <Text style={styles.previewDetailText}>{detail.label}</Text>
        </View>
      ))}
    </View>
  );
}

function DatePickerSheet({
  selectedDate,
  onConfirm,
  onClose,
}: {
  selectedDate: Date | null;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [monthOffset, setMonthOffset] = useState(0);
  const [draftDate, setDraftDate] = useState(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const month = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((month.getDay() + dayCount) / 7) * 7 },
    (_, index) => {
      const day = index - month.getDay() + 1;
      return day > 0 && day <= dayCount
        ? new Date(month.getFullYear(), month.getMonth(), day)
        : null;
    },
  );
  const canConfirm = draftDate !== null && draftDate >= today;

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} accessible={false}>
        <View
          accessibilityViewIsModal
          style={[
            styles.modalSheet,
            styles.dateSheet,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>Pick a date</Text>
              <Text style={styles.modalSubtitle}>Choose today or any day through next month.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
              onPress={onClose}
              style={styles.calendarArrow}
            >
              <MaterialCommunityIcons name="close" size={22} color={Theme.TEXT} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.calendarHeading}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                accessibilityState={{ disabled: monthOffset === 0 }}
                disabled={monthOffset === 0}
                onPress={() => setMonthOffset(0)}
                style={[styles.calendarArrow, monthOffset === 0 && styles.stepperButtonDisabled]}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color={Theme.PRIMARY} />
              </Pressable>
              <Text accessibilityLiveRegion="polite" style={styles.calendarMonth}>
                {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next month"
                accessibilityState={{ disabled: monthOffset === 1 }}
                disabled={monthOffset === 1}
                onPress={() => setMonthOffset(1)}
                style={[styles.calendarArrow, monthOffset === 1 && styles.stepperButtonDisabled]}
              >
                <MaterialCommunityIcons name="chevron-right" size={24} color={Theme.PRIMARY} />
              </Pressable>
            </View>
            <View style={styles.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.calendarWeekday}>
                  {day}
                </Text>
              ))}
              {cells.map((date, index) => {
                const disabled = !date || date < today;
                const selected = !!date && date.getTime() === draftDate?.getTime();
                const isToday = date?.getTime() === today.getTime();
                return (
                  <View key={index} style={styles.calendarCell}>
                    {date && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${isToday ? ', today' : ''}`}
                        accessibilityState={{ disabled, selected }}
                        disabled={disabled}
                        onPress={() => setDraftDate(date)}
                        style={({ pressed }) => [
                          styles.calendarDay,
                          isToday && styles.calendarToday,
                          selected && styles.calendarSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            disabled && styles.calendarDisabledText,
                            isToday && styles.calendarTodayText,
                            selected && styles.calendarSelectedText,
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
            <View style={styles.dateSummary}>
              <View style={styles.locationIcon}>
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={24}
                  color={Theme.PRIMARY}
                />
              </View>
              <View style={styles.locationCopy}>
                <Text style={styles.helperText}>Your match date</Text>
                <Text accessibilityLiveRegion="polite" style={styles.locationTitle}>
                  {draftDate
                    ? draftDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Select a day above'}
                </Text>
              </View>
            </View>
          </ScrollView>
          <Button
            mode="contained"
            buttonColor={Theme.PRIMARY}
            textColor={Theme.SURFACE}
            disabled={!canConfirm}
            onPress={() => {
              if (draftDate && canConfirm) onConfirm(draftDate);
            }}
            style={styles.postButton}
            contentStyle={styles.postButtonContent}
            labelStyle={styles.postButtonLabel}
          >
            Use date
          </Button>
        </View>
      </Pressable>
    </Modal>
  );
}

function TimePickerSheet({
  selectedTime,
  onConfirm,
  onClose,
}: {
  selectedTime: Date | null;
  onConfirm: (time: Date) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [draftTime, setDraftTime] = useState(selectedTime ?? defaultMatchTime());

  const handleAndroidChange = (event: DateTimePickerEvent, time?: Date) => {
    if (event.type === 'set' && time) onConfirm(time);
    else onClose();
  };

  const adjustDraftTime = (minutes: number) => {
    setDraftTime((current) => new Date(current.getTime() + minutes * 60 * 1000));
  };

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        mode="time"
        display="clock"
        value={draftTime}
        onChange={handleAndroidChange}
      />
    );
  }

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} accessible={false}>
        <View
          accessibilityViewIsModal
          style={[
            styles.modalSheet,
            styles.timeSheet,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>Pick a time</Text>
              <Text style={styles.modalSubtitle}>Choose the exact time your match starts.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close time picker"
              onPress={onClose}
              style={styles.calendarArrow}
            >
              <MaterialCommunityIcons name="close" size={22} color={Theme.TEXT} />
            </Pressable>
          </View>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              mode="time"
              display="spinner"
              minuteInterval={1}
              value={draftTime}
              onChange={(_, time) => {
                if (time) setDraftTime(time);
              }}
              style={styles.timePicker}
            />
          ) : (
            <View style={styles.webTimePicker}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="15 minutes earlier"
                onPress={() => adjustDraftTime(-15)}
                style={({ pressed }) => [styles.timeAdjustButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="minus" size={22} color={Theme.PRIMARY} />
              </Pressable>
              <Text accessibilityLiveRegion="polite" style={styles.webTimeValue}>
                {formatTime(draftTime)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="15 minutes later"
                onPress={() => adjustDraftTime(15)}
                style={({ pressed }) => [styles.timeAdjustButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="plus" size={22} color={Theme.PRIMARY} />
              </Pressable>
            </View>
          )}
          <Button
            mode="contained"
            buttonColor={Theme.PRIMARY}
            textColor={Theme.SURFACE}
            onPress={() => onConfirm(draftTime)}
            style={styles.postButton}
            contentStyle={styles.postButtonContent}
            labelStyle={styles.postButtonLabel}
          >
            Start at {formatTime(draftTime)}
          </Button>
        </View>
      </Pressable>
    </Modal>
  );
}

export function CreateMatch() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const courtMapRef = useRef<MapView>(null);
  const [form, setForm] = useState<CreateMatchForm>(INITIAL_FORM);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [courtSearchQuery, setCourtSearchQuery] = useState('');
  const [courtSuggestionsVisible, setCourtSuggestionsVisible] = useState(false);
  const [draftCourtLocation, setDraftCourtLocation] = useState<CourtLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationStatus, setLocationStatus] = useState('Finding your location…');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setUserLocation(null);
      setLocationStatus('Finding your location…');

      async function locateUser() {
        try {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (!active) return;
          if (!permission.granted) {
            setLocationStatus(
              'Allow location access in Settings to see distances and nearby courts first.',
            );
            return;
          }

          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!active) return;
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationStatus('Closest courts first · Distances from your current location');
        } catch {
          if (active)
            setLocationStatus('Current location unavailable. Court distances cannot be shown.');
        }
      }

      void locateUser();
      return () => {
        active = false;
      };
    }, []),
  );

  const { data: loadedCourts = [] } = useQuery<CourtLocation[]>({
    queryKey: ['loadCourts'],
    queryFn: courtService.loadCourts,
  });

  const courtLocations = useMemo(
    () =>
      loadedCourts.map((court) => ({
        ...court,
        distanceMiles: getCourtDistance(court, userLocation),
      })),
    [loadedCourts, userLocation],
  );

  const sortedCourtLocations = useMemo(
    () =>
      [...courtLocations].sort((firstCourt, secondCourt) => {
        const distanceDifference =
          (firstCourt.distanceMiles ?? Number.POSITIVE_INFINITY) -
          (secondCourt.distanceMiles ?? Number.POSITIVE_INFINITY);

        return distanceDifference || firstCourt.name.localeCompare(secondCourt.name);
      }),
    [courtLocations],
  );

  const visibleCourtLocations = useMemo(() => {
    const normalizedQuery = courtSearchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return sortedCourtLocations;
    }

    return sortedCourtLocations.filter((location) =>
      [location.name, location.address]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [courtSearchQuery, sortedCourtLocations]);

  const mappedCourtLocations = useMemo(
    () =>
      (courtSearchQuery.trim() ? visibleCourtLocations : sortedCourtLocations).filter(
        (court) => getCourtCoordinate(court) !== null,
      ),
    [courtSearchQuery, sortedCourtLocations, visibleCourtLocations],
  );

  const courtMapCoordinates = useMemo(
    () => [
      ...mappedCourtLocations
        .map(getCourtCoordinate)
        .filter((coordinate): coordinate is LatLng => coordinate !== null),
      ...(userLocation ? [userLocation] : []),
    ],
    [mappedCourtLocations, userLocation],
  );

  const initialCourtRegion = useMemo(
    () => getRegionForCoordinates(courtMapCoordinates),
    [courtMapCoordinates],
  );

  const startsAt = useMemo(
    () => combineMatchDateAndTime(form.matchDate, form.matchTime),
    [form.matchDate, form.matchTime],
  );
  const isFutureMatch = Boolean(startsAt && startsAt.getTime() > Date.now());
  const isComplete = Boolean(
    form.sport &&
    form.location &&
    startsAt &&
    isFutureMatch &&
    form.skillLevel &&
    form.gameType &&
    form.playersNeeded >= 1,
  );

  const dateTimeLabel = useMemo(() => {
    if (!form.dateLabel && !form.timeLabel) return null;
    if (!form.dateLabel) return form.timeLabel;
    if (!form.timeLabel) return form.dateLabel;
    return `${form.dateLabel} at ${form.timeLabel}`;
  }, [form.dateLabel, form.timeLabel]);

  const updateForm = <Key extends keyof CreateMatchForm>(key: Key, value: CreateMatchForm[Key]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const closeLocationModal = () => {
    Keyboard.dismiss();
    setCourtSuggestionsVisible(false);
    setLocationModalVisible(false);
    setCourtSearchQuery('');
    setDraftCourtLocation(null);
  };

  const openLocationModal = () => {
    setDraftCourtLocation(form.location);
    setLocationModalVisible(true);
  };

  const focusCourt = useCallback((court: CourtLocation) => {
    const coordinate = getCourtCoordinate(court);
    Keyboard.dismiss();
    setCourtSuggestionsVisible(false);
    setDraftCourtLocation(court);

    if (coordinate) {
      courtMapRef.current?.animateToRegion(
        { ...coordinate, latitudeDelta: 0.018, longitudeDelta: 0.018 },
        300,
      );
    }
  }, []);

  const fitMappedCourts = useCallback(
    (animated: boolean) => {
      const coordinates = courtMapCoordinates;

      if (coordinates.length === 1) {
        courtMapRef.current?.animateToRegion(
          getRegionForCoordinates(coordinates),
          animated ? 300 : 0,
        );
      } else if (coordinates.length > 1) {
        courtMapRef.current?.fitToCoordinates(coordinates, {
          animated,
          edgePadding: { top: 34, right: 34, bottom: 34, left: 34 },
        });
      }
    },
    [courtMapCoordinates],
  );

  useEffect(() => {
    if (!locationModalVisible || draftCourtLocation) return;
    fitMappedCourts(true);
  }, [draftCourtLocation, fitMappedCourts, locationModalVisible]);

  const selectSport = (sport: Sport) => {
    setForm((current) => ({
      ...current,
      sport,
      gameType: current.sport === sport ? current.gameType : null,
    }));
  };

  const handleCreateMatch = async () => {
    if (
      !isComplete ||
      !startsAt ||
      !form.sport ||
      !form.location ||
      !form.gameType ||
      isSubmitting
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      await matchService.createMatch({
        sport: form.sport,
        location: form.location,
        startsAt,
        skillLevel: form.skillLevel,
        gameType: form.gameType,
        playersNeeded: form.playersNeeded,
        note: form.note,
        matchName: form.matchName,
      });
      await queryClient.invalidateQueries({ queryKey: ['upcomingMatch'] });
      Alert.alert('Match posted', 'Nearby players can now find your match.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      SwingError.showAlert(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={10}
              style={({ pressed }) => [
                Theme.styles.backButton,
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Theme.TEXT} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Create Match</Text>
              <Text style={styles.subtitle}>Post a game for nearby players.</Text>
            </View>
          </View>

          <SectionCard title="Sport" icon="tennis-ball-outline" complete={Boolean(form.sport)}>
            <View style={styles.chipRow}>
              <SelectableChip
                label="Tennis"
                icon="tennis"
                selected={form.sport === 'tennis'}
                onPress={() => selectSport('tennis')}
              />
              <SelectableChip
                label="Pickleball"
                icon="table-tennis"
                selected={form.sport === 'pickleball'}
                onPress={() => selectSport('pickleball')}
              />
            </View>
            {!form.sport ? (
              <Text style={styles.validationText}>Choose a sport to continue.</Text>
            ) : null}
          </SectionCard>

          <SectionCard title="Location" icon="map-marker-outline" complete={Boolean(form.location)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select court or location"
              onPress={openLocationModal}
              style={({ pressed }) => [styles.locationCard, pressed && styles.pressed]}
            >
              <View style={styles.locationIcon}>
                <MaterialCommunityIcons name="map-search-outline" size={23} color={Theme.PRIMARY} />
              </View>
              <View style={styles.locationCopy}>
                <Text style={[styles.locationTitle, !form.location && styles.placeholderText]}>
                  {form.location?.name ?? 'Select court or location'}
                </Text>
                <Text style={styles.helperText} numberOfLines={2}>
                  {form.location
                    ? formatCourtDetails(form.location, userLocation)
                    : 'Search nearby courts or enter a place'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={Theme.SUB_TEXT_COLOR} />
            </Pressable>
            {!form.location ? (
              <Text style={styles.validationText}>Select where you want to play.</Text>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Date & time"
            icon="calendar-clock-outline"
            complete={Boolean(form.matchDate && form.matchTime && isFutureMatch)}
          >
            <Text style={styles.fieldLabel}>Date</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={form.matchDate ? `Change date, ${form.dateLabel}` : 'Pick date'}
              onPress={() => setDateModalVisible(true)}
              style={({ pressed }) => [
                styles.timeSelector,
                form.matchDate && styles.timeSelectorSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.locationIcon}>
                <MaterialCommunityIcons name="calendar-outline" size={23} color={Theme.PRIMARY} />
              </View>
              <View style={styles.locationCopy}>
                <Text style={[styles.timeSelectorValue, !form.matchDate && styles.placeholderText]}>
                  {form.dateLabel ?? 'Pick Date'}
                </Text>
                <Text style={styles.helperText}>
                  {form.matchDate ? 'Tap to change the match date' : 'Choose a date for your match'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={Theme.SUB_TEXT_COLOR} />
            </Pressable>
            <Text style={[styles.fieldLabel, styles.subField]}>Time</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={form.matchTime ? `Change time, ${form.timeLabel}` : 'Select time'}
              onPress={() => setTimeModalVisible(true)}
              style={({ pressed }) => [
                styles.timeSelector,
                form.matchTime && styles.timeSelectorSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.locationIcon}>
                <MaterialCommunityIcons name="clock-outline" size={23} color={Theme.PRIMARY} />
              </View>
              <View style={styles.locationCopy}>
                <Text style={[styles.timeSelectorValue, !form.matchTime && styles.placeholderText]}>
                  {form.timeLabel ?? 'Select a specific time'}
                </Text>
                <Text style={styles.helperText}>
                  {form.matchTime
                    ? 'Tap to change the start time'
                    : 'Choose the exact match start time'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={Theme.SUB_TEXT_COLOR} />
            </Pressable>
            {dateTimeLabel ? (
              <View style={styles.selectedDateTime}>
                <MaterialCommunityIcons name="check-circle" size={18} color={Theme.PRIMARY} />
                <Text style={styles.selectedDateTimeText}>{dateTimeLabel}</Text>
              </View>
            ) : null}
            {!form.matchDate || !form.matchTime ? (
              <Text style={styles.validationText}>Choose both a date and time.</Text>
            ) : !isFutureMatch ? (
              <Text style={[styles.validationText, styles.errorText]}>
                Choose a start time in the future.
              </Text>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Match details"
            icon="tune-variant"
            complete={Boolean(form.skillLevel && form.gameType && form.playersNeeded >= 1)}
          >
            <Text style={styles.fieldLabel}>Skill level</Text>
            <View style={styles.chipRow}>
              {SKILL_LEVELS.map(({ value, label }) => (
                <SelectableChip
                  key={value}
                  label={label}
                  selected={form.skillLevel === value}
                  onPress={() => updateForm('skillLevel', value)}
                />
              ))}
            </View>

            <Text style={[styles.fieldLabel, styles.subField]}>Game type</Text>
            {form.sport ? (
              <View style={styles.chipRow}>
                {GAME_TYPES[form.sport].map((gameType) => (
                  <SelectableChip
                    key={gameType}
                    label={gameType}
                    selected={form.gameType === gameType}
                    onPress={() => updateForm('gameType', gameType)}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.helperText}>Choose a sport to see game types.</Text>
            )}
            {form.sport && !form.gameType ? (
              <Text style={styles.validationText}>Choose a game type.</Text>
            ) : null}

            <View style={styles.divider} />
            <PlayerStepper
              value={form.playersNeeded}
              onChange={(value) => updateForm('playersNeeded', value)}
            />
          </SectionCard>

          <SectionCard
            title="Name your match"
            icon="rename-box-outline"
            optional
            complete={form.matchName.trim().length > 0}
          >
            <TextInput
              accessibilityLabel="Optional match note"
              multiline
              maxLength={25}
              onChangeText={(name) => updateForm('matchName', name)}
              placeholder="Example: Casual doubles"
              placeholderTextColor="#9CA3AF"
              style={styles.matchNameInput}
              textAlignVertical="top"
              value={form.matchName}
            />
            <Text style={styles.characterCount}>{form.matchName.length}/25</Text>
          </SectionCard>

          <SectionCard
            title="Add a note"
            icon="message-text-outline"
            optional
            complete={form.note.trim().length > 0}
          >
            <TextInput
              accessibilityLabel="Optional match note"
              multiline
              maxLength={180}
              onChangeText={(note) => updateForm('note', note)}
              placeholder="Example: Looking for 1–2 intermediate players for casual doubles."
              placeholderTextColor="#9CA3AF"
              style={styles.noteInput}
              textAlignVertical="top"
              value={form.note}
            />
            <Text style={styles.characterCount}>{form.note.length}/180</Text>
          </SectionCard>

          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Match preview</Text>
            <Text style={styles.previewSectionSubtitle}>This is what nearby players will see.</Text>
            <PreviewMatchCard form={form} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="contained"
            icon="calendar-check-outline"
            buttonColor={Theme.PRIMARY}
            textColor={Theme.SURFACE}
            disabled={!isComplete || isSubmitting}
            loading={isSubmitting}
            onPress={handleCreateMatch}
            style={[styles.postButton, !isComplete && styles.postButtonDisabled]}
            contentStyle={styles.postButtonContent}
            labelStyle={styles.postButtonLabel}
          >
            Post Match
          </Button>
          {!isComplete ? (
            <Text style={styles.footerHint}>Complete the required fields to post.</Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      {dateModalVisible && (
        <DatePickerSheet
          selectedDate={form.matchDate}
          onClose={() => setDateModalVisible(false)}
          onConfirm={(date) => {
            setForm((current) => ({
              ...current,
              matchDate: date,
              dateLabel: date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
            }));
            setDateModalVisible(false);
          }}
        />
      )}
      {timeModalVisible && (
        <TimePickerSheet
          selectedTime={form.matchTime}
          onClose={() => setTimeModalVisible(false)}
          onConfirm={(time) => {
            setForm((current) => ({
              ...current,
              matchTime: time,
              timeLabel: formatTime(time),
            }));
            setTimeModalVisible(false);
          }}
        />
      )}
      <Modal
        animationType="slide"
        transparent
        visible={locationModalVisible}
        onRequestClose={closeLocationModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardView}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeLocationModal}>
            <Pressable
              style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.modalTitle}>Choose a court</Text>
                  <Text style={styles.modalSubtitle}>Search or choose a nearby location</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close location picker"
                  onPress={closeLocationModal}
                  style={styles.closeButton}
                >
                  <MaterialCommunityIcons name="close" size={22} color={Theme.TEXT} />
                </Pressable>
              </View>
              <View style={styles.courtSearchContainer}>
                <Searchbar
                  accessibilityLabel="Search courts"
                  elevation={0}
                  iconColor={Theme.PRIMARY}
                  inputStyle={styles.courtSearchInput}
                  onChangeText={(query) => {
                    setCourtSearchQuery(query);
                    setDraftCourtLocation(null);
                    setCourtSuggestionsVisible(true);
                  }}
                  onFocus={() => setCourtSuggestionsVisible(true)}
                  placeholder="Search courts"
                  placeholderTextColor={Theme.SUB_TEXT_COLOR}
                  style={styles.courtSearch}
                  value={courtSearchQuery}
                />
                {courtSuggestionsVisible && courtSearchQuery.trim() !== '' && (
                  <View style={styles.courtSuggestions}>
                    <ScrollView
                      style={styles.courtSuggestionsScroll}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                    >
                      {visibleCourtLocations.length === 0 ? (
                        <Text accessibilityLiveRegion="polite" style={styles.courtSuggestionEmpty}>
                          No courts found. Try a different name or address.
                        </Text>
                      ) : visibleCourtLocations.map((court) => (
                        <Pressable
                          key={court.name}
                          accessibilityRole="button"
                          accessibilityLabel={`Select ${court.name}${court.address ? `, ${court.address}` : ''}`}
                          onPress={() => {
                            setCourtSearchQuery(court.name);
                            focusCourt(court);
                          }}
                          style={({ pressed }) => [styles.courtSuggestion, pressed && styles.pressed]}
                        >
                          <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={22}
                            color={Theme.PRIMARY}
                          />
                          <View style={styles.locationCopy}>
                            <Text style={styles.modalLocationName}>{court.name}</Text>
                            {court.address ? (
                              <Text numberOfLines={1} style={styles.helperText}>{court.address}</Text>
                            ) : null}
                            <Text style={styles.helperText}>
                              {formatCourtDetails(court, userLocation)}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.courtMapContainer}>
                {courtMapCoordinates.length > 0 ? (
                  <MapView
                    ref={courtMapRef}
                    initialRegion={initialCourtRegion}
                    loadingEnabled
                    loadingIndicatorColor={Theme.PRIMARY}
                    onMapReady={() => fitMappedCourts(false)}
                    onPress={() => {
                      setCourtSuggestionsVisible(false);
                      Keyboard.dismiss();
                    }}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    rotateEnabled={false}
                    showsUserLocation={userLocation !== null}
                    showsMyLocationButton={userLocation !== null}
                    style={styles.courtMap}
                  >
                    {mappedCourtLocations.map((court) => {
                      const coordinate = getCourtCoordinate(court);
                      if (!coordinate) return null;
                      const selected = draftCourtLocation?.name === court.name;

                      return (
                        <Marker
                          key={`${court.name}-${coordinate.latitude}-${coordinate.longitude}`}
                          accessibilityLabel={`${court.name} court`}
                          coordinate={coordinate}
                          onPress={() => focusCourt(court)}
                          title={court.name}
                          description={court.address}
                          zIndex={selected ? 2 : 1}
                        >
                          <View
                            style={[styles.courtMarker, selected && styles.courtMarkerSelected]}
                          >
                            <MaterialCommunityIcons
                              name="tennis"
                              size={selected ? 17 : 15}
                              color={selected ? Theme.SURFACE : Theme.PRIMARY}
                            />
                          </View>
                        </Marker>
                      );
                    })}
                  </MapView>
                ) : (
                  <View style={styles.courtMapEmpty}>
                    <MaterialCommunityIcons
                      name="map-marker-off-outline"
                      size={25}
                      color={Theme.PRIMARY}
                    />
                    <Text style={styles.courtMapEmptyText}>
                      {visibleCourtLocations.length > 0
                        ? 'Location unavailable for these courts'
                        : 'No court locations to show'}
                    </Text>
                  </View>
                )}
                {draftCourtLocation ? (
                  <View pointerEvents="none" style={styles.selectedCourtBadge}>
                    <MaterialCommunityIcons name="map-marker" size={14} color={Theme.PRIMARY} />
                    <Text numberOfLines={1} style={styles.selectedCourtBadgeText}>
                      {draftCourtLocation.name}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.courtListHeading}>
                <Text style={styles.courtListLabel}>
                  {courtSearchQuery.trim() ? 'Search results' : 'Nearby courts'}
                </Text>
                <Text style={styles.courtListCount}>{visibleCourtLocations.length}</Text>
              </View>
              <Text accessibilityLiveRegion="polite" style={styles.nearbyCourtSubtext}>
                {locationStatus}
              </Text>
              <ScrollView
                style={styles.courtResults}
                contentContainerStyle={styles.courtList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {courtSearchQuery.trim() && visibleCourtLocations.length === 0 ? (
                  <View style={styles.emptyCourtList}>
                    <View style={styles.emptyCourtIcon}>
                      <MaterialCommunityIcons
                        name="map-marker-off-outline"
                        size={28}
                        color={Theme.PRIMARY}
                      />
                    </View>
                    <Text style={styles.emptyCourtTitle}>No courts found</Text>
                    <Text style={styles.emptyCourtText}>Try a different court name.</Text>
                  </View>
                ) : (
                  visibleCourtLocations.map((location) => {
                    const selected = draftCourtLocation?.name === location.name;
                    const coordinate = getCourtCoordinate(location);

                    return (
                      <Pressable
                        key={location.name}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Select ${location.name}`}
                        onPress={() => focusCourt(location)}
                        style={({ pressed }) => [
                          styles.modalLocation,
                          selected && styles.modalLocationSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.resultMarkerIcon,
                            selected && styles.resultMarkerIconSelected,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={coordinate ? 'map-marker' : 'map-marker-question-outline'}
                            size={21}
                            color={selected ? Theme.SURFACE : Theme.PRIMARY}
                          />
                        </View>
                        <View style={styles.locationCopy}>
                          <Text style={styles.modalLocationName}>{location.name}</Text>
                          <Text numberOfLines={1} style={styles.helperText}>
                            {formatCourtDetails(location, userLocation)}
                          </Text>
                        </View>
                        {selected ? (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={21}
                            color={Theme.PRIMARY}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
                {!courtSearchQuery.trim() && courtLocations.length !== 0 && (
                  <Text style={styles.emptyCourtText}>
                    {courtLocations.length} courts available
                  </Text>
                )}
              </ScrollView>

              <Button
                mode="contained"
                buttonColor={Theme.PRIMARY}
                textColor={Theme.SURFACE}
                disabled={!draftCourtLocation}
                onPress={() => {
                  if (!draftCourtLocation) return;
                  updateForm('location', draftCourtLocation);
                  closeLocationModal();
                }}
                style={styles.chooseCourtButton}
                contentStyle={styles.chooseCourtButtonContent}
                labelStyle={styles.postButtonLabel}
              >
                {draftCourtLocation ? `Choose ${draftCourtLocation.name}` : 'Choose a court'}
              </Button>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dateSheet: { height: 'auto', maxHeight: '90%', gap: 4 },
  timeSheet: { height: 'auto', gap: 8 },
  timePicker: { height: 190, alignSelf: 'stretch' },
  webTimePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 28,
  },
  webTimeValue: { color: Theme.TEXT, fontSize: 28, fontWeight: '800', minWidth: 120 },
  timeAdjustButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.SURFACE,
  },
  calendarHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarArrow: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonth: { color: Theme.TEXT, fontSize: 18, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarWeekday: {
    width: '14.285714%',
    textAlign: 'center',
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: 10,
  },
  calendarCell: { width: '14.285714%', alignItems: 'center', paddingVertical: 3 },
  calendarDay: {
    width: '100%',
    maxWidth: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  calendarToday: { borderColor: Theme.PRIMARY, backgroundColor: PRIMARY_TINT },
  calendarSelected: { backgroundColor: Theme.PRIMARY, borderColor: Theme.PRIMARY },
  calendarDayText: { color: Theme.TEXT, fontSize: 15, fontWeight: '600' },
  calendarDisabledText: { color: '#B7C3C3' },
  calendarTodayText: { color: Theme.PRIMARY },
  calendarSelectedText: { color: Theme.SURFACE, fontWeight: '800' },
  calendarHint: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, textAlign: 'center', marginTop: 12 },
  dateSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: PRIMARY_TINT,
    marginVertical: 18,
  },
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Theme.BACKGROUND },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  backButton: { marginBottom: 0 },
  headerCopy: { flex: 1 },
  title: { color: Theme.PRIMARY, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  subtitle: { color: Theme.SUB_TEXT_COLOR, fontSize: 14, lineHeight: 20 },
  sectionCard: {
    backgroundColor: Theme.SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: Theme.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionCardComplete: { borderColor: Theme.PRIMARY },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Theme.PRIMARY,
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
    borderBottomWidth: 1,
    borderBottomColor: Theme.PRIMARY,
  },
  sectionBody: { padding: 16 },
  sectionStatus: { minWidth: 54, minHeight: 28, alignItems: 'flex-end', justifyContent: 'center' },
  completionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.SURFACE,
  },
  sectionTitle: { flex: 1, color: Theme.SURFACE, fontSize: 18, fontWeight: '700' },
  requirementLabel: { color: Theme.SURFACE, fontSize: 12, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  fieldLabel: { color: Theme.TEXT, fontSize: 15, fontWeight: '700', marginBottom: 9 },
  subField: { marginTop: 18 },
  nearbyCourtSubtext: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  helperText: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, lineHeight: 18 },
  validationText: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, lineHeight: 17, marginTop: 9 },
  locationCard: {
    minHeight: 74,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCopy: { flex: 1, gap: 3 },
  locationTitle: { color: Theme.TEXT, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  placeholderText: { color: Theme.SUB_TEXT_COLOR, fontWeight: '600', fontSize: 15 },
  selectedDateTime: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: PRIMARY_TINT,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  selectedDateTimeText: { color: Theme.PRIMARY, fontSize: 13, fontWeight: '700' },
  timeSelector: {
    minHeight: 74,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  timeSelectorSelected: { borderColor: Theme.PRIMARY, backgroundColor: PRIMARY_TINT },
  timeSelectorValue: { color: Theme.TEXT, fontSize: 16, lineHeight: 25, fontWeight: '800' },
  errorText: { color: ERROR },
  divider: { height: 1, backgroundColor: DIVIDER, marginVertical: 18 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.SURFACE,
  },
  stepperButtonDisabled: { opacity: 0.35 },
  stepperValue: {
    minWidth: 24,
    textAlign: 'center',
    color: Theme.TEXT,
    fontSize: 18,
    fontWeight: '800',
  },
  noteInput: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: Theme.TEXT,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: Theme.SURFACE,
  },
  matchNameInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: Theme.TEXT,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: Theme.SURFACE,
  },
  characterCount: {
    marginTop: 7,
    textAlign: 'right',
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
  },
  previewSection: { marginTop: 4 },
  previewSectionTitle: { color: Theme.PRIMARY, fontSize: 20, fontWeight: '700' },
  previewSectionSubtitle: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    marginTop: 3,
    marginBottom: 11,
  },
  previewCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: Theme.SURFACE,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderTopWidth: 4,
    borderTopColor: Theme.PRIMARY,
    shadowColor: Theme.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 3,
  },
  previewTopRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  previewSportIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHeading: { flex: 1 },
  previewTitle: { color: Theme.TEXT, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  previewSubtitle: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  gameBadge: {
    backgroundColor: PRIMARY_TINT,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  gameBadgeText: { color: Theme.PRIMARY, fontSize: 11, fontWeight: '800' },
  previewDivider: { height: 1, backgroundColor: DIVIDER, marginVertical: 13 },
  previewDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  previewDetailText: { flex: 1, color: Theme.SUB_TEXT_COLOR, fontSize: 13, lineHeight: 18 },
  footer: {
    backgroundColor: Theme.SURFACE,
    borderTopWidth: 1,
    borderTopColor: Theme.SECONDARY,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  postButton: { borderRadius: 16 },
  postButtonDisabled: { backgroundColor: Theme.SECONDARY },
  postButtonContent: { height: 52 },
  postButtonLabel: { fontSize: 16, fontWeight: '800' },
  footerHint: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  pressed: { opacity: 0.72 },
  modalKeyboardView: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Theme.SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    paddingHorizontal: 16,
    paddingTop: 9,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.SECONDARY,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  modalHeaderCopy: { flex: 1, paddingRight: 12 },
  modalTitle: { color: Theme.PRIMARY, fontSize: 20, fontWeight: '700' },
  modalSubtitle: { color: Theme.SUB_TEXT_COLOR, fontSize: 13, marginTop: 3 },
  courtSearch: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    backgroundColor: Theme.SURFACE,
  },
  courtSearchContainer: { zIndex: 10 },
  courtSuggestions: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: Theme.SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  courtSuggestionsScroll: { maxHeight: 240 },
  courtSuggestion: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  courtSuggestionEmpty: { padding: 16, color: Theme.SUB_TEXT_COLOR, fontSize: 13 },
  courtSearchInput: { minHeight: 0, fontSize: 15, lineHeight: 20 },
  courtMapContainer: {
    height: 174,
    marginTop: 12,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: PRIMARY_TINT,
  },
  courtMap: { width: '100%', height: '100%' },
  courtMapEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 20,
  },
  courtMapEmptyText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  courtMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Theme.SURFACE,
    backgroundColor: Theme.PRIMARY_LIGHT,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 4,
  },
  courtMarkerSelected: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.PRIMARY },
  selectedCourtBadge: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 9,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedCourtBadgeText: { flex: 1, color: Theme.TEXT, fontSize: 12, fontWeight: '700' },
  courtListHeading: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  courtListLabel: {
    color: Theme.PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
  courtListCount: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    color: Theme.PRIMARY,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    backgroundColor: PRIMARY_TINT,
  },
  courtResults: { flex: 1 },
  courtList: { paddingBottom: 8 },
  emptyCourtList: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
  emptyCourtIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_TINT,
  },
  emptyCourtTitle: { color: Theme.TEXT, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyCourtText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.BACKGROUND,
  },
  modalLocation: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  modalLocationSelected: { borderColor: Theme.PRIMARY, backgroundColor: PRIMARY_TINT },
  modalLocationName: { color: Theme.TEXT, fontSize: 14, fontWeight: '700' },
  resultMarkerIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_TINT,
  },
  resultMarkerIconSelected: { backgroundColor: Theme.PRIMARY },
  chooseCourtButton: { marginTop: 8, borderRadius: 16 },
  chooseCourtButtonContent: { minHeight: 50 },
});
