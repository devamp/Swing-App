import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  findNodeHandle,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { AppAlert, type AppAlertButton, type AppAlertRequest } from '../services/alertService';
import Theme from '../theme';

const ACTION_PRESETS = {
  default: { color: Theme.PRIMARY, fontWeight: '600' },
  cancel: { color: Theme.SUB_TEXT_COLOR, fontWeight: '400' },
  destructive: { color: Theme.DANGER, fontWeight: '600' },
} as const;

function AlertCard({
  alert,
  reduceMotion,
  children,
}: {
  alert: AppAlertRequest;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const scale = useRef(new Animated.Value(reduceMotion ? 1 : 1.12)).current;

  useEffect(() => {
    const animation = Animated.timing(scale, {
      toValue: reduceMotion || alert.visible ? 1 : 0.98,
      duration: reduceMotion ? 0 : alert.visible ? 260 : 140,
      easing: alert.visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [alert.visible, reduceMotion, scale]);

  return (
    <Animated.View
      role="alertdialog"
      accessibilityLabel={alert.title}
      accessibilityViewIsModal
      importantForAccessibility="yes"
      onAccessibilityEscape={() => AppAlert.escape(alert.id)}
      style={[styles.card, { maxHeight: Math.max(120, height - 96), transform: [{ scale }] }]}
    >
      {children}
    </Animated.View>
  );
}

function IOSAlertPresentation({
  alert,
  reduceMotion,
  onShow,
  children,
}: {
  alert: AppAlertRequest;
  reduceMotion: boolean;
  onShow: () => void;
  children: ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: alert.visible ? 1 : 0,
      duration: reduceMotion ? 0 : alert.visible ? 180 : 140,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (!finished) return;
      if (alert.visible) onShow();
      else AppAlert.finishDismissal(alert.id);
    });
    return () => animation.stop();
  }, [alert.id, alert.visible, onShow, opacity, reduceMotion]);

  // A window overlay also sits above native sheets, where a second root Modal cannot present.
  return (
    <FullWindowOverlay>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>{children}</Animated.View>
    </FullWindowOverlay>
  );
}

function AlertAction({ button, onPress }: { button: AppAlertButton; onPress: () => void }) {
  const preset = ACTION_PRESETS[button.style ?? 'default'];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: button.backgroundColor },
        pressed && styles.actionPressed,
      ]}
    >
      <Text style={[styles.actionText, preset, { color: button.color ?? preset.color }]}>
        {button.text}
      </Text>
    </Pressable>
  );
}

/** Mount once above navigation so every screen and service uses the same dialog. */
export default function AppAlertHost() {
  const alert = useSyncExternalStore(
    AppAlert.subscribe,
    AppAlert.getSnapshot,
    AppAlert.getSnapshot,
  );
  const titleRef = useRef<Text>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const focusTitle = useCallback(() => {
    const target = findNodeHandle(titleRef.current);
    if (target) AccessibilityInfo.setAccessibilityFocus(target);
  }, []);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (alert) Keyboard.dismiss();
  }, [alert?.id]);

  useEffect(() => {
    // React Native's onDismiss is iOS-only. Other platforms finish after their fade.
    if (!alert || alert.visible || Platform.OS === 'ios') return;
    const timeout = setTimeout(() => AppAlert.finishDismissal(alert.id), reduceMotion ? 0 : 300);
    return () => clearTimeout(timeout);
  }, [alert, reduceMotion]);

  if (!alert) return null;

  const content = (
    <View style={styles.overlay}>
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        style={StyleSheet.absoluteFill}
        onPress={() => AppAlert.dismiss(alert.id)}
      />
      <AlertCard key={alert.id} alert={alert} reduceMotion={reduceMotion}>
        <ScrollView style={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
          <View style={styles.copy}>
            <Text ref={titleRef} accessibilityRole="header" style={styles.title}>
              {alert.title}
            </Text>
            {Boolean(alert.message) && <Text style={styles.message}>{alert.message}</Text>}
          </View>
          {alert.buttons.map((button, index) => (
            <AlertAction
              key={`${alert.id}-${index}`}
              button={button}
              onPress={() => AppAlert.press(alert.id, index)}
            />
          ))}
        </ScrollView>
      </AlertCard>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <IOSAlertPresentation
        key={alert.id}
        alert={alert}
        reduceMotion={reduceMotion}
        onShow={focusTitle}
      >
        {content}
      </IOSAlertPresentation>
    );
  }

  return (
    <Modal
      transparent
      visible={alert.visible}
      animationType={reduceMotion ? 'none' : 'fade'}
      statusBarTranslucent
      navigationBarTranslucent
      onShow={focusTitle}
      onDismiss={() => AppAlert.finishDismissal(alert.id)}
      onRequestClose={() => AppAlert.escape(alert.id)}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    backgroundColor: 'rgba(9, 25, 23, 0.48)',
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: Theme.SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 20px 60px rgba(9, 25, 23, 0.22)',
  },
  copy: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 26,
    gap: 10,
  },
  scroll: {
    flexGrow: 0,
  },
  title: {
    color: Theme.PRIMARY,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    textAlign: 'center',
  },
  action: {
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.PRIMARY_BORDER,
  },
  actionPressed: {
    opacity: 0.65,
  },
  actionText: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
});
