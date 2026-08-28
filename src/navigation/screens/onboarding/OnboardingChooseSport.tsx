import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { Button } from 'react-native-paper';
import Theme from '../../../theme';
import type { SportPreference } from './OnboardingFlowTypes';

type SportOption = {
  name: Exclude<SportPreference, 'Both'>;
  copy: string;
  image: ReturnType<typeof require>;
};

const BOTH_SPORTS_IMAGE = require('../../../../assets/both-sport.png');

const SPORTS: SportOption[] = [
  {
    name: 'Tennis',
    copy: 'Find partners for rallies, singles, and doubles.',
    image: require('../../../../assets/tennis-court.png'),
  },
  {
    name: 'Pickleball',
    copy: 'Match with players for casual games and open play.',
    image: require('../../../../assets/pickle-ball-court.png'),
  },
];

export function OnboardingChooseSport() {
  const navigation = useNavigation();
  const [selectedSports, setSelectedSports] = useState<Array<'Tennis' | 'Pickleball'>>([]);

  const selectedSport = useMemo<SportPreference | ''>(() => {
    if (selectedSports.length === 2) {
      return 'Both';
    }

    return selectedSports[0] ?? '';
  }, [selectedSports]);

  const toggleSport = (sport: 'Tennis' | 'Pickleball') => {
    setSelectedSports((current) =>
      current.includes(sport) ? current.filter((item) => item !== sport) : [...current, sport],
    );
  };

  const selectBoth = () => {
    setSelectedSports((current) => (current.length === 2 ? [] : ['Tennis', 'Pickleball']));
  };

  const handleContinue = () => {
    if (!selectedSport) {
      return;
    }

    navigation.navigate('OnboardingChooseLocation', { selectedSport });
  };

  return (
    <SafeAreaView style={Theme.styles.appContainer}>
      <ScrollView
        style={Theme.styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={[Theme.styles.subtext, { fontWeight: 600 }]}>Onboarding 1 of 3</Text>
          <Text style={[Theme.styles.screenHeader, styles.header]}>What do you want to play?</Text>
          <Text style={Theme.styles.subtext}>
            Choose one or both sports so Swing can tune your matches.
          </Text>
        </View>

        <View style={styles.cardGrid}>
          {SPORTS.map((sport) => {
            const isSelected = selectedSports.includes(sport.name);

            return (
              <View key={sport.name} style={styles.sportCardContainer}>
                <Button
                  mode={isSelected ? 'contained' : 'outlined'}
                  onPress={() => toggleSport(sport.name)}
                  buttonColor={isSelected ? Theme.PRIMARY : Theme.SURFACE}
                  textColor={isSelected ? Theme.SURFACE : Theme.PRIMARY}
                  style={[styles.sportCard, isSelected && styles.selectedCard]}
                  contentStyle={styles.sportCardButtonContent}
                  labelStyle={styles.hiddenButtonLabel}
                  accessibilityLabel={`${sport.name}${isSelected ? ', selected' : ''}. ${
                    sport.copy
                  }`}
                  accessibilityState={{ selected: isSelected }}
                >
                  {sport.name}
                </Button>
                <View pointerEvents="none" style={styles.sportCardContent}>
                  <View style={[styles.iconFrame, isSelected && styles.selectedIconFrame]}>
                    <Image source={sport.image} style={styles.sportIcon} resizeMode="contain" />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, isSelected && styles.selectedCardTitle]}>
                      {sport.name}
                    </Text>
                    <Text style={[styles.cardCopy, isSelected && styles.selectedCardCopy]}>
                      {sport.copy}
                    </Text>
                  </View>
                  {isSelected ? (
                    <MaterialCommunityIcons name="check-circle" size={24} color={Theme.SURFACE} />
                  ) : null}
                </View>
              </View>
            );
          })}

          <View style={styles.sportCardContainer}>
            <Button
              mode={selectedSport === 'Both' ? 'contained' : 'outlined'}
              onPress={selectBoth}
              buttonColor={selectedSport === 'Both' ? Theme.PRIMARY : Theme.SURFACE}
              textColor={selectedSport === 'Both' ? Theme.SURFACE : Theme.PRIMARY}
              style={[
                styles.sportCard,
                styles.bothCard,
                selectedSport === 'Both' && styles.selectedCard,
              ]}
              contentStyle={styles.bothCardButtonContent}
              labelStyle={styles.hiddenButtonLabel}
              accessibilityLabel={`Both${
                selectedSport === 'Both' ? ', selected' : ''
              }. See tennis and pickleball players in one search.`}
              accessibilityState={{ selected: selectedSport === 'Both' }}
            >
              Both
            </Button>
            <View pointerEvents="none" style={[styles.sportCardContent, styles.bothCardContent]}>
              <View
                style={[styles.iconFrame, selectedSport === 'Both' && styles.selectedIconFrame]}
              >
                <Image source={BOTH_SPORTS_IMAGE} style={styles.sportIcon} resizeMode="contain" />
              </View>
              <View style={styles.cardText}>
                <Text
                  style={[styles.cardTitle, selectedSport === 'Both' && styles.selectedCardTitle]}
                >
                  Both
                </Text>
                <Text
                  style={[styles.cardCopy, selectedSport === 'Both' && styles.selectedCardCopy]}
                >
                  See tennis and pickleball players in one search.
                </Text>
              </View>
              {selectedSport === 'Both' ? (
                <MaterialCommunityIcons name="check-circle" size={24} color={Theme.SURFACE} />
              ) : null}
            </View>
          </View>
        </View>

        <Button
          mode="contained"
          icon="chevron-right"
          buttonColor={Theme.PRIMARY}
          textColor={Theme.SURFACE}
          style={[styles.continueButton, !selectedSport && styles.disabledButton]}
          contentStyle={styles.continueButtonContent}
          labelStyle={styles.continueButtonText}
          onPress={handleContinue}
          disabled={!selectedSport}
        >
          Continue
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
    gap: 18,
  },
  header: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 8,
  },
  cardGrid: {
    gap: 12,
  },
  sportCardContainer: {
    position: 'relative',
  },
  sportCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    shadowColor: '#004C4C',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sportCardButtonContent: {
    minHeight: 144,
  },
  bothCardButtonContent: {
    minHeight: 124,
  },
  hiddenButtonLabel: {
    opacity: 0,
  },
  sportCardContent: {
    ...StyleSheet.absoluteFill,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bothCardContent: {
    minHeight: 124,
  },
  selectedCard: {
    backgroundColor: Theme.PRIMARY,
    borderColor: Theme.PRIMARY,
    borderWidth: 2,
  },
  iconFrame: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: Theme.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconFrame: {
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.TEXT,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sportIcon: {
    width: 58,
    height: 58,
  },
  bothCard: {
    borderRadius: 18,
  },
  cardText: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    color: Theme.TEXT,
    fontSize: 20,
    fontWeight: '800',
  },
  selectedCardTitle: {
    color: Theme.SURFACE,
  },
  cardCopy: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
  },
  selectedCardCopy: {
    color: Theme.SURFACE,
  },
  continueButton: {
    marginTop: 8,
    borderRadius: 16,
  },
  continueButtonContent: {
    minHeight: 52,
    flexDirection: 'row-reverse',
  },
  disabledButton: {
    backgroundColor: Theme.SECONDARY,
  },
  continueButtonText: {
    color: Theme.SURFACE,
    fontSize: 16,
    fontWeight: '800',
  },
});
