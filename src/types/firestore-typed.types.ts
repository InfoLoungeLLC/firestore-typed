import type { FirestoreDataConverter } from 'firebase-admin/firestore'

/**
 * Configuration options for firestore-typed instance
 */
export interface FirestoreTypedOptions {
  /**
   * Whether to validate data on read operations
   * @default false
   */
  validateOnRead?: boolean

  /**
   * Whether to validate data on write operations
   * @default true
   */
  validateOnWrite?: boolean
}

/**
 * Options for read operations
 */
export interface ReadOptions {
  /**
   * Override validation settings for this read operation
   */
  validateOnRead?: boolean
}

/**
 * Options for write operations
 */
export interface WriteOptions {
  /**
   * Override validation settings for this write operation
   */
  validateOnWrite?: boolean

  /**
   * If true, the set operation will fail if the document already exists
   * Useful for ensuring document creation without overwriting existing data
   * @default false
   */
  failIfExists?: boolean
}

/**
 * Base type for serialized document data
 * Does not include Firestore special types (Timestamp, GeoPoint, DocumentReference)
 * Represents pure JavaScript objects
 *
 * object type: Only allows non-primitive types (objects, arrays, functions)
 */
export type SerializedDocumentData = object

/**
 * Native Firestore counterpart of a serialized value type: Date fields also
 * accept Timestamp operands, SerializedGeoPoint fields accept GeoPoint, and
 * SerializedDocumentReference fields accept DocumentReference (all pass
 * through query-value conversion unchanged).
 */
type NativeQueryOperand<V> = V extends Date
  ? import('firebase-admin/firestore').Timestamp
  : V extends import('../utils/firestore-converter').SerializedGeoPoint
    ? import('firebase-admin/firestore').GeoPoint
    : V extends import('../utils/firestore-converter').SerializedDocumentReference
      ? import('firebase-admin/firestore').DocumentReference
      : never

/**
 * A single query operand for field values of type V:
 * the value itself (undefined excluded — Firestore rejects undefined
 * operands at runtime) or its native Firestore counterpart.
 */
type QueryOperand<V> = Exclude<V, undefined> | NativeQueryOperand<Exclude<V, undefined>>

/**
 * Maps a Firestore where() operator to the operand type it expects for field K:
 * - `in` / `not-in` compare against an array of field values
 * - `array-contains` compares against a single element of an array field
 * - `array-contains-any` compares against an array of elements of an array field
 * - all other operators compare against the field value itself
 *
 * Native Firestore values (Timestamp, GeoPoint, DocumentReference) are accepted
 * alongside their serialized forms; undefined is never a valid operand.
 */
export type WhereFilterValue<
  T,
  K extends keyof T,
  Op extends import('firebase-admin/firestore').WhereFilterOp,
> = Op extends 'in' | 'not-in'
  ? readonly QueryOperand<T[K]>[]
  : Op extends 'array-contains'
    ? Extract<T[K], readonly unknown[]> extends readonly (infer E)[]
      ? QueryOperand<E>
      : never
    : Op extends 'array-contains-any'
      ? Extract<T[K], readonly unknown[]> extends readonly (infer E)[]
        ? readonly QueryOperand<E>[]
        : never
      : QueryOperand<T[K]>

/**
 * Metadata about a document
 */
export interface DocumentMetadata {
  /**
   * The ID of the document
   */
  id: string

  /**
   * The full path of the document
   */
  path: string

  /**
   * Whether the document exists
   */
  exists: boolean
}

/**
 * Result of a document read operation
 */
export interface DocumentSnapshot<T extends SerializedDocumentData> {
  /**
   * Document metadata
   */
  metadata: DocumentMetadata

  /**
   * The document data, or undefined if document doesn't exist
   */
  data?: T
}

/**
 * Result of a query operation
 */
export interface QuerySnapshot<T extends SerializedDocumentData> {
  /**
   * Array of document snapshots
   */
  docs: DocumentSnapshot<T>[]

  /**
   * Whether the result set is empty
   */
  empty: boolean

  /**
   * The number of documents
   */
  size: number
}

/**
 * Options for collection creation
 */
export interface CollectionOptions<T extends SerializedDocumentData> {
  /**
   * Optional converter for custom serialization
   */
  converter?: FirestoreDataConverter<T>

  /**
   * Optional validator function for runtime type checking
   * Example: typia.assert<YourType>
   */
  validator?: (data: unknown) => T
}

/**
 * Internal options with guaranteed boolean values
 * This is what the FirestoreTyped instance actually stores after applying defaults
 */
export interface ResolvedFirestoreTypedOptions {
  validateOnRead: boolean
  validateOnWrite: boolean
}

/**
 * Interface for accessing firestore-typed options
 */
export interface FirestoreTypedOptionsProvider {
  getOptions(): ResolvedFirestoreTypedOptions
}
