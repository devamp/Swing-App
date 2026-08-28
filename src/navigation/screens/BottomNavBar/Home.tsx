import { useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '../../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SelectableChip from '../../../components/SelectableChip';

const SKILL_LEVELS = ['Tennis', 'Pickleball', 'Both'] as const;

function ChipSection({
  title,
  optional = false,
  children,
}: {
  title: string;
  optional?: boolean;
  children: ReactNode;
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

export function Home() {
  // Get these from DB
  const username = 'Devam';
  const hasNotifications = false;
  const selectedSport = 'Both';

  const [skillLevel, setSkillLevel] = useState<(typeof SKILL_LEVELS)[number]>(selectedSport);

  return (
    <SafeAreaView style={Theme.styles.appContainer}>
      <ScrollView
        style={Theme.styles.scrollView}
        contentContainerStyle={Theme.styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View style={{ flexDirection: 'column' }}>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <Text style={Theme.styles.screenHeader}>Hello {username}!</Text>
              <MaterialCommunityIcons name="hand-wave" size={22} color={Theme.PRIMARY} />
            </View>
            <Text style={Theme.styles.subtext}>Near Tualatin, OR</Text>
          </View>

          <View>
            <MaterialCommunityIcons
              name={hasNotifications ? 'bell-badge' : 'bell-outline'}
              size={24}
              color={hasNotifications ? Theme.ALERT : Theme.PRIMARY}
            />
          </View>
        </View>

        <ChipSection title="Sport">
          {SKILL_LEVELS.map((level) => (
            <SelectableChip
              key={level}
              label={level}
              selected={skillLevel === level}
              onPress={() => setSkillLevel(level)}
            />
          ))}
        </ChipSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    gap: 11,
    marginTop: 28,
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
});
