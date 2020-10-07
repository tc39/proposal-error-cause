function createError() {
  let globalError = globalThis.Error;
  // Extending the native Error for devtools formatting (stacktrace,
  // categorization). Not required by the spec.
  const klass = class extends globalError {
    constructor(message, cause) {
      super(message);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, klass);
      }
      if (message !== undefined) {
        Object.defineProperty(this, 'message', {
          writable: true,
          configurable: true,
          enumerable: false,
          value: message,
        });
      }
      if (cause !== undefined) {
        Object.defineProperty(this, 'cause', {
          writable: true,
          configurable: true,
          enumerable: false,
          value: cause,
        });
      }
    }
  };
  Object.defineProperty(klass, 'name', {
    writable: false,
    enumerable: false,
    configurable: true,
    value: 'Error',
  });
  Object.defineProperties(klass.prototype, {
    cause: {
      writable: true,
      enumerable: false,
      configurable: true,
      value: '',
    },
    name: {
      writable: true,
      enumerable: false,
      configurable: true,
      value: 'Error',
    },
    message: {
      writable: true,
      enumerable: false,
      configurable: true,
      value: '',
    },
  });
  return klass;
}

globalThis.Error = createError();
