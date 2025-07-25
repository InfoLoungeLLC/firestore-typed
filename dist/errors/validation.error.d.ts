/**
 * Error thrown when validation fails in firestore-typed operations
 */
export declare class FirestoreTypedValidationError extends Error {
    readonly documentPath: string;
    readonly originalError?: unknown | undefined;
    constructor(message: string, documentPath: string, originalError?: unknown | undefined);
}
/**
 * Error thrown when a document is not found
 */
export declare class DocumentNotFoundError extends Error {
    readonly documentPath: string;
    constructor(documentPath: string);
}
/**
 * Error thrown when trying to create a document that already exists (with failIfExists option)
 */
export declare class DocumentAlreadyExistsError extends Error {
    readonly documentPath: string;
    constructor(documentPath: string);
}
//# sourceMappingURL=validation.error.d.ts.map