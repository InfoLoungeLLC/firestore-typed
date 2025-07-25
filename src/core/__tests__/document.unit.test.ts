import { DocumentReference } from '../document'
import { serializeFirestoreTypes, deserializeFirestoreTypes } from '../../utils/firestore-converter'
import { validateData } from '../../utils/validator'
import { DocumentNotFoundError, DocumentAlreadyExistsError } from '../../errors/errors'
import type { FirestoreTypedOptionsProvider } from '../../types/firestore-typed.types'
import { TestEntity, createTestEntity } from './__helpers__/test-entities.helper'

// Mock dependencies
jest.mock('../../utils/firestore-converter')
jest.mock('../../utils/validator')

jest.mock('firebase-admin/firestore', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockHelper = require('./__helpers__/firebase-mock.helper')
  return mockHelper.createFirebaseAdminMock()
})

const mockSerializeFirestoreTypes = serializeFirestoreTypes as jest.MockedFunction<
  typeof serializeFirestoreTypes
>
const mockDeserializeFirestoreTypes = deserializeFirestoreTypes as jest.MockedFunction<
  typeof deserializeFirestoreTypes
>
const mockValidateData = validateData as jest.MockedFunction<typeof validateData>

describe('DocumentReference', () => {
  let mockFirebaseDoc: any
  let mockFirestoreTyped: FirestoreTypedOptionsProvider
  let mockValidator: jest.Mock
  let docRef: DocumentReference<TestEntity>

  const testData = createTestEntity()

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    mockSerializeFirestoreTypes.mockImplementation((data) => data)
    mockDeserializeFirestoreTypes.mockImplementation((data) => data)
    mockValidateData.mockImplementation((data) => data as any)

    // Create mock Firebase DocumentReference
    mockFirebaseDoc = {
      id: 'test-id',
      path: 'users/test-id',
      firestore: {},
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    }

    // Create mock FirestoreTyped options provider
    mockFirestoreTyped = {
      getOptions: jest.fn().mockReturnValue({
        validateOnRead: false,
        validateOnWrite: true,
      }),
    }

    // Create mock validator
    mockValidator = jest.fn((data) => data as TestEntity)

    // Create DocumentReference instance
    docRef = new DocumentReference<TestEntity>(
      mockFirebaseDoc,
      mockFirestoreTyped,
      mockValidator
    )
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
        mockFirestoreTyped.getOptions = jest.fn().mockReturnValue({
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
        mockFirestoreTyped.getOptions = jest.fn().mockReturnValue({
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
          DocumentAlreadyExistsError
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
        mockValidator
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

      expect(mockDeserializeFirestoreTypes).toHaveBeenCalledWith({ ...testData, ...partialData }, {})
      expect(mockFirebaseDoc.set).toHaveBeenCalledWith(convertedData)
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