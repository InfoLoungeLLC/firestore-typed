# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Build
```bash
npm run build         # Compile TypeScript to JavaScript
npm run build:watch   # Watch mode for development
```

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Watch mode for development
npm test -- path/to/test.ts  # Run specific test file
npm run test:coverage # Generate coverage report
```

### Linting & Formatting
```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting errors
npm run format       # Format code with Prettier
```

## Code Architecture

### Core Concept
FirestoreTyped is a type-safe wrapper for Firebase Firestore that **mandates runtime validation** for all operations. Unlike raw Firestore, every piece of data must be validated using a validator function (typically typia).

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

### Data Flow
1. **Write Operations**: User Data → Validation → Type Conversion → Firestore
2. **Read Operations**: Firestore → Type Conversion → Validation (optional) → User Data

### Important Type Conversions
- `Date` → `Timestamp` (loses nanosecond precision)
- `SerializedGeoPoint` → `GeoPoint`
- `SerializedDocumentReference<TCollection, TDocument>` → `DocumentReference`

### Testing Strategy
- **Unit Tests**: Mock Firebase SDK, test individual components
- **Integration Tests**: Test with real Firestore operations
- Test files use `.test.ts` or `.spec.ts` suffix
- Helper files in `__tests__/__helpers__/` directories

### TypeScript Configuration Notes
- Target: ES2023
- Module: CommonJS
- Strict mode enabled
- `noUncheckedIndexedAccess`: true (requires explicit undefined checks)
- Currently **NOT** configured for typia transforms (users must set up ts-patch)

### Validation Library
Primary support for typia validators, but accepts any function with signature `(data: unknown) => T` that throws on validation failure.