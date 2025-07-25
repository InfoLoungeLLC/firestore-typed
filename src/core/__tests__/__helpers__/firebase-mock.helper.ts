// Mock Firebase types for testing
// This file provides simplified mock implementations that satisfy the basic interface requirements

// Define proper interfaces for type safety
interface MockDocumentData {
  [key: string]: unknown
}

interface MockDocumentRefMethods {
  id: string
  path: string
}

// Mock WriteResult for Firebase operations
export class MockWriteResult {
  constructor(public writeTime: MockTimestamp) {}
}

// Mock implementations of Firebase types to avoid importing real ones
export class MockTimestamp {
  constructor(
    public seconds: number,
    public nanoseconds: number,
  ) {}

  static fromDate(date: Date): MockTimestamp {
    const millis = date.getTime()
    const seconds = Math.floor(millis / 1000)
    const nanoseconds = (millis % 1000) * 1000000
    return new MockTimestamp(seconds, nanoseconds)
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + Math.floor(this.nanoseconds / 1000000))
  }
}

export class MockGeoPoint {
  constructor(
    public latitude: number,
    public longitude: number,
  ) {}
}

export class MockDocumentSnapshot<T = MockDocumentData> {
  constructor(
    public id: string,
    private _data: T | undefined,
    public exists: boolean,
  ) {}

  get ref(): MockDocumentRefMethods {
    return {
      id: this.id,
      path: `test-collection/${this.id}`,
    }
  }

  data(): T | undefined {
    return this._data
  }
}

export class MockQuerySnapshot<T = MockDocumentData> {
  constructor(
    public docs: MockDocumentSnapshot<T>[],
    public empty: boolean,
    public size: number,
  ) {}
}

export class MockDocumentReference {
  private static storage = new Map<string, MockDocumentData>()

  constructor(
    public id: string,
    public path: string,
    initialData: MockDocumentData | null = null,
  ) {
    if (initialData !== null) {
      MockDocumentReference.storage.set(this.path, initialData)
    }
  }

  get(): Promise<MockDocumentSnapshot<MockDocumentData>> {
    const data = MockDocumentReference.storage.get(this.path)
    return Promise.resolve(new MockDocumentSnapshot(this.id, data, data !== undefined))
  }

  set(data: MockDocumentData): Promise<MockWriteResult> {
    MockDocumentReference.storage.set(this.path, data)
    const writeTime = MockTimestamp.fromDate(new Date())
    return Promise.resolve(new MockWriteResult(writeTime))
  }

  delete(): Promise<MockWriteResult> {
    MockDocumentReference.storage.delete(this.path)
    const writeTime = MockTimestamp.fromDate(new Date())
    return Promise.resolve(new MockWriteResult(writeTime))
  }

  static reset(): void {
    MockDocumentReference.storage.clear()
  }
}

export class MockCollectionReference {
  private documents = new Map<string, MockDocumentData>()
  public firestore: MockFirestore

  constructor(
    public id: string,
    public path: string,
    firestore?: MockFirestore,
  ) {
    this.firestore = firestore || createMockFirestore()
  }

  doc(id: string): MockDocumentReference {
    const docPath = `${this.path}/${id}`
    const existingData = this.documents.get(id)
    const docRef = new MockDocumentReference(id, docPath, existingData ?? null)

    // Override set to also update the collection's internal storage
    const originalSet = docRef.set.bind(docRef)
    docRef.set = (data: MockDocumentData): Promise<MockWriteResult> => {
      const promise = originalSet(data)
      this.documents.set(id, data)
      return promise
    }

    // Override delete to also remove from collection's internal storage
    const originalDelete = docRef.delete.bind(docRef)
    docRef.delete = (): Promise<MockWriteResult> => {
      const promise = originalDelete()
      this.documents.delete(id)
      return promise
    }

    return docRef
  }

  add(data: MockDocumentData): Promise<MockDocumentReference> {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    this.documents.set(id, data)
    return Promise.resolve(new MockDocumentReference(id, `${this.path}/${id}`, data))
  }

  get(): Promise<MockQuerySnapshot<MockDocumentData>> {
    const docs = Array.from(this.documents.entries()).map(
      ([id, data]) => new MockDocumentSnapshot(id, data, true),
    )
    return Promise.resolve(new MockQuerySnapshot(docs, docs.length === 0, docs.length))
  }

  where(): MockQuery {
    return new MockQuery(this)
  }

  orderBy(): MockQuery {
    return new MockQuery(this)
  }

  limit(): MockQuery {
    return new MockQuery(this)
  }
}

export class MockQuery {
  constructor(private collection: MockCollectionReference) {}

  where(): MockQuery {
    return this
  }

  orderBy(): MockQuery {
    return this
  }

  limit(): MockQuery {
    return this
  }

  async get(): Promise<MockQuerySnapshot<MockDocumentData>> {
    return this.collection.get()
  }
}

export class MockFirestore {
  private collections = new Map<string, MockCollectionReference>()

  doc(path: string): MockDocumentReference {
    // Parse path like 'collections/docId' or 'collections/docId/subcollections/subdocId'
    const segments = path.split('/')
    const docId = segments[segments.length - 1] ?? 'default-doc'
    return new MockDocumentReference(docId, path)
  }

  collection(path: string): MockCollectionReference {
    const existingCollection = this.collections.get(path)
    if (existingCollection) {
      return existingCollection
    }
    
    const segments = path.split('/')
    const id = segments[segments.length - 1] ?? 'default'
    const newCollection = new MockCollectionReference(id, path, this)
    this.collections.set(path, newCollection)
    return newCollection
  }

  collectionGroup(): MockQuery {
    return new MockQuery(new MockCollectionReference('group', 'group', this))
  }
}

export const createMockFirestore = (): MockFirestore => {
  return new MockFirestore()
}

// Export mocked Timestamp and GeoPoint classes for tests
export const Timestamp = MockTimestamp
export const GeoPoint = MockGeoPoint

// Mock DocumentReference for type conversion tests
export class MockDocumentReferenceForTypeConversion {
  constructor(
    public path: string,
    public id: string,
  ) {}
}

// Common jest.mock configuration for firebase-admin/firestore
export const createFirebaseAdminMock = () => ({
  getFirestore: jest.fn(() => createMockFirestore()),
  Timestamp: MockTimestamp,
  GeoPoint: MockGeoPoint,
  DocumentReference: MockDocumentReferenceForTypeConversion,
})

// This is a helper file, not a test file - no tests needed here
