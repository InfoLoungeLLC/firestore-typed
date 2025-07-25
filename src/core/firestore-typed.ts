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
export class FirestoreTyped<T extends SerializedDocumentData = SerializedDocumentData>
  implements FirestoreTypedOptionsProvider
{
  private readonly options: ResolvedFirestoreTypedOptions
  private readonly validator: (data: unknown) => T

  constructor(
    private readonly firestore: Firestore,
    validator: (data: unknown) => T,
    options: FirestoreTypedOptions = {},
  ) {
    // Set default options
    this.options = {
      validateOnRead: false,
      validateOnWrite: true,
      ...options,
    }

    // Store validator for type safety
    this.validator = validator
  }

  /**
   * Gets a typed CollectionReference using the internal validator
   */
  collection(path: string): CollectionReference<T> {
    return new CollectionReference<T>(
      this.firestore.collection(path),
      this, // Pass the FirestoreTyped instance instead of options
      this.validator, // Use internal validator
    )
  }

  /**
   * Gets a typed CollectionGroup for cross-collection queries using the internal validator
   */
  collectionGroup(collectionId: string): CollectionGroup<T> {
    return new CollectionGroup<T>(
      this.firestore.collectionGroup(collectionId),
      this, // Pass the FirestoreTyped instance instead of options
      this.validator, // Use internal validator
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
  withOptions(newOptions: Partial<FirestoreTypedOptions>): FirestoreTyped<T> {
    return new FirestoreTyped<T>(this.firestore, this.validator, {
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
