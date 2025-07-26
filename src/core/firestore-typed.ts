import { Firestore } from 'firebase-admin/firestore'
import { CollectionReference } from './collection'
import { CollectionGroup } from './collection-group'
import type {
  FirestoreTypedOptions,
  SerializedDocumentData,
  FirestoreTypedOptionsProvider,
  ResolvedFirestoreTypedOptions,
} from '../types/firestore-typed.types'

/**
 * Main firestore-typed class that wraps Firestore with type safety and validation
 */
export class FirestoreTyped implements FirestoreTypedOptionsProvider {
  private readonly options: ResolvedFirestoreTypedOptions

  constructor(
    private readonly firestore: Firestore,
    options: FirestoreTypedOptions = {},
  ) {
    // Set default options
    this.options = {
      validateOnRead: false,
      validateOnWrite: true,
      ...options,
    }
  }

  /**
   * Gets a typed CollectionReference with validator
   * @param path - The collection path
   * @param validator - The validator function for this collection
   */
  collection<T extends SerializedDocumentData>(
    path: string,
    validator: (data: unknown) => T,
  ): CollectionReference<T> {
    return new CollectionReference<T>(
      this.firestore.collection(path),
      this, // Pass the FirestoreTyped instance
      validator,
    )
  }

  /**
   * Gets a typed CollectionGroup for cross-collection queries
   * @param collectionId - The collection ID to query across
   * @param validator - The validator function for this collection group
   */
  collectionGroup<T extends SerializedDocumentData>(
    collectionId: string,
    validator: (data: unknown) => T,
  ): CollectionGroup<T> {
    return new CollectionGroup<T>(
      this.firestore.collectionGroup(collectionId),
      this, // Pass the FirestoreTyped instance
      validator,
    )
  }

  /**
   * Gets the global options
   */
  getOptions(): ResolvedFirestoreTypedOptions {
    return { ...this.options }
  }

  /**
   * Updates global options (creates a new instance to maintain immutability)
   */
  withOptions(newOptions: Partial<FirestoreTypedOptions>): FirestoreTyped {
    return new FirestoreTyped(this.firestore, {
      ...this.options,
      ...newOptions,
    })
  }

  /**
   * Gets the underlying Firestore instance
   */
  get native(): Firestore {
    return this.firestore
  }
}
