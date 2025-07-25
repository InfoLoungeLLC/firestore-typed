import type {
  CollectionReference as FirebaseCollectionReference,
  DocumentData,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase-admin/firestore'
import { DocumentReference } from './document'
import { Query } from './query'
import { validateData } from '../utils/validator'
import { serializeFirestoreTypes, deserializeFirestoreTypes } from '../utils/firestore-converter'
import type {
  SerializedDocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  ReadOptions,
  WriteOptions,
  FirestoreTypedOptionsProvider,
} from '../types/firestore-typed.types'

/**
 * Wrapper for Firestore CollectionReference with type safety and validation
 */
export class CollectionReference<T extends SerializedDocumentData> {
  constructor(
    private readonly ref: FirebaseCollectionReference<DocumentData>,
    private readonly firestoreTyped: FirestoreTypedOptionsProvider,
    private readonly validator: (data: unknown) => T,
  ) {}

  /**
   * Gets the collection ID
   */
  get id(): string {
    return this.ref.id
  }

  /**
   * Gets the collection path
   */
  get path(): string {
    return this.ref.path
  }

  /**
   * Gets a DocumentReference for a specific document
   */
  doc(documentId: string): DocumentReference<T> {
    return new DocumentReference<T>(this.ref.doc(documentId), this.firestoreTyped, this.validator)
  }

  /**
   * Adds a new document with auto-generated ID and deserialization
   */
  async add(data: T, options?: WriteOptions): Promise<DocumentReference<T>> {
    const globalOptions = this.firestoreTyped.getOptions()
    const validateOnWrite = options?.validateOnWrite ?? globalOptions.validateOnWrite

    // Validate data first
    const validatedData = validateOnWrite ? validateData<T>(data, this.path, this.validator) : data

    // Deserialize data before writing to Firestore
    const deserializedData = deserializeFirestoreTypes(validatedData, this.ref.firestore) as T

    const docRef = await this.ref.add(deserializedData)
    return new DocumentReference<T>(docRef, this.firestoreTyped, this.validator)
  }

  /**
   * Gets all documents in the collection
   */
  async get(options?: ReadOptions): Promise<QuerySnapshot<T>> {
    const querySnapshot = await this.ref.get()
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
    const query = this.ref.where(field, op, value)
    return new Query<T>(query, this.firestoreTyped, this.validator)
  }

  /**
   * Creates a new Query with ordering (Phase 2)
   */
  orderBy<K extends keyof T & string>(field: K, direction?: OrderByDirection): Query<T> {
    const query = this.ref.orderBy(field, direction || 'asc')
    return new Query<T>(query, this.firestoreTyped, this.validator)
  }

  /**
   * Creates a new Query with limit (Phase 2)
   */
  limit(limit: number): Query<T> {
    const query = this.ref.limit(limit)
    return new Query<T>(query, this.firestoreTyped, this.validator)
  }

  /**
   * Gets the underlying Firebase CollectionReference
   */
  get native(): FirebaseCollectionReference<DocumentData> {
    return this.ref
  }
}
