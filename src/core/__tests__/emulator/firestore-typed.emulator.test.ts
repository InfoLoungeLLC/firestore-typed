import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { GeoPoint } from 'firebase-admin/firestore'
import { FirestoreTyped } from '../../firestore-typed'
import { DocumentAlreadyExistsError, FirestoreTypedValidationError } from '../../../errors/errors'
import type {
  SerializedGeoPoint,
  SerializedDocumentReference,
} from '../../../utils/firestore-converter'
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

  describe('merge() concurrency', () => {
    it('should leave the document unchanged when merged data fails validation', async () => {
      interface NamedEntity extends Record<string, unknown> {
        id: string
        name: string
      }
      const validator = (data: unknown): NamedEntity => {
        const obj = data as NamedEntity
        if (typeof obj.name !== 'string' || obj.name.length < 2) {
          throw new Error('Name must be at least 2 characters')
        }
        return obj
      }
      const uniqueCollectionName = `test-merge-abort-${Date.now()}-${Math.random()}`
      const collection = firestoreTyped.collection<NamedEntity>(uniqueCollectionName, validator)
      const docRef = collection.doc('validated-doc')

      await docRef.set({ id: '1', name: 'Original' })

      try {
        // Merged result {id, name: 'X'} fails validation → transaction aborts
        // (the validator's error is wrapped in FirestoreTypedValidationError)
        await expect(docRef.merge({ name: 'X' })).rejects.toThrow(FirestoreTypedValidationError)

        const snapshot = await docRef.get()
        expect(snapshot.data?.name).toBe('Original')
      } finally {
        await docRef.delete()
      }
    })

    it('should not lose a concurrent update to a different field', async () => {
      const validator = createSimpleTestEntityValidator()
      const uniqueCollectionName = `test-merge-${Date.now()}-${Math.random()}`
      const collection = firestoreTyped.collection(uniqueCollectionName, validator)
      const docRef = collection.doc('shared-doc')

      await docRef.set(createSimpleTestEntity({ id: '123', name: 'Original', age: 1 }))

      try {
        // Without a transaction, one merge's full-document overwrite can
        // silently drop the other merge's field update
        await Promise.all([docRef.merge({ name: 'Updated Name' }), docRef.merge({ age: 99 })])

        const snapshot = await docRef.get()
        expect(snapshot.data?.name).toBe('Updated Name')
        expect(snapshot.data?.age).toBe(99)
      } finally {
        await docRef.delete()
      }
    })
  })

  describe('Queries on special-type fields', () => {
    interface PlaceEntity extends Record<string, unknown> {
      id: string
      name: string
      location: SerializedGeoPoint
      owner: SerializedDocumentReference
    }

    it('should match documents by GeoPoint and DocumentReference values via where()', async () => {
      const validator = (data: unknown) => data as PlaceEntity
      const uniqueCollectionName = `test-places-${Date.now()}-${Math.random()}`
      const collection = firestoreTyped.collection<PlaceEntity>(uniqueCollectionName, validator)

      const location: SerializedGeoPoint = {
        type: 'GeoPoint',
        latitude: 35.6762,
        longitude: 139.6503,
      }
      const owner: SerializedDocumentReference = {
        type: 'DocumentReference',
        path: `owners-${uniqueCollectionName}/owner-1`,
        collectionId: `owners-${uniqueCollectionName}`,
        documentId: 'owner-1',
      }

      const docRef = collection.doc('tokyo')
      await docRef.set({ id: 'tokyo', name: 'Tokyo Office', location, owner })

      try {
        // Both queries return 0 results without query-value deserialization,
        // because the stored native types never equal the serialized plain objects
        const byLocation = await collection.where('location', '==', location).get()
        expect(byLocation.size).toBe(1)
        expect(byLocation.docs[0].data?.name).toBe('Tokyo Office')

        const byOwner = await collection.where('owner', '==', owner).get()
        expect(byOwner.size).toBe(1)
        expect(byOwner.docs[0].data?.name).toBe('Tokyo Office')
      } finally {
        await docRef.delete()
      }
    })
  })

  describe('Native operands for queries and cursors', () => {
    it('should accept a native DocumentSnapshot as a cursor value', async () => {
      const validator = createSimpleTestEntityValidator()
      const uniqueCollectionName = `test-cursor-${Date.now()}-${Math.random()}`
      const collection = firestoreTyped.collection(uniqueCollectionName, validator)

      const docRefs = await Promise.all([
        collection.add(createSimpleTestEntity({ id: '1', name: 'Alice' })),
        collection.add(createSimpleTestEntity({ id: '2', name: 'Bob' })),
        collection.add(createSimpleTestEntity({ id: '3', name: 'Carol' })),
      ])

      try {
        // Native snapshots contain circular references; before the passthrough
        // fix this overflowed the stack (RangeError) in cursor conversion
        const nativeSnapshot = await collection.native.orderBy('name').get()

        const page = await collection
          .orderBy('name')
          .startAfter(nativeSnapshot.docs[0])
          .get({ validateOnRead: false })

        expect(page.size).toBe(2)
        expect(page.docs.map((d) => d.data?.name)).toEqual(['Bob', 'Carol'])
      } finally {
        await Promise.all(docRefs.map((ref) => ref.delete()))
      }
    })

    it('should match documents when a native GeoPoint is used as a where() operand', async () => {
      interface PlaceEntity extends Record<string, unknown> {
        id: string
        name: string
        location: SerializedGeoPoint
      }
      const validator = (data: unknown) => data as PlaceEntity
      const uniqueCollectionName = `test-native-geo-${Date.now()}-${Math.random()}`
      const collection = firestoreTyped.collection<PlaceEntity>(uniqueCollectionName, validator)

      const docRef = collection.doc('osaka')
      await docRef.set({
        id: 'osaka',
        name: 'Osaka Office',
        location: { type: 'GeoPoint', latitude: 34.6937, longitude: 135.5023 },
      })

      try {
        // Native instances worked before 0.7.0's query-value conversion and
        // must keep working: they pass through instead of being flattened,
        // and WhereFilterValue accepts them alongside the serialized form
        const nativeGeoPoint = new GeoPoint(34.6937, 135.5023)
        const result = await collection.where('location', '==', nativeGeoPoint).get()

        expect(result.size).toBe(1)
        expect(result.docs[0].data?.name).toBe('Osaka Office')
      } finally {
        await docRef.delete()
      }
    })
  })

  describe('Binary field round-trip', () => {
    it('should preserve Buffer bytes through write and read', async () => {
      interface BlobEntity extends Record<string, unknown> {
        id: string
        payload: Uint8Array
      }
      const validator = (data: unknown) => data as BlobEntity
      const uniqueCollectionName = `test-bytes-${Date.now()}-${Math.random()}`
      const collection = firestoreTyped.collection<BlobEntity>(uniqueCollectionName, validator)
      const docRef = collection.doc('blob-doc')

      const payload = Buffer.from([0xde, 0xad, 0xbe, 0xef])
      await docRef.set({ id: 'blob', payload })

      try {
        const snapshot = await docRef.get()
        const stored = snapshot.data?.payload

        // Without binary passthrough this comes back as an index-keyed
        // plain object like { "0": 222, "1": 173, ... }
        expect(stored).toBeInstanceOf(Uint8Array)
        expect(Buffer.from(stored as Uint8Array).equals(payload)).toBe(true)
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
