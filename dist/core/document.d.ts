import type { DocumentReference as FirebaseDocumentReference } from 'firebase-admin/firestore';
import type { SerializedDocumentData, DocumentSnapshot, ReadOptions, WriteOptions, FirestoreTypedOptionsProvider } from '../types/firestore-typed.types';
/**
 * Wrapper for Firestore DocumentReference with type safety and validation
 */
export declare class DocumentReference<T extends SerializedDocumentData> {
    private readonly ref;
    private readonly firestoreTyped;
    private readonly validator;
    constructor(ref: FirebaseDocumentReference, firestoreTyped: FirestoreTypedOptionsProvider, validator: (data: unknown) => T);
    /**
     * Gets the document ID
     */
    get id(): string;
    /**
     * Gets the document path
     */
    get path(): string;
    /**
     * Gets the document data with optional validation
     */
    get(options?: ReadOptions): Promise<DocumentSnapshot<T>>;
    /**
     * Sets the document data with validation and deserialization
     */
    set(data: T, options?: WriteOptions): Promise<void>;
    /**
     * Merges partial data with existing document data and validates the complete schema
     */
    merge(data: Partial<T>, options?: WriteOptions): Promise<void>;
    /**
     * Deletes the document
     */
    delete(): Promise<void>;
    /**
     * Gets the underlying Firebase DocumentReference
     */
    get native(): FirebaseDocumentReference;
}
//# sourceMappingURL=document.d.ts.map