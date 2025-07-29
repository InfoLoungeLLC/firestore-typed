import { Timestamp, GeoPoint, DocumentReference, Firestore } from 'firebase-admin/firestore'
import type { DocumentData } from 'firebase-admin/firestore'
import type { SerializedDocumentData } from '../types/firestore-typed.types'

/**
 * Serialized GeoPoint type
 */
export interface SerializedGeoPoint {
  type: 'GeoPoint'
  latitude: number
  longitude: number
}

/**
 * Serialized DocumentReference type
 * @template TCollection - Collection name type
 * @template TDocument - Document type (for type-level information)
 */
export interface SerializedDocumentReference<
  TCollection extends string = string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TDocument = unknown,
> {
  type: 'DocumentReference'
  path: string
  collectionId: TCollection
  documentId: string
}

/**
 * Utility to convert Firestore special types to JavaScript types (serialization)
 * Similar to FirestoreService's serializeFirestoreTypes method
 * @param data Document data retrieved from Firestore
 * @returns Serialized data (Timestamp→Date, GeoPoint→SerializedGeoPoint, etc.)
 */
export function serializeFirestoreTypes(data: DocumentData): SerializedDocumentData {
  return serializeFirestoreTypesInternal(data) as SerializedDocumentData
}

/**
 * Internal recursive conversion function
 */
function serializeFirestoreTypesInternal(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }

  if (data instanceof Timestamp) {
    // Firestore Timestamp -> Date
    return data.toDate()
  }

  if (data instanceof GeoPoint) {
    // Firestore GeoPoint -> SerializedGeoPoint
    return {
      type: 'GeoPoint',
      latitude: data.latitude,
      longitude: data.longitude,
    }
  }

  if (data instanceof DocumentReference) {
    // Firestore DocumentReference -> SerializedDocumentReference
    return {
      type: 'DocumentReference',
      path: data.path,
      collectionId: data.parent.id,
      documentId: data.id,
    } as SerializedDocumentReference
  }

  if (Array.isArray(data)) {
    // Recursively convert arrays
    return data.map((item: unknown) => serializeFirestoreTypesInternal(item))
  }

  // Recursively convert objects
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    result[key] = serializeFirestoreTypesInternal(value)
  }
  return result
}

/**
 * Utility to convert JavaScript types to Firestore special types (deserialization)
 * Restores serialized objects to original Firestore types
 * @param data Data to convert (serialized document data)
 * @param firestore Firestore instance (required for DocumentReference creation)
 * @returns Document data for Firestore
 */
export function deserializeFirestoreTypes(
  data: SerializedDocumentData,
  firestore: Firestore,
): DocumentData {
  return deserializeFirestoreTypesInternal(data, firestore) as DocumentData
}

/**
 * Internal recursive deserialization function
 */
function deserializeFirestoreTypesInternal(data: unknown, firestore: Firestore): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }

  // Date -> Timestamp
  if (data instanceof Date) {
    return Timestamp.fromDate(data)
  }

  // SerializedGeoPoint -> GeoPoint
  if (isSerializedGeoPoint(data)) {
    return new GeoPoint(data.latitude, data.longitude)
  }

  // SerializedDocumentReference -> DocumentReference
  if (isSerializedDocumentReference(data)) {
    return firestore.doc(data.path)
  }

  if (Array.isArray(data)) {
    // Recursively convert arrays
    return data.map((item: unknown) => deserializeFirestoreTypesInternal(item, firestore))
  }

  // Recursively convert objects
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    result[key] = deserializeFirestoreTypesInternal(value, firestore)
  }
  return result
}

/**
 * SerializedGeoPoint type guard
 */
function isSerializedGeoPoint(data: unknown): data is SerializedGeoPoint {
  /* c8 ignore next 3 -- defensive programming: type guard for invalid input */
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const obj = data as Record<string, unknown>
  return (
    'type' in obj &&
    obj.type === 'GeoPoint' &&
    'latitude' in obj &&
    'longitude' in obj &&
    typeof obj.latitude === 'number' &&
    typeof obj.longitude === 'number'
  )
}

/**
 * SerializedDocumentReference type guard
 */
function isSerializedDocumentReference(data: unknown): data is SerializedDocumentReference {
  /* c8 ignore next 3 -- defensive programming: type guard for invalid input */
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const obj = data as Record<string, unknown>
  return (
    'type' in obj &&
    obj.type === 'DocumentReference' &&
    'path' in obj &&
    'collectionId' in obj &&
    'documentId' in obj &&
    typeof obj.path === 'string' &&
    typeof obj.collectionId === 'string' &&
    typeof obj.documentId === 'string'
  )
}
