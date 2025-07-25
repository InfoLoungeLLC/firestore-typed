"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeFirestoreTypes = serializeFirestoreTypes;
exports.deserializeFirestoreTypes = deserializeFirestoreTypes;
const firestore_1 = require("firebase-admin/firestore");
/**
 * Utility to convert Firestore special types to JavaScript types (serialization)
 * Similar to FirestoreService's serializeFirestoreTypes method
 * @param data Document data retrieved from Firestore
 * @returns Serialized data (Timestamp→Date, GeoPoint→SerializedGeoPoint, etc.)
 */
function serializeFirestoreTypes(data) {
    return serializeFirestoreTypesInternal(data);
}
/**
 * Internal recursive conversion function
 */
function serializeFirestoreTypesInternal(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    if (data instanceof firestore_1.Timestamp) {
        // Firestore Timestamp -> Date
        return data.toDate();
    }
    if (data instanceof firestore_1.GeoPoint) {
        // Firestore GeoPoint -> SerializedGeoPoint
        return {
            type: 'GeoPoint',
            latitude: data.latitude,
            longitude: data.longitude,
        };
    }
    if (data instanceof firestore_1.DocumentReference) {
        // Firestore DocumentReference -> SerializedDocumentReference
        return {
            type: 'DocumentReference',
            path: data.path,
            collectionId: data.parent.id,
            documentId: data.id,
        };
    }
    if (Array.isArray(data)) {
        // Recursively convert arrays
        return data.map((item) => serializeFirestoreTypesInternal(item));
    }
    if (typeof data === 'object' && data !== null) {
        // Recursively convert objects
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = serializeFirestoreTypesInternal(value);
        }
        return result;
    }
    return data;
}
/**
 * Utility to convert JavaScript types to Firestore special types (deserialization)
 * Restores serialized objects to original Firestore types
 * @param data Data to convert (serialized document data)
 * @param firestore Firestore instance (required for DocumentReference creation)
 * @returns Document data for Firestore
 */
function deserializeFirestoreTypes(data, firestore) {
    return deserializeFirestoreTypesInternal(data, firestore);
}
/**
 * Internal recursive deserialization function
 */
function deserializeFirestoreTypesInternal(data, firestore) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    // Date -> Timestamp
    if (data instanceof Date) {
        return firestore_1.Timestamp.fromDate(data);
    }
    // SerializedGeoPoint -> GeoPoint
    if (isSerializedGeoPoint(data)) {
        return new firestore_1.GeoPoint(data.latitude, data.longitude);
    }
    // SerializedDocumentReference -> DocumentReference
    if (isSerializedDocumentReference(data)) {
        return firestore.doc(data.path);
    }
    if (Array.isArray(data)) {
        // Recursively convert arrays
        return data.map((item) => deserializeFirestoreTypesInternal(item, firestore));
    }
    if (typeof data === 'object' && data !== null) {
        // Recursively convert objects
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = deserializeFirestoreTypesInternal(value, firestore);
        }
        return result;
    }
    return data;
}
/**
 * SerializedGeoPoint type guard
 */
function isSerializedGeoPoint(data) {
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    const obj = data;
    return ('type' in obj &&
        obj.type === 'GeoPoint' &&
        'latitude' in obj &&
        'longitude' in obj &&
        typeof obj.latitude === 'number' &&
        typeof obj.longitude === 'number');
}
/**
 * SerializedDocumentReference type guard
 */
function isSerializedDocumentReference(data) {
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    const obj = data;
    return ('type' in obj &&
        obj.type === 'DocumentReference' &&
        'path' in obj &&
        'collectionId' in obj &&
        'documentId' in obj &&
        typeof obj.path === 'string' &&
        typeof obj.collectionId === 'string' &&
        typeof obj.documentId === 'string');
}
//# sourceMappingURL=firestore-converter.js.map