import type { StaticScreenProps } from '@react-navigation/core';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Constants from '../../../constants';
import Theme from '../../../theme';
import type {
  OnboardingSportParams,
  SearchCriteria,
  SearchRadiusMiles,
} from './OnboardingFlowTypes';

type OnboardingChooseLocationProps = StaticScreenProps<OnboardingSportParams>;

const RADIUS_OPTIONS: SearchRadiusMiles[] = [5, 10, 25];

export function OnboardingChooseLocation({ route }: OnboardingChooseLocationProps) {
  const navigation = useNavigation();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [radiusMiles, setRadiusMiles] = useState<SearchRadiusMiles>(10);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');

  const selectCurrentLocation = async () => {
    setIsRequestingLocation(true);
    setPermissionMessage('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setSearchCriteria(null);
        setPermissionMessage(
          'Location permission was not granted. Enter a city, ZIP code, or court.',
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setSearchCriteria({
        type: 'Current',
        label: 'Current location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const setPortlandLocation = () => {
    setPermissionMessage('');
    setSearchCriteria({ type: 'Manual', ...Constants.PORTLAND_CENTER });
  };

  const handleContinue = () => {
    if (!searchCriteria) {
      return;
    }

    navigation.navigate('OnboardingSkillAvailability', {
      ...route.params,
      searchCriteria,
      radiusMiles,
    });
  };

  return (
    <SafeAreaView style={Theme.styles.appContainer}>
      <ScrollView
        style={Theme.styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={[Theme.styles.subtext, { fontWeight: 600 }]}>Step 2 of 3</Text>
          <Text style={[Theme.styles.screenHeader, styles.header]}>Where do you want to play?</Text>
          <Text style={Theme.styles.subtext}>
            Swing uses your location to show nearby players and games in your search radius.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.optionButtonContainer}>
            <Button
              mode={searchCriteria?.type === 'Current' ? 'contained' : 'outlined'}
              onPress={selectCurrentLocation}
              buttonColor={searchCriteria?.type === 'Current' ? Theme.PRIMARY : Theme.SURFACE}
              textColor={searchCriteria?.type === 'Current' ? Theme.SURFACE : Theme.PRIMARY}
              style={[
                styles.optionButton,
                searchCriteria?.type === 'Current' && styles.selectedOptionButton,
              ]}
              contentStyle={styles.optionButtonContent}
              labelStyle={styles.hiddenButtonLabel}
              disabled={isRequestingLocation}
              accessibilityLabel={`Use current location${
                searchCriteria?.type === 'Current' ? ', selected' : ''
              }`}
            >
              Use current location
            </Button>
            <View pointerEvents="none" style={styles.optionButtonOverlay}>
              <MaterialCommunityIcons
                name="map-marker-radius-outline"
                size={24}
                color={searchCriteria?.type === 'Current' ? Theme.SURFACE : Theme.PRIMARY}
              />
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionTitle,
                    searchCriteria?.type === 'Current' && styles.selectedOptionText,
                  ]}
                >
                  Use current location
                </Text>
                <Text
                  style={[
                    styles.optionCopy,
                    searchCriteria?.type === 'Current' && styles.selectedOptionText,
                  ]}
                >
                  {isRequestingLocation
                    ? 'Requesting permission...'
                    : 'Find players closest to you.'}
                </Text>
              </View>
              {searchCriteria?.type === 'Current' ? (
                <MaterialCommunityIcons name="check-circle" size={22} color={Theme.SURFACE} />
              ) : null}
            </View>
          </View>

          {permissionMessage ? (
            <Text style={styles.permissionMessage}>{permissionMessage}</Text>
          ) : null}

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.optionButtonContainer}>
            <Button
              mode={searchCriteria?.type === 'Manual' ? 'contained' : 'outlined'}
              onPress={setPortlandLocation}
              buttonColor={searchCriteria?.type === 'Manual' ? Theme.PRIMARY : Theme.SURFACE}
              textColor={searchCriteria?.type === 'Manual' ? Theme.SURFACE : Theme.PRIMARY}
              style={[
                styles.optionButton,
                searchCriteria?.type === 'Manual' && styles.selectedOptionButton,
              ]}
              contentStyle={styles.optionButtonContent}
              labelStyle={styles.hiddenButtonLabel}
              accessibilityLabel={`Portland, Oregon${
                searchCriteria?.type === 'Manual' ? ', selected' : ''
              }`}
            >
              Portland, OR
            </Button>
            <View pointerEvents="none" style={styles.optionButtonOverlay}>
              <MaterialCommunityIcons
                name="city-variant-outline"
                size={24}
                color={searchCriteria?.type === 'Manual' ? Theme.SURFACE : Theme.PRIMARY}
              />

              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionTitle,
                    searchCriteria?.type === 'Manual' && styles.selectedOptionText,
                  ]}
                >
                  Portland, OR
                </Text>

                <Text
                  style={[
                    styles.optionCopy,
                    searchCriteria?.type === 'Manual' && styles.selectedOptionText,
                  ]}
                >
                  Find players around the city.
                </Text>
              </View>

              {searchCriteria?.type === 'Manual' && (
                <MaterialCommunityIcons name="check-circle" size={22} color={Theme.SURFACE} />
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.radiusHeader}>Search radius</Text>
          <View style={styles.chipRow}>
            {RADIUS_OPTIONS.map((radius) => {
              const isSelected = radiusMiles === radius;

              return (
                <Button
                  key={radius}
                  mode={isSelected ? 'contained' : 'outlined'}
                  onPress={() => setRadiusMiles(radius)}
                  buttonColor={isSelected ? Theme.PRIMARY : Theme.SURFACE}
                  textColor={isSelected ? Theme.SURFACE : Theme.TEXT}
                  style={[styles.chip, isSelected && styles.selectedChip]}
                  contentStyle={styles.chipContent}
                  labelStyle={[styles.chipText, isSelected && styles.selectedChipText]}
                  accessibilityLabel={`${radius} miles${isSelected ? ', selected' : ''}`}
                >
                  {radius} miles
                </Button>
              );
            })}
          </View>
        </View>

        <Button
          mode="contained"
          icon="chevron-right"
          buttonColor={Theme.PRIMARY}
          textColor={Theme.SURFACE}
          style={[styles.continueButton, !searchCriteria && styles.disabledButton]}
          contentStyle={styles.continueButtonContent}
          labelStyle={styles.continueButtonText}
          onPress={handleContinue}
          disabled={!searchCriteria}
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
    gap: 20,
  },
  header: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 8,
  },
  section: {
    gap: 12,
  },
  optionButtonContainer: {
    position: 'relative',
  },
  optionButton: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
  },
  optionButtonContent: {
    minHeight: 76,
  },
  hiddenButtonLabel: {
    opacity: 0,
  },
  optionButtonOverlay: {
    ...StyleSheet.absoluteFill,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedOptionButton: {
    backgroundColor: Theme.PRIMARY,
    borderColor: Theme.PRIMARY,
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: Theme.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  optionCopy: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: Theme.SURFACE,
  },
  permissionMessage: {
    color: Theme.PRIMARY,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.SECONDARY,
  },
  dividerText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '800',
  },
  manualContainer: {
    width: '100%',
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.SECONDARY,
    backgroundColor: Theme.SURFACE,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedManualContainer: {
    borderColor: Theme.PRIMARY,
    borderWidth: 2,
  },
  locationInput: {
    flex: 1,
    minHeight: 56,
    color: Theme.TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  radiusHeader: {
    color: Theme.PRIMARY,
    fontSize: 18,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minWidth: 96,
    borderRadius: 999,
    borderColor: Theme.SECONDARY,
  },
  selectedChip: {
    backgroundColor: Theme.PRIMARY,
    borderColor: Theme.PRIMARY,
  },
  chipText: {
    color: Theme.TEXT,
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 16,
    marginVertical: 0,
  },
  chipContent: {
    minHeight: 42,
  },
  selectedChipText: {
    color: Theme.SURFACE,
  },
  continueButton: {
    marginTop: 6,
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
