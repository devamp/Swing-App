import { View, Text, Image, StyleSheet } from 'react-native';
import Theme from '../../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';

const BENEFITS = [
  'Show up in nearby player searches',
  'Get notified about new matches',
  'Share when and where you play',
];

export function OnboardingMatchNotFound() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={Theme.styles.backgroundBlobTop} />
      <View style={Theme.styles.backgroundBlobBottom} />
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>No matches yet — be the first</Text>
          <Text style={Theme.styles.subtext}>
            Create your player profile so nearby players can find you when they join.
          </Text>
        </View>

        <Image
          source={require('../../../../assets/playersNotFound.png')}
          style={styles.illustration}
          resizeMode="contain"
        />

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
              onPress={() => {}}
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
              icon="filter-variant"
              onPress={() => navigation.navigate('Onboarding')}
              buttonColor={Theme.SURFACE}
              textColor={Theme.PRIMARY}
              style={styles.secondaryButton}
              contentStyle={styles.secondaryButtonContent}
              labelStyle={styles.secondaryButtonText}
            >
              Try different preferences
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.BACKGROUND,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  header: {
    color: Theme.PRIMARY,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 8,
    textAlign: 'left',
  },
  illustration: {
    width: 246,
    height: 246,
  },
  benefitCard: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
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
