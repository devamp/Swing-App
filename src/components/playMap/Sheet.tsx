import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons/static";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Theme from '../../theme';
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel={`Close ${title}`}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), marginTop: insets.top + 20 },
          ]}
        >
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
              onPress={onClose}
              style={styles.close}
            >
              <MaterialCommunityIcons name="close" size={24} color={Theme.PRIMARY} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,30,30,0.35)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: Theme.BACKGROUND,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: { fontSize: 22, color: Theme.PRIMARY, fontWeight: '700', flex: 1 },
  close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 16 },
});
