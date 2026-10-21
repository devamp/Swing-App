import { Platform } from 'react-native';

// Keep the existing tab bar on older iOS versions and other platforms.
export const usesNativeTabs =
  Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;
