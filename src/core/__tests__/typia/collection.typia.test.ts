import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CollectionReference } from '../../collection'
import type { FirestoreTypedOptionsProvider } from '../../../types/firestore-typed.types'
import {
  createTestEntity,
  type TestEntity,
} from '../../../__tests__/__helpers__/test-entities.helper'
// Import generated typia validators
import { validateTestEntity } from '../../../__tests__/__helpers__/typia-validators/__generated__/test-entity-validators.helper'

// Mock Firebase modules
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
    delete: vi.fn(() => ({ _methodName: 'delete' })),
    increment: vi.fn((n: number) => ({ _methodName: 'increment', _operand: n })),
  },
}))

vi.mock('../../../utils/firestore-converter', () => ({
  serializeFirestoreTypes: vi.fn((data) => data),
  deserializeFirestoreTypes: vi.fn((data) => data),
}))

describe('CollectionReference with Typia validators', () => {
  let mockFirebaseCollection: any
  let mockFirestoreTyped: FirestoreTypedOptionsProvider
  let collection: CollectionReference<TestEntity>

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Firebase collection
    mockFirebaseCollection = {
      id: 'test-collection',
      path: 'test-collection',
      doc: vi.fn(),
      add: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      get: vi.fn(),
    }

    // Mock FirestoreTyped options
    mockFirestoreTyped = {
      getOptions: () => ({
        validateOnWrite: true,
        validateOnRead: true,
        transformTimestamps: true,
      }),
    }

    // Create collection with typia validator
    collection = new CollectionReference(
      mockFirebaseCollection,
      mockFirestoreTyped,
      validateTestEntity,
    )
  })

  describe('add() with typia validation', () => {
    it('should successfully add valid data', async () => {
      const validData = createTestEntity()
      const mockDocRef = { id: 'new-doc-id' }

      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      const result = await collection.add(validData)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(validData)
      expect(result.id).toBe('new-doc-id')
    })

    it('should throw error when adding invalid data', async () => {
      const invalidData = {
        id: 123, // Should be string
        name: 'Test',
        email: 'test@example.com',
      }

      // Typia validator should throw an error
      await expect(collection.add(invalidData as any)).rejects.toThrow()
      expect(mockFirebaseCollection.add).not.toHaveBeenCalled()
    })

    it('should validate optional fields correctly', async () => {
      const dataWithOptionalFields = {
        id: 'test-id',
        name: 'Test User',
        // email is optional
        age: 25,
        status: 'active' as const,
        createdAt: new Date(),
      }

      const mockDocRef = { id: 'new-doc-id' }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      const result = await collection.add(dataWithOptionalFields)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(dataWithOptionalFields)
      expect(result.id).toBe('new-doc-id')
    })

    it('should reject invalid enum values', async () => {
      const dataWithInvalidEnum = {
        id: 'test-id',
        name: 'Test User',
        status: 'invalid-status', // Should be 'active' | 'inactive'
      }

      await expect(collection.add(dataWithInvalidEnum as any)).rejects.toThrow()
    })

    it('should reject invalid date fields', async () => {
      const dataWithInvalidDate = {
        id: 'test-id',
        name: 'Test User',
        createdAt: 'not-a-date', // Should be Date
      }

      await expect(collection.add(dataWithInvalidDate as any)).rejects.toThrow()
    })
  })

  describe('doc() with typia validation', () => {
    it('should create document reference with same validator', () => {
      const mockDocRef = {
        id: 'doc-id',
        path: 'test-collection/doc-id',
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      }

      mockFirebaseCollection.doc.mockReturnValue(mockDocRef)

      const docRef = collection.doc('doc-id')

      expect(mockFirebaseCollection.doc).toHaveBeenCalledWith('doc-id')
      expect(docRef).toBeDefined()
      expect(docRef.id).toBe('doc-id')
    })
  })

  describe('validation with different data structures', () => {
    it('should validate nested objects if part of the schema', async () => {
      const dataWithAllFields: TestEntity = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        age: 30,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        value: 100,
        active: true,
      }

      const mockDocRef = { id: 'new-doc-id' }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      const result = await collection.add(dataWithAllFields)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(dataWithAllFields)
      expect(result.id).toBe('new-doc-id')
    })

    it('should handle validation when validateOnWrite is disabled', async () => {
      // Disable validation
      mockFirestoreTyped.getOptions = () => ({
        validateOnWrite: false,
        validateOnRead: true,
        transformTimestamps: true,
      })

      const invalidData = {
        id: 123, // Invalid type
        name: 'Test',
      }

      const mockDocRef = { id: 'new-doc-id' }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      // Should not throw even with invalid data
      const result = await collection.add(invalidData as any)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(invalidData)
      expect(result.id).toBe('new-doc-id')
    })
  })
})
