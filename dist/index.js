"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.DocumentReference = exports.CollectionGroup = exports.CollectionReference = exports.FirestoreTyped = void 0;
exports.firestoreTyped = firestoreTyped;
const firestore_1 = require("firebase-admin/firestore");
const firestore_typed_1 = require("./core/firestore-typed");
/**
 * Creates a new firestore-typed instance with the default Firestore
 *
 * Phase 3.2: Now requires validator for type safety at the low level
 */
function firestoreTyped(validator, options) {
    return new firestore_typed_1.FirestoreTyped((0, firestore_1.getFirestore)(), validator, options);
}
// Export all types
__exportStar(require("./types/firestore-typed.types"), exports);
__exportStar(require("./errors/validation.error"), exports);
// Export core classes
var firestore_typed_2 = require("./core/firestore-typed");
Object.defineProperty(exports, "FirestoreTyped", { enumerable: true, get: function () { return firestore_typed_2.FirestoreTyped; } });
var collection_1 = require("./core/collection");
Object.defineProperty(exports, "CollectionReference", { enumerable: true, get: function () { return collection_1.CollectionReference; } });
var collection_group_1 = require("./core/collection-group");
Object.defineProperty(exports, "CollectionGroup", { enumerable: true, get: function () { return collection_group_1.CollectionGroup; } });
var document_1 = require("./core/document");
Object.defineProperty(exports, "DocumentReference", { enumerable: true, get: function () { return document_1.DocumentReference; } });
var query_1 = require("./core/query");
Object.defineProperty(exports, "Query", { enumerable: true, get: function () { return query_1.Query; } });
//# sourceMappingURL=index.js.map