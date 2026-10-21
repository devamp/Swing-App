import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, onSnapshot } from 'firebase/firestore';
import { ActivityIndicator, Button, Snackbar, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import SelectableChip from '../../../components/SelectableChip';
import CourtBackground from '../../../components/CourtBackground';
import { authService } from '../../../services/authService';
import type {
  MatchActivity,
  PlayerProfile,
  PlayerProfileUpdate,
  PreferredGameType,
  ProfilePlayStyle,
  ProfileSkillLevel,
  ProfileSport,
} from '../../../types';
import { userService } from '../../../services/userService';
import { Database } from '../../../services/firebase';
import Theme from '../../../theme';
import { usesNativeTabs } from '../../nativeTabs';
import { getPlayerInitials } from '../../../utils';
import { OnboardingMatchPreferencesParams } from '../onboarding/OnboardingFlowTypes';
import { SwingBadRequestError, SwingError, SwingNotFoundError } from '../../../services/errorService';

type UserDocument = {
  username?: string;
  email?: string;
  onboardingPreferences?: OnboardingMatchPreferencesParams;
  profile?: PlayerProfile;
};

type EditForm = PlayerProfileUpdate & { photoUrl?: string };

const SKILL_LEVELS: ProfileSkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const SPORTS: ProfileSport[] = ['Tennis', 'Pickleball'];
const GAME_TYPES: PreferredGameType[] = ['Singles', 'Doubles', 'Both'];
const PLAY_STYLES: ProfilePlayStyle[] = ['Casual', 'Competitive', 'Both'];
const AVAILABILITY_OPTIONS = [
  'Weekday mornings',
  'Weekday evenings',
  'Weekend mornings',
  'Weekend afternoons',
];

// TODO: Replace with match queries once joined/hosted match reads are available.
const EMPTY_MATCH_ACTIVITY: MatchActivity = { upcoming: 0, joined: 0, hosted: 0 };

function normalizeSkillLevel(value?: string): ProfileSkillLevel | undefined {
  if (value === 'Intermediate' || value === 'Advanced' || value === 'Beginner') return value;
  if (value === 'Competitive') return 'Advanced';
  if (value === 'Casual') return 'Beginner';
  return undefined;
}

function getLegacySports(preferences?: OnboardingMatchPreferencesParams) {
  const sports: Partial<Record<ProfileSport, ProfileSkillLevel>> = {};
  if (!preferences) return sports;

  const skill = normalizeSkillLevel(preferences.skillLevel);
  if (!skill) return sports;
  if (preferences.selectedSport === 'Tennis' || preferences.selectedSport === 'Both') {
    sports.Tennis = skill;
  }
  if (preferences.selectedSport === 'Pickleball' || preferences.selectedSport === 'Both') {
    sports.Pickleball = skill;
  }
  return sports;
}

function getLegacyGameType(preferences?: OnboardingMatchPreferencesParams): PreferredGameType {
  const singles = preferences?.playStyles.includes('Singles');
  const doubles = preferences?.playStyles.includes('Doubles');
  if (singles && doubles) return 'Both';
  if (doubles) return 'Doubles';
  return 'Singles';
}

function getInitialForm(user: UserDocument, authDisplayName?: string | null): EditForm {
  const legacyLocation =
    user.onboardingPreferences?.searchCriteria.type === 'Manual'
      ? user.onboardingPreferences.searchCriteria.label
      : '';

  return {
    displayName: user.username || authDisplayName || '',
    location: user.profile?.location || legacyLocation,
    availabilityStatus: user.profile?.availabilityStatus || '',
    bio: user.profile?.bio || '',
    sports: user.profile?.sports || getLegacySports(user.onboardingPreferences),
    preferredGameType:
      user.profile?.preferredGameType || getLegacyGameType(user.onboardingPreferences),
    playStyle: user.profile?.playStyle || 'Casual',
    typicalAvailability:
      user.profile?.typicalAvailability || user.onboardingPreferences?.availability || [],
  };
}

function Avatar({ photoUrl, name, size = 92 }: { photoUrl?: string; name: string; size?: number }) {
  const avatarStyle = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) return <Image source={{ uri: photoUrl }} style={[styles.avatar, avatarStyle]} />;

  return (
    <View style={[styles.avatarFallback, avatarStyle]}>
      <Text style={[styles.avatarInitials, { fontSize: size * 0.3 }]}>
        {getPlayerInitials(name) || '?'}
      </Text>
      <MaterialCommunityIcons
        name="tennis-ball"
        size={size * 0.22}
        color={Theme.SURFACE}
        style={styles.avatarBadge}
      />
    </View>
  );
}

