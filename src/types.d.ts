declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

export type SignUpCredentials = {
  username: string;
  email: string;
  password: string;
};

export type User = {
  username: string;
  email: string;
  onboardingPreferences: OnboardingMatchPreferencesParams;
  createdAt: Date;
  updatedAt: Date;
};
