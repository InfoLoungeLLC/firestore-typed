"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentReference = void 0;
const validator_1 = require("../utils/validator");
const firestore_converter_1 = require("../utils/firestore-converter");
const validation_error_1 = require("../errors/validation.error");
/**
 * Wrapper for Firestore DocumentReference with type safety and validation
 */
class DocumentReference {
    ref;
    firestoreTyped;
    validator;
    constructor(ref, firestoreTyped, validator) {
        this.ref = ref;
        this.firestoreTyped = firestoreTyped;
        this.validator = validator;
    }
    /**
     * Gets the document ID
     */
    get id() {
        return this.ref.id;
    }
    /**
     * Gets the document path
     */
    get path() {
        return this.ref.path;
    }
    /**
     * Gets the document data with optional validation
     */
    async get(options) {
        const snapshot = await this.ref.get();
        const data = snapshot.data();
        if (!snapshot.exists || !data) {
            return {
                metadata: {
                    id: this.id,
                    path: this.path,
                    exists: false,
                },
            };
        }
        // Convert Firestore special types (Timestamp → Date, etc.)
        const convertedData = (0, firestore_converter_1.serializeFirestoreTypes)(data);
        const globalOptions = this.firestoreTyped.getOptions();
        const validateOnRead = options?.validateOnRead ?? globalOptions.validateOnRead;
        const validatedData = validateOnRead
            ? (0, validator_1.validateData)(convertedData, this.path, this.validator)
            : convertedData;
        return {
            metadata: {
                id: this.id,
                path: this.path,
                exists: true,
            },
            data: validatedData,
        };
    }
    /**
     * Sets the document data with validation and deserialization
     */
    async set(data, options) {
        const globalOptions = this.firestoreTyped.getOptions();
        const validateOnWrite = options?.validateOnWrite ?? globalOptions.validateOnWrite;
        // Check if document already exists when failIfExists is true
        if (options?.failIfExists) {
            const snapshot = await this.ref.get();
            if (snapshot.exists) {
                throw new validation_error_1.DocumentAlreadyExistsError(this.path);
            }
        }
        // Validate data first
        const validatedData = validateOnWrite ? (0, validator_1.validateData)(data, this.path, this.validator) : data;
        // Deserialize data before writing to Firestore
        const deserializedData = (0, firestore_converter_1.deserializeFirestoreTypes)(validatedData, this.ref.firestore);
        await this.ref.set(deserializedData);
    }
    /**
     * Merges partial data with existing document data and validates the complete schema
     */
    async merge(data, options) {
        const snapshot = await this.ref.get();
        if (!snapshot.exists) {
            throw new validation_error_1.DocumentNotFoundError(this.path);
        }
        const globalOptions = this.firestoreTyped.getOptions();
        const validateOnWrite = options?.validateOnWrite ?? globalOptions.validateOnWrite;
        // Merge with existing data
        const existingData = snapshot.data() || {};
        // Convert Firestore types in existing data before merging
        const convertedExistingData = (0, firestore_converter_1.serializeFirestoreTypes)(existingData);
        const mergedData = { ...convertedExistingData, ...data };
        // Validate the complete merged data
        const validatedData = validateOnWrite
            ? (0, validator_1.validateData)(mergedData, this.path, this.validator)
            : mergedData;
        // Deserialize the complete validated data before writing to Firestore
        const deserializedData = (0, firestore_converter_1.deserializeFirestoreTypes)(validatedData, this.ref.firestore);
        // Use set to ensure the complete schema is written
        await this.ref.set(deserializedData);
    }
    /**
     * Deletes the document
     */
    async delete() {
        await this.ref.delete();
    }
    /**
     * Gets the underlying Firebase DocumentReference
     */
    get native() {
        return this.ref;
    }
}
exports.DocumentReference = DocumentReference;
//# sourceMappingURL=document.js.map