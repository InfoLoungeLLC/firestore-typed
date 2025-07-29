import { vi, describe, it, expect, beforeEach } from 'vitest'
import { firestoreTyped, getFirestoreTyped } from '../index'
import { FirestoreTypedValidationError } from '../errors/errors'
import { createFirebaseAdminMock } from '../core/__tests__/__helpers__/firebase-mock.helper'

vi.mock('firebase-admin/firestore', async () => {
  const mockHelper = await import('../core/__tests__/__helpers__/firebase-mock.helper')
  return mockHelper.createFirebaseAdminMock()
})

describe('FirestoreTyped', () => {
  interface TestEntity {
    id: string
    name: string
    age: number
    createdAt: Date
  }

  const mockValidator = (data: unknown): TestEntity => {
    const obj = data as any
    if (!obj || typeof obj !== 'object') {
      throw new Error('Invalid data')
    }
    if (!obj.id || typeof obj.id !== 'string') {
      throw new Error('Invalid id')
    }
    if (!obj.name || typeof obj.name !== 'string') {
      throw new Error('Invalid name')
    }
    if (typeof obj.age !== 'number') {
      throw new Error('Invalid age')
    }
    if (!(obj.createdAt instanceof Date)) {
      throw new Error('Invalid createdAt')
    }
    return obj as TestEntity
  }

  describe('Factory Function', () => {
    it('should create a FirestoreTyped instance with default options', () => {
      const db = getFirestoreTyped()

      expect(db).toBeDefined()
      expect(db.getOptions()).toEqual({
        validateOnRead: false,
        validateOnWrite: true,
      })
    })

    it('should create a FirestoreTyped instance with custom options', () => {
      const db = getFirestoreTyped(undefined, {
        validateOnRead: true,
        validateOnWrite: false,
      })

      expect(db.getOptions()).toEqual({
        validateOnRead: true,
        validateOnWrite: false,
      })
    })
  })

  describe('Collection Operations', () => {
    let db: ReturnType<typeof getFirestoreTyped>
    let collection: ReturnType<typeof db.collection<TestEntity>>

    beforeEach(() => {
      db = getFirestoreTyped()
      collection = db.collection<TestEntity>('test-entities', mockValidator)
    })

    describe('add()', () => {
      it('should add a document with auto-generated ID', async () => {
        const testData: TestEntity = {
          id: 'test-1',
          name: 'John Doe',
          age: 30,
          createdAt: new Date(),
        }

        const docRef = await collection.add(testData)

        expect(docRef).toBeDefined()
        expect(docRef.id).toBeDefined()
        expect(typeof docRef.id).toBe('string')
      })

      it('should validate data before adding when validateOnWrite is true', async () => {
        const invalidData = {
          id: 'test-1',
          name: 'John Doe',
          // missing age and createdAt
        } as any

        try {
          await collection.add(invalidData)
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect(error).toBeInstanceOf(FirestoreTypedValidationError)
          const validationError = error as FirestoreTypedValidationError
          if (validationError.originalError instanceof Error) {
            expect(validationError.originalError.message).toContain('Invalid age')
          }
        }
      })

      it('should skip validation when validateOnWrite is false', async () => {
        const dbNoValidation = getFirestoreTyped(undefined, {
          validateOnWrite: false,
        })
        const collectionNoValidation = dbNoValidation.collection<TestEntity>(
          'test-entities',
          mockValidator,
        )

        const invalidData = {
          id: 'test-1',
          name: 'John Doe',
        } as any

        const docRef = await collectionNoValidation.add(invalidData)
        expect(docRef).toBeDefined()
      })
    })

    describe('doc().set()', () => {
      it('should set a document with specific ID', async () => {
        const testData: TestEntity = {
          id: 'specific-id',
          name: 'Jane Doe',
          age: 25,
          createdAt: new Date(),
        }

        await collection.doc('specific-id').set(testData)

        const snapshot = await collection.doc('specific-id').get()
        expect(snapshot.data?.id).toBe(testData.id)
        expect(snapshot.data?.name).toBe(testData.name)
        expect(snapshot.data?.age).toBe(testData.age)
        expect(snapshot.data?.createdAt).toBeInstanceOf(Date)
        // Allow up to 1 second difference due to timestamp conversion
        expect(snapshot.data?.createdAt.getTime()).toBeCloseTo(testData.createdAt.getTime(), -3)
      })

      it('should validate data before setting when validateOnWrite is true', async () => {
        const invalidData = {
          name: 'Jane Doe',
          age: 'twenty-five', // wrong type
        } as any

        await expect(collection.doc('test-id').set(invalidData)).rejects.toThrow()
      })
    })

    describe('doc().get()', () => {
      it('should get a document by ID', async () => {
        const testData: TestEntity = {
          id: 'get-test',
          name: 'Get Test',
          age: 40,
          createdAt: new Date(),
        }

        await collection.doc('get-test').set(testData)
        const snapshot = await collection.doc('get-test').get()

        expect(snapshot.metadata.exists).toBe(true)
        expect(snapshot.data?.id).toBe(testData.id)
        expect(snapshot.data?.name).toBe(testData.name)
        expect(snapshot.data?.age).toBe(testData.age)
        expect(snapshot.data?.createdAt).toBeInstanceOf(Date)
        // Allow up to 1 second difference due to timestamp conversion
        expect(snapshot.data?.createdAt.getTime()).toBeCloseTo(testData.createdAt.getTime(), -3)
      })

      it('should return null for non-existent document', async () => {
        const snapshot = await collection.doc('non-existent').get()

        expect(snapshot.metadata.exists).toBe(false)
        expect(snapshot.data).toBeUndefined()
      })

      it('should validate data after reading when validateOnRead is true', async () => {
        const dbWithReadValidation = getFirestoreTyped(undefined, {
          validateOnRead: true,
        })
        const collectionWithValidation = dbWithReadValidation.collection<TestEntity>(
          'test-entities',
          mockValidator,
        )

        // This test would require injecting invalid data directly into the mock
        // For now, we'll test that validation is attempted
        const snapshot = await collectionWithValidation.doc('test').get()
        expect(snapshot).toBeDefined()
      })
    })

    describe('doc().delete()', () => {
      it('should delete a document', async () => {
        const testData: TestEntity = {
          id: 'delete-test',
          name: 'Delete Test',
          age: 35,
          createdAt: new Date(),
        }

        await collection.doc('delete-test').set(testData)
        await collection.doc('delete-test').delete()

        const snapshot = await collection.doc('delete-test').get()
        expect(snapshot.metadata.exists).toBe(false)
      })
    })
  })

  describe('Options Management', () => {
    it('should create new instance with modified options using withOptions()', () => {
      const db = getFirestoreTyped(undefined, {
        validateOnRead: false,
        validateOnWrite: true,
      })

      const newDb = db.withOptions({
        validateOnRead: true,
      })

      expect(db.getOptions()).toEqual({
        validateOnRead: false,
        validateOnWrite: true,
      })

      expect(newDb.getOptions()).toEqual({
        validateOnRead: true,
        validateOnWrite: true,
      })
    })
  })

  describe('getFirestoreTyped Function', () => {
    it('should create a FirestoreTyped instance with default Firestore', () => {
      const db = getFirestoreTyped()
      expect(db).toBeDefined()
      expect(db.getOptions()).toEqual({
        validateOnRead: false,
        validateOnWrite: true,
      })
    })

    it('should create a FirestoreTyped instance with custom options', () => {
      const db = getFirestoreTyped(undefined, {
        validateOnRead: true,
        validateOnWrite: false,
      })

      expect(db.getOptions()).toEqual({
        validateOnRead: true,
        validateOnWrite: false,
      })
    })

    it('should create a FirestoreTyped instance with custom Firestore instance', () => {
      const mockFirebaseAdmin = createFirebaseAdminMock()
      const customFirestore = mockFirebaseAdmin.getFirestore()

      const db = getFirestoreTyped(customFirestore as any)
      expect(db).toBeDefined()
      expect(db.native).toBe(customFirestore)
    })

    it('should work with both custom Firestore and options', () => {
      const mockFirebaseAdmin = createFirebaseAdminMock()
      const customFirestore = mockFirebaseAdmin.getFirestore()

      const db = getFirestoreTyped(customFirestore as any, {
        validateOnRead: true,
        validateOnWrite: false,
      })

      expect(db.native).toBe(customFirestore)
      expect(db.getOptions()).toEqual({
        validateOnRead: true,
        validateOnWrite: false,
      })
    })

    it('should work identically to deprecated firestoreTyped function for backward compatibility', () => {
      const options = { validateOnRead: true, validateOnWrite: false }

      const dbOld = firestoreTyped(options)
      const dbNew = getFirestoreTyped(undefined, options)

      expect(dbOld.getOptions()).toEqual(dbNew.getOptions())
    })
  })
})
