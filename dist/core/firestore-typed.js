"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreTyped = void 0;
const collection_1 = require("./collection");
const collection_group_1 = require("./collection-group");
/**
 * Main firestore-typed class that wraps Firestore with type safety and validation
 */
class FirestoreTyped {
    firestore;
    options;
    validator;
    constructor(firestore, validator, options = {}) {
        this.firestore = firestore;
        // Set default options
        this.options = {
            validateOnRead: false,
            validateOnWrite: true,
            ...options,
        };
        // Store validator for type safety
        this.validator = validator;
    }
    /**
     * Gets a typed CollectionReference using the internal validator
     */
    collection(path) {
        return new collection_1.CollectionReference(this.firestore.collection(path), this, // Pass the FirestoreTyped instance instead of options
        this.validator);
    }
    /**
     * Gets a typed CollectionGroup for cross-collection queries using the internal validator
     */
    collectionGroup(collectionId) {
        return new collection_group_1.CollectionGroup(this.firestore.collectionGroup(collectionId), this, // Pass the FirestoreTyped instance instead of options
        this.validator);
    }
    /**
     * Gets the global options
     */
    getOptions() {
        return { ...this.options };
    }
    /**
     * Updates global options (creates a new instance to maintain immutability)
     */
    withOptions(newOptions) {
        return new FirestoreTyped(this.firestore, this.validator, {
            ...this.options,
            ...newOptions,
        });
    }
    /**
     * Gets the underlying Firestore instance
     */
    get native() {
        return this.firestore;
    }
}
exports.FirestoreTyped = FirestoreTyped;
//# sourceMappingURL=firestore-typed.js.map