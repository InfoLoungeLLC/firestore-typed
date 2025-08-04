// Common test entities and data for unit tests
import { vi, type Mock } from 'vitest'

// =============================================================================
// TestEntity - Primary test entity
// =============================================================================
export interface TestEntity {
  id: string
  name: string
  email?: string
  age?: number
  status?: 'active' | 'inactive'
  createdAt?: Date
  updatedAt?: Date
  value?: number
  active?: boolean
}

export const createTestEntity = (overrides: Partial<TestEntity> = {}): TestEntity => ({
  id: 'test-id',
  name: 'Test User',
  email: 'test@example.com',
  age: 30,
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

// Factory for simple test scenarios (replaces SimpleTestEntity)
export const createSimpleTestEntity = (overrides: Partial<TestEntity> = {}): TestEntity => ({
  id: 'test-id',
  name: 'Test Entity',
  value: 42,
  active: true,
  ...overrides,
})

export const createTestEntityValidator = () => vi.fn((data) => data as TestEntity)
// Keep for backward compatibility, but now returns TestEntity validator
export const createSimpleTestEntityValidator = () => vi.fn((data) => data as TestEntity)

// =============================================================================
// TestPostEntity - For collection group tests
// =============================================================================
export interface TestPostEntity {
  id: string
  title: string
  content: string
  authorId: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export const createTestPostEntity = (overrides: Partial<TestPostEntity> = {}): TestPostEntity => ({
  id: 'post-1',
  title: 'Test Post',
  content: 'Test content',
  authorId: 'user-1',
  tags: ['test'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const createTestPostEntityValidator = () => vi.fn((data) => data as TestPostEntity)

// =============================================================================
// TaggedEntity - Extends TestEntity with tags
// =============================================================================
export interface TaggedEntity extends TestEntity {
  tags: string[]
}

export const createTaggedEntity = (overrides: Partial<TaggedEntity> = {}): TaggedEntity => ({
  ...createTestEntity(),
  tags: ['tag1', 'tag2'],
  ...overrides,
})

export const createTaggedEntityValidator = () => vi.fn((data) => data as TaggedEntity)

// =============================================================================
// ProductEntity - For firestore-typed unit tests
// =============================================================================
export interface ProductEntity {
  title: string
  price: number
}

export const createProductEntity = (overrides: Partial<ProductEntity> = {}): ProductEntity => ({
  title: 'Test Product',
  price: 99.99,
  ...overrides,
})

export const createProductEntityValidator = () => vi.fn((data) => data as ProductEntity)

// =============================================================================
// ArticleEntity - For firestore-typed unit tests
// =============================================================================
export interface ArticleEntity {
  id: string
  title: string
  published: boolean
}

export const createArticleEntity = (overrides: Partial<ArticleEntity> = {}): ArticleEntity => ({
  id: 'article-1',
  title: 'Test Article',
  published: true,
  ...overrides,
})

export const createArticleEntityValidator = () => vi.fn((data) => data as ArticleEntity)

// =============================================================================
// Common mock setup utilities
// =============================================================================
export const createBasicMockImplementations = () => ({
  mockSerializeFirestoreTypes: vi.fn((data) => data),
  mockDeserializeFirestoreTypes: vi.fn((data) => data),
  mockValidateData: vi.fn((data) => data),
})

export const resetAllMocks = (...mocks: Mock[]) => {
  vi.clearAllMocks()
  mocks.forEach((mock) => {
    if (mock.mockImplementation) {
      mock.mockImplementation((data) => data)
    }
  })
}
