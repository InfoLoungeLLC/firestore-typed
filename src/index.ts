import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { FirestoreTyped } from './core/firestore-typed'
import type { FirestoreTypedOptions } from './types/firestore-typed.types'

/**
 * Creates a new firestore-typed instance with collection-level validators
 *
 * @param firestore - Optional Firestore instance. If not provided, uses default instance
 * @param options - Optional configuration options
 * @example
 * ```typescript
 * // Using default Firestore instance
 * const db = getFirestoreTyped();
 * const users = db.collection<UserEntity>('users', userValidator);
 *
 * // Using custom Firestore instance
 * const customFirestore = getFirestore(customApp);
 * const customDb = getFirestoreTyped(customFirestore);
 *
 * // With options
 * const dbWithOptions = getFirestoreTyped(undefined, { validateOnRead: true });
 * ```
 */
export function getFirestoreTyped(
  firestore?: Firestore,
  options?: FirestoreTypedOptions,
): FirestoreTyped {
  return new FirestoreTyped(firestore ?? getFirestore(), options)
}

/**
 * @deprecated Use getFirestoreTyped() instead for consistency with Firebase naming conventions
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
  return getFirestoreTyped(undefined, options)
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
