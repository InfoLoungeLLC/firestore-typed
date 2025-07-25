import { getFirestore } from 'firebase-admin/firestore'
import { FirestoreTyped } from './core/firestore-typed'
import type { FirestoreTypedOptions, SerializedDocumentData } from './types/firestore-typed.types'

/**
 * Creates a new firestore-typed instance with the default Firestore
 *
 * Phase 3.2: Now requires validator for type safety at the low level
 */
export function firestoreTyped<T extends SerializedDocumentData>(
  validator: (data: unknown) => T,
  options?: FirestoreTypedOptions,
): FirestoreTyped<T> {
  return new FirestoreTyped<T>(getFirestore(), validator, options)
}

// Export all types
export * from './types/firestore-typed.types'
export * from './errors/errors'

// Export core classes
export { FirestoreTyped } from './core/firestore-typed'
export { CollectionReference } from './core/collection'
export { CollectionGroup } from './core/collection-group'
export { DocumentReference } from './core/document'
export { Query } from './core/query'
