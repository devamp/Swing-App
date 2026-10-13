import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons/static";
import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '../../theme';
import { authService } from '../../services/authService';
import type { SignUpCredentials } from '../../types';
import { useMutation } from '@tanstack/react-query';
import SwingAlert from '../../components/SwingAlert';
import { OnboardingMatchPreferencesParams } from './onboarding/OnboardingFlowTypes';

type SignUpProps = StaticScreenProps<OnboardingMatchPreferencesParams>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function SignUp({ route }: SignUpProps) {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const swingLogo = require('../../../assets/swing-logo.png');
  const { params } = route;

  const validateUsername = (value = username) => {
    const error = value.trim() ? '' : 'Username is required.';
    setUsernameError(error);
    return !error;
  };

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
    const error = !value
      ? 'Password is required.'
      : value.length < MIN_PASSWORD_LENGTH
        ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
        : '';
    setPasswordError(error);
    return !error;
  };

  const { mutate: signUp, isPending: isSigningUp } = useMutation({
    mutationFn: (credentials: SignUpCredentials) => {
      const userPreferences = {
        ...params,
      };
      return authService.signUp(credentials, userPreferences);
    },
    onSuccess: (createdUser) => {
      navigation.navigate('Home');
    },
    onError: (error) => {
      SwingAlert.alert(
        'Could not create profile',
        error instanceof Error ? error.message : 'Please try again.',
        undefined,
        { type: 'error' },
      );
    },
  });

  const handleSignUp = () => {
    const isUsernameValid = validateUsername();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isUsernameValid || !isEmailValid || !isPasswordValid) return;

    signUp({
      username: username.trim(),
      email: email.trim(),
      password,
    });
  };

  const handleLogin = () => {
    navigation.navigate('Login');
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
          <Text style={styles.eyebrow}>JOIN THE COMMUNITY</Text>
          <Text style={styles.header}>Create your Swing profile</Text>
          <Text style={styles.subtext}>
            Join matches, create games, and connect with players nearby.
          </Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            mode="outlined"
            label="Username"
            value={username}
            placeholder="Enter your username"
            onChangeText={(value) => {
              setUsername(value);
              if (usernameError) setUsernameError('');
            }}
            onBlur={() => validateUsername()}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            left={<TextInput.Icon icon="account-outline" />}
            error={Boolean(usernameError)}
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />
          {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

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
            placeholder="At least 6 characters"
            onChangeText={(value) => {
              setPassword(value);
              if (passwordError) setPasswordError('');
            }}
            onBlur={() => validatePassword()}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
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

          <Button
            mode="contained"
            icon="account-plus-outline"
            onPress={handleSignUp}
            loading={isSigningUp}
            disabled={isSigningUp}
            buttonColor={Theme.PRIMARY}
            textColor={Theme.SURFACE}
            style={styles.signUpButton}
            contentStyle={styles.signUpButtonContent}
            labelStyle={Theme.styles.primaryButtonLabel}
          >
            {isSigningUp ? 'Creating profile...' : 'Sign up'}
          </Button>

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <Pressable
              onPress={handleLogin}
              accessibilityRole="link"
              accessibilityLabel="Log in to your account"
              hitSlop={8}
            >
              <Text style={styles.loginLink}>Log in</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ alignItems: 'center', padding: 20 }}>
          <Image source={swingLogo} style={styles.logo} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 160,
    height: 160,
  },
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
  signUpButton: { marginTop: 24, borderRadius: 28 },
  signUpButtonContent: { minHeight: 52 },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  loginPrompt: { color: Theme.SUB_TEXT_COLOR, fontSize: 15 },
  loginLink: { color: Theme.PRIMARY, fontSize: 15, fontWeight: '700' },
});
