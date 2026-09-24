import type { StaticScreenProps } from '@react-navigation/core';
import type React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '../../../theme';
import type {
  AvailabilityPreference,
  OnboardingLocationParams,
  PlayStyle,
  SkillLevel,
} from './OnboardingFlowTypes';
import type { OnboardingMatchedPlayersParams } from './OnboardingFoundMatches';

type OnboardingSkillAvailabilityProps = StaticScreenProps<OnboardingLocationParams>;

const SKILL_LEVELS: SkillLevel[] = [
  'Beginner',
  'Casual',
  'Intermediate',
  'Advanced',
  'Competitive',
];

const AVAILABILITY_OPTIONS: AvailabilityPreference[] = [
  'Morning',
  'Afternoon',
  'Evening',
  'Weekend',
];

const PLAY_STYLES: PlayStyle[] = ['Rally', 'Singles', 'Doubles', 'Casual Match', 'Open Play'];

export function OnboardingSkillAvailability({ route }: OnboardingSkillAvailabilityProps) {
  const navigation = useNavigation();
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [availability, setAvailability] = useState<AvailabilityPreference[]>([]);
  const [playStyles, setPlayStyles] = useState<PlayStyle[]>([]);

  const toggleAvailability = (option: AvailabilityPreference) => {
    setAvailability((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  };

  const togglePlayStyle = (option: PlayStyle) => {
    setPlayStyles((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  };

  const handleFindMatches = () => {
    if (!skillLevel) {
      return;
    }

    const params: OnboardingMatchedPlayersParams = {
      ...route.params,
      skillLevel,
      availability,
      playStyles,
    };

    navigation.navigate('OnboardingMatchedPlayers', params);
  };

  const isReady = Boolean(skillLevel);

  return (
    <SafeAreaView style={Theme.styles.appContainer}>
      <ScrollView
        style={Theme.styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={[Theme.styles.subtext, { fontWeight: 600 }]}>Onboarding 3 of 3</Text>
          <Text style={[Theme.styles.screenHeader, styles.header]}>Skill and play style</Text>
          <Text style={Theme.styles.subtext}>
            Pick the basics now. You can refine everything later.
          </Text>
        </View>

        <ChipSection title="Skill level">
          {SKILL_LEVELS.map((level) => (
            <SelectableChip
              key={level}
              label={level}
              selected={skillLevel === level}
              onPress={() => setSkillLevel(level)}
            />
          ))}
        </ChipSection>

        {/* <ChipSection title="Availability">
          {AVAILABILITY_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              label={option}
              selected={availability.includes(option)}
              onPress={() => toggleAvailability(option)}
            />
          ))}
        </ChipSection> */}

        <ChipSection title="Play style" optional>
          {PLAY_STYLES.map((option) => (
            <SelectableChip
              key={option}
              label={option}
              selected={playStyles.includes(option)}
              onPress={() => togglePlayStyle(option)}
            />
          ))}
        </ChipSection>

        <Button
          mode="contained"
          icon="account-search-outline"
          buttonColor={Theme.PRIMARY}
          textColor={Theme.SURFACE}
          style={[styles.findButton, !isReady && styles.disabledButton]}
          contentStyle={styles.findButtonContent}
          labelStyle={styles.findButtonText}
          onPress={handleFindMatches}
          disabled={!isReady}
        >
          Find Matches
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChipSection({
  title,
  optional = false,
  children,
}: {
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {optional ? <Text style={styles.optionalText}>Optional</Text> : null}
      </View>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

function SelectableChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      mode={selected ? 'contained' : 'outlined'}
      onPress={onPress}
      buttonColor={selected ? Theme.PRIMARY : Theme.SURFACE}
      textColor={selected ? Theme.SURFACE : Theme.TEXT}
      style={[styles.chip, selected && styles.selectedChip]}
      contentStyle={styles.chipContent}
      labelStyle={[styles.chipText, selected && styles.selectedChipText]}
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
    gap: 22,
  },
  header: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 8,
  },
  section: {
    gap: 11,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: Theme.PRIMARY,
    fontSize: 18,
    fontWeight: '800',
  },
  optionalText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minHeight: 44,
    borderRadius: 999,
    borderColor: Theme.SECONDARY,
  },
  selectedChip: {
    backgroundColor: Theme.PRIMARY,
    borderColor: Theme.PRIMARY,
  },
  chipText: {
    color: Theme.TEXT,
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 16,
    marginVertical: 0,
  },
  chipContent: {
    minHeight: 44,
  },
  selectedChipText: {
    color: Theme.SURFACE,
  },
  findButton: {
    marginTop: 4,
    borderRadius: 16,
  },
  findButtonContent: {
    minHeight: 52,
  },
  disabledButton: {
    backgroundColor: Theme.SECONDARY,
  },
  findButtonText: {
    color: Theme.SURFACE,
    fontSize: 16,
    fontWeight: '800',
  },
});
