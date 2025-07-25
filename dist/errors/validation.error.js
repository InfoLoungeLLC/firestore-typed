"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAlreadyExistsError = exports.DocumentNotFoundError = exports.FirestoreTypedValidationError = void 0;
/**
 * Error thrown when validation fails in firestore-typed operations
 */
class FirestoreTypedValidationError extends Error {
    documentPath;
    originalError;
    constructor(message, documentPath, originalError) {
        super(message);
        this.documentPath = documentPath;
        this.originalError = originalError;
        this.name = 'FirestoreTypedValidationError';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FirestoreTypedValidationError);
        }
    }
}
exports.FirestoreTypedValidationError = FirestoreTypedValidationError;
/**
 * Error thrown when a document is not found
 */
class DocumentNotFoundError extends Error {
    documentPath;
    constructor(documentPath) {
        super(`Document not found at path: ${documentPath}`);
        this.documentPath = documentPath;
        this.name = 'DocumentNotFoundError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DocumentNotFoundError);
        }
    }
}
exports.DocumentNotFoundError = DocumentNotFoundError;
/**
 * Error thrown when trying to create a document that already exists (with failIfExists option)
 */
class DocumentAlreadyExistsError extends Error {
    documentPath;
    constructor(documentPath) {
        super(`Document already exists at path: ${documentPath}`);
        this.documentPath = documentPath;
        this.name = 'DocumentAlreadyExistsError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DocumentAlreadyExistsError);
        }
    }
}
exports.DocumentAlreadyExistsError = DocumentAlreadyExistsError;
//# sourceMappingURL=validation.error.js.map