import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { FirestoreTyped } from '../../firestore-typed'
import { DocumentAlreadyExistsError } from '../../../errors/errors'
import {
  setupEmulator,
  teardownEmulator,
  type EmulatorSetup,
} from '../../../__tests__/__helpers__/emulator-setup.helper'
import {
  createSimpleTestEntity,
  createSimpleTestEntityValidator,
} from '../../../__tests__/__helpers__/test-entities.helper'

describe('FirestoreTyped Core Class (Emulator)', () => {
  let emulator: EmulatorSetup
  let firestoreTyped: FirestoreTyped

  beforeAll(() => {
    emulator = setupEmulator()
  })

  beforeEach(() => {
    firestoreTyped = new FirestoreTyped(emulator.firestore)
  })

  afterAll(async () => {
    await teardownEmulator(emulator)
  })

  describe('collection()', () => {
    it('should work with real Firestore operations', async () => {
      const validator = createSimpleTestEntityValidator()
      const uniqueCollectionName = `test-entities-${Date.now()}-${Math.random()}`
      const collectionRef = firestoreTyped.collection(uniqueCollectionName, validator)

      // Add document
      const testData = createSimpleTestEntity({
        id: '123',
        name: 'Test Entity',
      })
      const docRef = await collectionRef.add(testData)

      try {
        // Read back
        const snapshot = await docRef.get()
        expect(snapshot.metadata.exists).toBe(true)
        expect(snapshot.data).toEqual(testData)
      } finally {
        // Clean up: delete the document we created
        await docRef.delete()
      }
    })
  })

  describe('collectionGroup()', () => {
    it('should query across collections', async () => {
      const validator = createSimpleTestEntityValidator()

      // Use unique collection name to avoid conflicts
      const uniqueCollectionName = `test-entities-${Date.now()}`

      // Create documents in different parent paths
      const collection1 = firestoreTyped.collection(
        `parent1/doc1/${uniqueCollectionName}`,
        validator,
      )
      const collection2 = firestoreTyped.collection(
        `parent2/doc2/${uniqueCollectionName}`,
        validator,
      )

      const docRef1 = await collection1.add(createSimpleTestEntity({ id: '1', name: 'Entity 1' }))
      const docRef2 = await collection2.add(createSimpleTestEntity({ id: '2', name: 'Entity 2' }))

      try {
        // Query collection group
        const collectionGroup = firestoreTyped.collectionGroup(uniqueCollectionName, validator)
        const snapshot = await collectionGroup.get()

        expect(snapshot.size).toBe(2)
        const data = snapshot.docs.map((doc) => doc.data)
        expect(data).toContainEqual(expect.objectContaining({ name: 'Entity 1' }))
        expect(data).toContainEqual(expect.objectContaining({ name: 'Entity 2' }))
      } finally {
        // Clean up: delete the documents we created
        await Promise.all([docRef1.delete(), docRef2.delete()])
      }
    })
  })

  describe('failIfExists atomicity', () => {
    it('should allow exactly one of two concurrent failIfExists writes to succeed', async () => {
      const validator = createSimpleTestEntityValidator()
      const uniqueCollectionName = `test-atomic-${Date.now()}-${Math.random()}`
      const collection = firestoreTyped.collection(uniqueCollectionName, validator)
      const docRef = collection.doc('contested-doc')

      const testData = createSimpleTestEntity({ id: '123', name: 'First Writer' })

      try {
        const results = await Promise.allSettled([
          docRef.set(testData, { failIfExists: true }),
          docRef.set(testData, { failIfExists: true }),
        ])

        const fulfilled = results.filter((r) => r.status === 'fulfilled')
        const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

        expect(fulfilled).toHaveLength(1)
        expect(rejected).toHaveLength(1)
        expect(rejected[0].reason).toBeInstanceOf(DocumentAlreadyExistsError)
      } finally {
        await docRef.delete()
      }
    })

    it('should throw DocumentAlreadyExistsError for an existing document', async () => {
      const validator = createSimpleTestEntityValidator()
      const uniqueCollectionName = `test-exists-${Date.now()}-${Math.random()}`
      const collection = firestoreTyped.collection(uniqueCollectionName, validator)
      const docRef = collection.doc('existing-doc')

      const testData = createSimpleTestEntity({ id: '123', name: 'Original' })
      await docRef.set(testData)

      try {
        await expect(docRef.set(testData, { failIfExists: true })).rejects.toThrow(
          DocumentAlreadyExistsError,
        )
      } finally {
        await docRef.delete()
      }
    })
  })

  describe('Validation behavior', () => {
    it('should validate on write when enabled', async () => {
      const instance = new FirestoreTyped(emulator.firestore, { validateOnWrite: true })
      const validator = createSimpleTestEntityValidator()
      const uniqueCollectionName = `test-${Date.now()}-${Math.random()}`
      const collection = instance.collection(uniqueCollectionName, validator)

      const testData = createSimpleTestEntity({
        id: '123',
        name: 'Test',
      })

      const docRef = await collection.add(testData)

      try {
        // Validator should be called for write operations
        expect(validator).toHaveBeenCalledWith(testData)
      } finally {
        // Clean up: delete the document we created
        await docRef.delete()
      }
    })

    it('should not validate on read when disabled', async () => {
      const instance = new FirestoreTyped(emulator.firestore, { validateOnRead: false })
      const validator = createSimpleTestEntityValidator()
      const uniqueCollectionName = `test-${Date.now()}-${Math.random()}`
      const collection = instance.collection(uniqueCollectionName, validator)

      // First add data
      const testData = createSimpleTestEntity({
        id: '123',
        name: 'Test',
      })
      const docRef = await collection.add(testData)

      try {
        // Reset validator mock
        validator.mockClear()

        // Read data
        await docRef.get()

        // Validator should not be called for read operations
        expect(validator).not.toHaveBeenCalled()
      } finally {
        // Clean up: delete the document we created
        await docRef.delete()
      }
    })
  })
})
