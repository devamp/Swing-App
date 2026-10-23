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

## Error handling

Use `SwingBadRequestError`, `SwingNotFoundError`, or `SwingInternalServerError` from `src/services/errorService.ts` for app errors. Give them a message suitable for users:

```ts
throw new SwingBadRequestError('Choose a match start time in the future.');
```

In a screen's catch or mutation error handler, call `SwingError.showAlert(error)` to parse the error and show its header and message using the shared Swing alert dialog. `SwingError.parse(error)` returns the typed error without showing anything, so it can be used in services or inline error states. Constructors do not show alerts, which keeps query retries from opening duplicate popups.

The parser handles Firebase codes, network failures, timeouts, HTTP statuses, and unknown thrown values. Unexpected errors use friendly fallback copy; the original error is kept as `cause`. Run `npm test` to check parsing, alert delivery, and action/dismissal behavior.

## Alert dialogs

Use `AppAlert` from `src/services/alertService.ts` for informational and confirmation dialogs. `AppAlertHost` is mounted once in `App.tsx`. Alerts queue in order, and callbacks run after dismissal so navigation and follow-up dialogs work safely.

```ts
AppAlert.alert('Delete match?', 'This cannot be undone.', [
  { text: 'Delete match', style: 'destructive', onPress: deleteMatch },
  { text: 'Cancel', style: 'cancel' },
]);

AppAlert.alert('Ready to play?', 'Let the host know you’re joining.', [
  { text: 'Join match', color: '#163D38', backgroundColor: '#EBF1EF', onPress: joinMatch },
  { text: 'Not now', style: 'cancel' },
]);
```

Supply one or two actions in display order; omitting them adds an **OK** action. Presets are `default` (forest green, semibold), `cancel` (neutral, regular), and `destructive` (red, semibold). Each action can override `color` and `backgroundColor`. Keep custom text/fill pairs readable. The dialog uses a bold title, regular body text, vertically stacked actions, and a dimmed backdrop. Text follows the system font size and scrolls on smaller screens.

Backdrop dismissal is off by default. To enable it, pass `{ cancelable: true, onDismiss }` as the fourth argument. Android back and accessibility Escape choose the cancel action when present; otherwise they dismiss only when `cancelable` is enabled. Passive dismissal never runs a destructive action. `SwingError.showAlert(error, buttons, options)` accepts the same action styles and colors.

## Toast notifications

The shared `ToastProvider` in `App.tsx` displays the same top toast across screens, including after match creation and profile edits. Use the `useToast` hook from any component under the provider:

```tsx
import { useToast } from './components/ToastProvider';

const { showToast } = useToast();
showToast('Profile saved', 'Your profile has been updated.');
```

The title is required and the message is optional. Toasts sit below the safe area, animate in and out, dismiss automatically after 4.5 seconds, and include a close button. They remain visible across navigation, support screen reader announcements, and respect Reduce Motion. A new notification replaces the current toast and restarts its timer.

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
