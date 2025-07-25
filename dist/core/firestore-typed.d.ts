import { Firestore } from 'firebase-admin/firestore';
import { CollectionReference } from './collection';
import { CollectionGroup } from './collection-group';
import type { FirestoreTypedOptions, SerializedDocumentData, FirestoreTypedOptionsProvider, ResolvedFirestoreTypedOptions } from '../types/firestore-typed.types';
/**
 * Main firestore-typed class that wraps Firestore with type safety and validation
 */
export declare class FirestoreTyped<T extends SerializedDocumentData = SerializedDocumentData> implements FirestoreTypedOptionsProvider {
    private readonly firestore;
    private readonly options;
    private readonly validator;
    constructor(firestore: Firestore, validator: (data: unknown) => T, options?: FirestoreTypedOptions);
    /**
     * Gets a typed CollectionReference using the internal validator
     */
    collection(path: string): CollectionReference<T>;
    /**
     * Gets a typed CollectionGroup for cross-collection queries using the internal validator
     */
    collectionGroup(collectionId: string): CollectionGroup<T>;
    /**
     * Gets the global options
     */
    getOptions(): ResolvedFirestoreTypedOptions;
    /**
     * Updates global options (creates a new instance to maintain immutability)
     */
    withOptions(newOptions: Partial<FirestoreTypedOptions>): FirestoreTyped<T>;
    /**
     * Gets the underlying Firestore instance
     */
    get native(): Firestore;
}
//# sourceMappingURL=firestore-typed.d.ts.map