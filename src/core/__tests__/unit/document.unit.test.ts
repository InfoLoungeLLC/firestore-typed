import { vi, describe, it, expect, beforeEach, type Mock, type MockedFunction } from 'vitest'
import { DocumentReference } from '../../document'
import {
  serializeFirestoreTypes,
  deserializeFirestoreTypes,
} from '../../../utils/firestore-converter'
import { validateData } from '../../../utils/validator'
import { DocumentNotFoundError, DocumentAlreadyExistsError } from '../../../errors/errors'
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

const mockSerializeFirestoreTypes = serializeFirestoreTypes as MockedFunction<
  typeof serializeFirestoreTypes
>
const mockDeserializeFirestoreTypes = deserializeFirestoreTypes as MockedFunction<
  typeof deserializeFirestoreTypes
>
const mockValidateData = validateData as MockedFunction<typeof validateData>

describe('DocumentReference', () => {
  let mockFirebaseDoc: any
  let mockFirestoreTyped: FirestoreTypedOptionsProvider
  let mockValidator: Mock
  let docRef: DocumentReference<TestEntity>

  const testData = createTestEntity()

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    mockSerializeFirestoreTypes.mockImplementation((data: any) => data)
    mockDeserializeFirestoreTypes.mockImplementation((data: any) => data)
    mockValidateData.mockImplementation((_data: any, _path: any, validator: any) =>
      validator(_data),
    )

    // Create mock Firebase DocumentReference
    mockFirebaseDoc = {
      id: 'test-id',
      path: 'users/test-id',
      firestore: {},
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
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

    // Create DocumentReference instance
    docRef = new DocumentReference<TestEntity>(mockFirebaseDoc, mockFirestoreTyped, mockValidator)
  })

  describe('Properties', () => {
    it('should expose document id', () => {
      expect(docRef.id).toBe('test-id')
    })

    it('should expose document path', () => {
      expect(docRef.path).toBe('users/test-id')
    })
  })

  describe('get()', () => {
    it('should retrieve document when it exists', async () => {
      mockFirebaseDoc.get.mockResolvedValue({
        exists: true,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => testData,
      })

      const snapshot = await docRef.get()

      expect(mockFirebaseDoc.get).toHaveBeenCalled()
      expect(snapshot.metadata.exists).toBe(true)
      expect(snapshot.metadata.id).toBe('test-id')
      expect(snapshot.data).toEqual(testData)
    })

    it('should return null data when document does not exist', async () => {
      mockFirebaseDoc.get.mockResolvedValue({
        exists: false,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => undefined,
      })

      const snapshot = await docRef.get()

      expect(snapshot.metadata.exists).toBe(false)
      expect(snapshot.data).toBeUndefined()
    })

    it('should apply type conversion when document exists', async () => {
      const rawData = { ...testData, timestamp: { toDate: () => new Date() } }
      const convertedData = { ...testData }

      mockFirebaseDoc.get.mockResolvedValue({
        exists: true,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => rawData,
      })
      mockSerializeFirestoreTypes.mockReturnValue(convertedData)

      await docRef.get()

      expect(mockSerializeFirestoreTypes).toHaveBeenCalledWith(rawData)
    })

    describe('Validation on Read', () => {
      it('should skip validation when validateOnRead is false', async () => {
        mockFirebaseDoc.get.mockResolvedValue({
          exists: true,
          id: 'test-id',
          ref: mockFirebaseDoc,
          data: () => testData,
        })

        await docRef.get()

        expect(mockValidateData).not.toHaveBeenCalled()
      })

      it('should validate when validateOnRead is true globally', async () => {
        mockFirestoreTyped.getOptions = vi.fn().mockReturnValue({
          validateOnRead: true,
          validateOnWrite: true,
        })

        mockFirebaseDoc.get.mockResolvedValue({
          exists: true,
          id: 'test-id',
          ref: mockFirebaseDoc,
          data: () => testData,
        })

        await docRef.get()

        expect(mockValidateData).toHaveBeenCalledWith(testData, 'users/test-id', mockValidator)
      })

      it('should override global validateOnRead with options', async () => {
        mockFirebaseDoc.get.mockResolvedValue({
          exists: true,
          id: 'test-id',
          ref: mockFirebaseDoc,
          data: () => testData,
        })

        await docRef.get({ validateOnRead: true })

        expect(mockValidateData).toHaveBeenCalledWith(testData, 'users/test-id', mockValidator)
      })
    })
  })

  describe('set()', () => {
    it('should set document data', async () => {
      await docRef.set(testData)

      expect(mockFirebaseDoc.set).toHaveBeenCalledWith(testData)
    })

    it('should apply type conversion before setting', async () => {
      const convertedData = { ...testData, converted: true }
      mockDeserializeFirestoreTypes.mockReturnValue(convertedData)

      await docRef.set(testData)

      expect(mockDeserializeFirestoreTypes).toHaveBeenCalledWith(testData, {})
      expect(mockFirebaseDoc.set).toHaveBeenCalledWith(convertedData)
    })

    describe('Validation on Write', () => {
      it('should validate when validateOnWrite is true', async () => {
        await docRef.set(testData)

        expect(mockValidateData).toHaveBeenCalledWith(testData, 'users/test-id', mockValidator)
      })

      it('should skip validation when validateOnWrite is false globally', async () => {
        mockFirestoreTyped.getOptions = vi.fn().mockReturnValue({
          validateOnRead: false,
          validateOnWrite: false,
        })

        await docRef.set(testData)

        expect(mockValidateData).not.toHaveBeenCalled()
      })

      it('should override global validateOnWrite with options', async () => {
        await docRef.set(testData, { validateOnWrite: false })

        expect(mockValidateData).not.toHaveBeenCalled()
      })

      it('should validate when validateOnWrite is true via options', async () => {
        // First set global validateOnWrite to false
        mockFirestoreTyped.getOptions = vi.fn().mockReturnValue({
          validateOnRead: false,
          validateOnWrite: false,
        })

        // Then explicitly pass validateOnWrite: true via options to ensure the true branch is taken
        await docRef.set(testData, { validateOnWrite: true })

        // Validation should be called
        expect(mockValidateData).toHaveBeenCalledWith(testData, 'users/test-id', mockValidator)

        // Serialization should also occur
        expect(mockDeserializeFirestoreTypes).toHaveBeenCalled()

        // And the set operation should be called
        expect(mockFirebaseDoc.set).toHaveBeenCalled()
      })
    })

    describe('failIfExists option', () => {
      it('should check existence when failIfExists is true', async () => {
        mockFirebaseDoc.get.mockResolvedValue({
          exists: false,
          id: 'test-id',
          ref: mockFirebaseDoc,
          data: () => undefined,
        })

        await docRef.set(testData, { failIfExists: true })

        expect(mockFirebaseDoc.get).toHaveBeenCalled()
        expect(mockFirebaseDoc.set).toHaveBeenCalledWith(testData)
      })

      it('should throw DocumentAlreadyExistsError when document exists', async () => {
        mockFirebaseDoc.get.mockResolvedValue({
          exists: true,
          id: 'test-id',
          ref: mockFirebaseDoc,
          data: () => testData,
        })

        await expect(docRef.set(testData, { failIfExists: true })).rejects.toThrow(
          DocumentAlreadyExistsError,
        )

        expect(mockFirebaseDoc.set).not.toHaveBeenCalled()
      })
    })
  })

  describe('merge()', () => {
    const partialData = { name: 'Updated Name', updatedAt: new Date() }

    it('should merge partial data with existing document', async () => {
      mockFirebaseDoc.get.mockResolvedValue({
        exists: true,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => testData,
      })

      await docRef.merge(partialData)

      const expectedMergedData = { ...testData, ...partialData }
      expect(mockFirebaseDoc.set).toHaveBeenCalledWith(expectedMergedData)
    })

    it('should throw DocumentNotFoundError when document does not exist', async () => {
      mockFirebaseDoc.get.mockResolvedValue({
        exists: false,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => undefined,
      })

      await expect(docRef.merge(partialData)).rejects.toThrow(DocumentNotFoundError)

      expect(mockFirebaseDoc.set).not.toHaveBeenCalled()
    })

    it('should validate merged data when validateOnWrite is true', async () => {
      mockFirebaseDoc.get.mockResolvedValue({
        exists: true,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => testData,
      })

      await docRef.merge(partialData)

      const expectedMergedData = { ...testData, ...partialData }
      expect(mockValidateData).toHaveBeenCalledWith(
        expectedMergedData,
        'users/test-id',
        mockValidator,
      )
    })

    it('should apply type conversion to merged data', async () => {
      mockFirebaseDoc.get.mockResolvedValue({
        exists: true,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => testData,
      })

      const convertedData = { converted: true }
      mockDeserializeFirestoreTypes.mockReturnValue(convertedData)

      await docRef.merge(partialData)

      expect(mockDeserializeFirestoreTypes).toHaveBeenCalledWith(
        { ...testData, ...partialData },
        {},
      )
      expect(mockFirebaseDoc.set).toHaveBeenCalledWith(convertedData)
    })

    it('should skip validation when validateOnWrite is false via options', async () => {
      mockFirebaseDoc.get.mockResolvedValue({
        exists: true,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => testData,
      })

      // Explicitly pass validateOnWrite: false via options to ensure the false branch is taken
      await docRef.merge(partialData, { validateOnWrite: false })

      // Validation should not be called (this exercises line 119: (mergedData as T))
      expect(mockValidateData).not.toHaveBeenCalled()

      // But deserialization should still occur
      expect(mockDeserializeFirestoreTypes).toHaveBeenCalled()

      // And the set operation should be called
      expect(mockFirebaseDoc.set).toHaveBeenCalled()
    })

    it('should validate when validateOnWrite is true via options', async () => {
      // First set global validateOnWrite to false
      mockFirestoreTyped.getOptions = vi.fn().mockReturnValue({
        validateOnRead: false,
        validateOnWrite: false,
      })

      mockFirebaseDoc.get.mockResolvedValue({
        exists: true,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => testData,
      })

      // Then explicitly pass validateOnWrite: true via options to ensure the true branch is taken
      await docRef.merge(partialData, { validateOnWrite: true })

      // Validation should be called (this exercises line 118)
      const expectedMergedData = { ...testData, ...partialData }
      expect(mockValidateData).toHaveBeenCalledWith(
        expectedMergedData,
        'users/test-id',
        mockValidator,
      )

      // Deserialization should also occur
      expect(mockDeserializeFirestoreTypes).toHaveBeenCalled()

      // And the set operation should be called
      expect(mockFirebaseDoc.set).toHaveBeenCalled()
    })

    it('should handle document with no existing data (null/undefined)', async () => {
      // Mock snapshot with null data to test the || {} fallback (line 111)
      mockFirebaseDoc.get.mockResolvedValue({
        exists: true,
        id: 'test-id',
        ref: mockFirebaseDoc,
        data: () => null, // This will trigger the || {} fallback
      })

      await docRef.merge(partialData)

      // Should still work and merge with empty object
      expect(mockFirebaseDoc.set).toHaveBeenCalled()

      // The merged data should be just the partial data since existing was null
      expect(mockDeserializeFirestoreTypes).toHaveBeenCalledWith(
        partialData, // Since existingData was null, mergedData is just partialData
        {},
      )
    })
  })

  describe('delete()', () => {
    it('should delete the document', async () => {
      await docRef.delete()

      expect(mockFirebaseDoc.delete).toHaveBeenCalled()
    })
  })

  describe('native property', () => {
    it('should provide access to native Firebase DocumentReference', () => {
      expect(docRef.native).toBe(mockFirebaseDoc)
    })
  })
})
