import { StyleSheet } from 'react-native';
import { MD3LightTheme } from 'react-native-paper';

const COLORS = {
  PRIMARY: '#163D38',
  PRIMARY_LIGHT: '#EBF1EF',
  PRIMARY_BORDER: '#DCE5E1',
  ON_PRIMARY_MUTED: '#D5E4DF',
  SECONDARY: 'lightgrey',
  BACKGROUND: '#F5F7F2',
  SURFACE: 'white',
  TEXT: 'black',
  SUB_TEXT_COLOR: '#4A4A4A',
  ALERT: '#F59E0B',
  DANGER: '#B42318',
} as const;

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.PRIMARY,
    onPrimary: COLORS.SURFACE,
    primaryContainer: COLORS.PRIMARY_LIGHT,
    onPrimaryContainer: COLORS.PRIMARY,
    secondary: COLORS.SECONDARY,
    onSecondary: COLORS.TEXT,
    secondaryContainer: COLORS.PRIMARY_LIGHT,
    onSecondaryContainer: COLORS.PRIMARY,
    background: COLORS.BACKGROUND,
    surface: COLORS.SURFACE,
    onSurface: COLORS.TEXT,
    surfaceVariant: COLORS.PRIMARY_LIGHT,
    onSurfaceVariant: COLORS.SUB_TEXT_COLOR,
    inversePrimary: COLORS.ON_PRIMARY_MUTED,
    outline: COLORS.SECONDARY,
    outlineVariant: COLORS.PRIMARY_BORDER,
    elevation: {
      level0: 'transparent',
      level1: '#F3F5F5',
      level2: '#ECEFEF',
      level3: '#E5EAE9',
      level4: '#E3E8E7',
      level5: '#DEE4E3',
    },
  },
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  appContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  paddedAppContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  scrollView: {
    width: '100%',
  },

  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  headerContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },

  screenHeader: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },

  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: COLORS.PRIMARY,
  },

  subtext: {
    color: COLORS.SUB_TEXT_COLOR,
    marginBottom: 12,
  },

  centeredSubtext: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.SUB_TEXT_COLOR,
    textAlign: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },

  rowButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    gap: 8,
    padding: 14,
    width: '100%',
    alignItems: 'center',
  },

  selectionCard: {
    flexDirection: 'column',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 28,
    borderColor: 'grey',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  elevatedPillButton: {
    borderRadius: 28,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },

  primaryPillButton: {
    backgroundColor: COLORS.PRIMARY,
  },

  secondaryPillButton: {
    backgroundColor: COLORS.SURFACE,
  },

  pillButtonContent: {
    paddingVertical: 8,
    minWidth: 100,
    paddingHorizontal: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonLabel: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  secondaryButtonLabel: {
    color: COLORS.TEXT,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  backgroundBlobTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.PRIMARY,
    opacity: 0.16,
  },

  backgroundBlobBottom: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.SECONDARY,
    opacity: 0.28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
    marginBottom: 12,
    shadowColor: COLORS.TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
});

const Theme = {
  ...COLORS,
  paperTheme,
  styles,
};

export default Theme;
