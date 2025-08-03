import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CollectionReference } from '../../collection'
import type { FirestoreTypedOptionsProvider } from '../../../types/firestore-typed.types'
import {
  createUserProfileValidator,
  createOrderValidator,
  createAnalyticsEventValidator,
  type UserProfile,
  type Order,
  type AnalyticsEvent,
} from '../__helpers__/zod-schemas.helper'

// Mock Firebase modules
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
    delete: vi.fn(() => ({ _methodName: 'delete' })),
    increment: vi.fn((n: number) => ({ _methodName: 'increment', _operand: n })),
  },
}))

vi.mock('../../../utils/firestore-converter', () => ({
  serializeFirestoreTypes: vi.fn((data) => data),
  deserializeFirestoreTypes: vi.fn((data) => data),
}))

describe('CollectionReference with Zod validators', () => {
  let mockFirebaseCollection: any
  let mockFirestoreTyped: FirestoreTypedOptionsProvider

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Firebase collection
    mockFirebaseCollection = {
      id: 'test-collection',
      path: 'test-collection',
      doc: vi.fn(),
      add: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      get: vi.fn(),
    }

    // Mock FirestoreTyped options
    mockFirestoreTyped = {
      getOptions: () => ({
        validateOnWrite: true,
        validateOnRead: true,
        transformTimestamps: true,
      }),
    }
  })

  describe('UserProfile validation with complex nested objects', () => {
    let userCollection: CollectionReference<UserProfile>

    beforeEach(() => {
      userCollection = new CollectionReference(
        mockFirebaseCollection,
        mockFirestoreTyped,
        createUserProfileValidator(),
      )
    })

    it('should successfully validate valid user profile with all fields', async () => {
      const validUserProfile: UserProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'Johnny',
          avatar: {
            url: 'https://example.com/avatar.jpg',
            width: 256,
            height: 256,
            thumbnails: [
              { size: 'small', url: 'https://example.com/avatar-small.jpg' },
              { size: 'medium', url: 'https://example.com/avatar-medium.jpg' },
            ],
          },
          bio: 'Software developer with passion for TypeScript',
          location: {
            country: 'US',
            city: 'San Francisco',
            timezone: 'America/Los_Angeles',
          },
        },
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
            marketing: false,
          },
          privacy: {
            profileVisible: true,
            emailVisible: false,
          },
        },
        subscription: {
          tier: 'premium',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          features: ['advanced-analytics', 'priority-support'],
          billing: {
            amount: 99.99,
            currency: 'USD',
            interval: 'yearly',
            nextBillingDate: new Date('2024-12-31'),
          },
        },
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01'),
          lastLoginAt: new Date('2024-06-01'),
          loginCount: 42,
          isVerified: true,
          tags: ['developer', 'enterprise'],
          customFields: {
            department: 'Engineering',
            manager: 'Jane Smith',
          },
        },
        permissions: [
          {
            resource: 'projects',
            actions: ['read', 'write'],
            conditions: { department: 'Engineering' },
          },
        ],
      }

      const mockDocRef = { id: 'new-user-id' }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      const result = await userCollection.add(validUserProfile)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(validUserProfile)
      expect(result.id).toBe('new-user-id')
    })

    it('should reject invalid email format', async () => {
      const invalidUserProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'not-an-email', // Invalid email
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: { email: true, push: true, marketing: false },
          privacy: { profileVisible: true, emailVisible: false },
        },
        subscription: {
          tier: 'free',
          startDate: new Date(),
          features: [],
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          loginCount: 0,
          isVerified: false,
          tags: [],
        },
        permissions: [],
      }

      await expect(userCollection.add(invalidUserProfile as any)).rejects.toThrow()
      expect(mockFirebaseCollection.add).not.toHaveBeenCalled()
    })

    it('should reject invalid UUID format', async () => {
      const invalidUserProfile = {
        id: 'invalid-uuid', // Invalid UUID
        email: 'user@example.com',
        profile: { firstName: 'John', lastName: 'Doe' },
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: { email: true, push: true, marketing: false },
          privacy: { profileVisible: true, emailVisible: false },
        },
        subscription: { tier: 'free', startDate: new Date(), features: [] },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          loginCount: 0,
          isVerified: false,
          tags: [],
        },
        permissions: [],
      }

      await expect(userCollection.add(invalidUserProfile as any)).rejects.toThrow()
    })

    it('should validate with minimal required fields', async () => {
      const minimalUserProfile: UserProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'minimal@example.com',
        profile: {
          firstName: 'Min',
          lastName: 'User',
        },
        preferences: {
          language: 'en',
          theme: 'auto',
          notifications: { email: true, push: true, marketing: false },
          privacy: { profileVisible: true, emailVisible: false },
        },
        subscription: {
          tier: 'free',
          startDate: new Date(),
          features: [],
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          loginCount: 0,
          isVerified: false,
          tags: [],
        },
        permissions: [],
      }

      const mockDocRef = { id: 'minimal-user-id' }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      const result = await userCollection.add(minimalUserProfile)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(minimalUserProfile)
      expect(result.id).toBe('minimal-user-id')
    })
  })

  describe('Order validation with complex pricing and line items', () => {
    let orderCollection: CollectionReference<Order>

    beforeEach(() => {
      orderCollection = new CollectionReference(
        mockFirebaseCollection,
        mockFirestoreTyped,
        createOrderValidator(),
      )
    })

    it('should validate complex order with multiple items and pricing', async () => {
      const validOrder: Order = {
        id: '67890',
        orderNumber: 'ORD-20241201-ABC',
        customer: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'customer@example.com',
          name: 'Jane Customer',
          phone: '+1234567890',
        },
        items: [
          {
            id: 'item-1',
            productId: 'prod-123',
            sku: 'SKU-SHIRT-RED-L',
            name: 'Red T-Shirt',
            description: 'Comfortable cotton t-shirt',
            category: {
              id: 'cat-clothing',
              name: 'Clothing',
              path: ['Fashion', 'Clothing', 'T-Shirts'],
            },
            price: {
              unit: 29.99,
              currency: 'USD',
              discount: {
                type: 'percentage',
                value: 0.1,
                reason: 'Summer sale',
              },
            },
            quantity: 2,
            variants: { color: 'red', size: 'L' },
            metadata: {
              weight: 0.2,
              dimensions: { length: 30, width: 20, height: 1, unit: 'cm' },
              taxable: true,
            },
          },
        ],
        pricing: {
          subtotal: 53.98,
          tax: { amount: 5.4, rate: 0.1 },
          shipping: { amount: 9.99, method: 'standard', carrier: 'USPS' },
          discounts: [],
          total: 69.37,
          currency: 'USD',
        },
        status: {
          current: 'processing',
          history: [
            {
              status: 'pending',
              timestamp: new Date('2024-01-01T10:00:00Z'),
              note: 'Order received',
            },
            {
              status: 'processing',
              timestamp: new Date('2024-01-01T11:00:00Z'),
              note: 'Payment confirmed',
            },
          ],
        },
        addresses: {
          billing: {
            name: 'Jane Customer',
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US',
          },
          shipping: {
            name: 'Jane Customer',
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US',
            instructions: 'Leave at door',
          },
        },
        payment: {
          method: 'credit_card',
          status: 'captured',
          transactionId: 'txn_123456789',
          gateway: 'stripe',
        },
        metadata: {
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
          source: 'web',
          campaign: 'summer-sale',
        },
      }

      const mockDocRef = { id: 'order-123' }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      const result = await orderCollection.add(validOrder)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(validOrder)
      expect(result.id).toBe('order-123')
    })

    it('should reject invalid order number format', async () => {
      const invalidOrder = {
        id: '67890',
        orderNumber: 'INVALID-ORDER-NUMBER', // Invalid format
        customer: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'customer@example.com',
          name: 'Jane Customer',
        },
        items: [
          {
            id: 'item-1',
            productId: 'prod-123',
            sku: 'SKU-SHIRT',
            name: 'T-Shirt',
            category: { id: 'cat-1', name: 'Clothing', path: ['Fashion'] },
            price: { unit: 29.99, currency: 'USD' },
            quantity: 1,
          },
        ],
        pricing: {
          subtotal: 29.99,
          tax: { amount: 3.0, rate: 0.1 },
          shipping: { amount: 5.0, method: 'standard' },
          discounts: [],
          total: 37.99,
          currency: 'USD',
        },
        status: { current: 'pending', history: [] },
        addresses: {
          billing: {
            name: 'Jane',
            line1: '123 St',
            city: 'City',
            postalCode: '12345',
            country: 'US',
          },
          shipping: {
            name: 'Jane',
            line1: '123 St',
            city: 'City',
            postalCode: '12345',
            country: 'US',
          },
        },
        payment: { method: 'credit_card', status: 'pending', gateway: 'stripe' },
        metadata: { createdAt: new Date(), updatedAt: new Date(), source: 'web' },
      }

      await expect(orderCollection.add(invalidOrder as any)).rejects.toThrow()
    })

    it('should reject empty items array', async () => {
      const invalidOrder = {
        id: '67890',
        orderNumber: 'ORD-20241201-ABC',
        customer: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'customer@example.com',
          name: 'Jane Customer',
        },
        items: [], // Empty items array - should be rejected
        pricing: {
          subtotal: 0,
          tax: { amount: 0, rate: 0 },
          shipping: { amount: 5.0, method: 'standard' },
          discounts: [],
          total: 5.0,
          currency: 'USD',
        },
        status: { current: 'pending', history: [] },
        addresses: {
          billing: {
            name: 'Jane',
            line1: '123 St',
            city: 'City',
            postalCode: '12345',
            country: 'US',
          },
          shipping: {
            name: 'Jane',
            line1: '123 St',
            city: 'City',
            postalCode: '12345',
            country: 'US',
          },
        },
        payment: { method: 'credit_card', status: 'pending', gateway: 'stripe' },
        metadata: { createdAt: new Date(), updatedAt: new Date(), source: 'web' },
      }

      await expect(orderCollection.add(invalidOrder as any)).rejects.toThrow()
    })
  })

  describe('AnalyticsEvent validation with device and location data', () => {
    let analyticsCollection: CollectionReference<AnalyticsEvent>

    beforeEach(() => {
      analyticsCollection = new CollectionReference(
        mockFirebaseCollection,
        mockFirestoreTyped,
        createAnalyticsEventValidator(),
      )
    })

    it('should validate analytics event with comprehensive tracking data', async () => {
      const validEvent: AnalyticsEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        event: {
          name: 'product_purchase',
          category: 'conversion',
          action: 'purchase',
          label: 'premium_subscription',
          value: 99.99,
        },
        page: {
          url: 'https://example.com/checkout',
          title: 'Checkout - Example Store',
          path: '/checkout',
          referrer: 'https://google.com/search',
          search: '?utm_source=google',
        },
        user: {
          id: 'user-123',
          anonymousId: '550e8400-e29b-41d4-a716-446655440003',
          traits: {
            email: 'user@example.com',
            name: 'John Doe',
            segment: 'premium_users',
            cohort: '2024-q1',
          },
        },
        device: {
          type: 'desktop',
          category: 'computer',
          vendor: 'Apple',
          model: 'MacBook Pro',
          os: { name: 'macOS', version: '14.1' },
          browser: { name: 'Chrome', version: '119.0', engine: 'Blink' },
          screen: { width: 1920, height: 1080, density: 2.0 },
        },
        location: {
          ip: '192.168.1.1',
          country: 'US',
          region: 'California',
          city: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194,
          timezone: 'America/Los_Angeles',
        },
        context: {
          campaign: {
            name: 'black_friday_2024',
            source: 'google',
            medium: 'cpc',
            term: 'saas software',
            content: 'ad_variant_a',
          },
          ab_tests: [
            { experiment: 'checkout_flow_v2', variant: 'treatment' },
            { experiment: 'pricing_display', variant: 'control' },
          ],
          custom: {
            feature_flags: ['new_ui', 'enhanced_analytics'],
            user_tier: 'premium',
          },
        },
        properties: {
          product_id: 'premium_annual',
          revenue: 99.99,
          currency: 'USD',
          items_count: 1,
          is_new_customer: false,
          discount_applied: true,
          coupon_code: 'BLACKFRIDAY2024',
        },
        timestamp: new Date('2024-01-01T12:00:00Z'),
        receivedAt: new Date('2024-01-01T12:00:01Z'),
      }

      const mockDocRef = { id: 'event-123' }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      const result = await analyticsCollection.add(validEvent)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(validEvent)
      expect(result.id).toBe('event-123')
    })

    it('should reject invalid IP address format', async () => {
      const invalidEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
        event: {
          name: 'page_view',
          category: 'page_view',
          action: 'view',
        },
        page: {
          url: 'https://example.com',
          title: 'Home',
          path: '/',
        },
        user: {
          anonymousId: '550e8400-e29b-41d4-a716-446655440003',
        },
        device: {
          type: 'desktop',
          os: { name: 'Windows' },
          browser: { name: 'Chrome' },
        },
        location: {
          ip: 'not-an-ip-address', // Invalid IP
          country: 'US',
        },
        context: {},
        timestamp: new Date(),
        receivedAt: new Date(),
      }

      await expect(analyticsCollection.add(invalidEvent as any)).rejects.toThrow()
    })

    it('should reject invalid latitude/longitude values', async () => {
      const invalidEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
        event: {
          name: 'page_view',
          category: 'page_view',
          action: 'view',
        },
        page: {
          url: 'https://example.com',
          title: 'Home',
          path: '/',
        },
        user: {
          anonymousId: '550e8400-e29b-41d4-a716-446655440003',
        },
        device: {
          type: 'mobile',
          os: { name: 'iOS' },
          browser: { name: 'Safari' },
        },
        location: {
          ip: '192.168.1.1',
          country: 'US',
          latitude: 91.0, // Invalid latitude (must be -90 to 90)
          longitude: -122.4194,
        },
        context: {},
        timestamp: new Date(),
        receivedAt: new Date(),
      }

      await expect(analyticsCollection.add(invalidEvent as any)).rejects.toThrow()
    })
  })

  describe('Zod error handling and edge cases', () => {
    let userCollection: CollectionReference<UserProfile>

    beforeEach(() => {
      userCollection = new CollectionReference(
        mockFirebaseCollection,
        mockFirestoreTyped,
        createUserProfileValidator(),
      )
    })

    it('should handle validation when validateOnWrite is disabled', async () => {
      // Disable validation
      mockFirestoreTyped.getOptions = () => ({
        validateOnWrite: false,
        validateOnRead: true,
        transformTimestamps: true,
      })

      const invalidData = {
        id: 'not-a-uuid',
        email: 'not-an-email',
        profile: { firstName: 'Test' },
      }

      const mockDocRef = { id: 'bypass-validation' }
      mockFirebaseCollection.add.mockResolvedValue(mockDocRef)

      // Should not throw even with invalid data when validation is disabled
      const result = await userCollection.add(invalidData as any)

      expect(mockFirebaseCollection.add).toHaveBeenCalledWith(invalidData)
      expect(result.id).toBe('bypass-validation')
    })

    it('should provide detailed error messages for nested validation failures', async () => {
      const invalidUserProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        profile: {
          firstName: '', // Empty string should fail min(1) validation
          lastName: 'Doe',
        },
        preferences: {
          language: 'invalid_language', // Invalid enum value
          theme: 'dark',
          notifications: { email: true, push: true, marketing: false },
          privacy: { profileVisible: true, emailVisible: false },
        },
        subscription: {
          tier: 'free',
          startDate: new Date(),
          features: [],
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          loginCount: -1, // Negative value should fail nonnegative validation
          isVerified: false,
          tags: [],
        },
        permissions: [],
      }

      try {
        await userCollection.add(invalidUserProfile as any)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error).toBeDefined()
        // Check that we got a FirestoreTypedValidationError with original Zod error
        expect((error as any).name).toBe('FirestoreTypedValidationError')
        expect((error as any).originalError).toBeDefined()
        // Zod provides detailed error information in the original error
        const originalError = (error as any).originalError
        expect(originalError.message || originalError.toString()).toContain('min')
      }
    })
  })
})
