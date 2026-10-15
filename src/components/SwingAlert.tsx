import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons/static";
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Theme from '../theme';

export type SwingAlertType = 'info' | 'error';

export type SwingAlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type SwingAlertOptions = {
  type?: SwingAlertType;
  cancelable?: boolean;
  onDismiss?: () => void;
};

type AlertRequest = {
  id: number;
  title: string;
  message?: string;
  buttons: SwingAlertButton[];
  options: SwingAlertOptions;
};

const ALERT_STYLES = {
  info: {
    backgroundColor: Theme.PRIMARY_LIGHT,
    borderColor: Theme.PRIMARY_BORDER,
    iconColor: Theme.PRIMARY,
    icon: 'information-outline',
  },
  error: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    iconColor: '#C2414B',
    icon: 'alert-circle-outline',
  },
} as const;

let nextAlertId = 0;
let activeAlert: AlertRequest | null = null;
const listeners = new Set<(alert: AlertRequest | null) => void>();

function publish(alert: AlertRequest | null) {
  activeAlert = alert;
  listeners.forEach((listener) => listener(alert));
}

function showAlert(
  title: string,
  message?: string,
  buttons?: SwingAlertButton[],
  options: SwingAlertOptions = {},
) {
  publish({
    id: ++nextAlertId,
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    options,
  });
}

function dismissAlert(runOnDismiss = true) {
  const dismissedAlert = activeAlert;
  if (!dismissedAlert) return;

  publish(null);
  if (runOnDismiss) dismissedAlert.options.onDismiss?.();
}

function SwingAlertHost() {
  const [alert, setAlert] = useState<AlertRequest | null>(activeAlert);

  useEffect(() => {
    listeners.add(setAlert);
    return () => {
      listeners.delete(setAlert);
    };
  }, []);

  if (!alert) return null;

  const type = alert.options.type ?? 'info';
  const appearance = ALERT_STYLES[type];
  const buttonsAreStacked = alert.buttons.length > 2;

  const handleButtonPress = (button: SwingAlertButton) => {
    if (activeAlert?.id !== alert.id) return;
    dismissAlert();
    button.onPress?.();
  };

  const handleCancel = () => {
    if (alert.options.cancelable) dismissAlert();
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.modalContainer}>
        <Pressable
          accessible={Boolean(alert.options.cancelable)}
          accessibilityLabel="Dismiss alert"
          accessibilityRole="button"
          onPress={handleCancel}
          style={styles.backdrop}
        />

        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={[
            styles.alert,
            {
              backgroundColor: appearance.backgroundColor,
              borderColor: appearance.borderColor,
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: appearance.borderColor }]}>
            <MaterialCommunityIcons name={appearance.icon} size={28} color={appearance.iconColor} />
          </View>

          <Text style={styles.title}>{alert.title}</Text>
          {alert.message ? <Text style={styles.message}>{alert.message}</Text> : null}

          <View style={[styles.actions, buttonsAreStacked && styles.stackedActions]}>
            {alert.buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel && index === alert.buttons.length - 1;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={`${button.text ?? 'OK'}-${index}`}
                  onPress={() => handleButtonPress(button)}
                  style={({ pressed }) => [
                    styles.button,
                    buttonsAreStacked && styles.stackedButton,
                    isPrimary && { backgroundColor: appearance.iconColor },
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonLabel,
                      { color: isPrimary ? Theme.SURFACE : appearance.iconColor },
                      isDestructive && styles.destructiveButtonLabel,
                    ]}
                  >
                    {button.text ?? 'OK'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const SwingAlert = Object.assign(SwingAlertHost, {
  alert: showAlert,
  dismiss: dismissAlert,
});

export default SwingAlert;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  alert: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderRadius: 24,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  iconContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderRadius: 26,
  },
  title: {
    color: Theme.TEXT,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'center',
  },
  message: {
    marginTop: 7,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },
  stackedActions: {
    flexDirection: 'column',
  },
  button: {
    minWidth: 96,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  stackedButton: {
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.65,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  destructiveButtonLabel: {
    color: '#C2414B',
  },
});
