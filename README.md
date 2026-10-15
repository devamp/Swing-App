# Starter Template with React Navigation

This is a minimal starter template for React Native apps using Expo and React Navigation.

It includes the following:

- Example [Native Stack](https://reactnavigation.org/docs/native-stack-navigator) with a nested [Bottom Tab](https://reactnavigation.org/docs/bottom-tab-navigator)
- Web support with [React Native for Web](https://necolas.github.io/react-native-web/)
- TypeScript support and configured for React Navigation
- Automatic [deep link](https://reactnavigation.org/docs/deep-linking) and [URL handling configuration](https://reactnavigation.org/docs/configuring-links)
- Theme support [based on system appearance](https://reactnavigation.org/docs/themes/#using-the-operating-system-preferences)
- Expo [Development Build](https://docs.expo.dev/develop/development-builds/introduction/) with [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)

## Getting Started

1. Create a new project using this template:

   ```sh
   npx create-expo-app@latest --template react-navigation/template
   ```

2. Edit the `app.json` file to configure the `name`, `slug`, `scheme` and bundle identifiers (`ios.bundleIdentifier` and `android.bundleIdentifier`) for your app.

3. Edit the `src/App.tsx` file to start working on your app.

## Running the app

- Install the dependencies:

  ```sh
  npm install
  ```

- Start the development server:

  ```sh
  npm start
  ```

- Build and run iOS and Android development builds:

  ```sh
  npm run ios
  # or
  npm run android
  ```

- In the terminal running the development server, press `i` to open the iOS simulator, `a` to open the Android device or emulator, or `w` to open the web browser.

`npm run ios` and `npm run android` sync native configuration and assets before building. After changing the app icon, splash image/color, or font plugins, use these commands to rebuild the installed app; a Metro reload only updates JavaScript. Icons also load their font at startup so existing development clients can render them.

## Local verification

From a clean checkout, run:

```sh
npm ci
npm run verify
```

`verify` runs the auth session tests (`test:auth`), `typecheck` (`tsc --noEmit`), then `export:ios` (`expo export --platform ios`). The export writes to the ignored `dist/` directory. This checks session restoration, TypeScript and production iOS bundling without compiling a native app or requiring Xcode.

## Login persistence

Firebase sessions persist across app restarts using AsyncStorage on native and Firebase's default browser storage on web. Startup waits for Firebase to restore credentials before showing a screen. Users who signed in within the last 30 days open the dashboard; older sessions are signed out and open Landing. The window is configured by `SESSION_MAX_AGE_MS` in `src/services/authService.ts`. Logging out or deleting an account clears the Firebase session.

## Notes

This project uses a [development build](https://docs.expo.dev/develop/development-builds/introduction/) and cannot be run with [Expo Go](https://expo.dev/go). To run the app with Expo Go, edit the `package.json` file, remove the `expo-dev-client` package and `--dev-client` flag from the `start` script.

We highly recommend using the development builds for normal development and testing.

This project uses [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/). The tracked `ios` and `android` folders are excluded from EAS uploads by `.easignore`, so EAS Build regenerates them from `app.config.ts` and the installed SDK. Make native configuration changes in `app.config.ts` or config plugins so they are included in cloud builds. Keep `.easignore` in sync with `.gitignore` when adding ignore rules.

After upgrading the Expo SDK, regenerate local projects with `npx expo prebuild` before running `npm run ios` or `npm run android`. The installed CLI recreates the native folders by default, so migrate any manual native changes into config plugins first. The run scripts use `--no-clean` to sync configuration into existing projects. Native dependency changes require rebuilding the development client.

## Resources

- [React Navigation documentation](https://reactnavigation.org/)
- [Expo documentation](https://docs.expo.dev/)

---

Demo assets are from [lucide.dev](https://lucide.dev/)
