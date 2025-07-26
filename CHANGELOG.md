# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-07-26

### Changed

**BREAKING CHANGE**: Minimum firebase-admin version requirement updated.

- **firebase-admin**: Updated peer dependency from `>=12.7.0 <13.0.0` to `^13.4.0`
- **Compatibility**: Verified full compatibility with firebase-admin v13.4.0 and @google-cloud/firestore v7.11.3

### Added

- Support for firebase-admin v13.x series (13.4.0 and above)
- Enhanced stability with latest Google Cloud Firestore package

### Removed

- **GitHub Deployment Tracking**: Removed unnecessary GitHub deployment creation from release workflow
- **Release Workflow**: Simplified to focus only on npm publishing

### Technical Details

- All 209 tests passing with firebase-admin v13.4.0
- No TypeScript/ESLint compatibility issues found
- Previous v13 type inference problems appear to be resolved in later versions

### Migration Guide

Users upgrading from v0.2.x:
- Update firebase-admin to version 13.4.0 or higher
- No code changes required - API remains the same

## [0.2.1] - 2025-07-26

### Fixed

- **Release Workflow**: Added `deployments: write` permission to fix GitHub Actions deployment creation error
- **Version**: Bumped package version to 0.2.1

### Internal

- Fixed GitHub Actions permissions issue that prevented successful deployment tracking during npm publish

## [0.2.0] - 2025-07-26

### Changed

**BREAKING CHANGES**: This release introduces a major architectural redesign that changes how validators are handled.

- **Collection-level validators**: Validators are now passed to individual `collection()` and `collectionGroup()` method calls instead of the FirestoreTyped constructor
- **Single instance flexibility**: One FirestoreTyped instance can now handle multiple entity types with different validators
- **Simplified factory function**: `firestoreTyped()` no longer requires a validator parameter

### Migration Guide

**Before (v0.1.x):**
```typescript
const userDb = firestoreTyped({ validator: userValidator });
const userCollection = userDb.collection<UserEntity>('users');

const productDb = firestoreTyped({ validator: productValidator });
const productCollection = productDb.collection<ProductEntity>('products');
```

**After (v0.2.0):**
```typescript
const db = firestoreTyped();
const userCollection = db.collection<UserEntity>('users', userValidator);
const productCollection = db.collection<ProductEntity>('products', productValidator);
```

### Added

- `collectionGroup()` method now supports validator parameter for cross-collection queries
- Enhanced type safety with collection-specific validators
- Better performance by eliminating need for multiple FirestoreTyped instances

### Benefits

- **Simplified setup**: Single database instance for multiple entity types
- **Better resource utilization**: Reduced memory footprint and connection overhead
- **Enhanced flexibility**: Mix different validators in the same application instance
- **Improved developer experience**: More intuitive API that aligns with Firestore's native patterns

### Dependencies

- **firebase-admin**: Compatible with v12.7.0 and later v12.x versions. **Note**: v13.x is not currently supported due to TypeScript/ESLint compatibility issues encountered during testing. See [issue tracking](https://github.com/InfoLoungeLLC/firestore-typed/issues) for updates on v13.x support.

## [0.1.0] - 2025-07-25

### Added
- Initial beta release
- Type-safe wrapper for Firebase Firestore
- Automatic validation with typia
- Support for Date to Timestamp conversion
- Support for SerializedGeoPoint and SerializedDocumentReference
- Comprehensive error handling
- TypeScript strict mode support
- Full test coverage
