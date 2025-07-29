// Common test entities and data for unit tests
import { vi, type Mock } from 'vitest'

export interface TestEntity {
  id: string
  name: string
  email: string
  age: number
  status?: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface TestPostEntity {
  id: string
  title: string
  content: string
  authorId: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
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

// Common mock setup utilities
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
