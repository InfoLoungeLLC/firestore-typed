// Typia validators for test entities
import typia from 'typia'
import type {
  TestEntity,
  TestPostEntity,
  TaggedEntity,
  ProductEntity,
  ArticleEntity,
} from '../test-entities.helper'

// =============================================================================
// TestEntity validators
// =============================================================================
export const validateTestEntity = typia.createAssert<TestEntity>()

// =============================================================================
// TestPostEntity validators
// =============================================================================
export const validateTestPostEntity = typia.createAssert<TestPostEntity>()

// =============================================================================
// TaggedEntity validators
// =============================================================================
export const validateTaggedEntity = typia.createAssert<TaggedEntity>()

// =============================================================================
// ProductEntity validators
// =============================================================================
export const validateProductEntity = typia.createAssert<ProductEntity>()

// =============================================================================
// ArticleEntity validators
// =============================================================================
export const validateArticleEntity = typia.createAssert<ArticleEntity>()
