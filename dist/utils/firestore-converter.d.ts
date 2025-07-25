import { Firestore, DocumentData } from 'firebase-admin/firestore';
import type { SerializedDocumentData } from '../types/firestore-typed.types';
/**
 * Serialized GeoPoint type
 */
export interface SerializedGeoPoint {
    type: 'GeoPoint';
    latitude: number;
    longitude: number;
}
/**
 * Serialized DocumentReference type
 * @template TCollection - Collection name type
 * @template TDocument - Document type (for type-level information)
 */
export interface SerializedDocumentReference<TCollection extends string = string, TDocument = unknown> {
    type: 'DocumentReference';
    path: string;
    collectionId: TCollection;
    documentId: string;
}
/**
 * Utility to convert Firestore special types to JavaScript types (serialization)
 * Similar to FirestoreService's serializeFirestoreTypes method
 * @param data Document data retrieved from Firestore
 * @returns Serialized data (Timestamp→Date, GeoPoint→SerializedGeoPoint, etc.)
 */
export declare function serializeFirestoreTypes(data: DocumentData): SerializedDocumentData;
/**
 * Utility to convert JavaScript types to Firestore special types (deserialization)
 * Restores serialized objects to original Firestore types
 * @param data Data to convert (serialized document data)
 * @param firestore Firestore instance (required for DocumentReference creation)
 * @returns Document data for Firestore
 */
export declare function deserializeFirestoreTypes(data: SerializedDocumentData, firestore: Firestore): DocumentData;
//# sourceMappingURL=firestore-converter.d.ts.map