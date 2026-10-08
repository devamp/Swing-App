import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Searchbar } from 'react-native-paper';
import { AREAS } from '../../services/playMap/fixtures';
import type { Area } from '../../services/playMap/types';
import Theme from '../../theme';
import { Sheet } from './Sheet';
export function AreaSheet({
  onSelect,
  onClose,
  onLocate,
  locating,
  locationError,
}: {
  onSelect: (area: Area) => void;
  onClose: () => void;
  onLocate: () => void;
  locating: boolean;
  locationError: string;
}) {
  const [query, setQuery] = useState('');
  const areas = AREAS.filter((area) =>
    area.label.toLowerCase().includes(query.toLowerCase().trim()),
  );
  return (
    <Sheet title="Search area" onClose={onClose}>
      <Searchbar
        placeholder="Search city or neighborhood"
        value={query}
        onChangeText={setQuery}
        accessibilityLabel="Search available areas"
      />
      <Button
        icon="crosshairs-gps"
        mode="outlined"
        loading={locating}
        disabled={locating}
        onPress={onLocate}
      >
        Use current location
      </Button>
      {!!locationError && (
        <Text accessibilityRole="alert" style={{ color: Theme.paperTheme.colors.error }}>
          {locationError} Choose an area below or move the map.
        </Text>
      )}
      <Text style={{ color: Theme.SUB_TEXT_COLOR }}>Explore an area</Text>
      {areas.map((area) => (
        <Button
          key={area.label}
          icon="map-marker-outline"
          contentStyle={{ minHeight: 48, justifyContent: 'flex-start' }}
          onPress={() => onSelect(area)}
        >
          {area.label}
        </Button>
      ))}
      {!areas.length && (
        <View>
          <Text style={{ color: Theme.SUB_TEXT_COLOR }}>
            No matching areas. Try Tualatin, Lake Oswego, Tigard, or Portland. You can also move the
            map to choose any area.
          </Text>
        </View>
      )}
    </Sheet>
  );
}
