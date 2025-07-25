"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionReference = void 0;
const document_1 = require("./document");
const query_1 = require("./query");
const validator_1 = require("../utils/validator");
const firestore_converter_1 = require("../utils/firestore-converter");
/**
 * Wrapper for Firestore CollectionReference with type safety and validation
 */
class CollectionReference {
    ref;
    firestoreTyped;
    validator;
    constructor(ref, firestoreTyped, validator) {
        this.ref = ref;
        this.firestoreTyped = firestoreTyped;
        this.validator = validator;
    }
    /**
     * Gets the collection ID
     */
    get id() {
        return this.ref.id;
    }
    /**
     * Gets the collection path
     */
    get path() {
        return this.ref.path;
    }
    /**
     * Gets a DocumentReference for a specific document
     */
    doc(documentId) {
        return new document_1.DocumentReference(this.ref.doc(documentId), this.firestoreTyped, this.validator);
    }
    /**
     * Adds a new document with auto-generated ID and deserialization
     */
    async add(data, options) {
        const globalOptions = this.firestoreTyped.getOptions();
        const validateOnWrite = options?.validateOnWrite ?? globalOptions.validateOnWrite;
        // Validate data first
        const validatedData = validateOnWrite ? (0, validator_1.validateData)(data, this.path, this.validator) : data;
        // Deserialize data before writing to Firestore
        const deserializedData = (0, firestore_converter_1.deserializeFirestoreTypes)(validatedData, this.ref.firestore);
        const docRef = await this.ref.add(deserializedData);
        return new document_1.DocumentReference(docRef, this.firestoreTyped, this.validator);
    }
    /**
     * Gets all documents in the collection
     */
    async get(options) {
        const querySnapshot = await this.ref.get();
        const globalOptions = this.firestoreTyped.getOptions();
        const validateOnRead = options?.validateOnRead ?? globalOptions.validateOnRead;
        const docs = [];
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            if (data) {
                // Convert Firestore special types (Timestamp → Date, etc.)
                const convertedData = (0, firestore_converter_1.serializeFirestoreTypes)(data);
                const validatedData = validateOnRead
                    ? (0, validator_1.validateData)(convertedData, doc.ref.path, this.validator)
                    : convertedData;
                docs.push({
                    metadata: {
                        id: doc.id,
                        path: doc.ref.path,
                        exists: true,
                    },
                    data: validatedData,
                });
            }
        }
        return {
            docs,
            empty: docs.length === 0,
            size: docs.length,
        };
    }
    /**
     * Creates a new Query with where clause (Phase 2)
     */
    where(field, op, value) {
        const query = this.ref.where(field, op, value);
        return new query_1.Query(query, this.firestoreTyped, this.validator);
    }
    /**
     * Creates a new Query with ordering (Phase 2)
     */
    orderBy(field, direction) {
        const query = this.ref.orderBy(field, direction || 'asc');
        return new query_1.Query(query, this.firestoreTyped, this.validator);
    }
    /**
     * Creates a new Query with limit (Phase 2)
     */
    limit(limit) {
        const query = this.ref.limit(limit);
        return new query_1.Query(query, this.firestoreTyped, this.validator);
    }
    /**
     * Gets the underlying Firebase CollectionReference
     */
    get native() {
        return this.ref;
    }
}
exports.CollectionReference = CollectionReference;
//# sourceMappingURL=collection.js.map