import type { DocumentReference as FirebaseDocumentReference } from 'firebase-admin/firestore'
import { validateData } from '../utils/validator'
import { serializeFirestoreTypes, deserializeFirestoreTypes } from '../utils/firestore-converter'
import { DocumentNotFoundError, DocumentAlreadyExistsError } from '../errors/validation.error'
import type {
  SerializedDocumentData,
  DocumentSnapshot,
  ReadOptions,
  WriteOptions,
  FirestoreTypedOptionsProvider,
} from '../types/firestore-typed.types'

/**
 * Wrapper for Firestore DocumentReference with type safety and validation
 */
export class DocumentReference<T extends SerializedDocumentData> {
  constructor(
    private readonly ref: FirebaseDocumentReference,
    private readonly firestoreTyped: FirestoreTypedOptionsProvider,
    private readonly validator: (data: unknown) => T,
  ) {}

  /**
   * Gets the document ID
   */
  get id(): string {
    return this.ref.id
  }

  /**
   * Gets the document path
   */
  get path(): string {
    return this.ref.path
  }

  /**
   * Gets the document data with optional validation
   */
  async get(options?: ReadOptions): Promise<DocumentSnapshot<T>> {
    const snapshot = await this.ref.get()
    const data = snapshot.data()

    if (!snapshot.exists || !data) {
      return {
        metadata: {
          id: this.id,
          path: this.path,
          exists: false,
        },
      }
    }

    // Convert Firestore special types (Timestamp → Date, etc.)
    const convertedData = serializeFirestoreTypes(data)

    const globalOptions = this.firestoreTyped.getOptions()
    const validateOnRead = options?.validateOnRead ?? globalOptions.validateOnRead

    const validatedData = validateOnRead
      ? validateData<T>(convertedData, this.path, this.validator)
      : (convertedData as T)

    return {
      metadata: {
        id: this.id,
        path: this.path,
        exists: true,
      },
      data: validatedData,
    }
  }

  /**
   * Sets the document data with validation and deserialization
   */
  async set(data: T, options?: WriteOptions): Promise<void> {
    const globalOptions = this.firestoreTyped.getOptions()
    const validateOnWrite = options?.validateOnWrite ?? globalOptions.validateOnWrite

    // Check if document already exists when failIfExists is true
    if (options?.failIfExists) {
      const snapshot = await this.ref.get()
      if (snapshot.exists) {
        throw new DocumentAlreadyExistsError(this.path)
      }
    }

    // Validate data first
    const validatedData = validateOnWrite ? validateData<T>(data, this.path, this.validator) : data

    // Deserialize data before writing to Firestore
    const deserializedData = deserializeFirestoreTypes(validatedData, this.ref.firestore)

    await this.ref.set(deserializedData)
  }

  /**
   * Merges partial data with existing document data and validates the complete schema
   */
  async merge(data: Partial<T>, options?: WriteOptions): Promise<void> {
    const snapshot = await this.ref.get()
    if (!snapshot.exists) {
      throw new DocumentNotFoundError(this.path)
    }

    const globalOptions = this.firestoreTyped.getOptions()
    const validateOnWrite = options?.validateOnWrite ?? globalOptions.validateOnWrite

    // Merge with existing data
    const existingData = snapshot.data() || {}
    // Convert Firestore types in existing data before merging
    const convertedExistingData = serializeFirestoreTypes(existingData)
    const mergedData = { ...convertedExistingData, ...data }

    // Validate the complete merged data
    const validatedData = validateOnWrite
      ? validateData<T>(mergedData, this.path, this.validator)
      : (mergedData as T)

    // Deserialize the complete validated data before writing to Firestore
    const deserializedData = deserializeFirestoreTypes(validatedData, this.ref.firestore)

    // Use set to ensure the complete schema is written
    await this.ref.set(deserializedData)
  }

  /**
   * Deletes the document
   */
  async delete(): Promise<void> {
    await this.ref.delete()
  }

  /**
   * Gets the underlying Firebase DocumentReference
   */
  get native(): FirebaseDocumentReference {
    return this.ref
  }
}
