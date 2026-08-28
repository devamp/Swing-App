import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import Theme from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type SelectableChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function SelectableChip({ label, selected, onPress }: SelectableChipProps) {
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
      accessibilityState={{ selected }}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
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
});
