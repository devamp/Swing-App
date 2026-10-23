import { requireOptionalNativeModule } from 'expo';
import type { PropsWithChildren, ComponentType } from 'react';
import { View, type ViewProps } from 'react-native';
import type { GlassViewProps } from 'expo-glass-effect';

// Existing development clients may not contain the new native module yet.
const nativeGlass = requireOptionalNativeModule('ExpoGlassEffect');
const NativeGlassView: ComponentType<GlassViewProps> | null =
  nativeGlass?.isLiquidGlassAvailable && nativeGlass?.isGlassEffectAPIAvailable
    ? require('expo-glass-effect').GlassView
    : null;

export default function GlassSurface(props: PropsWithChildren<ViewProps>) {
  return NativeGlassView ? (
    <NativeGlassView
      {...props}
      style={[props.style, { backgroundColor: 'transparent' }]}
      glassEffectStyle="regular"
      colorScheme="light"
      isInteractive
    />
  ) : (
    <View {...props} />
  );
}
