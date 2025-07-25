"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = void 0;
const validator_1 = require("../utils/validator");
const firestore_converter_1 = require("../utils/firestore-converter");
/**
 * Type-safe Query Builder for Firestore operations
 * Supports method chaining with compile-time type checking
 */
class Query {
    query;
    firestoreTyped;
    validator;
    constructor(query, firestoreTyped, validator) {
        this.query = query;
        this.firestoreTyped = firestoreTyped;
        this.validator = validator;
    }
    /**
     * Add a where clause with type-safe field names
     */
    where(field, op, value) {
        const newQuery = this.query.where(field, op, value);
        return new Query(newQuery, this.firestoreTyped, this.validator);
    }
    /**
     * Add ordering with type-safe field names
     */
    orderBy(field, direction) {
        const newQuery = this.query.orderBy(field, direction || 'asc');
        return new Query(newQuery, this.firestoreTyped, this.validator);
    }
    /**
     * Limit the number of results
     */
    limit(limit) {
        const newQuery = this.query.limit(limit);
        return new Query(newQuery, this.firestoreTyped, this.validator);
    }
    /**
     * Start pagination at a specific point
     */
    startAt(...fieldValues) {
        const newQuery = this.query.startAt(...fieldValues);
        return new Query(newQuery, this.firestoreTyped, this.validator);
    }
    /**
     * Start pagination after a specific point
     */
    startAfter(...fieldValues) {
        const newQuery = this.query.startAfter(...fieldValues);
        return new Query(newQuery, this.firestoreTyped, this.validator);
    }
    /**
     * End pagination at a specific point
     */
    endAt(...fieldValues) {
        const newQuery = this.query.endAt(...fieldValues);
        return new Query(newQuery, this.firestoreTyped, this.validator);
    }
    /**
     * End pagination before a specific point
     */
    endBefore(...fieldValues) {
        const newQuery = this.query.endBefore(...fieldValues);
        return new Query(newQuery, this.firestoreTyped, this.validator);
    }
    /**
     * Execute the query and return type-safe results with validation
     */
    async get(options) {
        const querySnapshot = await this.query.get();
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
     * Gets the underlying Firebase Query
     */
    get native() {
        return this.query;
    }
}
exports.Query = Query;
//# sourceMappingURL=query.js.map