# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2025-01-26

### Added

- **Validation Library Support**: Added comprehensive test examples demonstrating typia and Zod validator integration
- **Development Tools**: Added automated typia code generation with `typia:generate` and `typia:postprocess` scripts
- **Complex Schema Examples**: Added real-world validation schemas for nested objects (UserProfile, Order, AnalyticsEvent)
- **Peer Dependencies**: Declared typia (^9.6.1) and Zod (^4.0.14) as optional peer dependencies for better dependency management

### Changed

- **Documentation**: Enhanced README with validation library alternatives and usage examples
- **Test Infrastructure**: Consolidated test helpers from `src/core/__tests__/__helpers__` to `src/__tests__/__helpers__` for project-wide accessibility
- **Integration Tests**: Improved test realism by using actual typia validators instead of manual validation logic
- **Package Keywords**: Added 'typia' and 'zod' keywords for better discoverability

### Fixed

- **TypeScript Compilation**: Fixed compilation errors with proper type assertions for optional test data properties
- **Test Error Handling**: Improved validation error testing to properly access original error details

### Internal

- **Test Organization**: Centralized all test utilities in global helpers directory for better maintainability
- **Code Quality**: Updated integration tests to use generated validators for more accurate validation testing
- **Development Workflow**: Streamlined typia code generation process with automated post-processing

## [0.5.0] - 2025-07-31

### Changed

- **Development Environment**: Migrated to ES modules for development by adding `"type": "module"` to package.json
- **Build Configuration**: Updated TypeScript configuration to use ESNext modules for development while maintaining dual CommonJS/ESM build output
- **Configuration Files**: Converted Prettier configuration from CommonJS to ES module format
- **CI Workflow**: Enhanced GitHub Actions workflow with:
  - Added npm cache for faster CI runs
  - Added formatting check step
  - Reorganized step order for better error visibility
  - Made lint, format check, and type check steps non-blocking with `continue-on-error`

### Fixed

- **Documentation**: Added Japanese documentation files (README.ja.md, CHANGELOG.ja.md) to npm package distribution

### Internal

- Updated development tooling to support ES modules
- Improved CI pipeline efficiency with caching
- Enhanced code quality checks in continuous integration

## [0.4.2] - 2025-07-28

### Added

- **Funding Support**: Added GitHub Sponsors funding information to package.json for InfoLoungeLLC organization

### Changed

- **Testing Framework**: Migrated from Jest to Vitest for improved performance and modern tooling
- **Build System**: Updated to use Vitest with v8 coverage provider for faster test execution
- **Code Quality**: Updated ESLint configuration and moved settings to top-level for better development experience

### Fixed

- **Test Coverage**: Improved test coverage for conditional branches in validation logic
- **Code Quality**: Enhanced test suite to cover edge cases in collection and document operations
- **Documentation**: Added descriptive comments to coverage ignore statements for defensive programming
- **Dependencies**: Updated typia peer dependency to ^9.6.0 (from >=5.3.0) with full backward compatibility maintained
- **Linting**: Fixed ESLint configuration issues and applied consistent code formatting

### Internal

- Replaced Jest with Vitest configuration and test utilities
- Updated all test files to use Vitest imports (`vi`, `describe`, `it`, `expect`)
- Migrated from `jest.mock()` to `vi.mock()` for mocking
- Added comprehensive tests for `validateOnRead: false` and `validateOnWrite: false` code paths
- Added test coverage for document merge operations with null existing data
- Removed redundant test cases to reduce code duplication
- Updated c8 ignore comments with defensive programming context
- Ensured @google-cloud/firestore optional dependency is properly available for TypeScript type checking
- Moved ESLint configuration to project root for improved IDE integration
- Applied Prettier formatting across entire codebase for consistency
- Restricted Codecov coverage uploads to main and develop branches only in CI workflow

## [0.4.1] - 2025-07-28

### Fixed

- **Tests**: Updated all deprecated `firestoreTyped()` calls to `getFirestoreTyped()` in test files
- **Code Quality**: Improved consistency by migrating test suite to use the new factory function

### Internal

- Test files now use the recommended `getFirestoreTyped()` function throughout
- Maintained backward compatibility test for the deprecated `firestoreTyped()` function

## [0.4.0] - 2025-07-28

### Added

- **New Factory Function**: Added `getFirestoreTyped()` function for consistency with Firebase naming conventions
- **Custom Firestore Instance Support**: `getFirestoreTyped()` now accepts an optional Firestore instance as the first parameter for multi-project scenarios

### Changed

- **Factory Function**: `firestoreTyped()` is now deprecated in favor of `getFirestoreTyped()`
- **API Enhancement**: Enhanced support for custom Firestore instances and databases

### Example

```typescript
// Using default Firestore instance
const db = getFirestoreTyped();

// Using custom Firestore instance
const customApp = initializeApp(customConfig, 'custom');
const customFirestore = getFirestore(customApp);
const customDb = getFirestoreTyped(customFirestore);

// With options
const dbWithOptions = getFirestoreTyped(undefined, { validateOnRead: true });
```

### Deprecated

- `firestoreTyped()` function is deprecated but remains available for backward compatibility
- All test files updated to use the new `getFirestoreTyped()` function

## [0.3.1] - 2025-07-26

### Fixed

- **Documentation**: Updated README.md and README.ja.md to reflect firebase-admin v13.4.0 compatibility
- **Compatibility Notes**: Removed outdated v13 incompatibility warnings from documentation

### Internal

- Documentation synchronization to match actual firebase-admin v13.4.0 support status

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
