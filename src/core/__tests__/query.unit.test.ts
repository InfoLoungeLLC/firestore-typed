import { Query } from '../query'
import { serializeFirestoreTypes } from '../../utils/firestore-converter'
import { validateData } from '../../utils/validator'
import type { FirestoreTypedOptionsProvider } from '../../types/firestore-typed.types'
import type { TestEntity } from './__helpers__/test-entities.helper'

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
const mockValidateData = validateData as jest.MockedFunction<typeof validateData>

describe('Query', () => {
  let mockFirebaseQuery: any
  let mockFirestoreTyped: FirestoreTypedOptionsProvider
  let mockValidator: jest.Mock
  let query: Query<TestEntity>

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    mockSerializeFirestoreTypes.mockImplementation((data) => data)
    mockValidateData.mockImplementation((data) => data as any)

    // Create mock Firebase Query
    mockFirebaseQuery = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      startAt: jest.fn().mockReturnThis(),
      startAfter: jest.fn().mockReturnThis(),
      endAt: jest.fn().mockReturnThis(),
      endBefore: jest.fn().mockReturnThis(),
      get: jest.fn(),
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

    // Create Query instance
    query = new Query<TestEntity>(mockFirebaseQuery, mockFirestoreTyped, mockValidator)
  })

  describe('Query Building Methods', () => {
    describe('where()', () => {
      it('should add where clause and return new Query instance', () => {
        const result = query.where('name', '==', 'John')

        expect(mockFirebaseQuery.where).toHaveBeenCalledWith('name', '==', 'John')
        expect(result).toBeInstanceOf(Query)
        expect(result).not.toBe(query) // Should return new instance
      })

      it('should accept different operators', () => {
        query.where('age', '>', 18)
        expect(mockFirebaseQuery.where).toHaveBeenCalledWith('age', '>', 18)

        // For 'in' operator, cast to any to handle union type limitations
        query.where('status', 'in', ['active', 'inactive'] as any)
        expect(mockFirebaseQuery.where).toHaveBeenCalledWith('status', 'in', ['active', 'inactive'])
      })

      it('should be chainable', () => {
        const result = query
          .where('name', '==', 'John')
          .where('age', '>', 18)
          .where('status', '==', 'active')

        expect(mockFirebaseQuery.where).toHaveBeenCalledTimes(3)
        expect(result).toBeInstanceOf(Query)
      })
    })

    describe('orderBy()', () => {
      it('should add ordering with default ascending direction', () => {
        const result = query.orderBy('name')

        expect(mockFirebaseQuery.orderBy).toHaveBeenCalledWith('name', 'asc')
        expect(result).toBeInstanceOf(Query)
      })

      it('should accept explicit direction', () => {
        query.orderBy('age', 'desc')
        expect(mockFirebaseQuery.orderBy).toHaveBeenCalledWith('age', 'desc')

        query.orderBy('createdAt', 'asc')
        expect(mockFirebaseQuery.orderBy).toHaveBeenCalledWith('createdAt', 'asc')
      })

      it('should be chainable', () => {
        const result = query.orderBy('name').orderBy('age', 'desc')

        expect(mockFirebaseQuery.orderBy).toHaveBeenCalledTimes(2)
        expect(result).toBeInstanceOf(Query)
      })
    })

    describe('limit()', () => {
      it('should limit query results', () => {
        const result = query.limit(10)

        expect(mockFirebaseQuery.limit).toHaveBeenCalledWith(10)
        expect(result).toBeInstanceOf(Query)
      })

      it('should be chainable', () => {
        const result = query.where('status', '==', 'active').limit(5)

        expect(mockFirebaseQuery.limit).toHaveBeenCalledWith(5)
        expect(result).toBeInstanceOf(Query)
      })
    })

    describe('Pagination Methods', () => {
      it('should handle startAt', () => {
        const result = query.startAt('John', 25)

        expect(mockFirebaseQuery.startAt).toHaveBeenCalledWith('John', 25)
        expect(result).toBeInstanceOf(Query)
      })

      it('should handle startAfter', () => {
        const result = query.startAfter('John', 25)

        expect(mockFirebaseQuery.startAfter).toHaveBeenCalledWith('John', 25)
        expect(result).toBeInstanceOf(Query)
      })

      it('should handle endAt', () => {
        const result = query.endAt('Zoe', 50)

        expect(mockFirebaseQuery.endAt).toHaveBeenCalledWith('Zoe', 50)
        expect(result).toBeInstanceOf(Query)
      })

      it('should handle endBefore', () => {
        const result = query.endBefore('Zoe', 50)

        expect(mockFirebaseQuery.endBefore).toHaveBeenCalledWith('Zoe', 50)
        expect(result).toBeInstanceOf(Query)
      })

      it('should handle complex pagination', () => {
        const result = query.orderBy('name').orderBy('age').startAt('Alice', 20).endAt('Bob', 30)

        expect(mockFirebaseQuery.orderBy).toHaveBeenCalledTimes(2)
        expect(mockFirebaseQuery.startAt).toHaveBeenCalledWith('Alice', 20)
        expect(mockFirebaseQuery.endAt).toHaveBeenCalledWith('Bob', 30)
        expect(result).toBeInstanceOf(Query)
      })
    })
  })

  describe('Query Execution', () => {
    const mockQuerySnapshot = {
      docs: [
        {
          id: 'user1',
          ref: { path: 'users/user1' },
          data: () => ({
            id: 'user1',
            name: 'John',
            age: 25,
            status: 'active',
            createdAt: new Date('2024-01-01'),
          }),
        },
        {
          id: 'user2',
          ref: { path: 'users/user2' },
          data: () => ({
            id: 'user2',
            name: 'Jane',
            age: 30,
            status: 'inactive',
            createdAt: new Date('2024-01-02'),
          }),
        },
      ],
    }

    beforeEach(() => {
      mockFirebaseQuery.get.mockResolvedValue(mockQuerySnapshot)
    })

    describe('get()', () => {
      it('should execute query and return results', async () => {
        const result = await query.get()

        expect(mockFirebaseQuery.get).toHaveBeenCalled()
        expect(result.docs).toHaveLength(2)
        expect(result.empty).toBe(false)
        expect(result.size).toBe(2)
      })

      it('should return correct document structure', async () => {
        const result = await query.get()

        expect(result.docs[0]).toMatchObject({
          metadata: {
            id: 'user1',
            path: 'users/user1',
            exists: true,
          },
          data: expect.objectContaining({
            id: 'user1',
            name: 'John',
            age: 25,
            status: 'active',
          }),
        })
      })

      it('should handle empty results', async () => {
        mockFirebaseQuery.get.mockResolvedValue({ docs: [] })

        const result = await query.get()

        expect(result.docs).toHaveLength(0)
        expect(result.empty).toBe(true)
        expect(result.size).toBe(0)
      })

      it('should apply type conversion', async () => {
        const mockConvertedData = { converted: true }
        mockSerializeFirestoreTypes.mockReturnValue(mockConvertedData)

        await query.get()

        expect(mockSerializeFirestoreTypes).toHaveBeenCalledTimes(2)
        expect(mockSerializeFirestoreTypes).toHaveBeenCalledWith(mockQuerySnapshot.docs[0]?.data())
      })

      describe('Validation', () => {
        it('should skip validation when validateOnRead is false', async () => {
          mockFirestoreTyped.getOptions = jest.fn().mockReturnValue({
            validateOnRead: false,
            validateOnWrite: true,
          })

          await query.get()

          expect(mockValidateData).not.toHaveBeenCalled()
        })

        it('should validate when validateOnRead is true globally', async () => {
          mockFirestoreTyped.getOptions = jest.fn().mockReturnValue({
            validateOnRead: true,
            validateOnWrite: true,
          })

          await query.get()

          expect(mockValidateData).toHaveBeenCalledTimes(2)
          expect(mockValidateData).toHaveBeenCalledWith(
            expect.any(Object),
            'users/user1',
            mockValidator,
          )
        })

        it('should override global validateOnRead with options', async () => {
          mockFirestoreTyped.getOptions = jest.fn().mockReturnValue({
            validateOnRead: false,
            validateOnWrite: true,
          })

          await query.get({ validateOnRead: true })

          expect(mockValidateData).toHaveBeenCalledTimes(2)
        })
      })
    })
  })

  describe('Complex Query Scenarios', () => {
    it('should build complex queries with multiple conditions', () => {
      query
        .where('status', '==', 'active')
        .where('age', '>=', 18)
        .where('age', '<=', 65)
        .orderBy('age', 'desc')
        .orderBy('name', 'asc')
        .limit(20)

      expect(mockFirebaseQuery.where).toHaveBeenCalledTimes(3)
      expect(mockFirebaseQuery.orderBy).toHaveBeenCalledTimes(2)
      expect(mockFirebaseQuery.limit).toHaveBeenCalledWith(20)
    })

    it('should handle array contains queries', () => {
      // Simulating a tags array field
      interface TaggedEntity extends TestEntity {
        tags: string[]
      }

      const taggedQuery = new Query<TaggedEntity>(
        mockFirebaseQuery,
        mockFirestoreTyped,
        mockValidator,
      )

      taggedQuery.where('tags', 'array-contains', 'important' as any)

      expect(mockFirebaseQuery.where).toHaveBeenCalledWith('tags', 'array-contains', 'important')
    })
  })

  describe('Native Query Access', () => {
    it('should provide access to native Firebase query', () => {
      const nativeQuery = query.native

      expect(nativeQuery).toBe(mockFirebaseQuery)
    })
  })
})
