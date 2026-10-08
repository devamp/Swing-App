import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import SelectableChip from '../SelectableChip';
import { Sheet } from './Sheet';
import { AVAILABILITIES } from '../../services/playMap/fixtures';
import { DEFAULT_FILTERS } from '../../services/playMap/model';
import type { Filters, Mode } from '../../services/playMap/types';
import Theme from '../../theme';
export function FilterSheet({
  mode,
  filters,
  onApply,
  onClose,
}: {
  mode: Mode;
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);
  function choices<K extends keyof Filters>(title: string, key: K, options: Filters[K][]) {
    return (
      <View style={styles.section}>
        <Text style={styles.label}>{title}</Text>
        <View style={styles.options}>
          {options.map((value) => (
            <SelectableChip
              key={value}
              label={typeof value === 'number' ? `${value} miles` : value}
              selected={draft[key] === value}
              onPress={() => setDraft({ ...draft, [key]: value })}
            />
          ))}
        </View>
      </View>
    );
  }
  return (
    <Sheet title={`${mode === 'matches' ? 'Match' : 'Player'} filters`} onClose={onClose}>
      {choices('Sport', 'sport', ['All sports', 'Tennis', 'Pickleball'])}
      {choices('Distance from search center', 'distance', [2, 5, 10, 25, 50])}
      {choices('Skill level', 'skill', ['Any skill', 'Beginner', 'Intermediate', 'Advanced'])}
      {mode === 'matches' ? (
        <>
          {choices('Date', 'date', ['Any day', 'Today', 'Tomorrow', 'This weekend'])}
          {choices('Time of day', 'time', ['Any time', 'Morning', 'Afternoon', 'Evening'])}
        </>
      ) : (
        choices('Preferred availability', 'availability', ['Any availability', ...AVAILABILITIES])
      )}
      <Text style={styles.note}>
        Results must be within both the search area and your distance limit.
      </Text>
      <Button mode="contained" onPress={() => onApply(draft)}>
        Apply filters
      </Button>
      <Button onPress={() => setDraft({ ...DEFAULT_FILTERS })}>Reset filters</Button>
    </Sheet>
  );
}
const styles = StyleSheet.create({
  section: { gap: 10 },
  label: { fontSize: 16, color: Theme.TEXT, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { color: Theme.SUB_TEXT_COLOR, fontSize: 14 },
});
