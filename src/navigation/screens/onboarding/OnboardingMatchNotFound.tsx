import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import Theme from '../../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { OnboardingMatchPreferencesParams } from './OnboardingFlowTypes';

const BENEFITS = [
  'Show up in nearby player searches',
  'Get notified about new matches',
  'Share when and where you play',
];

type OnboardingMatchNotFoundProps = StaticScreenProps<OnboardingMatchPreferencesParams>;

export function OnboardingMatchNotFound({ route }: OnboardingMatchNotFoundProps) {
  const navigation = useNavigation();
  const heroImage = require('../../../../assets/playersNotFound.png');
  const { radiusMiles, searchCriteria, selectedSport } = route.params;
  const searchLocation = searchCriteria.type === 'Current' ? 'you' : searchCriteria.label;

  const handleCreateProfileClick = () => navigation.navigate('SignUp', route.params);

  return (
    <SafeAreaView style={styles.container}>
      <View style={Theme.styles.backgroundBlobTop} />
      <View style={Theme.styles.backgroundBlobBottom} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          style={Theme.styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Theme.TEXT} />
        </Pressable>

        <View style={styles.headerContainer}>
          <Text style={styles.header}>No matches found yet</Text>
          <Text style={styles.subtitle}>
            Be the first player looking to play in this area. Create a game and we’ll help others
            find you.
          </Text>
          <View style={styles.filterRow}>
            <View style={styles.filterPill}>
              <MaterialCommunityIcons
                name={selectedSport === 'Pickleball' ? 'table-tennis' : 'tennis'}
                size={15}
                color={Theme.PRIMARY}
              />
              <Text style={styles.filterText}>{selectedSport}</Text>
            </View>
            <View style={styles.filterPill}>
              <MaterialCommunityIcons name="map-marker-radius" size={15} color={Theme.PRIMARY} />
              <Text style={styles.filterText}>{radiusMiles} mi radius</Text>
            </View>
          </View>
        </View>

        <View style={styles.illustrationContainer}>
          <Image source={heroImage} style={styles.illustration} resizeMode="cover" />
        </View>

        <View style={styles.benefitCard}>
          <Text style={styles.benefitHeading}>Be ready when players join</Text>
          <View style={styles.benefitList}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <MaterialCommunityIcons name="check-circle" size={18} color={Theme.PRIMARY} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.reassuranceText}>Takes less than 2 minutes</Text>

          <View style={styles.actionContainer}>
            <Button
              mode="contained"
              icon="account-plus-outline"
              onPress={handleCreateProfileClick}
              buttonColor={Theme.PRIMARY}
              textColor={Theme.SURFACE}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonText}
            >
              Create my Swing profile
            </Button>
            <Button
              mode="outlined"
              icon="magnify"
              onPress={() => navigation.navigate('Onboarding')}
              buttonColor={Theme.SURFACE}
              textColor={Theme.PRIMARY}
              style={styles.secondaryButton}
              contentStyle={styles.secondaryButtonContent}
              labelStyle={styles.secondaryButtonText}
            >
              Change search preferences
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.BACKGROUND,
  },
  scrollView: {
    width: '100%',
  },
  content: {
    flexGrow: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  header: {
    color: Theme.TEXT,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 7,
    textAlign: 'left',
  },
  subtitle: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 20,
  },
  resultBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EAF5F5',
    marginBottom: 10,
  },
  resultBadgeText: {
    color: Theme.PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 13,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#EAF5F5',
  },
  filterText: {
    color: Theme.PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  illustrationContainer: {
    width: '100%',
    aspectRatio: 1.7,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 20,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  benefitCard: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    backgroundColor: Theme.SURFACE,
    shadowColor: '#004C4C',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  benefitHeading: {
    color: Theme.TEXT,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  benefitList: {
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  benefitText: {
    flex: 1,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
  },
  footer: {
    width: '100%',
    marginTop: 'auto',
    paddingTop: 4,
  },
  reassuranceText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    shadowColor: Theme.PRIMARY,
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryButtonContent: {
    minHeight: 52,
  },
  primaryButtonText: {
    color: Theme.SURFACE,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    borderColor: Theme.PRIMARY,
    borderRadius: 16,
  },
  secondaryButtonContent: {
    minHeight: 48,
  },
  secondaryButtonText: {
    color: Theme.PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
});
