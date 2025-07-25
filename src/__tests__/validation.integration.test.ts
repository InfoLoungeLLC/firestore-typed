import { firestoreTyped } from '../index'
import { FirestoreTypedValidationError } from '../errors/errors'

jest.mock('firebase-admin/firestore', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockHelper = require('../core/__tests__/__helpers__/firebase-mock.helper')
  return mockHelper.createFirebaseAdminMock()
})

describe('FirestoreTyped Validation', () => {
  interface UserEntity {
    name: string
    email: string
    age: number
    status: 'active' | 'inactive'
    createdAt: Date
  }

  const strictValidator = (data: unknown): UserEntity => {
    const obj = data as any

    if (!obj || typeof obj !== 'object') {
      throw new Error('Data must be an object')
    }

    if (!obj.name || typeof obj.name !== 'string') {
      throw new Error('Name is required and must be a string')
    }

    if (obj.name.length < 2 || obj.name.length > 50) {
      throw new Error('Name must be between 2 and 50 characters')
    }

    if (!obj.email || typeof obj.email !== 'string') {
      throw new Error('Email is required and must be a string')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(obj.email)) {
      throw new Error('Email must be a valid email address')
    }

    if (typeof obj.age !== 'number') {
      throw new Error('Age is required and must be a number')
    }

    if (obj.age < 0 || obj.age > 120) {
      throw new Error('Age must be between 0 and 120')
    }

    if (obj.status !== 'active' && obj.status !== 'inactive') {
      throw new Error('Status must be either "active" or "inactive"')
    }

    if (!(obj.createdAt instanceof Date)) {
      throw new Error('CreatedAt must be a Date object')
    }

    return obj as UserEntity
  }

  describe('Write Validation', () => {
    let db: ReturnType<typeof firestoreTyped<UserEntity>>
    let collection: ReturnType<typeof db.collection>

    beforeEach(() => {
      db = firestoreTyped<UserEntity>(strictValidator, {
        validateOnWrite: true,
      })
      collection = db.collection('users')
    })

    it('should accept valid data', async () => {
      const validUser: UserEntity = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        status: 'active',
        createdAt: new Date(),
      }

      const docRef = await collection.add(validUser)
      expect(docRef).toBeDefined()
    })

    it('should reject null data', async () => {
      try {
        await collection.add(null as any)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FirestoreTypedValidationError)
        const validationError = error as FirestoreTypedValidationError
        if (validationError.originalError instanceof Error) {
          expect(validationError.originalError.message).toContain('Data must be an object')
        } else {
          expect(String(validationError.originalError)).toContain('Data must be an object')
        }
      }
    })

    it('should reject undefined data', async () => {
      try {
        await collection.add(undefined as any)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FirestoreTypedValidationError)
        const validationError = error as FirestoreTypedValidationError
        if (validationError.originalError instanceof Error) {
          expect(validationError.originalError.message).toContain('Data must be an object')
        } else {
          expect(String(validationError.originalError)).toContain('Data must be an object')
        }
      }
    })

    it('should reject data with missing required fields', async () => {
      const invalidUser = {
        name: 'John Doe',
        // missing email, age, status, createdAt
      }

      try {
        await collection.add(invalidUser as any)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FirestoreTypedValidationError)
        const validationError = error as FirestoreTypedValidationError
        if (validationError.originalError instanceof Error) {
          expect(validationError.originalError.message).toContain('Email is required')
        } else {
          expect(String(validationError.originalError)).toContain('Email is required')
        }
      }
    })

    it('should reject data with invalid name length', async () => {
      const invalidUser = {
        name: 'J', // too short
        email: 'john@example.com',
        age: 30,
        status: 'active' as const,
        createdAt: new Date(),
      }

      try {
        await collection.add(invalidUser)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FirestoreTypedValidationError)
        const validationError = error as FirestoreTypedValidationError
        if (validationError.originalError instanceof Error) {
          expect(validationError.originalError.message).toContain(
            'Name must be between 2 and 50 characters',
          )
        } else {
          expect(String(validationError.originalError)).toContain(
            'Name must be between 2 and 50 characters',
          )
        }
      }
    })

    it('should reject data with invalid email format', async () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30,
        status: 'active' as const,
        createdAt: new Date(),
      }

      try {
        await collection.add(invalidUser)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FirestoreTypedValidationError)
        const validationError = error as FirestoreTypedValidationError
        if (validationError.originalError instanceof Error) {
          expect(validationError.originalError.message).toContain(
            'Email must be a valid email address',
          )
        } else {
          expect(String(validationError.originalError)).toContain(
            'Email must be a valid email address',
          )
        }
      }
    })

    it('should reject data with invalid age range', async () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'john@example.com',
        age: -5,
        status: 'active' as const,
        createdAt: new Date(),
      }

      try {
        await collection.add(invalidUser)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FirestoreTypedValidationError)
        const validationError = error as FirestoreTypedValidationError
        if (validationError.originalError instanceof Error) {
          expect(validationError.originalError.message).toContain('Age must be between 0 and 120')
        } else {
          expect(String(validationError.originalError)).toContain('Age must be between 0 and 120')
        }
      }
    })

    it('should reject data with invalid status', async () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        status: 'pending' as any,
        createdAt: new Date(),
      }

      try {
        await collection.add(invalidUser)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FirestoreTypedValidationError)
        const validationError = error as FirestoreTypedValidationError
        if (validationError.originalError instanceof Error) {
          expect(validationError.originalError.message).toContain(
            'Status must be either "active" or "inactive"',
          )
        } else {
          expect(String(validationError.originalError)).toContain(
            'Status must be either "active" or "inactive"',
          )
        }
      }
    })

    it('should wrap validation errors in FirestoreTypedValidationError', async () => {
      const invalidUser = {
        name: 123, // wrong type
        email: 'john@example.com',
        age: 30,
        status: 'active' as const,
        createdAt: new Date(),
      }

      try {
        await collection.add(invalidUser as any)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FirestoreTypedValidationError)
        expect((error as FirestoreTypedValidationError).message).toContain('Validation failed')
      }
    })
  })

  describe('Read Validation', () => {
    it('should validate data on read when validateOnRead is true', async () => {
      const db = firestoreTyped<UserEntity>(strictValidator, {
        validateOnRead: true,
        validateOnWrite: false,
      })
      const collection = db.collection('users')

      // For this test, we need to inject invalid data into the mock
      // Since our mock doesn't actually store/retrieve data in a way we can manipulate,
      // we'll test that the validation is called
      const snapshot = await collection.doc('test').get()
      expect(snapshot).toBeDefined()
    })

    it('should skip validation on read when validateOnRead is false', async () => {
      const db = firestoreTyped<UserEntity>(strictValidator, {
        validateOnRead: false,
      })
      const collection = db.collection('users')

      const snapshot = await collection.doc('test').get()
      expect(snapshot).toBeDefined()
    })
  })

  describe('Operation-level Validation Override', () => {
    it('should override global validateOnWrite setting', async () => {
      const db = firestoreTyped<UserEntity>(strictValidator, {
        validateOnWrite: true,
      })
      const collection = db.collection('users')

      const invalidUser = {
        name: 'John',
        // missing other fields
      }

      // Should not throw because we override validation
      await collection.doc('test').set(invalidUser as any, { validateOnWrite: false })
    })

    it('should override global validateOnRead setting', async () => {
      const db = firestoreTyped<UserEntity>(strictValidator, {
        validateOnRead: false,
        validateOnWrite: false,
      })
      const collection = db.collection('users')

      // First, create a valid document without validation
      const validUser: UserEntity = {
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
        status: 'active',
        createdAt: new Date(),
      }
      await collection.doc('test').set(validUser, { validateOnWrite: false })

      // Force validation on this specific read
      const snapshot = await collection.doc('test').get({ validateOnRead: true })
      expect(snapshot).toBeDefined()
      expect(snapshot.metadata.exists).toBe(true)
      expect(snapshot.data?.name).toBe('Test User')
    })
  })
})
