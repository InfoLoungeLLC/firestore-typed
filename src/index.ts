import { getFirestore } from 'firebase-admin/firestore'
import { FirestoreTyped } from './core/firestore-typed'
import type { FirestoreTypedOptions } from './types/firestore-typed.types'

/**
 * Creates a new firestore-typed instance with collection-level validators
 *
 * @example
 * ```typescript
 * const db = firestoreTyped();
 * const users = db.collection<UserEntity>('users', userValidator);
 * const products = db.collection<ProductEntity>('products', productValidator);
 * ```
 */
export function firestoreTyped(options?: FirestoreTypedOptions): FirestoreTyped {
  return new FirestoreTyped(getFirestore(), options)
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
