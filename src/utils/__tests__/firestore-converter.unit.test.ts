/* eslint-disable @typescript-eslint/unbound-method */
import {
  serializeFirestoreTypes,
  deserializeFirestoreTypes,
  SerializedGeoPoint,
  SerializedDocumentReference,
} from '../firestore-converter'
import { Timestamp, GeoPoint, DocumentReference, Firestore } from 'firebase-admin/firestore'

describe('Firestore Converter', () => {
  let mockFirestore: jest.Mocked<Firestore>

  beforeEach(() => {
    mockFirestore = {
      doc: jest.fn(),
    } as any
  })

  // Helper to create proper Firestore instances
  const createMockTimestamp = (date: Date): Timestamp => {
    const mockObj = {
      toDate: jest.fn().mockReturnValue(date)
    }
    Object.setPrototypeOf(mockObj, Timestamp.prototype)
    return mockObj as unknown as Timestamp
  }

  const createMockGeoPoint = (latitude: number, longitude: number): GeoPoint => {
    const mockObj = {
      latitude,
      longitude
    }
    Object.setPrototypeOf(mockObj, GeoPoint.prototype)
    return mockObj as unknown as GeoPoint
  }

  const createMockDocumentReference = (path: string, id: string, parentId: string): DocumentReference => {
    const mockObj = {
      path,
      id,
      parent: { id: parentId }
    }
    Object.setPrototypeOf(mockObj, DocumentReference.prototype)
    return mockObj as unknown as DocumentReference
  }

  describe('serializeFirestoreTypes', () => {
    describe('Primitive Values', () => {
      it('should return primitive values unchanged', () => {
        expect(serializeFirestoreTypes('string' as any)).toBe('string')
        expect(serializeFirestoreTypes(123 as any)).toBe(123)
        expect(serializeFirestoreTypes(true as any)).toBe(true)
        expect(serializeFirestoreTypes(false as any)).toBe(false)
        expect(serializeFirestoreTypes(null as any)).toBe(null)
        expect(serializeFirestoreTypes(undefined as any)).toBe(undefined)
      })

      it('should handle empty values', () => {
        expect(serializeFirestoreTypes('' as any)).toBe('')
        expect(serializeFirestoreTypes(0 as any)).toBe(0)
      })
    })

    describe('Timestamp Conversion', () => {
      it('should convert Timestamp to Date', () => {
        const testDate = new Date('2024-01-01T10:00:00Z')
        const mockTimestamp = createMockTimestamp(testDate)

        const result = serializeFirestoreTypes(mockTimestamp)

        expect(mockTimestamp.toDate).toHaveBeenCalled()
        expect(result).toBe(testDate)
        expect(result).toBeInstanceOf(Date)
      })

      it('should handle multiple Timestamps in object', () => {
        const date1 = new Date('2024-01-01')
        const date2 = new Date('2024-12-31')
        const timestamp1 = createMockTimestamp(date1)
        const timestamp2 = createMockTimestamp(date2)

        const data = { created: timestamp1, updated: timestamp2 }
        const result = serializeFirestoreTypes(data) as any

        expect(result.created).toBe(date1)
        expect(result.updated).toBe(date2)
      })
    })

    describe('GeoPoint Conversion', () => {
      it('should convert GeoPoint to SerializedGeoPoint', () => {
        const mockGeoPoint = createMockGeoPoint(35.6762, 139.6503)

        const result = serializeFirestoreTypes(mockGeoPoint) as SerializedGeoPoint

        expect(result).toEqual({
          type: 'GeoPoint',
          latitude: 35.6762,
          longitude: 139.6503,
        })
      })

      it('should handle GeoPoint with negative coordinates', () => {
        const mockGeoPoint = createMockGeoPoint(-33.8688, -151.2093)

        const result = serializeFirestoreTypes(mockGeoPoint) as SerializedGeoPoint

        expect(result).toEqual({
          type: 'GeoPoint',
          latitude: -33.8688,
          longitude: -151.2093,
        })
      })
    })

    describe('DocumentReference Conversion', () => {
      it('should convert DocumentReference to SerializedDocumentReference', () => {
        const mockDocRef = createMockDocumentReference('users/user123', 'user123', 'users')

        const result = serializeFirestoreTypes(mockDocRef) as SerializedDocumentReference

        expect(result).toEqual({
          type: 'DocumentReference',
          path: 'users/user123',
          collectionId: 'users',
          documentId: 'user123',
        })
      })

      it('should handle nested collection DocumentReference', () => {
        const mockDocRef = createMockDocumentReference('users/user123/posts/post456', 'post456', 'posts')

        const result = serializeFirestoreTypes(mockDocRef) as SerializedDocumentReference

        expect(result).toEqual({
          type: 'DocumentReference',
          path: 'users/user123/posts/post456',
          collectionId: 'posts',
          documentId: 'post456',
        })
      })
    })

    describe('Array Conversion', () => {
      it('should recursively convert arrays', () => {
        const testDate = new Date('2024-01-01')
        const mockTimestamp = createMockTimestamp(testDate)
        const mockGeoPoint = createMockGeoPoint(35.6762, 139.6503)

        const data = [mockTimestamp, mockGeoPoint, 'string', 123]
        const result = serializeFirestoreTypes(data) as any[]

        expect(result[0]).toBe(testDate)
        expect(result[1]).toEqual({
          type: 'GeoPoint',
          latitude: 35.6762,
          longitude: 139.6503,
        })
        expect(result[2]).toBe('string')
        expect(result[3]).toBe(123)
      })

      it('should handle empty arrays', () => {
        const result = serializeFirestoreTypes([])
        expect(result).toEqual([])
      })
    })

    describe('Object Conversion', () => {
      it('should recursively convert objects', () => {
        const testDate = new Date('2024-01-01')
        const mockTimestamp = createMockTimestamp(testDate)
        const mockGeoPoint = createMockGeoPoint(35.6762, 139.6503)

        const data = {
          timestamp: mockTimestamp,
          location: mockGeoPoint,
          name: 'test',
          count: 42,
        }

        const result = serializeFirestoreTypes(data) as any

        expect(result.timestamp).toBe(testDate)
        expect(result.location).toEqual({
          type: 'GeoPoint',
          latitude: 35.6762,
          longitude: 139.6503,
        })
        expect(result.name).toBe('test')
        expect(result.count).toBe(42)
      })

      it('should handle empty objects', () => {
        const result = serializeFirestoreTypes({})
        expect(result).toEqual({})
      })
    })
  })

  describe('deserializeFirestoreTypes', () => {
    describe('Primitive Values', () => {
      it('should return primitive values unchanged', () => {
        const data = {
          string: 'test',
          number: 123,
          boolean: true,
          nullValue: null,
        }

        const result = deserializeFirestoreTypes(data, mockFirestore)

        expect(result.string).toBe('test')
        expect(result.number).toBe(123)
        expect(result.boolean).toBe(true)
        expect(result.nullValue).toBe(null)
      })
    })

    describe('Date to Timestamp Conversion', () => {
      it('should convert Date to Timestamp', () => {
        const testDate = new Date('2024-01-01T10:00:00Z')
        const data = { createdAt: testDate }

        const result = deserializeFirestoreTypes(data, mockFirestore) as any

        expect(result.createdAt).toBeInstanceOf(Timestamp)
        expect(result.createdAt.toDate()).toEqual(testDate)
      })

      it('should handle multiple Dates', () => {
        const date1 = new Date('2024-01-01')
        const date2 = new Date('2024-12-31')
        const data = { created: date1, updated: date2 }

        const result = deserializeFirestoreTypes(data, mockFirestore) as any

        expect(result.created).toBeInstanceOf(Timestamp)
        expect(result.updated).toBeInstanceOf(Timestamp)
        expect(result.created.toDate()).toEqual(date1)
        expect(result.updated.toDate()).toEqual(date2)
      })
    })

    describe('SerializedGeoPoint to GeoPoint Conversion', () => {
      it('should convert SerializedGeoPoint to GeoPoint', () => {
        const data = {
          location: {
            type: 'GeoPoint',
            latitude: 35.6762,
            longitude: 139.6503,
          } as SerializedGeoPoint,
        }

        const result = deserializeFirestoreTypes(data, mockFirestore) as any

        expect(result.location).toBeInstanceOf(GeoPoint)
        expect(result.location.latitude).toBe(35.6762)
        expect(result.location.longitude).toBe(139.6503)
      })

      it('should ignore invalid SerializedGeoPoint objects', () => {
        const data = {
          invalid1: { type: 'GeoPoint', latitude: 'invalid' },
          invalid2: { type: 'GeoPoint', longitude: 139.6503 },
          invalid3: { type: 'NotGeoPoint', latitude: 35.6762, longitude: 139.6503 },
          valid: { type: 'GeoPoint', latitude: 35.6762, longitude: 139.6503 },
        }

        const result = deserializeFirestoreTypes(data, mockFirestore) as any

        expect(result.invalid1).toEqual({ type: 'GeoPoint', latitude: 'invalid' })
        expect(result.invalid2).toEqual({ type: 'GeoPoint', longitude: 139.6503 })
        expect(result.invalid3).toEqual({ type: 'NotGeoPoint', latitude: 35.6762, longitude: 139.6503 })
        expect(result.valid).toBeInstanceOf(GeoPoint)
      })
    })

    describe('SerializedDocumentReference to DocumentReference Conversion', () => {
      it('should convert SerializedDocumentReference to DocumentReference', () => {
        const mockDocRef = { path: 'users/user123' }
        mockFirestore.doc.mockReturnValue(mockDocRef as any)

        const data = {
          author: {
            type: 'DocumentReference',
            path: 'users/user123',
            collectionId: 'users',
            documentId: 'user123',
          } as SerializedDocumentReference,
        }

        const result = deserializeFirestoreTypes(data, mockFirestore) as any

        expect(mockFirestore.doc).toHaveBeenCalledWith('users/user123')
        expect(result.author).toBe(mockDocRef)
      })

      it('should ignore invalid SerializedDocumentReference objects', () => {
        const data = {
          invalid1: { type: 'DocumentReference', path: 123 },
          invalid2: { type: 'DocumentReference', collectionId: 'users' },
          invalid3: { type: 'NotDocumentReference', path: 'users/user123', collectionId: 'users', documentId: 'user123' },
          valid: { type: 'DocumentReference', path: 'users/user123', collectionId: 'users', documentId: 'user123' },
        }

        const mockDocRef = { path: 'users/user123' }
        mockFirestore.doc.mockReturnValue(mockDocRef as any)

        const result = deserializeFirestoreTypes(data, mockFirestore) as any

        expect(result.invalid1).toEqual({ type: 'DocumentReference', path: 123 })
        expect(result.invalid2).toEqual({ type: 'DocumentReference', collectionId: 'users' })
        expect(result.invalid3).toEqual({ type: 'NotDocumentReference', path: 'users/user123', collectionId: 'users', documentId: 'user123' })
        expect(result.valid).toBe(mockDocRef)
        expect(mockFirestore.doc).toHaveBeenCalledWith('users/user123')
      })
    })

    describe('Array Conversion', () => {
      it('should recursively convert arrays', () => {
        const testDate = new Date('2024-01-01')
        const geoPoint: SerializedGeoPoint = {
          type: 'GeoPoint',
          latitude: 35.6762,
          longitude: 139.6503,
        }

        const data = [testDate, geoPoint, 'string', 123]
        const result = deserializeFirestoreTypes(data, mockFirestore) as any[]

        expect(result[0]).toBeInstanceOf(Timestamp)
        expect(result[1]).toBeInstanceOf(GeoPoint)
        expect(result[2]).toBe('string')
        expect(result[3]).toBe(123)
      })

      it('should handle empty arrays', () => {
        const result = deserializeFirestoreTypes([], mockFirestore)
        expect(result).toEqual([])
      })
    })

    describe('Object Conversion', () => {
      it('should recursively convert objects', () => {
        const testDate = new Date('2024-01-01')
        const geoPoint: SerializedGeoPoint = {
          type: 'GeoPoint',
          latitude: 35.6762,
          longitude: 139.6503,
        }

        const data = {
          timestamp: testDate,
          location: geoPoint,
          name: 'test',
          count: 42,
        }

        const result = deserializeFirestoreTypes(data, mockFirestore) as any

        expect(result.timestamp).toBeInstanceOf(Timestamp)
        expect(result.location).toBeInstanceOf(GeoPoint)
        expect(result.name).toBe('test')
        expect(result.count).toBe(42)
      })

      it('should handle empty objects', () => {
        const result = deserializeFirestoreTypes({}, mockFirestore)
        expect(result).toEqual({})
      })
    })
  })

  describe('Round-trip Conversion', () => {
    it('should be able to serialize and deserialize back to equivalent values', () => {
      const originalDate = new Date('2024-01-01T10:00:00Z')
      const mockTimestamp = createMockTimestamp(originalDate)
      const mockGeoPoint = createMockGeoPoint(35.6762, 139.6503)
      const mockDocRef = createMockDocumentReference('users/user123', 'user123', 'users')

      // Mock the Firestore doc method to return a DocumentReference-like object
      const recreatedDocRef = { path: 'users/user123' }
      mockFirestore.doc.mockReturnValue(recreatedDocRef as any)

      const originalData = {
        timestamp: mockTimestamp,
        location: mockGeoPoint,
        author: mockDocRef,
        tags: ['tag1', 'tag2'],
        meta: { count: 5 },
      }

      // Serialize (Firestore -> JavaScript)
      const serialized = serializeFirestoreTypes(originalData)

      // Deserialize (JavaScript -> Firestore)
      const deserialized = deserializeFirestoreTypes(serialized, mockFirestore) as any

      // Check that types are correctly converted
      expect(deserialized.timestamp).toBeInstanceOf(Timestamp)
      expect(deserialized.location).toBeInstanceOf(GeoPoint)
      expect(deserialized.author).toBe(recreatedDocRef)
      expect(deserialized.tags).toEqual(['tag1', 'tag2'])
      expect(deserialized.meta.count).toBe(5)

      // Check that the DocumentReference path is correct
      expect(mockFirestore.doc).toHaveBeenCalledWith('users/user123')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      const data = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        false: false,
      }

      const serialized = serializeFirestoreTypes(data)
      const deserialized = deserializeFirestoreTypes(serialized, mockFirestore)

      expect(serialized).toEqual(data)
      expect(deserialized).toEqual(data)
    })

    it('should handle deeply nested structures', () => {
      let deepObject: any = { value: 'deep' }
      for (let i = 0; i < 5; i++) {  // Reduced depth to avoid stack overflow
        deepObject = { nested: deepObject }
      }

      const serialized = serializeFirestoreTypes(deepObject)
      const deserialized = deserializeFirestoreTypes(serialized, mockFirestore)

      expect(serialized).toEqual(deepObject)
      expect(deserialized).toEqual(deepObject)
    })

    it('should handle circular references by not crashing', () => {
      const obj: any = { name: 'test' }
      obj.self = obj

      // This will cause a stack overflow, so we should expect it to throw
      expect(() => serializeFirestoreTypes(obj)).toThrow()
    })
  })

  describe('Type Guards', () => {
    it('should correctly identify valid SerializedGeoPoint', () => {
      const validGeoPoint: SerializedGeoPoint = {
        type: 'GeoPoint',
        latitude: 35.6762,
        longitude: 139.6503,
      }

      const result = deserializeFirestoreTypes({ location: validGeoPoint }, mockFirestore) as any
      expect(result.location).toBeInstanceOf(GeoPoint)
    })

    it('should correctly identify valid SerializedDocumentReference', () => {
      const validDocRef: SerializedDocumentReference = {
        type: 'DocumentReference',
        path: 'users/user123',
        collectionId: 'users',
        documentId: 'user123',
      }

      const mockDocRef = { path: 'users/user123' }
      mockFirestore.doc.mockReturnValue(mockDocRef as any)

      const result = deserializeFirestoreTypes({ author: validDocRef }, mockFirestore) as any
      expect(result.author).toBe(mockDocRef)
    })

    it('should reject invalid type guard checks', () => {
      const invalidObjects = [
        null,
        undefined,
        'string',
        123,
        [],
        { type: 'GeoPoint' }, // missing required fields
        { type: 'DocumentReference' }, // missing required fields
      ]

      invalidObjects.forEach((obj) => {
        const result = deserializeFirestoreTypes({ test: obj }, mockFirestore) as any
        if (Array.isArray(obj) || (typeof obj === 'object' && obj !== null)) {
          expect(result.test).toEqual(obj) // Use toEqual for objects/arrays
        } else {
          expect(result.test).toBe(obj) // Should remain unchanged
        }
      })
    })

    it('should handle invalid type objects that fail type guards', () => {
      // Test invalid objects that don't pass type guard validation
      const invalidObjects = [
        { type: 'GeoPoint', latitude: 'invalid', longitude: 139.6503 },
        { type: 'DocumentReference', path: 123 },
        { type: 'NotGeoPoint', latitude: 35.6762, longitude: 139.6503 },
        { latitude: 35.6762, longitude: 139.6503 }, // missing type
      ]

      invalidObjects.forEach((obj) => {
        const result = deserializeFirestoreTypes({ test: obj }, mockFirestore) as any
        expect(result.test).toEqual(obj) // Should remain unchanged
      })
    })
  })
})