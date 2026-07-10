import { vi, describe, it, expect } from 'vitest'
import { validateData } from '../../validator'
import { FirestoreTypedValidationError } from '../../../errors/errors'
import { catchError } from '../../../__tests__/__helpers__/catch-error.helper'

describe('Validator', () => {
  interface TestEntity {
    id: string
    name: string
    age: number
    isActive: boolean
  }

  const testPath = 'users/test-user'

  describe('validateData', () => {
    describe('Successful Validation', () => {
      it('should return validated data when validation passes', () => {
        const inputData = {
          id: 'test-123',
          name: 'John Doe',
          age: 30,
          isActive: true,
        }

        const mockValidator = vi.fn().mockReturnValue(inputData)

        const result = validateData(inputData, testPath, mockValidator)

        expect(mockValidator).toHaveBeenCalledWith(inputData)
        expect(result).toBe(inputData)
      })

      it('should pass through the exact data returned by validator', () => {
        const inputData = { raw: 'data' }
        const transformedData: TestEntity = {
          id: 'transformed-id',
          name: 'Transformed Name',
          age: 25,
          isActive: false,
        }

        const mockValidator = vi.fn().mockReturnValue(transformedData)

        const result = validateData(inputData, testPath, mockValidator)

        expect(mockValidator).toHaveBeenCalledWith(inputData)
        expect(result).toBe(transformedData)
        expect(result).not.toBe(inputData)
      })

      it('should work with different data types', () => {
        const testCases = [
          { input: null, expected: null },
          { input: undefined, expected: undefined },
          { input: 'string', expected: 'string' },
          { input: 123, expected: 123 },
          { input: [], expected: [] },
          { input: {}, expected: {} },
        ]

        testCases.forEach(({ input, expected }) => {
          const mockValidator = vi.fn().mockReturnValue(expected as any)
          const result = validateData(input, testPath, mockValidator)

          expect(mockValidator).toHaveBeenCalledWith(input)
          expect(result).toBe(expected)
        })
      })
    })

    describe('Validation Errors', () => {
      it('should wrap validator errors in FirestoreTypedValidationError', () => {
        const inputData = { invalid: 'data' }
        const originalError = new Error('Validation failed: missing required field')

        const mockValidator = vi.fn().mockImplementation(() => {
          throw originalError
        })

        expect(() => {
          validateData(inputData, testPath, mockValidator)
        }).toThrow(FirestoreTypedValidationError)

        expect(mockValidator).toHaveBeenCalledWith(inputData)
      })

      it('should preserve original error in wrapped error', async () => {
        const inputData = { invalid: 'data' }
        const originalError = new Error('Type validation failed')

        const mockValidator = vi.fn().mockImplementation(() => {
          throw originalError
        })

        const wrappedError = await catchError<FirestoreTypedValidationError>(() =>
          validateData(inputData, testPath, mockValidator),
        )

        expect(wrappedError).toBeInstanceOf(FirestoreTypedValidationError)
        expect(wrappedError.message).toBe('Validation failed')
        expect(wrappedError.documentPath).toBe(testPath)
        expect(wrappedError.originalError).toBe(originalError)
      })

      it('should handle string errors thrown by validator', async () => {
        const inputData = { invalid: 'data' }
        const stringError = 'String error message'

        const mockValidator = vi.fn().mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw stringError
        })

        const wrappedError = await catchError<FirestoreTypedValidationError>(() =>
          validateData(inputData, testPath, mockValidator),
        )

        expect(wrappedError).toBeInstanceOf(FirestoreTypedValidationError)
        expect(wrappedError.originalError).toBe(stringError)
      })

      it('should handle object errors thrown by validator', async () => {
        const inputData = { invalid: 'data' }
        const objectError = { code: 'VALIDATION_FAILED', details: 'Field missing' }

        const mockValidator = vi.fn().mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw objectError
        })

        const wrappedError = await catchError<FirestoreTypedValidationError>(() =>
          validateData(inputData, testPath, mockValidator),
        )

        expect(wrappedError).toBeInstanceOf(FirestoreTypedValidationError)
        expect(wrappedError.originalError).toBe(objectError)
      })

      it('should handle null/undefined errors thrown by validator', async () => {
        const inputData = { invalid: 'data' }

        const nullValidator = vi.fn().mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw null
        })
        const undefinedValidator = vi.fn().mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw undefined
        })

        const nullWrappedError = await catchError<FirestoreTypedValidationError>(() =>
          validateData(inputData, testPath, nullValidator),
        )

        expect(nullWrappedError).toBeInstanceOf(FirestoreTypedValidationError)
        expect(nullWrappedError.originalError).toBe(null)

        const undefinedWrappedError = await catchError<FirestoreTypedValidationError>(() =>
          validateData(inputData, testPath, undefinedValidator),
        )

        expect(undefinedWrappedError).toBeInstanceOf(FirestoreTypedValidationError)
        expect(undefinedWrappedError.originalError).toBe(undefined)
      })
    })

    describe('Path Handling', () => {
      it('should include correct document path in error', async () => {
        const paths = [
          'users/user1',
          'posts/post123',
          'users/user1/comments/comment456',
          'organizations/org1/projects/project2/tasks/task789',
        ]

        for (const path of paths) {
          const mockValidator = vi.fn().mockImplementation(() => {
            throw new Error('Validation error')
          })

          const wrappedError = await catchError<FirestoreTypedValidationError>(() =>
            validateData({}, path, mockValidator),
          )

          expect(wrappedError).toBeInstanceOf(FirestoreTypedValidationError)
          expect(wrappedError.documentPath).toBe(path)
        }
      })

      it('should handle empty and special character paths', async () => {
        const specialPaths = [
          '',
          '/',
          'collection/',
          '/document',
          'collection/document/',
          'users/user-with-dashes',
          'users/user_with_underscores',
          'users/user.with.dots',
        ]

        for (const path of specialPaths) {
          const mockValidator = vi.fn().mockImplementation(() => {
            throw new Error('Validation error')
          })

          const wrappedError = await catchError<FirestoreTypedValidationError>(() =>
            validateData({}, path, mockValidator),
          )

          expect(wrappedError).toBeInstanceOf(FirestoreTypedValidationError)
          expect(wrappedError.documentPath).toBe(path)
        }
      })
    })

    describe('Validator Function Behavior', () => {
      it('should call validator function exactly once', () => {
        const inputData = { test: 'data' }
        const mockValidator = vi.fn().mockReturnValue(inputData as any)

        validateData(inputData, testPath, mockValidator)

        expect(mockValidator).toHaveBeenCalledTimes(1)
        expect(mockValidator).toHaveBeenCalledWith(inputData)
      })

      it('should not modify validator function calls on error', () => {
        const inputData = { test: 'data' }
        const mockValidator = vi.fn().mockImplementation(() => {
          throw new Error('Validation failed')
        })

        try {
          validateData(inputData, testPath, mockValidator)
        } catch {
          // Expected to throw
        }

        expect(mockValidator).toHaveBeenCalledTimes(1)
        expect(mockValidator).toHaveBeenCalledWith(inputData)
      })

      it('should support validators that return different types', () => {
        interface DifferentEntity {
          uuid: string
          status: 'active' | 'inactive'
        }

        const inputData = { id: 'test', active: true }
        const transformedData: DifferentEntity = { uuid: 'test', status: 'active' }

        const mockValidator = vi.fn().mockReturnValue(transformedData)

        const result = validateData(inputData, testPath, mockValidator)

        expect(result).toBe(transformedData)
        expect(mockValidator).toHaveBeenCalledWith(inputData)
      })
    })

    describe('Edge Cases', () => {
      it('should handle validators that return falsy values', () => {
        const falsyValues = [false, 0, '', null, undefined]

        falsyValues.forEach((falsyValue) => {
          const mockValidator = vi.fn().mockReturnValue(falsyValue as any)
          const result = validateData({}, testPath, mockValidator)

          expect(result).toBe(falsyValue)
        })
      })

      it('should handle complex nested data structures', () => {
        const complexData = {
          user: {
            profile: {
              name: 'John',
              preferences: {
                theme: 'dark',
                notifications: ['email', 'push'],
              },
            },
            posts: [
              { id: 1, title: 'Post 1' },
              { id: 2, title: 'Post 2' },
            ],
          },
          metadata: {
            version: 1,
            createdAt: new Date(),
          },
        }

        const mockValidator = vi.fn().mockReturnValue(complexData as any)
        const result = validateData(complexData, testPath, mockValidator)

        expect(result).toBe(complexData)
        expect(mockValidator).toHaveBeenCalledWith(complexData)
      })

      it('should handle validators that modify input during validation', () => {
        const inputData = { count: 5 }
        const mockValidator = vi.fn().mockImplementation((data: any) => {
          data.count += 1 // Modify input
          return data
        })

        const result = validateData(inputData, testPath, mockValidator)

        expect(result).toBe(inputData)
        expect(result.count).toBe(6) // Should reflect modification
        expect(mockValidator).toHaveBeenCalledWith(inputData)
      })
    })

    describe('Performance Considerations', () => {
      it('should not add significant overhead for simple validation', () => {
        const inputData = { id: 'test' }
        const mockValidator = vi.fn().mockReturnValue(inputData as any)

        const startTime = performance.now()

        for (let i = 0; i < 1000; i++) {
          validateData(inputData, testPath, mockValidator)
        }

        const endTime = performance.now()
        const duration = endTime - startTime

        // Should complete 1000 validations in reasonable time (< 100ms)
        expect(duration).toBeLessThan(100)
        expect(mockValidator).toHaveBeenCalledTimes(1000)
      })
    })
  })
})