function SectionCard({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${title.toLowerCase()}`}
            onPress={onEdit}
            style={({ pressed }) => [styles.sectionEdit, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={Theme.PRIMARY} />
            <Text style={styles.sectionEditText}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function AccountRow({
  icon,
  label,
  onPress,
  destructive = false,
  loading = false,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
}) {
  const color = destructive ? '#B42318' : Theme.PRIMARY;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading, busy: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.accountLabel, destructive && styles.destructiveLabel]}>{label}</Text>
      {loading ? (
        <ActivityIndicator size={20} color={color} />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={24} color={Theme.SUB_TEXT_COLOR} />
      )}
    </Pressable>
  );
}

function ChoiceField<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value?: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => (
          <SelectableChip
            key={option}
            label={option}
            selected={value === option}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}

function EditProfileModal({
  visible,
  initialForm,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialForm: EditForm;
  saving: boolean;
  onClose: () => void;
  onSave: (form: EditForm) => void;
}) {
  const [form, setForm] = useState(initialForm);
  const selectedSports = SPORTS.filter((sport) => Boolean(form.sports?.[sport]));
  const canSave = Boolean(form.displayName.trim() && selectedSports.length);

  const toggleSport = (sport: ProfileSport) => {
    setForm((current) => {
      const sports = { ...current.sports };
      if (sports[sport]) delete sports[sport];
      else sports[sport] = 'Beginner';
      return { ...current, sports };
    });
  };

  const toggleAvailability = (availability: string) => {
    setForm((current) => {
      const currentAvailability = current.typicalAvailability || [];
      return {
        ...current,
        typicalAvailability: currentAvailability.includes(availability)
          ? currentAvailability.filter((item) => item !== availability)
          : [...currentAvailability, availability],
      };
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <KeyboardAvoidingView
          style={styles.modalSafeArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close edit profile"
              disabled={saving}
              onPress={onClose}
              style={styles.iconButton}
            >
              <MaterialCommunityIcons name="close" size={26} color={Theme.TEXT} />
            </Pressable>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={styles.iconButton} />
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              mode="outlined"
              label="Display name *"
              value={form.displayName}
              onChangeText={(displayName) => setForm((current) => ({ ...current, displayName }))}
              error={!form.displayName.trim()}
              disabled={saving}
              maxLength={60}
            />
            {!form.displayName.trim() ? (
              <Text style={styles.errorText}>Display name is required.</Text>
            ) : null}

            <TextInput
              mode="outlined"
              label="Home city or general area"
              value={form.location}
              onChangeText={(location) => setForm((current) => ({ ...current, location }))}
              disabled={saving}
              maxLength={80}
            />
            <TextInput
              mode="outlined"
              label="Short bio"
              value={form.bio}
              onChangeText={(bio) => setForm((current) => ({ ...current, bio }))}
              disabled={saving}
              multiline
              maxLength={100}
              right={<TextInput.Affix text={`${form.bio?.length || 0}/100`} />}
            />

            <Text style={styles.fieldLabel}>Sports played *</Text>
            <View style={styles.chipRow}>
              {SPORTS.map((sport) => (
                <SelectableChip
                  key={sport}
                  label={sport}
                  icon={sport === 'Tennis' ? 'tennis' : 'table-tennis'}
                  selected={selectedSports.includes(sport)}
                  onPress={() => toggleSport(sport)}
                />
              ))}
            </View>
            {!selectedSports.length ? (
              <Text style={styles.errorText}>Select at least one sport.</Text>
            ) : null}

            {selectedSports.map((sport) => (
              <View key={sport} style={styles.formGroup}>
                <Text style={styles.fieldLabel}>{sport} skill level *</Text>
                <View style={styles.chipRow}>
                  {SKILL_LEVELS.map((level) => (
                    <SelectableChip
                      key={level}
                      label={level}
                      selected={form.sports?.[sport] === level}
                      onPress={() =>
                        setForm((current) => ({
                          ...current,
                          sports: { ...current.sports, [sport]: level },
                        }))
                      }
                    />
                  ))}
                </View>
              </View>
            ))}

            <ChoiceField
              label="Preferred game type"
              options={GAME_TYPES}
              value={form.preferredGameType}
              onChange={(preferredGameType) =>
                setForm((current) => ({ ...current, preferredGameType }))
              }
            />
            <ChoiceField
              label="Play style"
              options={PLAY_STYLES}
              value={form.playStyle}
              onChange={(playStyle) => setForm((current) => ({ ...current, playStyle }))}
            />
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Typical availability</Text>
              <View style={styles.chipRow}>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <SelectableChip
                    key={option}
                    label={option}
                    selected={form.typicalAvailability?.includes(option) || false}
                    onPress={() => toggleAvailability(option)}
                  />
                ))}
              </View>
            </View>
            <TextInput
              mode="outlined"
              label="Availability status (optional)"
              placeholder="Open to games this weekend"
              value={form.availabilityStatus}
              onChangeText={(availabilityStatus) =>
                setForm((current) => ({ ...current, availabilityStatus }))
              }
              disabled={saving}
              maxLength={60}
            />
            <Button
              mode="contained"
              icon="content-save-outline"
              onPress={() => onSave(form)}
              disabled={!canSave || saving}
              loading={saving}
              buttonColor={Theme.PRIMARY}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export function Profile() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const authUser = authService.getCurrentUser();
  const userId = authUser?.uid;
  const profileQueryKey = useMemo(() => ['profile', userId] as const, [userId]);
  const [editVisible, setEditVisible] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) throw new SwingBadRequestError('Please sign in to view your profile.');
      const loadedUser = await userService.getUserById(userId);
      if (!loadedUser) throw new SwingNotFoundError('Your profile could not be found.');
      return loadedUser as UserDocument;
    },
  });

  useFocusEffect(
    useCallback(() => {
      if (userId) void profileQuery.refetch();
    }, [profileQuery.refetch, userId]),
  );

  useEffect(() => {
    if (!userId) return;

    return onSnapshot(
      doc(Database, 'Users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          queryClient.setQueryData<UserDocument>(profileQueryKey, snapshot.data() as UserDocument);
        } else {
          void profileQuery.refetch();
        }
      },
      (error) => console.warn('Could not sync profile changes', error),
    );
  }, [profileQuery.refetch, profileQueryKey, queryClient, userId]);

  const user = profileQuery.data;
  const initialForm = useMemo(
    () => getInitialForm(user || {}, authUser?.displayName),
    [authUser?.displayName, user],
  );

  const saveMutation = useMutation({
    mutationFn: async (form: EditForm) => {
      if (!authUser?.uid) throw new SwingBadRequestError('Please sign in to save your profile.');

      await userService.updateProfile(authUser.uid, {
        ...form,
        displayName: form.displayName.trim(),
        location: form.location?.trim(),
        availabilityStatus: form.availabilityStatus?.trim(),
        bio: form.bio?.trim(),
      });
      await authService.updateDisplayName(form.displayName.trim()).catch((error) => {
        console.warn('Could not sync Firebase Auth display name', error);
      });
    },
    onSuccess: async () => {
      setEditVisible(false);
      setSuccessMessage('Profile saved.');
      await profileQuery.refetch();
    },
    onError: (error) => SwingError.showAlert(error),
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Landing' }] }),
    onError: (error) => SwingError.showAlert(error),
  });

  const deleteMutation = useMutation({
    mutationFn: () => authService.deleteAccount(),
    onSuccess: () => navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Landing' }] }),
    onError: (error) => SwingError.showAlert(error),
  });

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your Swing profile and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  };

  const confirmLogOut = () => {
    Alert.alert('Log out?', 'Are you sure you want to log out now?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logoutMutation.mutate() },
    ]);
  };

  if (!authUser || profileQuery.isError) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <CourtBackground />
        <MaterialCommunityIcons name="account-alert-outline" size={48} color={Theme.PRIMARY} />
        <Text style={styles.stateTitle}>We couldn’t load your profile</Text>
        <Text style={styles.stateCopy}>
          {SwingError.parse(profileQuery.error).message}
        </Text>
        <Button mode="contained" onPress={() => profileQuery.refetch()} buttonColor={Theme.PRIMARY}>
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  if (profileQuery.isLoading || !user) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <CourtBackground />
        <ActivityIndicator size="large" color={Theme.PRIMARY} />
        <Text style={styles.stateCopy}>Loading your profile…</Text>
      </SafeAreaView>
    );
  }

  const name = initialForm.displayName || 'Swing Player';
  const sports = SPORTS.filter((sport) => Boolean(initialForm.sports?.[sport]));
  const availability = initialForm.typicalAvailability || [];
  const activity = user.profile?.matchActivity || EMPTY_MATCH_ACTIVITY;
  const completionMessage = !initialForm.location
    ? 'Add your city or general area to find nearby matches.'
    : !sports.length || sports.some((sport) => !initialForm.sports?.[sport])
      ? 'Add your sport and skill level to find better matches.'
      : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <CourtBackground />
      <ScrollView
        contentInsetAdjustmentBehavior={usesNativeTabs ? 'automatic' : 'never'}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>
        <View style={styles.profileHeader}>
          <View style={styles.avatarFrame}>
            <View
              style={styles.avatarHalo}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <Avatar photoUrl={initialForm.photoUrl} name={name} />
          </View>
          <Text style={styles.displayName}>{name}</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={18}
              color={Theme.SUB_TEXT_COLOR}
            />
            <Text style={styles.locationText}>
              {initialForm.location || 'General area not added'}
            </Text>
          </View>
          {initialForm.availabilityStatus ? (
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{initialForm.availabilityStatus}</Text>
            </View>
          ) : null}
          {initialForm.bio ? <Text style={styles.bio}>{initialForm.bio}</Text> : null}
          <Button
            mode="contained"
            icon="account-edit-outline"
            onPress={() => setEditVisible(true)}
            buttonColor={Theme.PRIMARY}
            contentStyle={styles.editButtonContent}
            style={styles.editButton}
          >
            Edit Profile
          </Button>
        </View>

        {completionMessage && !completionDismissed ? (
          <View style={styles.completionCard}>
            <View style={styles.completionIcon}>
              <MaterialCommunityIcons
                name="account-check-outline"
                size={24}
                color={Theme.PRIMARY}
              />
            </View>
            <View style={styles.completionCopy}>
              <Text style={styles.completionTitle}>Complete your profile</Text>
              <Text style={styles.completionText}>{completionMessage}</Text>
              <Pressable onPress={() => setEditVisible(true)} style={styles.inlineAction}>
                <Text style={styles.inlineActionText}>Add details</Text>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss profile completion prompt"
              onPress={() => setCompletionDismissed(true)}
              style={styles.dismissButton}
            >
              <MaterialCommunityIcons name="close" size={20} color={Theme.SUB_TEXT_COLOR} />
            </Pressable>
          </View>
        ) : null}

        <SectionCard title="Playing Profile" onEdit={() => setEditVisible(true)}>
          <View style={styles.sportsList}>
            {sports.length ? (
              sports.map((sport) => (
                <View key={sport} style={styles.sportRow}>
                  <View style={styles.sportIcon}>
                    <MaterialCommunityIcons
                      name={sport === 'Tennis' ? 'tennis' : 'table-tennis'}
                      size={24}
                      color={Theme.PRIMARY}
                    />
                  </View>
                  <Text style={styles.sportName}>{sport}</Text>
                  <View style={styles.skillBadge}>
                    <Text style={styles.skillText}>{initialForm.sports?.[sport]}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Add a sport to start finding players.</Text>
            )}
          </View>
          <View style={styles.preferencesGrid}>
            <PreferenceItem label="Game Type" value={initialForm.preferredGameType || 'Not set'} />
            <PreferenceItem label="Play Style" value={initialForm.playStyle || 'Not set'} />
            <PreferenceItem
              label="Availability"
              value={availability.length ? availability.join(' · ') : 'Not set'}
            />
            {!availability.length ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set availability in edit profile"
                onPress={() => setEditVisible(true)}
                style={({ pressed }) => [styles.availabilityAction, pressed && styles.pressed]}
              >
                <Text style={styles.sectionEditText}>Set Availability</Text>
              </Pressable>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Match Activity">
          <View style={styles.activityRow}>
            <ActivityItem
              icon="calendar-clock"
              count={activity.upcoming}
              label="Upcoming"
              onPress={() => navigation.navigate('Home', { screen: 'Dashboard' })}
            />
            <ActivityItem icon="account-check-outline" count={activity.joined} label="Joined" />
            <ActivityItem icon="whistle-outline" count={activity.hosted} label="Hosted" />
          </View>
        </SectionCard>

        <SectionCard title="Account">
          <AccountRow
            icon="logout"
            label="Log Out"
            onPress={confirmLogOut}
            loading={logoutMutation.isPending}
          />
          <View style={styles.accountDivider} />
          <AccountRow
            icon="delete-outline"
            label="Delete Account"
            onPress={confirmDelete}
            destructive
            loading={deleteMutation.isPending}
          />
        </SectionCard>
      </ScrollView>

      {editVisible ? (
        <EditProfileModal
          visible={editVisible}
          initialForm={initialForm}
          saving={saveMutation.isPending}
          onClose={() => !saveMutation.isPending && setEditVisible(false)}
          onSave={(form) => saveMutation.mutate(form)}
        />
      ) : null}
      <Snackbar
        visible={Boolean(successMessage)}
        onDismiss={() => setSuccessMessage('')}
        duration={2500}
      >
        {successMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

function PreferenceItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.preferenceItem}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Text style={styles.preferenceValue}>{value}</Text>
    </View>
  );
}

function ActivityItem({
  icon,
  count,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  count: number;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <MaterialCommunityIcons name={icon} size={22} color={Theme.PRIMARY} />
      <Text style={styles.activityCount}>{count}</Text>
      <Text style={styles.activityLabel}>{label}</Text>
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} matches, ${count}`}
      onPress={onPress}
      style={({ pressed }) => [styles.activityItem, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.activityItem}>{content}</View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.BACKGROUND },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  screenTitle: { color: Theme.PRIMARY, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  profileHeader: { alignItems: 'center', paddingVertical: 8 },
  avatarFrame: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 66,
    borderWidth: 1,
    borderColor: `${Theme.PRIMARY}20`,
  },
  avatarHalo: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Theme.PRIMARY,
    opacity: 0.06,
  },
  avatar: { backgroundColor: Theme.PRIMARY_LIGHT, borderWidth: 3, borderColor: Theme.SURFACE },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.PRIMARY,
    borderWidth: 3,
    borderColor: Theme.SURFACE,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 3,
  },
  avatarInitials: { color: Theme.SURFACE, fontWeight: '800' },
  avatarBadge: { position: 'absolute', right: 8, bottom: 8, opacity: 0.8 },
  displayName: {
    marginTop: 12,
    color: Theme.TEXT,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  locationRow: {
    maxWidth: '100%',
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: { flexShrink: 1, color: Theme.SUB_TEXT_COLOR, fontSize: 15, textAlign: 'center' },
  sportBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  sportBadge: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  sportBadgeText: {
    color: Theme.PRIMARY,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusPill: {
    maxWidth: '100%',
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Theme.PRIMARY },
  statusText: { flexShrink: 1, color: Theme.PRIMARY, fontSize: 13, fontWeight: '700' },
  bio: {
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center',
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 20,
  },
  editButton: { maxWidth: '100%', marginTop: 10, borderRadius: 14 },
  editButtonContent: { minHeight: 48, paddingHorizontal: 18 },
  completionCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  completionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.SURFACE,
  },
  completionCopy: { flex: 1 },
  completionTitle: { color: Theme.TEXT, fontSize: 15, fontWeight: '800' },
  completionText: { marginTop: 2, color: Theme.SUB_TEXT_COLOR, fontSize: 13, lineHeight: 18 },
  inlineAction: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  inlineActionText: { color: Theme.PRIMARY, fontWeight: '800' },
  dismissButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    marginRight: -8,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    backgroundColor: Theme.SURFACE,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: {
    flex: 1,
    color: '#202C30',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  sectionEdit: {
    minHeight: 44,
    minWidth: 44,
    marginVertical: -9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sectionEditText: { color: Theme.PRIMARY, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  sportsList: { gap: 10 },
  sportRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sportIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  sportName: { flex: 1, color: '#202C30', fontSize: 15, lineHeight: 21, fontWeight: '600' },
  skillBadge: {
    flexShrink: 1,
    maxWidth: '50%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  skillText: {
    color: Theme.PRIMARY,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  preferencesGrid: {
    marginTop: 14,
    paddingTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: '4%',
    rowGap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.PRIMARY_BORDER,
  },
  preferenceItem: { width: '48%', gap: 4 },
  preferenceLabel: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, lineHeight: 17 },
  preferenceValue: { color: '#202C30', fontSize: 15, lineHeight: 21, fontWeight: '500' },
  availabilityAction: {
    width: '48%',
    minHeight: 44,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  activityRow: { flexDirection: 'row', gap: 8 },
  activityItem: {
    flex: 1,
    minHeight: 84,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  activityCount: {
    marginTop: 3,
    color: Theme.PRIMARY,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  activityLabel: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  accountRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountLabel: { flex: 1, color: '#202C30', fontSize: 15, fontWeight: '500' },
  destructiveLabel: { color: '#B42318' },
  accountDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Theme.PRIMARY_BORDER },
  pressed: { opacity: 0.65 },
  emptyText: { color: Theme.SUB_TEXT_COLOR, fontSize: 14, lineHeight: 20 },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 28,
    backgroundColor: Theme.BACKGROUND,
  },
  stateTitle: { color: Theme.TEXT, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  stateCopy: { color: Theme.SUB_TEXT_COLOR, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  modalSafeArea: { flex: 1, backgroundColor: Theme.BACKGROUND },
  modalHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.PRIMARY_BORDER,
    backgroundColor: Theme.SURFACE,
  },
  modalTitle: { color: Theme.TEXT, fontSize: 18, fontWeight: '800' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  formContent: { padding: 20, paddingBottom: 40, gap: 14 },
  formGroup: { gap: 9 },
  fieldLabel: { color: Theme.TEXT, fontSize: 15, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  errorText: { color: '#B42318', fontSize: 12, lineHeight: 17 },
  saveButton: { marginTop: 8, borderRadius: 14 },
  saveButtonContent: { minHeight: 52 },
});
