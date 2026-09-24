import { type ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import Theme from '../theme';

export type SelectableChipProps = {
  label: string;
  icon?: ComponentProps<typeof Button>['icon'];
  selected: boolean;
  onPress: () => void;
};

export default function SelectableChip({ label, icon, selected, onPress }: SelectableChipProps) {
  return (
    <Button
      mode={selected ? 'contained' : 'outlined'}
      icon={icon}
      onPress={onPress}
      buttonColor={selected ? Theme.PRIMARY : Theme.SURFACE}
      textColor={selected ? Theme.SURFACE : Theme.TEXT}
      style={[styles.chip, selected && styles.selectedChip]}
      contentStyle={styles.chipContent}
      labelStyle={styles.chipText}
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
    maxWidth: '100%',
    borderRadius: 999,
    borderColor: Theme.SECONDARY,
  },
  selectedChip: {
    backgroundColor: Theme.PRIMARY,
    borderColor: Theme.PRIMARY,
  },
  chipText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    marginHorizontal: 12,
    marginVertical: 0,
  },
  chipContent: {
    minHeight: 44,
    paddingHorizontal: 4,
    gap: 8,
  },
});
