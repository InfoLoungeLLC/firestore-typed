# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Build
```bash
npm run build         # Compile TypeScript to JavaScript using tsdown
npm run build:watch   # Watch mode for development using tsdown
```

Note: This project uses tsdown instead of traditional tsc for faster builds and modern output formats (CommonJS and ESM).

### Testing
```bash
npm test                    # Run unit/integration tests only (excludes emulator tests)
npm run test:watch          # Watch mode for unit/integration tests
npm run test:coverage       # Generate coverage report (excludes emulator tests)
npm run test:emulator       # Run Firebase emulator tests only
npm run test:emulator:watch # Watch mode for emulator tests
npm test -- path/to/test.ts # Run specific test file

# Run specific test pattern
npm test -- --grep "pattern"
# Run tests in a specific directory
npm test -- src/core/__tests__/unit/
```

**Note**: Tests automatically run `typia:generate` before execution to generate validator code.

### Firebase Emulator (for emulator tests)
```bash
npm run emulators:start     # Start Firebase emulator (required for emulator tests)
# Emulator UI available at http://localhost:4000
# Firestore emulator runs on port 8080
```

### Linting & Formatting
```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting errors
npm run format       # Format code with Prettier
npm run format:check # Check if code is properly formatted
npm run typecheck    # Run TypeScript type checking without emitting files
```

## Code Architecture

### Core Concept
FirestoreTyped is a type-safe wrapper for Firebase Firestore that **mandates runtime validation** for all operations. Unlike raw Firestore, every piece of data must be validated using a validator function (typically typia).

**Key Differentiator**: While raw Firestore allows any data structure, FirestoreTyped requires a validator function for each collection, ensuring data integrity at runtime.

### Key Design Principles
1. **Validator-First Architecture**: All instances require a validator function at initialization
2. **Type Safety + Runtime Safety**: Combines TypeScript compile-time checks with runtime validation
3. **Low-Level Wrapper**: Direct mapping to Firestore's native API patterns
4. **Minimal Overhead**: Performance-optimized with configurable validation

### Core Structure
```
src/
├── core/                    # Core implementation classes
│   ├── firestore-typed.ts   # Main FirestoreTyped class
│   ├── collection.ts        # CollectionReference implementation
│   ├── document.ts          # DocumentReference implementation
│   ├── query.ts             # Query builder implementation
│   └── collection-group.ts  # Collection group queries
├── types/                   # TypeScript interfaces and types
│   └── firestore-typed.types.ts  # All type definitions
├── errors/                  # Custom error classes
│   └── errors.ts           # All error implementations
├── utils/                   # Utility functions
│   ├── firestore-converter.ts  # Type conversion logic
│   └── validator.ts            # Validation utilities
└── index.ts                # Public API exports
```

### Public API
```typescript
// Main entry point (recommended)
import { getFirestoreTyped } from '@info-lounge/firestore-typed'

// Core classes available for advanced usage
import { FirestoreTyped, CollectionReference, DocumentReference, Query, CollectionGroup } from '@info-lounge/firestore-typed'
```

### Data Flow
1. **Write Operations**: User Data → Validation → Type Conversion → Firestore
2. **Read Operations**: Firestore → Type Conversion → Validation → User Data

### Important Type Conversions
- `Date` → `Timestamp` (loses nanosecond precision)
- `SerializedGeoPoint` → `GeoPoint`
- `SerializedDocumentReference<TCollection, TDocument>` → `DocumentReference`

### Testing Strategy
The codebase uses a three-tiered testing approach:

#### Test Types and Structure
- **Unit Tests**: Mock Firebase SDK, test individual components in isolation
  - Located in `__tests__/unit/` subdirectories
  - Use `.unit.test.ts` naming convention
  - Run with `npm test` (default, fast execution)

- **Integration Tests**: Test interactions between components with mocked Firebase
  - Located in root `__tests__/` directories  
  - Use `.integration.test.ts` naming convention
  - Run with `npm test` (included in default test suite)

- **Emulator Tests**: Test with real Firebase Firestore emulator
  - Located in `__tests__/emulator/` subdirectories
  - Use `.emulator.test.ts` naming convention  
  - Run with `npm run test:emulator` (requires Firebase emulator)
  - **Separate execution**: Excluded from default `npm test` for CI/CD compatibility

#### Test Organization
```
src/
├── core/__tests__/
│   ├── unit/                    # Unit tests with mocked Firebase
│   │   ├── *.unit.test.ts
│   └── emulator/                # Real Firestore emulator tests
│       ├── *.emulator.test.ts
├── utils/__tests__/unit/        # Utility function unit tests
├── errors/__tests__/unit/       # Error class unit tests
└── __tests__/                   # Integration tests
    ├── *.integration.test.ts
```

#### Key Testing Utilities
- Helper files in `__tests__/__helpers__/` directories
- Shared test entities and validators in `test-entities.helper.ts`
- Firebase emulator setup/teardown in `emulator-setup.helper.ts`
- Mock factory functions in `firebase-mock.helper.ts`

### TypeScript Configuration Notes
- Target: ESNext
- Module: ESNext with bundler resolution
- Strict mode enabled
- Build tool: tsdown (replaces traditional tsc compilation)
- Currently **NOT** configured for typia transforms (users must set up ts-patch)

### Validation Library
Primary support for typia validators, but accepts any function with signature `(data: unknown) => T` that throws on validation failure. Zod is also tested and verified to work as an alternative validation library.

## Firebase Emulator Configuration

### Setup
- Firebase emulator configuration in `firebase.json`
- Firestore emulator runs on port 8080
- Emulator UI available at http://localhost:4000
- Dedicated vitest configuration in `vitest.emulator.config.ts`

### Emulator Test Architecture
- **Isolation**: Each test cleans up its own data using try/finally blocks
- **Unique Collections**: Tests use timestamped collection names to avoid conflicts
- **Real I/O Operations**: Tests actual Firestore write/read operations, not mocks
- **Automatic Cleanup**: Recursive deletion handles subcollections properly

### When to Use Emulator Tests
- Testing real Firestore operations (CRUD, queries, transactions)
- Validating collection group queries across multiple collections
- Testing complex document structures and relationships
- Verifying type conversion with actual Firestore data serialization

## Development Workflow

### Common Patterns

#### Adding a New Validator Type
1. Create the type interface in your code
2. Create the validator using typia: `typia.createAssert<YourType>()`
3. Use with collection: `db.collection<YourType>('path', validator)`

#### Debugging Validation Errors
- Check the `FirestoreTypedValidationError` for the original validation error
- The error includes the exact validation failure from typia/zod
- Use `validateOnWrite: false` temporarily to bypass validation for debugging

### CI/CD Notes
- GitHub Actions runs tests on Node.js 20.x and 22.x
- Emulator tests are run separately in CI pipeline
- Coverage reports are uploaded to Codecov