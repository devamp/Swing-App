import type { ColorValue } from 'react-native';

export type AppAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  /** Overrides the preset's text color. */
  color?: ColorValue;
  /** Optional fill for this action's full-width row. */
  backgroundColor?: ColorValue;
  onPress?: () => void;
};

export type AppAlertOptions = {
  /** Allow dismissing via the backdrop, Android back, or Escape. Defaults to false. */
  cancelable?: boolean;
  /** Called on dismissal without choosing a button. */
  onDismiss?: () => void;
};

export type AppAlertRequest = {
  readonly id: number;
  readonly title: string;
  readonly message?: string;
  readonly buttons: readonly AppAlertButton[];
  readonly options: AppAlertOptions;
  readonly visible: boolean;
};

/** Keeps alerts available outside React (including error handlers) and presents them in order. */
export function createAlertService() {
  const queue: AppAlertRequest[] = [];
  const listeners = new Set<() => void>();
  let current: AppAlertRequest | null = null;
  let nextId = 0;
  let afterDismiss: (() => void) | undefined;

  const notify = () => listeners.forEach((listener) => listener());

  const close = (id: number, callback?: () => void) => {
    if (!current || current.id !== id || !current.visible) return;
    afterDismiss = callback;
    current = { ...current, visible: false };
    notify();
  };

  return {
    alert(
      title: string,
      message?: string,
      buttons?: readonly AppAlertButton[],
      options: AppAlertOptions = {},
    ): void {
      if (buttons && buttons.length > 2) {
        throw new RangeError('AppAlert supports up to two actions.');
      }
      const request: AppAlertRequest = {
        id: ++nextId,
        title,
        message,
        buttons: (buttons?.length ? buttons : [{ text: 'OK' }]).map((button) => ({ ...button })),
        options: { ...options },
        visible: true,
      };
      queue.push(request);
      if (!current) {
        current = request;
        notify();
      }
    },

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot: () => current,

    press(id: number, buttonIndex: number) {
      if (!current || current.id !== id || !current.buttons[buttonIndex]) return;
      close(id, current.buttons[buttonIndex].onPress);
    },

    dismiss(id: number) {
      if (!current || current.id !== id || !current.options.cancelable) return;
      close(id, current.options.onDismiss);
    },

    escape(id: number) {
      if (!current || current.id !== id) return;
      const cancel = current.buttons.find((button) => button.style === 'cancel');
      if (cancel) close(id, cancel.onPress);
      else if (current.options.cancelable) close(id, current.options.onDismiss);
    },

    /** The host calls this after the dialog closes, before navigation or a follow-up alert. */
    finishDismissal(id: number) {
      if (!current || current.id !== id || current.visible) return;
      const callback = afterDismiss;
      afterDismiss = undefined;
      queue.shift();
      current = queue[0] ?? null;
      notify();
      callback?.();
    },
  };
}

export const AppAlert = createAlertService();
