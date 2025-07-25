import type { CollectionReference as FirebaseCollectionReference, DocumentData, WhereFilterOp, OrderByDirection } from 'firebase-admin/firestore';
import { DocumentReference } from './document';
import { Query } from './query';
import type { SerializedDocumentData, QuerySnapshot, ReadOptions, WriteOptions, FirestoreTypedOptionsProvider } from '../types/firestore-typed.types';
/**
 * Wrapper for Firestore CollectionReference with type safety and validation
 */
export declare class CollectionReference<T extends SerializedDocumentData> {
    private readonly ref;
    private readonly firestoreTyped;
    private readonly validator;
    constructor(ref: FirebaseCollectionReference<DocumentData>, firestoreTyped: FirestoreTypedOptionsProvider, validator: (data: unknown) => T);
    /**
     * Gets the collection ID
     */
    get id(): string;
    /**
     * Gets the collection path
     */
    get path(): string;
    /**
     * Gets a DocumentReference for a specific document
     */
    doc(documentId: string): DocumentReference<T>;
    /**
     * Adds a new document with auto-generated ID and deserialization
     */
    add(data: T, options?: WriteOptions): Promise<DocumentReference<T>>;
    /**
     * Gets all documents in the collection
     */
    get(options?: ReadOptions): Promise<QuerySnapshot<T>>;
    /**
     * Creates a new Query with where clause (Phase 2)
     */
    where<K extends keyof T & string>(field: K, op: WhereFilterOp, value: T[K]): Query<T>;
    /**
     * Creates a new Query with ordering (Phase 2)
     */
    orderBy<K extends keyof T & string>(field: K, direction?: OrderByDirection): Query<T>;
    /**
     * Creates a new Query with limit (Phase 2)
     */
    limit(limit: number): Query<T>;
    /**
     * Gets the underlying Firebase CollectionReference
     */
    get native(): FirebaseCollectionReference<DocumentData>;
}
//# sourceMappingURL=collection.d.ts.map