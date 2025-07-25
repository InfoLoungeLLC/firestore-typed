import type { SerializedDocumentData } from '../types/firestore-typed.types';
/**
 * Validates data using a provided validator function and wraps errors in FirestoreTypedValidationError
 */
export declare function validateData<T extends SerializedDocumentData>(data: unknown, path: string, validator: (data: unknown) => T): T;
//# sourceMappingURL=validator.d.ts.map