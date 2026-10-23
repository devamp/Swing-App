import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwingError } from '../../services/errorService';
import { AppAlert } from '../../services/alertService';
import { authService } from '../../services/authService';
import Theme from '../../theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const swingLogo = require('../../../assets/swing-logo.png');

  const validateEmail = (value = email) => {
    const normalizedEmail = value.trim();
    const error = !normalizedEmail
      ? 'Email is required.'
      : !EMAIL_PATTERN.test(normalizedEmail)
        ? 'Enter a valid email address.'
        : '';
    setEmailError(error);
    return !error;
  };

  const validatePassword = (value = password) => {
    const error = value ? '' : 'Password is required.';
    setPasswordError(error);
    return !error;
  };

  const { mutate: logIn, isPending: isLoggingIn } = useMutation({
    mutationFn: ({ loginEmail, loginPassword }: { loginEmail: string; loginPassword: string }) =>
      authService.login(loginEmail, loginPassword),
    onSuccess: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
    onError: (error) => SwingError.showAlert(error),
  });

  const handleLogin = () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) return;

    logIn({ loginEmail: email.trim(), loginPassword: password });
  };

  const handleForgotPassword = () => {
    AppAlert.alert(
      'Forgot password',
      'Password reset is not available yet. Please check back soon.',
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={Theme.styles.backgroundBlobTop} />
      <View style={Theme.styles.backgroundBlobBottom} />
      <ScrollView
        style={Theme.styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          style={Theme.styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Theme.TEXT} />
        </Pressable>

        <View style={styles.headerContainer}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.header}>Log in to Swing</Text>
          <Text style={styles.subtext}>Pick up where you left off and get back in the game.</Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            placeholder="Enter your email address"
            onChangeText={(value) => {
              setEmail(value);
              if (emailError) setEmailError('');
            }}
            onBlur={() => validateEmail()}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            left={<TextInput.Icon icon="email-outline" />}
            error={Boolean(emailError)}
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            placeholder="Enter your password"
            onChangeText={(value) => {
              setPassword(value);
              if (passwordError) setPasswordError('');
            }}
            onBlur={() => validatePassword()}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            secureTextEntry={!isPasswordVisible}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setIsPasswordVisible((visible) => !visible)}
                accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              />
            }
            error={Boolean(passwordError)}
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <Pressable
            onPress={handleForgotPassword}
            accessibilityRole="link"
            accessibilityLabel="Forgot your password"
            hitSlop={8}
            style={styles.forgotPasswordButton}
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>

          <Button
            mode="contained"
            icon={({ size, color }) => (
              <MaterialCommunityIcons name="login" size={20} color="white" />
            )}
            onPress={handleLogin}
            loading={isLoggingIn}
            disabled={isLoggingIn}
            buttonColor={Theme.PRIMARY}
            textColor={Theme.SURFACE}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            labelStyle={Theme.styles.primaryButtonLabel}
          >
            {isLoggingIn ? 'Logging in...' : 'Log in'}
          </Button>

          <View style={styles.signUpRow}>
            <Text style={styles.signUpPrompt}>New to Swing? </Text>
            <Pressable
              onPress={() => navigation.navigate('Onboarding')}
              accessibilityRole="link"
              accessibilityLabel="Create a Swing account"
              hitSlop={8}
            >
              <Text style={styles.linkText}>Start Onboarding</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.BACKGROUND },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  headerContainer: { marginBottom: 22 },
  eyebrow: {
    color: Theme.PRIMARY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  header: {
    color: Theme.TEXT,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtext: { color: Theme.SUB_TEXT_COLOR, fontSize: 16, lineHeight: 20 },
  formCard: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  input: { backgroundColor: Theme.SURFACE, marginTop: 10 },
  inputOutline: { borderRadius: 12 },
  errorText: {
    color: '#B3261E',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 12,
  },
  forgotPasswordButton: { alignSelf: 'flex-end', marginTop: 12 },
  loginButton: { marginTop: 22, borderRadius: 28 },
  loginButtonContent: { minHeight: 52 },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  signUpPrompt: { color: Theme.SUB_TEXT_COLOR, fontSize: 15 },
  linkText: { color: Theme.PRIMARY, fontSize: 13, fontWeight: '600' },
  logoContainer: { alignItems: 'center', padding: 20 },
  logo: { width: 160, height: 160 },
});
