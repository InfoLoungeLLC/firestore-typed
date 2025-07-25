import type { WhereFilterOp, OrderByDirection } from 'firebase-admin/firestore';
import { Query } from './query';
import type { SerializedDocumentData, FirestoreTypedOptionsProvider, ReadOptions, QuerySnapshot } from '../types/firestore-typed.types';
/**
 * Typed wrapper for Firestore Collection Group queries
 */
export declare class CollectionGroup<T extends SerializedDocumentData> {
    private readonly query;
    private readonly firestoreTyped;
    private readonly validator;
    constructor(query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>, firestoreTyped: FirestoreTypedOptionsProvider, validator: (data: unknown) => T);
    /**
     * Execute a simple query across all collections and return QuerySnapshot
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
     * Gets the underlying Firebase Query
     */
    get native(): FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
}
//# sourceMappingURL=collection-group.d.ts.map