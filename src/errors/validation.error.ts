/**
 * Error thrown when validation fails in firestore-typed operations
 */
export class FirestoreTypedValidationError extends Error {
  constructor(
    message: string,
    public readonly documentPath: string,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'FirestoreTypedValidationError'

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestoreTypedValidationError)
    }
  }
}

/**
 * Error thrown when a document is not found
 */
export class DocumentNotFoundError extends Error {
  constructor(public readonly documentPath: string) {
    super(`Document not found at path: ${documentPath}`)
    this.name = 'DocumentNotFoundError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocumentNotFoundError)
    }
  }
}

/**
 * Error thrown when trying to create a document that already exists (with failIfExists option)
 */
export class DocumentAlreadyExistsError extends Error {
  constructor(public readonly documentPath: string) {
    super(`Document already exists at path: ${documentPath}`)
    this.name = 'DocumentAlreadyExistsError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocumentAlreadyExistsError)
    }
  }
}
