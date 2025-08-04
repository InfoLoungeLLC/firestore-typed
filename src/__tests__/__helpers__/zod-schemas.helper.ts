// Complex Zod schemas for testing
import { z } from 'zod'

// =============================================================================
// User Entity - Complex user profile with nested objects
// =============================================================================
export const UserProfileSchema = z.object({
  id: z.uuidv4(),
  email: z.email(),
  profile: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    displayName: z.string().optional(),
    avatar: z
      .object({
        url: z.url(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        thumbnails: z
          .array(
            z.object({
              size: z.enum(['small', 'medium', 'large']),
              url: z.url(),
            }),
          )
          .optional(),
      })
      .optional(),
    bio: z.string().max(500).optional(),
    location: z
      .object({
        country: z.string().length(2), // ISO country code
        city: z.string().optional(),
        timezone: z.string().optional(),
      })
      .optional(),
  }),
  preferences: z.object({
    language: z.enum(['en', 'ja', 'fr', 'de', 'es']).default('en'),
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      marketing: z.boolean().default(false),
    }),
    privacy: z.object({
      profileVisible: z.boolean().default(true),
      emailVisible: z.boolean().default(false),
    }),
  }),
  subscription: z.object({
    tier: z.enum(['free', 'premium', 'enterprise']),
    startDate: z.date(),
    endDate: z.date().optional(),
    features: z.array(z.string()),
    billing: z
      .object({
        amount: z.number().positive(),
        currency: z.string().length(3), // ISO currency code
        interval: z.enum(['monthly', 'yearly']),
        nextBillingDate: z.date().optional(),
      })
      .optional(),
  }),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    lastLoginAt: z.date().optional(),
    loginCount: z.number().int().nonnegative().default(0),
    isVerified: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    customFields: z.record(z.string(), z.unknown()).optional(),
  }),
  permissions: z
    .array(
      z.object({
        resource: z.string(),
        actions: z.array(z.enum(['read', 'write', 'delete', 'admin'])),
        conditions: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .default([]),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

// =============================================================================
// E-commerce Order - Complex order with line items and calculations
// =============================================================================
export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string().regex(/^ORD-\d{8}-[A-Z]{3}$/), // ORD-20241201-ABC
  customer: z.object({
    id: z.uuidv4(),
    email: z.email(),
    name: z.string(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(), // E.164 format
  }),
  items: z
    .array(
      z.object({
        id: z.string(),
        productId: z.string(),
        sku: z.string(),
        name: z.string(),
        description: z.string().optional(),
        category: z.object({
          id: z.string(),
          name: z.string(),
          path: z.array(z.string()), // Category hierarchy path
        }),
        price: z.object({
          unit: z.number().positive(),
          currency: z.string().length(3),
          discount: z
            .object({
              type: z.enum(['percentage', 'fixed']),
              value: z.number().nonnegative(),
              reason: z.string().optional(),
            })
            .optional(),
        }),
        quantity: z.number().int().positive(),
        variants: z.record(z.string(), z.string()).optional(), // color: red, size: L
        metadata: z
          .object({
            weight: z.number().positive().optional(),
            dimensions: z
              .object({
                length: z.number().positive(),
                width: z.number().positive(),
                height: z.number().positive(),
                unit: z.enum(['cm', 'in']),
              })
              .optional(),
            taxable: z.boolean().default(true),
          })
          .optional(),
      }),
    )
    .min(1),
  pricing: z.object({
    subtotal: z.number().nonnegative(),
    tax: z.object({
      amount: z.number().nonnegative(),
      rate: z.number().min(0).max(1), // 0.0 to 1.0
      breakdown: z
        .array(
          z.object({
            name: z.string(),
            rate: z.number().min(0).max(1),
            amount: z.number().nonnegative(),
          }),
        )
        .optional(),
    }),
    shipping: z.object({
      amount: z.number().nonnegative(),
      method: z.string(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
    }),
    discounts: z
      .array(
        z.object({
          code: z.string(),
          description: z.string(),
          amount: z.number().positive(),
          type: z.enum(['percentage', 'fixed', 'shipping']),
        }),
      )
      .default([]),
    total: z.number().positive(),
    currency: z.string().length(3),
  }),
  status: z.object({
    current: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    history: z.array(
      z.object({
        status: z.string(),
        timestamp: z.date(),
        note: z.string().optional(),
        updatedBy: z.string().optional(),
      }),
    ),
  }),
  addresses: z.object({
    billing: z.object({
      name: z.string(),
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string(),
      country: z.string().length(2),
      phone: z.string().optional(),
    }),
    shipping: z.object({
      name: z.string(),
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string(),
      country: z.string().length(2),
      phone: z.string().optional(),
      instructions: z.string().optional(),
    }),
  }),
  payment: z.object({
    method: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto']),
    status: z.enum(['pending', 'authorized', 'captured', 'failed', 'refunded']),
    transactionId: z.string().optional(),
    gateway: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  fulfillment: z
    .object({
      warehouse: z.string().optional(),
      estimatedDelivery: z.date().optional(),
      actualDelivery: z.date().optional(),
      tracking: z
        .object({
          number: z.string(),
          url: z.url().optional(),
          carrier: z.string(),
        })
        .optional(),
    })
    .optional(),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    source: z.enum(['web', 'mobile', 'api', 'admin']).default('web'),
    campaign: z.string().optional(),
    referrer: z.string().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.ipv4().optional(),
  }),
})

export type Order = z.infer<typeof OrderSchema>

// =============================================================================
// Event Analytics - Complex event tracking with nested data
// =============================================================================
export const AnalyticsEventSchema = z.object({
  id: z.uuidv4(),
  sessionId: z.uuidv4(),
  userId: z.uuidv4().optional(),
  event: z.object({
    name: z.string().min(1),
    category: z.enum(['page_view', 'user_action', 'conversion', 'error', 'custom']),
    action: z.string(),
    label: z.string().optional(),
    value: z.number().optional(),
  }),
  page: z.object({
    url: z.url(),
    title: z.string(),
    path: z.string(),
    referrer: z.url().optional(),
    search: z.string().optional(),
    hash: z.string().optional(),
  }),
  user: z.object({
    id: z.string().optional(),
    anonymousId: z.uuidv4(),
    traits: z
      .object({
        email: z.email().optional(),
        name: z.string().optional(),
        segment: z.string().optional(),
        cohort: z.string().optional(),
      })
      .optional(),
  }),
  device: z.object({
    type: z.enum(['desktop', 'mobile', 'tablet', 'tv', 'wearable']),
    category: z.enum(['phone', 'computer', 'tablet', 'smarttv', 'wearable', 'gaming']).optional(),
    vendor: z.string().optional(),
    model: z.string().optional(),
    os: z.object({
      name: z.string(),
      version: z.string().optional(),
    }),
    browser: z.object({
      name: z.string(),
      version: z.string().optional(),
      engine: z.string().optional(),
    }),
    screen: z
      .object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        density: z.number().positive().optional(),
      })
      .optional(),
  }),
  location: z
    .object({
      ip: z.ipv4(),
      country: z.string().length(2),
      region: z.string().optional(),
      city: z.string().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  context: z.object({
    campaign: z
      .object({
        name: z.string(),
        source: z.string(),
        medium: z.string(),
        term: z.string().optional(),
        content: z.string().optional(),
      })
      .optional(),
    ab_tests: z
      .array(
        z.object({
          experiment: z.string(),
          variant: z.string(),
        }),
      )
      .default([]),
    custom: z.record(z.string(), z.unknown()).optional(),
  }),
  properties: z
    .record(
      z.string(),
      z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.unknown()),
        z.record(z.string(), z.unknown()),
      ]),
    )
    .optional(),
  timestamp: z.date(),
  receivedAt: z.date(),
})

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>

// =============================================================================
// Zod validator creation functions
// =============================================================================
export const createUserProfileValidator =
  () =>
  (data: unknown): UserProfile => {
    return UserProfileSchema.parse(data)
  }

export const createOrderValidator =
  () =>
  (data: unknown): Order => {
    return OrderSchema.parse(data)
  }

export const createAnalyticsEventValidator =
  () =>
  (data: unknown): AnalyticsEvent => {
    return AnalyticsEventSchema.parse(data)
  }
