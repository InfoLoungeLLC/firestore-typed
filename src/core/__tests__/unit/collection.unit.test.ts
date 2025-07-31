import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import { CollectionReference } from '../../collection'
import { DocumentReference } from '../../document'
import { Query } from '../../query'
import { deserializeFirestoreTypes, serializeFirestoreTypes } from '../../../utils/firestore-converter'
import { validateData } from '../../../utils/validator'
import type { FirestoreTypedOptionsProvider } from '../../../types/firestore-typed.types'
import {
  type TestEntity,
  createTestEntity,
  createTestEntityValidator,
} from '../__helpers__/test-entities.helper'

// Mock dependencies
vi.mock('../../../utils/firestore-converter')
vi.mock('../../../utils/validator')

vi.mock('firebase-admin/firestore', async () => {
  const mockHelper = await import('../__helpers__/firebase-mock.helper')
  return mockHelper.createFirebaseAdminMock()
})

const mockDeserializeFirestoreTypes = deserializeFirestoreTypes
const mockSerializeFirestoreTypes = serializeFirestoreTypes
const mockValidateData = validateData

describe('CollectionReference', () => {
  let mockFirebaseCollection: any
  let mockFirestoreTyped: FirestoreTypedOptionsProvider
  let mockValidator: Mock
  let collection: CollectionReference<TestEntity>

  const testData = createTestEntity({ status: 'active' })

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    mockDeserializeFirestoreTypes.mockImplementation((data) => data)
    mockSerializeFirestoreTypes.mockImplementation((data) => data)
    mockValidateData.mockImplementation((data) => data)

    // Create mock Firebase CollectionReference
    mockFirebaseCollection = {
      id: 'users',
      path: 'users',
      firestore: {},
      doc: vi.fn(),
      add: vi.fn(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAt: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      endAt: vi.fn().mockReturnThis(),
      endBefore: vi.fn().mockReturnThis(),
      get: vi.fn(),
    }

    // Create mock FirestoreTyped options provider
    mockFirestoreTyped = {
      getOptions: vi.fn().mockReturnValue({
        validateOnRead: false,
        validateOnWrite: true,
      }),
    }

    // Create mock validator
    mockValidator = createTestEntityValidator()

    // Create CollectionReference instance
    collection = new CollectionReference<TestEntity>(
      mockFirebaseCollection,
      mockFirestoreTyped,
      mockValidator,
    )
  })

  describe('Properties', () => {
    it('should expose collection id', () => {
      expect(collection.id).toBe('users')
    })

    it('should expose collection path', () => {
      expect(collection.path).toBe('users')
    })
  })

  describe('doc()', () => {
    it('should return a DocumentReference for the given ID', () => {
      const mockDoc = {
        id: 'doc-123',
        path: 'users/doc-123',
      }
      mockFirebaseCollection.doc.mockReturnValue(mockDoc)

      const docRef = collection.doc('doc-123')

      expect(mockFirebaseCollection.doc).toHaveBeenCalledWith('doc-123')
      expect(docRef).toBeInstanceOf(DocumentReference)
      expect(docRef.id).toBe('doc-123')
    })
  })

  describe('add()', () => {
    it('should add a document with auto-generated ID', async () => {
      const mockDocRef = {
        id: 'generated-id',
        path: 'users/generated-id',
      }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      const result = await collection.add(testData)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(testData)
      expect(result).toBeInstanceOf(DocumentReference)
      expect(result.id).toBe('generated-id')
    })

    it('should validate data before adding when validateOnWrite is true', async () => {
      const mockDocRef = {
        id: 'generated-id',
        path: 'users/generated-id',
      }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      await collection.add(testData)

      expect(mockValidateData).toHaveBeenCalledWith(testData, 'users', mockValidator)
    })

    it('should skip validation when validateOnWrite is false', async () => {
      const mockDocRef = {
        id: 'generated-id',
        path: 'users/generated-id',
      }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      await collection.add(testData, { validateOnWrite: false })

      expect(mockValidateData).not.toHaveBeenCalled()
    })

    it('should apply type conversion before adding', async () => {
      const convertedData = { ...testData, converted: true }
      mockDeserializeFirestoreTypes.mockReturnValue(convertedData)

      const mockDocRef = {
        id: 'generated-id',
        path: 'users/generated-id',
      }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      await collection.add(testData)

      expect(mockDeserializeFirestoreTypes).toHaveBeenCalledWith(testData, {})
      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(convertedData)
    })
  })

  describe('get()', () => {
    const mockQuerySnapshot = {
      docs: [
        {
          id: 'user1',
          ref: { path: 'users/user1' },
          data: () => ({
            id: 'user1',
            name: 'User One',
            email: 'user1@example.com',
            status: 'active',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          }),
        },
        {
          id: 'user2',
          ref: { path: 'users/user2' },
          data: () => ({
            id: 'user2',
            name: 'User Two',
            email: 'user2@example.com',
            status: 'inactive',
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
          }),
        },
      ],
    }

    beforeEach(() => {
      mockFirebaseCollection.get.mockResolvedValue(mockQuerySnapshot)
    })

    it('should retrieve all documents in the collection', async () => {
      const result = await collection.get()

      expect(mockFirebaseCollection.get).toHaveBeenCalled()
      expect(result.docs).toHaveLength(2)
      expect(result.empty).toBe(false)
      expect(result.size).toBe(2)
    })

    it('should return correct document structure', async () => {
      const result = await collection.get()

      expect(result.docs[0]).toMatchObject({
        metadata: {
          id: 'user1',
          path: 'users/user1',
          exists: true,
        },
        data: expect.objectContaining({
          id: 'user1',
          name: 'User One',
        }),
      })
    })

    it('should skip validation when validateOnRead is false', async () => {
      // Explicitly pass validateOnRead: false via options to ensure the false branch is taken
      const result = await collection.get({ validateOnRead: false })

      // Validation should not be called
      expect(mockValidateData).not.toHaveBeenCalled()

      // But serialization should still occur
      expect(mockSerializeFirestoreTypes).toHaveBeenCalledTimes(2)

      // And data should still be returned (this exercises line 86: (convertedData as T))
      expect(result.docs).toHaveLength(2)
      expect(result.docs[0]?.data).toBeDefined()
    })

    it('should validate when validateOnRead is true via options', async () => {
      // Explicitly pass validateOnRead: true via options to ensure the true branch is taken
      const result = await collection.get({ validateOnRead: true })

      // Validation should be called (this exercises line 85)
      expect(mockValidateData).toHaveBeenCalledTimes(2)

      // Serialization should also occur
      expect(mockSerializeFirestoreTypes).toHaveBeenCalledTimes(2)

      // And data should still be returned
      expect(result.docs).toHaveLength(2)
      expect(result.docs[0]?.data).toBeDefined()
    })

    it('should handle empty collection', async () => {
      mockFirebaseCollection.get.mockResolvedValue({ docs: [] })

      const result = await collection.get()

      expect(result.docs).toHaveLength(0)
      expect(result.empty).toBe(true)
      expect(result.size).toBe(0)
    })
  })

  describe('Query Methods', () => {
    describe('where()', () => {
      it('should return a Query instance', () => {
        const query = collection.where('status', '==', 'active')

        expect(query).toBeInstanceOf(Query)
        expect(mockFirebaseCollection.where).toHaveBeenCalledWith('status', '==', 'active')
      })

      it('should be chainable with other query methods', () => {
        const query = collection
          .where('status', '==', 'active')
          .where('name', '!=', '')
          .orderBy('createdAt', 'desc')
          .limit(10)

        expect(query).toBeInstanceOf(Query)
      })
    })

    describe('orderBy()', () => {
      it('should return a Query instance with default ascending order', () => {
        const query = collection.orderBy('name')

        expect(query).toBeInstanceOf(Query)
        expect(mockFirebaseCollection.orderBy).toHaveBeenCalledWith('name', 'asc')
      })

      it('should accept explicit direction', () => {
        const query = collection.orderBy('createdAt', 'desc')

        expect(query).toBeInstanceOf(Query)
        expect(mockFirebaseCollection.orderBy).toHaveBeenCalledWith('createdAt', 'desc')
      })
    })

    describe('limit()', () => {
      it('should return a Query instance', () => {
        const query = collection.limit(5)

        expect(query).toBeInstanceOf(Query)
        expect(mockFirebaseCollection.limit).toHaveBeenCalledWith(5)
      })
    })

    describe('startAt(), startAfter(), endAt(), endBefore()', () => {
      it('should support pagination methods', () => {
        const query = collection.orderBy('name').startAt('A').endAt('Z')

        expect(query).toBeInstanceOf(Query)
      })
    })
  })

  describe('native property', () => {
    it('should provide access to native Firebase CollectionReference', () => {
      expect(collection.native).toBe(mockFirebaseCollection)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle subcollections', () => {
      const subcollection = new CollectionReference<TestEntity>(
        {
          ...mockFirebaseCollection,
          id: 'posts',
          path: 'users/user1/posts',
        },
        mockFirestoreTyped,
        mockValidator,
      )

      expect(subcollection.path).toBe('users/user1/posts')
      expect(subcollection.id).toBe('posts')
    })

    it('should support complex query combinations', async () => {
      const mockQueryResult = {
        docs: [
          {
            id: 'user1',
            ref: { path: 'users/user1' },
            data: () => ({
              id: 'user1',
              name: 'User One',
              email: 'user1@example.com',
              status: 'active',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            }),
          },
        ],
      }

      mockFirebaseCollection.get.mockResolvedValue(mockQueryResult)

      const query = collection
        .where('status', '==', 'active')
        .where('email', '!=', '')
        .orderBy('email')
        .orderBy('createdAt', 'desc')
        .limit(10)

      const result = await query.get()

      expect(result.docs).toHaveLength(1)
    })
  })
})
