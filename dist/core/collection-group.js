"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionGroup = void 0;
const query_1 = require("./query");
const validator_1 = require("../utils/validator");
const firestore_converter_1 = require("../utils/firestore-converter");
/**
 * Typed wrapper for Firestore Collection Group queries
 */
class CollectionGroup {
    query;
    firestoreTyped;
    validator;
    constructor(query, firestoreTyped, validator) {
        this.query = query;
        this.firestoreTyped = firestoreTyped;
        this.validator = validator;
    }
    /**
     * Execute a simple query across all collections and return QuerySnapshot
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
     * Creates a new Query with where clause (Phase 2)
     */
    where(field, op, value) {
        const query = this.query.where(field, op, value);
        return new query_1.Query(query, this.firestoreTyped, this.validator);
    }
    /**
     * Creates a new Query with ordering (Phase 2)
     */
    orderBy(field, direction) {
        const query = this.query.orderBy(field, direction || 'asc');
        return new query_1.Query(query, this.firestoreTyped, this.validator);
    }
    /**
     * Creates a new Query with limit (Phase 2)
     */
    limit(limit) {
        const query = this.query.limit(limit);
        return new query_1.Query(query, this.firestoreTyped, this.validator);
    }
    /**
     * Gets the underlying Firebase Query
     */
    get native() {
        return this.query;
    }
}
exports.CollectionGroup = CollectionGroup;
//# sourceMappingURL=collection-group.js.map