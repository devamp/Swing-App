import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { authService } from '../services/authService';
import { SwingError } from '../services/errorService';
import Theme from '../theme';

export default function DeleteAccountConfirmation({
  onClose,
  onDeleted,
}: {
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const submit = async () => {
    if (submitting.current || !password) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await authService.deleteAccount(password);
      setPassword('');
      onDeleted();
    } catch (cause) {
      const code = (cause as { code?: string } | null)?.code;
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'The password is incorrect. Please try again.'
          : SwingError.parse(cause).message,
      );
      setPassword('');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={() => !busy && onClose()}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>
              Confirm account deletion
            </Text>
            <Text style={styles.message}>
              Enter your current password to permanently delete your Swing account. This cannot be
              undone.
            </Text>
            <TextInput
              mode="outlined"
              label="Current password"
              accessibilityLabel="Current password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              autoFocus
              disabled={busy}
              error={Boolean(error)}
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
            />
            {Boolean(error) && (
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
                {error}
              </Text>
            )}
            <Button
              mode="contained"
              buttonColor={Theme.DANGER}
              textColor={Theme.SURFACE}
              loading={busy}
              disabled={!password || busy}
              onPress={() => void submit()}
              contentStyle={styles.button}
            >
              {busy ? 'Deleting account…' : 'Delete account'}
            </Button>
            <Button
              textColor={Theme.SUB_TEXT_COLOR}
              disabled={busy}
              onPress={onClose}
              contentStyle={styles.button}
            >
              Cancel
            </Button>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(9, 25, 23, 0.48)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '90%',
    borderRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: Theme.SURFACE,
    overflow: 'hidden',
  },
  content: { padding: 24, gap: 14 },
  title: {
    color: Theme.DANGER,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: { color: Theme.SUB_TEXT_COLOR, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  error: { color: Theme.DANGER, fontSize: 14, lineHeight: 20 },
  button: { minHeight: 48 },
});
