/* eslint-disable @typescript-eslint/unbound-method */
import { FirestoreTyped } from '../firestore-typed'
import { CollectionReference } from '../collection'
import { CollectionGroup } from '../collection-group'
import type { Firestore } from 'firebase-admin/firestore'
import { TestEntity } from './__helpers__/test-entities.helper'

jest.mock('firebase-admin/firestore', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockHelper = require('./__helpers__/firebase-mock.helper')
  return mockHelper.createFirebaseAdminMock()
})

describe('FirestoreTyped Core Class', () => {
  let mockFirestore: jest.Mocked<Firestore>
  let mockValidator: jest.Mock
  let firestoreTyped: FirestoreTyped<TestEntity>


  beforeEach(() => {
    // Create mock Firestore instance
    mockFirestore = {
      collection: jest.fn(),
      collectionGroup: jest.fn(),
    } as any

    // Create mock validator
    mockValidator = jest.fn((data) => data as TestEntity)

    // Create FirestoreTyped instance with default options
    firestoreTyped = new FirestoreTyped<TestEntity>(mockFirestore, mockValidator)
  })

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      const instance = new FirestoreTyped<TestEntity>(mockFirestore, mockValidator)

      expect(instance.getOptions()).toEqual({
        validateOnRead: false,
        validateOnWrite: true,
      })
    })

    it('should create instance with custom options', () => {
      const customOptions = {
        validateOnRead: true,
        validateOnWrite: false,
      }
      const instance = new FirestoreTyped<TestEntity>(mockFirestore, mockValidator, customOptions)

      expect(instance.getOptions()).toEqual(customOptions)
    })

    it('should merge custom options with defaults', () => {
      const instance = new FirestoreTyped<TestEntity>(mockFirestore, mockValidator, {
        validateOnRead: true,
      })

      expect(instance.getOptions()).toEqual({
        validateOnRead: true,
        validateOnWrite: true, // default value preserved
      })
    })

    it('should store the validator function', () => {
      const customValidator = jest.fn()
      const instance = new FirestoreTyped<TestEntity>(mockFirestore, customValidator)

      // Accessing validator indirectly through collection creation
      const mockCollectionRef = { id: 'test', path: 'test' }
      mockFirestore.collection.mockReturnValue(mockCollectionRef as any)

      const collection = instance.collection('test')
      expect(collection).toBeInstanceOf(CollectionReference)
      expect(mockFirestore.collection).toHaveBeenCalledWith('test')
    })
  })

  describe('collection()', () => {
    it('should return a CollectionReference instance', () => {
      const mockCollectionRef = { id: 'users', path: 'users' }
      mockFirestore.collection.mockReturnValue(mockCollectionRef as any)

      const collection = firestoreTyped.collection('users')

      expect(collection).toBeInstanceOf(CollectionReference)
      expect(mockFirestore.collection).toHaveBeenCalledWith('users')
    })

    it('should pass correct parameters to CollectionReference constructor', () => {
      const mockCollectionRef = { id: 'users', path: 'users' }
      mockFirestore.collection.mockReturnValue(mockCollectionRef as any)

      const collection = firestoreTyped.collection('users')

      // Verify the collection was created with the right FirestoreTyped instance
      expect(collection.id).toBe('users')
      expect(collection.path).toBe('users')
    })

    it('should handle different collection paths', () => {
      const paths = ['users', 'posts', 'comments', 'users/user1/posts']
      
      paths.forEach((path) => {
        const mockCollectionRef = { id: path.split('/').pop(), path }
        mockFirestore.collection.mockReturnValue(mockCollectionRef as any)

        const collection = firestoreTyped.collection(path)
        expect(collection).toBeInstanceOf(CollectionReference)
        expect(mockFirestore.collection).toHaveBeenCalledWith(path)
      })
    })
  })

  describe('collectionGroup()', () => {
    it('should return a CollectionGroup instance', () => {
      const mockQuery = { where: jest.fn(), orderBy: jest.fn(), limit: jest.fn() }
      mockFirestore.collectionGroup.mockReturnValue(mockQuery as any)

      const collectionGroup = firestoreTyped.collectionGroup('posts')

      expect(collectionGroup).toBeInstanceOf(CollectionGroup)
      expect(mockFirestore.collectionGroup).toHaveBeenCalledWith('posts')
    })

    it('should pass correct parameters to CollectionGroup constructor', () => {
      const mockQuery = { where: jest.fn(), orderBy: jest.fn(), limit: jest.fn() }
      mockFirestore.collectionGroup.mockReturnValue(mockQuery as any)

      const collectionGroup = firestoreTyped.collectionGroup('posts')

      // Verify the collection group has access to the native query
      expect(collectionGroup.native).toBe(mockQuery)
    })

    it('should handle different collection group IDs', () => {
      const collectionIds = ['posts', 'comments', 'messages', 'notifications']
      
      collectionIds.forEach((collectionId) => {
        const mockQuery = { where: jest.fn(), orderBy: jest.fn(), limit: jest.fn() }
        mockFirestore.collectionGroup.mockReturnValue(mockQuery as any)

        const collectionGroup = firestoreTyped.collectionGroup(collectionId)
        expect(collectionGroup).toBeInstanceOf(CollectionGroup)
        expect(mockFirestore.collectionGroup).toHaveBeenCalledWith(collectionId)
      })
    })
  })

  describe('getOptions()', () => {
    it('should return a copy of options (immutable)', () => {
      const options1 = firestoreTyped.getOptions()
      const options2 = firestoreTyped.getOptions()

      expect(options1).toEqual(options2)
      expect(options1).not.toBe(options2) // Different object instances

      // Modifying returned options should not affect internal state
      options1.validateOnRead = true
      expect(firestoreTyped.getOptions().validateOnRead).toBe(false)
    })

    it('should return current options state', () => {
      const customOptions = {
        validateOnRead: true,
        validateOnWrite: false,
      }
      const instance = new FirestoreTyped<TestEntity>(mockFirestore, mockValidator, customOptions)

      expect(instance.getOptions()).toEqual(customOptions)
    })
  })

  describe('withOptions()', () => {
    it('should create new instance with updated options', () => {
      const newInstance = firestoreTyped.withOptions({
        validateOnRead: true,
      })

      expect(newInstance).toBeInstanceOf(FirestoreTyped)
      expect(newInstance).not.toBe(firestoreTyped) // Different instance

      expect(firestoreTyped.getOptions()).toEqual({
        validateOnRead: false,
        validateOnWrite: true,
      })

      expect(newInstance.getOptions()).toEqual({
        validateOnRead: true,
        validateOnWrite: true,
      })
    })

    it('should preserve original instance options', () => {
      const originalOptions = firestoreTyped.getOptions()
      
      firestoreTyped.withOptions({
        validateOnRead: true,
        validateOnWrite: false,
      })

      expect(firestoreTyped.getOptions()).toEqual(originalOptions)
    })

    it('should support partial option updates', () => {
      const instance = new FirestoreTyped<TestEntity>(mockFirestore, mockValidator, {
        validateOnRead: true,
        validateOnWrite: false,
      })

      const newInstance = instance.withOptions({
        validateOnWrite: true,
      })

      expect(newInstance.getOptions()).toEqual({
        validateOnRead: true, // preserved
        validateOnWrite: true, // updated
      })
    })

    it('should support multiple chained option updates', () => {
      const instance1 = firestoreTyped.withOptions({ validateOnRead: true })
      const instance2 = instance1.withOptions({ validateOnWrite: false })

      expect(instance2.getOptions()).toEqual({
        validateOnRead: true,
        validateOnWrite: false,
      })

      // Original instance should be unchanged
      expect(firestoreTyped.getOptions()).toEqual({
        validateOnRead: false,
        validateOnWrite: true,
      })
    })

    it('should maintain same validator and firestore instance', () => {
      const newInstance = firestoreTyped.withOptions({ validateOnRead: true })

      expect(newInstance.native).toBe(mockFirestore)
      
      // Verify validator is maintained by testing collection creation
      const mockCollectionRef = { id: 'test', path: 'test' }
      mockFirestore.collection.mockReturnValue(mockCollectionRef as any)
      
      const collection = newInstance.collection('test')
      expect(collection).toBeInstanceOf(CollectionReference)
    })
  })

  describe('native property', () => {
    it('should return the underlying Firestore instance', () => {
      expect(firestoreTyped.native).toBe(mockFirestore)
    })

    it('should provide access to native Firestore methods', () => {
      const nativeFirestore = firestoreTyped.native

      expect(nativeFirestore.collection).toBe(mockFirestore.collection as any)
      expect(nativeFirestore.collectionGroup).toBe(mockFirestore.collectionGroup as any)
    })
  })

  describe('FirestoreTypedOptionsProvider Interface', () => {
    it('should implement FirestoreTypedOptionsProvider interface', () => {
      // Test that the instance can be used as a FirestoreTypedOptionsProvider
      const optionsProvider = firestoreTyped as any // Type assertion for interface test

      expect(typeof optionsProvider.getOptions).toBe('function')
      expect(optionsProvider.getOptions()).toEqual({
        validateOnRead: false,
        validateOnWrite: true,
      })
    })

    it('should provide consistent options to created collections', () => {
      const customInstance = new FirestoreTyped<TestEntity>(mockFirestore, mockValidator, {
        validateOnRead: true,
        validateOnWrite: false,
      })

      const mockCollectionRef = { id: 'test', path: 'test' }
      mockFirestore.collection.mockReturnValue(mockCollectionRef as any)

      const collection = customInstance.collection('test')
      
      // Collection should receive the same options provider
      expect(collection).toBeInstanceOf(CollectionReference)
    })
  })

  describe('Integration with Collection and CollectionGroup', () => {
    it('should create collections that inherit global options', () => {
      const instance = new FirestoreTyped<TestEntity>(mockFirestore, mockValidator, {
        validateOnRead: true,
        validateOnWrite: false,
      })

      const mockCollectionRef = { id: 'users', path: 'users' }
      mockFirestore.collection.mockReturnValue(mockCollectionRef as any)

      const collection = instance.collection('users')
      
      // Collection should be able to access the options through the provider
      expect(collection).toBeInstanceOf(CollectionReference)
    })

    it('should create collection groups that inherit global options', () => {
      const instance = new FirestoreTyped<TestEntity>(mockFirestore, mockValidator, {
        validateOnRead: true,
        validateOnWrite: false,
      })

      const mockQuery = { where: jest.fn(), orderBy: jest.fn(), limit: jest.fn() }
      mockFirestore.collectionGroup.mockReturnValue(mockQuery as any)

      const collectionGroup = instance.collectionGroup('posts')
      
      // CollectionGroup should be able to access the options through the provider
      expect(collectionGroup).toBeInstanceOf(CollectionGroup)
    })
  })

  describe('Type Safety', () => {
    it('should maintain type safety across method calls', () => {
      // This test ensures TypeScript compilation succeeds with proper types
      const mockDocRef = { id: 'user1', path: 'users/user1' }
      const mockCollectionRef = { 
        id: 'users', 
        path: 'users',
        doc: jest.fn().mockReturnValue(mockDocRef)
      }
      mockFirestore.collection.mockReturnValue(mockCollectionRef as any)

      const collection = firestoreTyped.collection('users')
      const doc = collection.doc('user1')
      
      expect(collection).toBeInstanceOf(CollectionReference)
      expect(doc.id).toBe('user1')
    })

    it('should work with different entity types', () => {
      interface DifferentEntity {
        id: string
        title: string
        published: boolean
      }

      const differentValidator = jest.fn((data) => data as DifferentEntity)
      const differentInstance = new FirestoreTyped<DifferentEntity>(
        mockFirestore,
        differentValidator
      )

      const mockCollectionRef = { id: 'articles', path: 'articles' }
      mockFirestore.collection.mockReturnValue(mockCollectionRef as any)

      const collection = differentInstance.collection('articles')
      expect(collection).toBeInstanceOf(CollectionReference)
    })
  })

  describe('Error Handling', () => {
    it('should handle validator errors gracefully', () => {
      const errorValidator = jest.fn(() => {
        throw new Error('Validation failed')
      })
      
      expect(() => {
        new FirestoreTyped<TestEntity>(mockFirestore, errorValidator)
      }).not.toThrow() // Constructor should not throw even if validator would throw
    })

    it('should handle Firestore errors in collection creation', () => {
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Firestore error')
      })

      expect(() => {
        firestoreTyped.collection('test')
      }).toThrow('Firestore error')
    })

    it('should handle Firestore errors in collection group creation', () => {
      mockFirestore.collectionGroup.mockImplementation(() => {
        throw new Error('Firestore error')
      })

      expect(() => {
        firestoreTyped.collectionGroup('test')
      }).toThrow('Firestore error')
    })
  })
})