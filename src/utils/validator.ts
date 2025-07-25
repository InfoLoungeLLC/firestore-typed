import { FirestoreTypedValidationError } from '../errors/errors'
import type { SerializedDocumentData } from '../types/firestore-typed.types'

/**
 * Validates data using a provided validator function and wraps errors in FirestoreTypedValidationError
 */
export function validateData<T extends SerializedDocumentData>(
  data: unknown,
  path: string,
  validator: (data: unknown) => T,
): T {
  try {
    return validator(data)
  } catch (error) {
    throw new FirestoreTypedValidationError(`Validation failed`, path, error)
  }
}
