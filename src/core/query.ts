import type {
  Query as FirebaseQuery,
  WhereFilterOp,
  OrderByDirection,
  DocumentData,
} from 'firebase-admin/firestore'
import { validateData } from '../utils/validator'
import { serializeFirestoreTypes } from '../utils/firestore-converter'
import type {
  SerializedDocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  ReadOptions,
  FirestoreTypedOptionsProvider,
} from '../types/firestore-typed.types'

/**
 * Type-safe Query Builder for Firestore operations
 * Supports method chaining with compile-time type checking
 */
export class Query<T extends SerializedDocumentData> {
  constructor(
    private readonly query: FirebaseQuery<DocumentData>,
    private readonly firestoreTyped: FirestoreTypedOptionsProvider,
    private readonly validator: (data: unknown) => T,
  ) {}

  /**
   * Add a where clause with type-safe field names
   */
  where<K extends keyof T & string>(field: K, op: WhereFilterOp, value: T[K]): Query<T> {
    const newQuery = this.query.where(field, op, value)
    return new Query<T>(newQuery, this.firestoreTyped, this.validator)
  }

  /**
   * Add ordering with type-safe field names
   */
  orderBy<K extends keyof T & string>(field: K, direction?: OrderByDirection): Query<T> {
    const newQuery = this.query.orderBy(field, direction || 'asc')
    return new Query<T>(newQuery, this.firestoreTyped, this.validator)
  }

  /**
   * Limit the number of results
   */
  limit(limit: number): Query<T> {
    const newQuery = this.query.limit(limit)
    return new Query<T>(newQuery, this.firestoreTyped, this.validator)
  }

  /**
   * Start pagination at a specific point
   */
  startAt(...fieldValues: unknown[]): Query<T> {
    const newQuery = this.query.startAt(...fieldValues)
    return new Query<T>(newQuery, this.firestoreTyped, this.validator)
  }

  /**
   * Start pagination after a specific point
   */
  startAfter(...fieldValues: unknown[]): Query<T> {
    const newQuery = this.query.startAfter(...fieldValues)
    return new Query<T>(newQuery, this.firestoreTyped, this.validator)
  }

  /**
   * End pagination at a specific point
   */
  endAt(...fieldValues: unknown[]): Query<T> {
    const newQuery = this.query.endAt(...fieldValues)
    return new Query<T>(newQuery, this.firestoreTyped, this.validator)
  }

  /**
   * End pagination before a specific point
   */
  endBefore(...fieldValues: unknown[]): Query<T> {
    const newQuery = this.query.endBefore(...fieldValues)
    return new Query<T>(newQuery, this.firestoreTyped, this.validator)
  }

  /**
   * Execute the query and return type-safe results with validation
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
   * Gets the underlying Firebase Query
   */
  get native(): FirebaseQuery<DocumentData> {
    return this.query
  }
}
