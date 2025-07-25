import {
  FirestoreTypedValidationError,
  DocumentNotFoundError,
  DocumentAlreadyExistsError,
} from '../errors'

describe('Error Classes', () => {
  describe('FirestoreTypedValidationError', () => {
    const testMessage = 'Validation failed'
    const testPath = 'users/test-user'
    const testOriginalError = new Error('Original validation error')

    it('should create error with message and document path', () => {
      const error = new FirestoreTypedValidationError(testMessage, testPath)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(FirestoreTypedValidationError)
      expect(error.message).toBe(testMessage)
      expect(error.name).toBe('FirestoreTypedValidationError')
      expect(error.documentPath).toBe(testPath)
      expect(error.originalError).toBeUndefined()
    })

    it('should create error with original error', () => {
      const error = new FirestoreTypedValidationError(testMessage, testPath, testOriginalError)

      expect(error.message).toBe(testMessage)
      expect(error.documentPath).toBe(testPath)
      expect(error.originalError).toBe(testOriginalError)
    })

    it('should maintain proper inheritance chain', () => {
      const error = new FirestoreTypedValidationError(testMessage, testPath)

      expect(error instanceof Error).toBe(true)
      expect(error instanceof FirestoreTypedValidationError).toBe(true)
      expect(error.constructor.name).toBe('FirestoreTypedValidationError')
    })

    it('should set proper stack trace when Error.captureStackTrace is available', () => {
      const originalCaptureStackTrace = Error.captureStackTrace
      const mockCaptureStackTrace = jest.fn()
      Error.captureStackTrace = mockCaptureStackTrace

      const error = new FirestoreTypedValidationError(testMessage, testPath)

      expect(mockCaptureStackTrace).toHaveBeenCalledWith(error, FirestoreTypedValidationError)

      // Restore original function
      Error.captureStackTrace = originalCaptureStackTrace
    })

    it('should handle missing Error.captureStackTrace gracefully', () => {
      const originalCaptureStackTrace = Error.captureStackTrace
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (Error as any).captureStackTrace

      expect(() => {
        new FirestoreTypedValidationError(testMessage, testPath)
      }).not.toThrow()

      // Restore original function
      Error.captureStackTrace = originalCaptureStackTrace
    })

    it('should preserve all properties when thrown and caught', () => {
      const originalError = new Error('Type validation failed')
      
      try {
        throw new FirestoreTypedValidationError(testMessage, testPath, originalError)
      } catch (caught) {
        expect(caught).toBeInstanceOf(FirestoreTypedValidationError)
        const error = caught as FirestoreTypedValidationError
        expect(error.message).toBe(testMessage)
        expect(error.documentPath).toBe(testPath)
        expect(error.originalError).toBe(originalError)
        expect(error.name).toBe('FirestoreTypedValidationError')
      }
    })

    it('should handle different types of original errors', () => {
      const stringError = 'String error'
      const objectError = { code: 'INVALID_DATA', details: 'Field validation failed' }
      const numberError = 404

      const error1 = new FirestoreTypedValidationError(testMessage, testPath, stringError)
      const error2 = new FirestoreTypedValidationError(testMessage, testPath, objectError)
      const error3 = new FirestoreTypedValidationError(testMessage, testPath, numberError)

      expect(error1.originalError).toBe(stringError)
      expect(error2.originalError).toBe(objectError)
      expect(error3.originalError).toBe(numberError)
    })
  })

  describe('DocumentNotFoundError', () => {
    const testPath = 'users/non-existent-user'

    it('should create error with document path', () => {
      const error = new DocumentNotFoundError(testPath)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(DocumentNotFoundError)
      expect(error.message).toBe(`Document not found at path: ${testPath}`)
      expect(error.name).toBe('DocumentNotFoundError')
      expect(error.documentPath).toBe(testPath)
    })

    it('should maintain proper inheritance chain', () => {
      const error = new DocumentNotFoundError(testPath)

      expect(error instanceof Error).toBe(true)
      expect(error instanceof DocumentNotFoundError).toBe(true)
      expect(error.constructor.name).toBe('DocumentNotFoundError')
    })

    it('should set proper stack trace when Error.captureStackTrace is available', () => {
      const originalCaptureStackTrace = Error.captureStackTrace
      const mockCaptureStackTrace = jest.fn()
      Error.captureStackTrace = mockCaptureStackTrace

      const error = new DocumentNotFoundError(testPath)

      expect(mockCaptureStackTrace).toHaveBeenCalledWith(error, DocumentNotFoundError)

      // Restore original function
      Error.captureStackTrace = originalCaptureStackTrace
    })

    it('should handle missing Error.captureStackTrace gracefully', () => {
      const originalCaptureStackTrace = Error.captureStackTrace
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (Error as any).captureStackTrace

      expect(() => {
        new DocumentNotFoundError(testPath)
      }).not.toThrow()

      // Restore original function
      Error.captureStackTrace = originalCaptureStackTrace
    })

    it('should preserve all properties when thrown and caught', () => {
      try {
        throw new DocumentNotFoundError(testPath)
      } catch (caught) {
        expect(caught).toBeInstanceOf(DocumentNotFoundError)
        const error = caught as DocumentNotFoundError
        expect(error.message).toBe(`Document not found at path: ${testPath}`)
        expect(error.documentPath).toBe(testPath)
        expect(error.name).toBe('DocumentNotFoundError')
      }
    })

    it('should handle different document paths', () => {
      const paths = [
        'users/user1',
        'posts/post123',
        'users/user1/comments/comment456',
        'organizations/org1/projects/project2/tasks/task789'
      ]

      paths.forEach((path) => {
        const error = new DocumentNotFoundError(path)
        expect(error.documentPath).toBe(path)
        expect(error.message).toBe(`Document not found at path: ${path}`)
      })
    })
  })

  describe('DocumentAlreadyExistsError', () => {
    const testPath = 'users/existing-user'

    it('should create error with document path', () => {
      const error = new DocumentAlreadyExistsError(testPath)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(DocumentAlreadyExistsError)
      expect(error.message).toBe(`Document already exists at path: ${testPath}`)
      expect(error.name).toBe('DocumentAlreadyExistsError')
      expect(error.documentPath).toBe(testPath)
    })

    it('should maintain proper inheritance chain', () => {
      const error = new DocumentAlreadyExistsError(testPath)

      expect(error instanceof Error).toBe(true)
      expect(error instanceof DocumentAlreadyExistsError).toBe(true)
      expect(error.constructor.name).toBe('DocumentAlreadyExistsError')
    })

    it('should set proper stack trace when Error.captureStackTrace is available', () => {
      const originalCaptureStackTrace = Error.captureStackTrace
      const mockCaptureStackTrace = jest.fn()
      Error.captureStackTrace = mockCaptureStackTrace

      const error = new DocumentAlreadyExistsError(testPath)

      expect(mockCaptureStackTrace).toHaveBeenCalledWith(error, DocumentAlreadyExistsError)

      // Restore original function
      Error.captureStackTrace = originalCaptureStackTrace
    })

    it('should handle missing Error.captureStackTrace gracefully', () => {
      const originalCaptureStackTrace = Error.captureStackTrace
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (Error as any).captureStackTrace

      expect(() => {
        new DocumentAlreadyExistsError(testPath)
      }).not.toThrow()

      // Restore original function
      Error.captureStackTrace = originalCaptureStackTrace
    })

    it('should preserve all properties when thrown and caught', () => {
      try {
        throw new DocumentAlreadyExistsError(testPath)
      } catch (caught) {
        expect(caught).toBeInstanceOf(DocumentAlreadyExistsError)
        const error = caught as DocumentAlreadyExistsError
        expect(error.message).toBe(`Document already exists at path: ${testPath}`)
        expect(error.documentPath).toBe(testPath)
        expect(error.name).toBe('DocumentAlreadyExistsError')
      }
    })

    it('should handle different document paths', () => {
      const paths = [
        'users/user1',
        'posts/post123',
        'users/user1/comments/comment456',
        'organizations/org1/projects/project2/tasks/task789'
      ]

      paths.forEach((path) => {
        const error = new DocumentAlreadyExistsError(path)
        expect(error.documentPath).toBe(path)
        expect(error.message).toBe(`Document already exists at path: ${path}`)
      })
    })
  })

  describe('Error Differentiation', () => {
    it('should be able to distinguish between different error types', () => {
      const validationError = new FirestoreTypedValidationError('Validation failed', 'users/test')
      const notFoundError = new DocumentNotFoundError('users/test')
      const alreadyExistsError = new DocumentAlreadyExistsError('users/test')

      expect(validationError).toBeInstanceOf(FirestoreTypedValidationError)
      expect(validationError).not.toBeInstanceOf(DocumentNotFoundError)
      expect(validationError).not.toBeInstanceOf(DocumentAlreadyExistsError)

      expect(notFoundError).toBeInstanceOf(DocumentNotFoundError)
      expect(notFoundError).not.toBeInstanceOf(FirestoreTypedValidationError)
      expect(notFoundError).not.toBeInstanceOf(DocumentAlreadyExistsError)

      expect(alreadyExistsError).toBeInstanceOf(DocumentAlreadyExistsError)
      expect(alreadyExistsError).not.toBeInstanceOf(FirestoreTypedValidationError)
      expect(alreadyExistsError).not.toBeInstanceOf(DocumentNotFoundError)
    })

    it('should have unique error names', () => {
      const validationError = new FirestoreTypedValidationError('Validation failed', 'users/test')
      const notFoundError = new DocumentNotFoundError('users/test')
      const alreadyExistsError = new DocumentAlreadyExistsError('users/test')

      const errorNames = [validationError.name, notFoundError.name, alreadyExistsError.name]
      const uniqueNames = [...new Set(errorNames)]

      expect(uniqueNames).toHaveLength(3)
      expect(uniqueNames).toContain('FirestoreTypedValidationError')
      expect(uniqueNames).toContain('DocumentNotFoundError')
      expect(uniqueNames).toContain('DocumentAlreadyExistsError')
    })
  })
})