import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

// Android and web retain the same shape, colors, and sliding interaction.
export default function GlassSurface(props: PropsWithChildren<ViewProps>) {
  return <View {...props} />;
}
