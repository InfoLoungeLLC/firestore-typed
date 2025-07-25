import type { Query as FirebaseQuery, WhereFilterOp, OrderByDirection, DocumentData } from 'firebase-admin/firestore';
import type { SerializedDocumentData, QuerySnapshot, ReadOptions, FirestoreTypedOptionsProvider } from '../types/firestore-typed.types';
/**
 * Type-safe Query Builder for Firestore operations
 * Supports method chaining with compile-time type checking
 */
export declare class Query<T extends SerializedDocumentData> {
    private readonly query;
    private readonly firestoreTyped;
    private readonly validator;
    constructor(query: FirebaseQuery<DocumentData>, firestoreTyped: FirestoreTypedOptionsProvider, validator: (data: unknown) => T);
    /**
     * Add a where clause with type-safe field names
     */
    where<K extends keyof T & string>(field: K, op: WhereFilterOp, value: T[K]): Query<T>;
    /**
     * Add ordering with type-safe field names
     */
    orderBy<K extends keyof T & string>(field: K, direction?: OrderByDirection): Query<T>;
    /**
     * Limit the number of results
     */
    limit(limit: number): Query<T>;
    /**
     * Start pagination at a specific point
     */
    startAt(...fieldValues: unknown[]): Query<T>;
    /**
     * Start pagination after a specific point
     */
    startAfter(...fieldValues: unknown[]): Query<T>;
    /**
     * End pagination at a specific point
     */
    endAt(...fieldValues: unknown[]): Query<T>;
    /**
     * End pagination before a specific point
     */
    endBefore(...fieldValues: unknown[]): Query<T>;
    /**
     * Execute the query and return type-safe results with validation
     */
    get(options?: ReadOptions): Promise<QuerySnapshot<T>>;
    /**
     * Gets the underlying Firebase Query
     */
    get native(): FirebaseQuery<DocumentData>;
}
//# sourceMappingURL=query.d.ts.map