import { Alert, type AlertButton, type AlertOptions } from 'react-native';

export type SwingErrorType = 'not-found' | 'internal-server' | 'bad-request';

const DEFAULTS = {
  'not-found': {
    title: 'Not found',
    message: 'This item is no longer available. Please refresh and try again.',
    status: 404,
  },
  'internal-server': {
    title: 'Something went wrong',
    message: 'We couldn’t complete your request. Please try again in a moment.',
    status: 500,
  },
  'bad-request': {
    title: 'Please check your request',
    message: 'Please check your details and try again.',
    status: 400,
  },
} as const;

const CODE_MESSAGES: Record<string, [SwingErrorType, string]> = {
  'invalid-email': ['bad-request', 'Enter a valid email address.'],
  'missing-email': ['bad-request', 'Enter your email address.'],
  'missing-password': ['bad-request', 'Enter your password.'],
  'invalid-credential': ['bad-request', 'The email or password is incorrect. Please try again.'],
  'invalid-login-credentials': [
    'bad-request',
    'The email or password is incorrect. Please try again.',
  ],
  'wrong-password': ['bad-request', 'The email or password is incorrect. Please try again.'],
  'user-not-found': ['bad-request', 'The email or password is incorrect. Please try again.'],
  'email-already-in-use': [
    'bad-request',
    'An account with this email already exists. Please log in.',
  ],
  'weak-password': ['bad-request', 'Choose a stronger password with at least 6 characters.'],
  'password-does-not-meet-requirements': [
    'bad-request',
    'Choose a stronger password and try again.',
  ],
  'user-disabled': ['bad-request', 'This account is disabled. Please contact support for help.'],
  'requires-recent-login': [
    'bad-request',
    'For your security, log out and sign in again before deleting your account.',
  ],
  'user-token-expired': ['bad-request', 'Your session has expired. Please sign in again.'],
  'invalid-user-token': ['bad-request', 'Your session has expired. Please sign in again.'],
  unauthenticated: ['bad-request', 'Please sign in again to continue.'],
  unauthorized: ['bad-request', 'You don’t have permission to do this.'],
  'permission-denied': ['bad-request', 'You don’t have permission to do this.'],
  'too-many-requests': [
    'bad-request',
    'Too many attempts. Please wait a few minutes and try again.',
  ],
  'resource-exhausted': ['bad-request', 'Too many requests. Please wait a moment and try again.'],
  'not-found': ['not-found', DEFAULTS['not-found'].message],
  'object-not-found': ['not-found', 'This file is no longer available.'],
  'invalid-argument': ['bad-request', DEFAULTS['bad-request'].message],
  'failed-precondition': [
    'bad-request',
    'This action is unavailable right now. Please refresh and try again.',
  ],
  'already-exists': ['bad-request', 'This item already exists. Please refresh and try again.'],
  'network-request-failed': ['internal-server', 'Check your internet connection and try again.'],
  unavailable: [
    'internal-server',
    'We can’t connect right now. Check your connection and try again.',
  ],
  'deadline-exceeded': ['internal-server', 'The request took too long. Please try again.'],
  'retry-limit-exceeded': ['internal-server', 'The request took too long. Please try again.'],
  'operation-not-allowed': [
    'internal-server',
    'This feature is currently unavailable. Please try again later.',
  ],
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

// Only explicit SwingErrors and readable client validation responses supply display copy.
// Unexpected server/SDK messages can contain implementation details, URLs, or stack traces.
function validationMessage(value: unknown): string | undefined {
  const message = asText(value);
  if (
    !message ||
    message.length > 300 ||
    /[<>\n\r{}]|https?:\/\/|firebase|\bat\s+\S+\s*\(/i.test(message)
  ) {
    return undefined;
  }
  return message;
}

export class SwingError extends Error {
  readonly title: string;
  readonly status: number;
  readonly code?: string;
  override readonly cause?: unknown;

  constructor(
    message: string = DEFAULTS['internal-server'].message,
    readonly type: SwingErrorType = 'internal-server',
    options: { code?: string; cause?: unknown } = {},
  ) {
    super(message.trim() || DEFAULTS[type].message);
    this.name = 'SwingError';
    this.title = DEFAULTS[type].title;
    this.status = DEFAULTS[type].status;
    this.code = options.code;
    this.cause = options.cause;
  }

  /** Normalize thrown values without showing a popup (safe for retries and service code). */
  static parse(error: unknown): SwingError {
    if (error instanceof SwingError) return error;

    const source = asRecord(error);
    const response = asRecord(source.response);
    const data = asRecord(response.data ?? source.data);
    const nested = asRecord(data.error ?? source.error);
    const message =
      asText(nested.message) ?? asText(data.message) ?? asText(source.message) ?? asText(error);
    const code =
      asText(source.code) ??
      asText(nested.code) ??
      asText(data.code) ??
      message?.match(/\b((?:auth|firestore|storage)\/[a-z-]+)\b/i)?.[1];
    const normalizedCode = code?.toLowerCase().split('/').pop();
    const knownError =
      normalizedCode && Object.hasOwn(CODE_MESSAGES, normalizedCode)
        ? CODE_MESSAGES[normalizedCode]
        : undefined;
    const options = { code, cause: error };

    if (knownError) return SwingError.create(knownError[0], knownError[1], options);

    const rawStatus = response.status ?? source.status ?? source.statusCode ?? nested.status;
    const status =
      typeof rawStatus === 'number' || typeof rawStatus === 'string'
        ? Number(rawStatus)
        : undefined;
    if (status === 404) return new SwingNotFoundError(undefined, options);
    if (status === 401)
      return new SwingBadRequestError('Please sign in again to continue.', options);
    if (status === 403)
      return new SwingBadRequestError('You don’t have permission to do this.', options);
    if (status === 429) {
      return new SwingBadRequestError(
        'Too many requests. Please wait a moment and try again.',
        options,
      );
    }
    if (
      status === 408 ||
      status === 504 ||
      /timeout|timed out|ETIMEDOUT|ECONNABORTED/i.test(`${code ?? ''} ${message ?? ''}`)
    ) {
      return new SwingInternalServerError('The request took too long. Please try again.', options);
    }
    if (status !== undefined && status >= 400 && status < 500) {
      return new SwingBadRequestError(validationMessage(message), options);
    }
    // Server failures always use safe copy, even if the response includes a message.
    if (status !== undefined && status >= 500 && status < 600)
      return new SwingInternalServerError(undefined, options);
    if (
      /network request failed|failed to fetch|network error|internet|offline|ERR_NETWORK|ECONNREFUSED|ENETUNREACH|ENOTFOUND/i.test(
        `${code ?? ''} ${message ?? ''}`,
      )
    ) {
      return new SwingInternalServerError('Check your internet connection and try again.', options);
    }
    return new SwingInternalServerError(undefined, options);
  }

  private static create(
    type: SwingErrorType,
    message: string,
    options: { code?: string; cause?: unknown },
  ): SwingError {
    switch (type) {
      case 'not-found':
        return new SwingNotFoundError(message, options);
      case 'bad-request':
        return new SwingBadRequestError(message, options);
      case 'internal-server':
        return new SwingInternalServerError(message, options);
    }
  }

  static showAlert(error: unknown, buttons?: AlertButton[], options?: AlertOptions): void {
    SwingError.parse(error).showAlert(buttons, options);
  }

  showAlert(buttons?: AlertButton[], options?: AlertOptions): void {
    Alert.alert(this.title, this.message, buttons ?? [{ text: 'OK' }], options);
  }
}

export class SwingNotFoundError extends SwingError {
  constructor(message?: string, options?: { code?: string; cause?: unknown }) {
    super(message ?? DEFAULTS['not-found'].message, 'not-found', options);
    this.name = 'SwingNotFoundError';
  }
}

export class SwingInternalServerError extends SwingError {
  constructor(message?: string, options?: { code?: string; cause?: unknown }) {
    super(message ?? DEFAULTS['internal-server'].message, 'internal-server', options);
    this.name = 'SwingInternalServerError';
  }
}

export class SwingBadRequestError extends SwingError {
  constructor(message?: string, options?: { code?: string; cause?: unknown }) {
    super(message ?? DEFAULTS['bad-request'].message, 'bad-request', options);
    this.name = 'SwingBadRequestError';
  }
}

export const errorService = {
  parse: SwingError.parse,
  showAlert: SwingError.showAlert,
};
