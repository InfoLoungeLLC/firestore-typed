import type { WhereFilterOp, OrderByDirection } from 'firebase-admin/firestore'
import { Query } from './query'
import type {
  SerializedDocumentData,
  FirestoreTypedOptionsProvider,
  ReadOptions,
  QuerySnapshot,
  DocumentSnapshot,
} from '../types/firestore-typed.types'
import { validateData } from '../utils/validator'
import { serializeFirestoreTypes } from '../utils/firestore-converter'

/**
 * Typed wrapper for Firestore Collection Group queries
 */
export class CollectionGroup<T extends SerializedDocumentData> {
  constructor(
    private readonly query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
    private readonly firestoreTyped: FirestoreTypedOptionsProvider,
    private readonly validator: (data: unknown) => T,
  ) {}

  /**
   * Execute a simple query across all collections and return QuerySnapshot
   */
  async get(options?: ReadOptions): Promise<QuerySnapshot<T>> {
    const querySnapshot = await this.query.get()
    const globalOptions = this.firestoreTyped.getOptions()
    const validateOnRead = options?.validateOnRead ?? globalOptions.validateOnRead

    const docs: DocumentSnapshot<T>[] = []

    for (const doc of querySnapshot.docs) {
      const data = doc.data()
      if (data) {
        // Convert Firestore special types (Timestamp → Date, etc.)
        const convertedData = serializeFirestoreTypes(data)

        const validatedData = validateOnRead
          ? validateData<T>(convertedData, doc.ref.path, this.validator)
          : (convertedData as T)

        docs.push({
          metadata: {
            id: doc.id,
            path: doc.ref.path,
            exists: true,
          },
          data: validatedData,
        })
      }
    }

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
    }
  }

  /**
   * Creates a new Query with where clause (Phase 2)
   */
  where<K extends keyof T & string>(field: K, op: WhereFilterOp, value: T[K]): Query<T> {
    const query = this.query.where(field, op, value)
    return new Query<T>(query, this.firestoreTyped, this.validator)
  }

  /**
   * Creates a new Query with ordering (Phase 2)
   */
  orderBy<K extends keyof T & string>(field: K, direction?: OrderByDirection): Query<T> {
    const query = this.query.orderBy(field, direction || 'asc')
    return new Query<T>(query, this.firestoreTyped, this.validator)
  }

  /**
   * Creates a new Query with limit (Phase 2)
   */
  limit(limit: number): Query<T> {
    const query = this.query.limit(limit)
    return new Query<T>(query, this.firestoreTyped, this.validator)
  }

  /**
   * Gets the underlying Firebase Query
   */
  get native(): FirebaseFirestore.Query<FirebaseFirestore.DocumentData> {
    return this.query
  }
}
