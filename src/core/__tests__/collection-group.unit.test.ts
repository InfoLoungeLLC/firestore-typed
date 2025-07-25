import { CollectionGroup } from '../collection-group'
import { Query } from '../query'
import { serializeFirestoreTypes } from '../../utils/firestore-converter'
import { validateData } from '../../utils/validator'
import type { FirestoreTypedOptionsProvider } from '../../types/firestore-typed.types'
import { TestPostEntity, createTestPostEntity } from './__helpers__/test-entities.helper'

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

describe('CollectionGroup', () => {
  let mockFirebaseQuery: any
  let mockFirestoreTyped: FirestoreTypedOptionsProvider
  let mockValidator: jest.Mock
  let collectionGroup: CollectionGroup<TestPostEntity>

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    mockSerializeFirestoreTypes.mockImplementation((data) => data)
    mockValidateData.mockImplementation((data) => data as any)

    // Create mock Firebase Query (for collection group)
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
    mockValidator = jest.fn((data) => data as TestPostEntity)

    // Create CollectionGroup instance
    collectionGroup = new CollectionGroup<TestPostEntity>(
      mockFirebaseQuery,
      mockFirestoreTyped,
      mockValidator
    )
  })

  // Note: CollectionGroup doesn't expose collectionId in the actual implementation

  describe('Query Methods', () => {
    describe('where()', () => {
      it('should add where clause and return Query instance', () => {
        const result = collectionGroup.where('authorId', '==', 'user-1')

        expect(mockFirebaseQuery.where).toHaveBeenCalledWith('authorId', '==', 'user-1')
        expect(result).toBeInstanceOf(Query)
      })

      it('should support chaining with multiple where clauses', () => {
        const query = collectionGroup
          .where('authorId', '==', 'user-1')
          .where('tags', 'array-contains', 'test' as any)

        expect(query).toBeInstanceOf(Query)
      })
    })

    describe('orderBy()', () => {
      it('should add ordering with default ascending direction', () => {
        const result = collectionGroup.orderBy('createdAt')

        expect(mockFirebaseQuery.orderBy).toHaveBeenCalledWith('createdAt', 'asc')
        expect(result).toBeInstanceOf(Query)
      })

      it('should accept explicit direction', () => {
        const result = collectionGroup.orderBy('updatedAt', 'desc')

        expect(mockFirebaseQuery.orderBy).toHaveBeenCalledWith('updatedAt', 'desc')
        expect(result).toBeInstanceOf(Query)
      })
    })

    describe('limit()', () => {
      it('should limit query results', () => {
        const result = collectionGroup.limit(20)

        expect(mockFirebaseQuery.limit).toHaveBeenCalledWith(20)
        expect(result).toBeInstanceOf(Query)
      })
    })
  })

  describe('get()', () => {
    const mockQuerySnapshot = {
      docs: [
        {
          id: 'post-1',
          ref: { path: 'users/user-1/posts/post-1' },
          data: () => ({
            id: 'post-1',
            title: 'User 1 Post',
            content: 'Content from user 1',
            authorId: 'user-1',
            tags: ['test'],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          }),
        },
        {
          id: 'post-2',
          ref: { path: 'users/user-2/posts/post-2' },
          data: () => ({
            id: 'post-2',
            title: 'User 2 Post',
            content: 'Content from user 2',
            authorId: 'user-2',
            tags: ['test'],
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
          }),
        },
        {
          id: 'post-3',
          ref: { path: 'groups/group-1/posts/post-3' },
          data: () => ({
            id: 'post-3',
            title: 'Group Post',
            content: 'Content from group',
            authorId: 'user-3',
            tags: ['group', 'test'],
            createdAt: new Date('2024-01-03'),
            updatedAt: new Date('2024-01-03'),
          }),
        },
      ],
    }

    beforeEach(() => {
      mockFirebaseQuery.get.mockResolvedValue(mockQuerySnapshot)
    })

    it('should execute query and return results from multiple collections', async () => {
      const result = await collectionGroup.get()

      expect(mockFirebaseQuery.get).toHaveBeenCalled()
      expect(result.docs).toHaveLength(3)
      expect(result.empty).toBe(false)
      expect(result.size).toBe(3)
    })

    it('should return documents from different parent paths', async () => {
      const result = await collectionGroup.get()

      const paths = result.docs.map((doc) => doc.metadata.path)
      expect(paths).toContain('users/user-1/posts/post-1')
      expect(paths).toContain('users/user-2/posts/post-2')
      expect(paths).toContain('groups/group-1/posts/post-3')
    })

    it('should handle empty results', async () => {
      mockFirebaseQuery.get.mockResolvedValue({ docs: [] })

      const result = await collectionGroup.get()

      expect(result.docs).toHaveLength(0)
      expect(result.empty).toBe(true)
      expect(result.size).toBe(0)
    })

    it('should apply type conversion', async () => {
      const mockConvertedData = { converted: true }
      mockSerializeFirestoreTypes.mockReturnValue(mockConvertedData)

      await collectionGroup.get()

      expect(mockSerializeFirestoreTypes).toHaveBeenCalledTimes(3)
    })

    describe('Validation', () => {
      it('should skip validation when validateOnRead is false', async () => {
        await collectionGroup.get()

        expect(mockValidateData).not.toHaveBeenCalled()
      })

      it('should validate when validateOnRead is true globally', async () => {
        mockFirestoreTyped.getOptions = jest.fn().mockReturnValue({
          validateOnRead: true,
          validateOnWrite: true,
        })

        await collectionGroup.get()

        expect(mockValidateData).toHaveBeenCalledTimes(3)
        expect(mockValidateData).toHaveBeenNthCalledWith(
          1,
          expect.any(Object),
          'users/user-1/posts/post-1',
          mockValidator
        )
      })

      it('should override global validateOnRead with options', async () => {
        await collectionGroup.get({ validateOnRead: true })

        expect(mockValidateData).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('Complex Query Scenarios', () => {
    it('should build complex queries across collections', () => {
      const query = collectionGroup
        .where('authorId', '==', 'user-1')
        .where('tags', 'array-contains', 'test' as any)
        .orderBy('createdAt', 'desc')
        .limit(10)

      expect(query).toBeInstanceOf(Query)
    })

    it('should handle pagination across collections', () => {
      const query = collectionGroup
        .orderBy('createdAt', 'desc')
        .limit(20)

      expect(query).toBeInstanceOf(Query)
    })
  })

  describe('native property', () => {
    it('should provide access to native Firebase Query', () => {
      expect(collectionGroup.native).toBe(mockFirebaseQuery)
    })
  })

  describe('Use Cases', () => {
    it('should find all posts by a specific user across different collections', async () => {
      const userPost = {
        id: 'post-1',
        ref: { path: 'users/user-1/posts/post-1' },
        data: () => ({
          id: 'post-1',
          title: 'User 1 Post',
          content: 'Content from user 1',
          authorId: 'user-1',
          tags: ['test'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }),
      }
      mockFirebaseQuery.get.mockResolvedValue({ docs: [userPost] })

      const result = await collectionGroup.get()

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]?.data?.authorId).toBe('user-1')
    })

    it('should find all posts with specific tags across all collections', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'post-1',
            ref: { path: 'users/user-1/posts/post-1' },
            data: () => ({
              id: 'post-1',
              title: 'User 1 Post',
              content: 'Content from user 1',
              authorId: 'user-1',
              tags: ['test'],
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            }),
          },
          {
            id: 'post-2',
            ref: { path: 'users/user-2/posts/post-2' },
            data: () => ({
              id: 'post-2',
              title: 'User 2 Post',
              content: 'Content from user 2',
              authorId: 'user-2',
              tags: ['test'],
              createdAt: new Date('2024-01-02'),
              updatedAt: new Date('2024-01-02'),
            }),
          },
          {
            id: 'post-3',
            ref: { path: 'groups/group-1/posts/post-3' },
            data: () => ({
              id: 'post-3',
              title: 'Group Post',
              content: 'Content from group',
              authorId: 'user-3',
              tags: ['group', 'test'],
              createdAt: new Date('2024-01-03'),
              updatedAt: new Date('2024-01-03'),
            }),
          },
        ],
      }
      mockFirebaseQuery.get.mockResolvedValue(mockQuerySnapshot)

      const result = await collectionGroup.get()

      expect(result.docs).toHaveLength(3)
      expect(result.docs.every((doc) => doc.data?.tags.includes('test'))).toBe(true)
    })
  })
})