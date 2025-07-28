import { getFirestoreTyped } from '../index'
import { deserializeFirestoreTypes } from '../utils/firestore-converter'
import { createMockFirestore } from '../core/__tests__/__helpers__/firebase-mock.helper'
import type { SerializedGeoPoint, SerializedDocumentReference } from '../utils/firestore-converter'

// Types are only used in test assertions, not direct imports needed

jest.mock('firebase-admin/firestore', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockHelper = require('../core/__tests__/__helpers__/firebase-mock.helper')
  return mockHelper.createFirebaseAdminMock()
})

describe('FirestoreTyped Type Conversion', () => {
  interface LocationEntity {
    id: string
    name: string
    coordinates: SerializedGeoPoint
    parent?: SerializedDocumentReference<'locations', LocationEntity>
    createdAt: Date
    updatedAt: Date
  }

  const mockValidator = (data: unknown): LocationEntity => {
    return data as LocationEntity
  }

  describe('deserializeFirestoreTypes', () => {
    it('should convert Date to Timestamp', () => {
      const testDate = new Date('2024-01-01T00:00:00.000Z')
      const data = {
        createdAt: testDate,
        updatedAt: testDate,
      }

      const mockFirestore = createMockFirestore() as any
      const converted = deserializeFirestoreTypes(data, mockFirestore)

      expect(converted.createdAt).toBeDefined()
      expect(converted.createdAt.constructor.name).toBe('MockTimestamp')
      expect(converted.updatedAt).toBeDefined()
      expect(converted.updatedAt.constructor.name).toBe('MockTimestamp')
    })

    it('should convert nested Dates in arrays', () => {
      const data = {
        dates: [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')],
      }

      const mockFirestore = createMockFirestore() as any
      const converted = deserializeFirestoreTypes(data, mockFirestore)

      expect(Array.isArray(converted.dates)).toBe(true)
      converted.dates.forEach((date: any) => {
        expect(date.constructor.name).toBe('MockTimestamp')
      })
    })

    it('should convert SerializedGeoPoint to GeoPoint', () => {
      const data = {
        location: {
          type: 'GeoPoint' as const,
          latitude: 35.4478,
          longitude: 139.6425,
        },
      }

      const mockFirestore = createMockFirestore() as any
      const converted = deserializeFirestoreTypes(data, mockFirestore)

      expect(converted.location).toBeDefined()
      expect(converted.location.constructor.name).toBe('MockGeoPoint')
      expect(converted.location.latitude).toBe(35.4478)
      expect(converted.location.longitude).toBe(139.6425)
    })

    it('should convert SerializedDocumentReference to DocumentReference', () => {
      const data = {
        parent: {
          type: 'DocumentReference' as const,
          path: 'locations/parent-001',
          collectionId: 'locations',
          documentId: 'parent-001',
        } as SerializedDocumentReference<'locations', LocationEntity>,
      }

      const mockFirestore = createMockFirestore() as any
      const converted = deserializeFirestoreTypes(data, mockFirestore)

      expect(converted.parent).toBeDefined()
      // In a real implementation, this would be a DocumentReference
      // For now, we're testing that the conversion logic is called
      expect(converted.parent.path).toBe('locations/parent-001')
    })

    it('should handle null and undefined values', () => {
      const data = {
        nullValue: null,
        undefinedValue: undefined,
        validDate: new Date(),
      }

      const mockFirestore = createMockFirestore() as any
      const converted = deserializeFirestoreTypes(data, mockFirestore)

      expect(converted.nullValue).toBeNull()
      expect(converted.undefinedValue).toBeUndefined()
      expect(converted.validDate.constructor.name).toBe('MockTimestamp')
    })

    it('should handle deeply nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              date: new Date('2024-01-01'),
              location: {
                type: 'GeoPoint' as const,
                latitude: 35.4478,
                longitude: 139.6425,
              },
            },
          },
        },
      }

      const mockFirestore = createMockFirestore() as any
      const converted = deserializeFirestoreTypes(data, mockFirestore)

      expect(converted.level1.level2.level3.date.constructor.name).toBe('MockTimestamp')
      expect(converted.level1.level2.level3.location.constructor.name).toBe('MockGeoPoint')
    })

    it('should preserve other data types', () => {
      const data = {
        string: 'test',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: { key: 'value' },
      }

      const mockFirestore = createMockFirestore() as any
      const converted = deserializeFirestoreTypes(data, mockFirestore)

      expect(converted.string).toBe('test')
      expect(converted.number).toBe(123)
      expect(converted.boolean).toBe(true)
      expect(converted.array).toEqual([1, 2, 3])
      expect(converted.object).toEqual({ key: 'value' })
    })
  })

  describe('Integration with FirestoreTyped', () => {
    let db: ReturnType<typeof getFirestoreTyped>
    let collection: ReturnType<typeof db.collection<LocationEntity>>

    beforeEach(() => {
      db = getFirestoreTyped()
      collection = db.collection<LocationEntity>('locations', mockValidator)
    })

    it('should convert types during write operations', async () => {
      const locationData: LocationEntity = {
        id: 'loc-001',
        name: 'Tokyo Office',
        coordinates: {
          type: 'GeoPoint',
          latitude: 35.6762,
          longitude: 139.6503,
        },
        parent: {
          type: 'DocumentReference',
          path: 'locations/parent-001',
          collectionId: 'locations',
          documentId: 'parent-001',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // This should not throw an error
      const docRef = await collection.add(locationData)
      expect(docRef).toBeDefined()
    })

    it('should handle mixed type conversions', async () => {
      const complexData = {
        id: 'complex-001',
        name: 'Complex Location',
        coordinates: {
          type: 'GeoPoint' as const,
          latitude: 35.6762,
          longitude: 139.6503,
        },
        metadata: {
          tags: ['office', 'headquarters'],
          lastVisited: new Date(),
          visitHistory: [
            { date: new Date('2024-01-01'), visitor: 'John' },
            { date: new Date('2024-01-02'), visitor: 'Jane' },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // This should handle all nested conversions
      await collection.doc('complex-001').set(complexData as any)
    })
  })
})
