import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Theme from '../theme';

const ToastContext = createContext<{ showToast: (title: string, message?: string) => void } | null>(
  null,
);

function Toast({
  title,
  message,
  onDismiss,
}: {
  title: string;
  message?: string;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    let exit: ReturnType<typeof setTimeout>;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      animation = Animated.timing(progress, {
        toValue: 1,
        duration: reduceMotion ? 0 : 220,
        useNativeDriver: true,
      });
      animation.start();
      if (Platform.OS === 'ios')
        AccessibilityInfo.announceForAccessibility([title, message].filter(Boolean).join('. '));
      exit = setTimeout(() => {
        animation = Animated.timing(progress, {
          toValue: 0,
          duration: reduceMotion ? 0 : 180,
          useNativeDriver: true,
        });
        animation.start(({ finished }) => {
          if (finished) onDismiss();
        });
      }, 4500);
    });
    return () => {
      active = false;
      clearTimeout(exit);
      animation?.stop();
    };
  }, [message, onDismiss, progress, title]);

  const content = (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        { paddingTop: insets.top + 12, paddingHorizontal: Math.max(insets.left, insets.right, 20) },
      ]}
    >
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: progress,
            transform: [
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
            ],
          },
        ]}
      >
        <MaterialCommunityIcons name="check-circle" size={24} color={Theme.PRIMARY} />
        <View
          style={styles.copy}
          accessibilityLiveRegion="polite"
          accessible
          accessibilityLabel={[title, message].filter(Boolean).join('. ')}
        >
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          onPress={onDismiss}
          hitSlop={12}
          style={styles.close}
        >
          <MaterialCommunityIcons name="close" size={20} color={Theme.SUB_TEXT_COLOR} />
        </Pressable>
      </Animated.View>
    </View>
  );

  return Platform.OS === 'ios' ? (
    <FullWindowOverlay unstable_accessibilityContainerViewIsModal={false}>
      {content}
    </FullWindowOverlay>
  ) : (
    content
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; title: string; message?: string } | null>(null);
  const nextId = useRef(0);
  const showToast = useCallback((title: string, message?: string) => {
    setToast({ id: ++nextId.current, title, message });
  }, []);
  const dismiss = useCallback(() => setToast(null), []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast key={toast.id} title={toast.title} message={toast.message} onDismiss={dismiss} />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  toast: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: Theme.SURFACE,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    boxShadow: '0 6px 24px rgba(9, 25, 23, 0.16)',
  },
  copy: { flex: 1 },
  title: { color: Theme.PRIMARY, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  message: { color: Theme.SUB_TEXT_COLOR, fontSize: 13, lineHeight: 18, marginTop: 2 },
  close: { minWidth: 32, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
