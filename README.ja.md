# @info-lounge/firestore-typed – ランタイムバリデーション付きの型安全なFirestoreラッパー

[![npm version](https://badge.fury.io/js/@info-lounge%2Ffirestore-typed.svg)](https://badge.fury.io/js/@info-lounge%2Ffirestore-typed)
[![npm downloads](https://img.shields.io/npm/dm/@info-lounge/firestore-typed.svg)](https://www.npmjs.com/package/@info-lounge/firestore-typed)
[![codecov](https://codecov.io/gh/InfoLoungeLLC/firestore-typed/branch/main/graph/badge.svg)](https://codecov.io/gh/InfoLoungeLLC/firestore-typed)
[![license](https://img.shields.io/npm/l/@info-lounge/firestore-typed.svg)](https://github.com/InfoLoungeLLC/firestore-typed/blob/main/LICENSE)

**必須ランタイムバリデーション**付きFirebase Firestoreの型安全な低レベルラッパーです。このパッケージは、**読み書き操作時にtypiaValidatorを用いてすべてのデータがバリデーションされることを保証**し、包括的な型安全性、データ整合性、改善された開発者体験をFirestore操作に提供します。

> **[English README here / 英語版READMEはこちら →](README.md)**

## 利用例 - なぜFirestoreTypedを使うのか？

```typescript
// ❌ 生のFirestore - バリデーションなし、ランタイムエラーの可能性
const db = getFirestore()
await db.collection('users').doc('123').set({
  name: 123,      // 間違った型だがランタイムまでエラーにならない
  email: null     // 必須フィールドがない
})

// ✅ FirestoreTyped - 自動バリデーションでエラーを防止
import { getFirestoreTyped } from '@info-lounge/firestore-typed'
import typia from 'typia'

interface User {
  name: string
  email: string
}

const userValidator = typia.createAssert<User>()
const db = getFirestoreTyped()
const users = db.collection<User>('users', userValidator)

await users.doc('123').set({
  name: 'John',              // ✓ ランタイムでバリデーション
  email: 'john@example.com'  // ✓ すべてのフィールドがチェックされる
})
// データがUserと一致しない場合バリデーションエラーをスロー
```

> ⚠️ **実験的リリース**: このパッケージは現在ベータ版です。将来のリリースでAPIが変更される可能性があります。本番環境での使用には注意してください。

## 主要機能

- **🛡️ 必須ランタイムバリデーション**: 読み書き操作時にtypiaValidatorで自動的にすべてのデータをバリデーション
- **🔒 型安全性**: 完全なTypeScriptコンパイル時・ランタイム型チェック
- **⚡ パフォーマンス最適化**: 最大のデータ整合性で最小のオーバーヘッド
- **🎯 Firebaseネイティブ**: FirestoreのネイティブAPIパターンへの直接マッピング
- **🔧 設定可能**: 操作ごとまたはグローバルな柔軟なバリデーション設定

## 目次

1. [インストール](#インストール)
2. [クイックスタート](#クイックスタート)
3. [コアアーキテクチャ](#コアアーキテクチャ)
4. [設定](#設定)
5. [CRUD操作](#crud操作)
6. [クエリビルダー](#クエリビルダー)
7. [バリデーション](#バリデーション)
8. [自動型変換](#自動型変換)
9. [型安全なドキュメント参照](#型安全なドキュメント参照)
10. [エラーハンドリング](#エラーハンドリング)
11. [パフォーマンス](#パフォーマンス)
12. [ベストプラクティス](#ベストプラクティス)
13. [高度な使い方](#高度な使い方)
14. [APIリファレンス](#apiリファレンス)

## インストール

```bash
npm install @info-lounge/firestore-typed
```

### 動作要件

- **Node.js**: 22以上
- **firebase-admin**: `^13.5.0 || ^14.0.0`(peer dependency)
- **バリデーションライブラリ**(peer dependency、少なくとも一方を選択):
  - typia: `>=9.7.2 <13`(v13はTypeScript 7 + ttsc専用のため現時点では未サポート)
  - zod: `^4.0.17`

### 依存関係

このパッケージには以下のpeer dependenciesが必要です：

```bash
# 必須
npm install firebase-admin

# バリデーションライブラリを選択（または両方）：
npm install typia     # パフォーマンス重視（推奨）
# または
npm install zod       # 代替バリデーションライブラリ
```

**注意**: バリデーションライブラリとして`typia`または`zod`（または両方）をインストールする必要があります。パッケージはどちらでも動作します。

### Typia Transform設定

**重要**: Typiaが正しく動作するにはTypeScriptのtransformプラグインの設定が必要です。最も簡単な設定には`ts-patch`を使用してください。

#### 1. ts-patchのインストール

```bash
npm install -D ts-patch
```

#### 2. TypeScriptコンパイラのパッチ

```bash
npx ts-patch install
```

#### 3. tsconfig.jsonの設定

```json
{
  "compilerOptions": {
    "strict": true,
    "plugins": [
      {
        "transform": "typia/lib/transform"
      }
    ]
  }
}
```

#### 4. パッチされたTypeScriptコンパイラの使用

```bash
# tscの代わりに
npx tsc

# ts-nodeの場合
npx ts-node your-file.ts
```

> **注意**: 適切なtransformer設定がないと、`typia.createAssert<T>()`がバリデーションコードを生成せず、ランタイムエラーが発生する可能性があります。ts-patchアプローチはほとんどのプロジェクトにとって最も信頼性の高い方法です。

## クイックスタート

### なぜFirestoreTypedなのか？

**FirestoreTypedの核心原則：すべてのデータがバリデーションされる。**生のFirestore操作とは異なり、FirestoreTypedはすべての操作にvalidatorを必須とすることでデータ整合性を保証します。

```typescript
// ❌ 生のFirestore - バリデーションなし、ランタイムエラーの可能性
const db = getFirestore()
await db.collection('users').doc('123').set({
  name: 123, // 間違った型だがランタイムまでエラーにならない
  email: null // 必須フィールドがない
})

// ✅ FirestoreTyped - 自動バリデーションでエラーを防止
const db = getFirestoreTyped()
const users = db.collection<UserEntity>('users', userValidator)
await users.doc('123').set({
  name: 'John', // ランタイムでバリデーション
  email: 'john@example.com' // すべてのフィールドがチェックされる
})
// データがUserEntityと一致しない場合バリデーションエラーをスロー
```

### 基本的な使い方

```typescript
import { getFirestoreTyped } from '@info-lounge/firestore-typed'
import typia from 'typia'

// 1. データ構造を定義
interface UserEntity {
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

// 2. validatorを作成（必須 - これがデータを安全にする）
const userEntityValidator = typia.createAssert<UserEntity>()

// 3. FirestoreTypedインスタンスを作成
const db = getFirestoreTyped(undefined, { 
  validateOnWrite: true,  // デフォルト：すべての書き込みをバリデーション
  validateOnRead: false   // オプション：すべての読み取りをバリデーション
})

// 4. validator付き型安全なコレクションを作成
const usersCollection = db.collection<UserEntity>('users', userEntityValidator)

// ✅ このデータは書き込み前にバリデーションされる
await usersCollection.doc('user-001').set({
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
})

// ✅ このデータは読み取り後にバリデーションされる（validateOnRead: trueの場合）
const user = await usersCollection.doc('user-001').get()
// user.dataはUserEntityと一致するかバリデーションエラーをスローすることが保証される
```

### カスタムFirestoreインスタンスの使用

デフォルトのFirestoreインスタンス以外を使用する場合（例：異なるプロジェクト、異なるデータベース）、カスタムFirestoreインスタンスを渡すことができます：

```typescript
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestoreTyped } from '@info-lounge/firestore-typed'

// カスタムFirebaseアプリの初期化
const customApp = getApps().find(app => app.name === 'custom-app') || 
  initializeApp({
    projectId: 'custom-project-id',
    // その他の設定...
  }, 'custom-app')

// カスタムFirestoreインスタンスを取得
const customFirestore = getFirestore(customApp)

// カスタムFirestoreインスタンスでFirestoreTypedを初期化
const customDb = getFirestoreTyped(customFirestore, {
  validateOnWrite: true,
  validateOnRead: false
})

// 通常と同様に使用
const usersCollection = customDb.collection<UserEntity>('users', userValidator)
await usersCollection.doc('user-001').set(userData)

// 名前付きデータベースの使用例
const namedDatabase = getFirestore(customApp, '(named-database)')
const namedDb = getFirestoreTyped(namedDatabase, {
  validateOnWrite: true
})
```

**使用ケース:**
- **マルチプロジェクト**: 複数のFirebaseプロジェクトとの連携
- **環境分離**: 開発、ステージング、本番環境での異なるデータベース使用
- **名前付きデータベース**: Firestore の複数データベース機能の利用
- **テスト**: テスト専用のFirestoreエミュレーターインスタンスの使用

### 完全なCRUD例

```typescript
// ユーザーデータ構造を定義
interface User {
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

// validator関数を作成
const userValidator = typia.createAssert<User>()

// FirestoreTypedを初期化
const db = getFirestoreTyped(undefined, {
  validateOnRead: true,
  validateOnWrite: true
})

const usersCollection = db.collection<User>('users', userValidator)

// CREATE: 自動生成IDでドキュメントを追加
const newUser = {
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
}

const docRef = await usersCollection.add(newUser)
console.log('Created user with ID:', docRef.id)

// CREATE: 特定のIDでドキュメントを設定
const specificUser = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
}

await usersCollection.doc('user-123').set(specificUser)

// READ: 単一ドキュメントを取得
const userSnapshot = await usersCollection.doc('user-123').get()
if (userSnapshot.metadata.exists) {
  const user = userSnapshot.data!
  console.log(`User: ${user.name} (${user.email})`)
}

// READ: すべてのドキュメントを取得
const allUsers = await usersCollection.get()
const userList = allUsers.docs.map(doc => ({
  id: doc.metadata.id, // FirestoreドキュメントIDを使用
  ...doc.data!
}))

// UPDATE: 部分データをマージ
await usersCollection.doc('user-123').merge({
  email: 'jane.updated@example.com',
  updatedAt: new Date()
})

// UPDATE: 完全置換
const updatedUser: User = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date()
}
await usersCollection.doc('user-123').set(updatedUser)

// DELETE: ドキュメントを削除
await usersCollection.doc('user-123').delete()
```

## コアアーキテクチャ

### FirestoreTypedインスタンス

FirestoreTypedは、内蔵バリデーション付きのFirestoreへの型安全な低レベルインターフェースを提供します。メインエントリーポイントは`getFirestoreTyped()`ファクトリ関数です：

```typescript
const db = getFirestoreTyped(firestore?: Firestore, options?: FirestoreTypedOptions)
```

### アーキテクチャ哲学

FirestoreTypedは**低レベル、コレクション特化型バリデーション**のアプローチに従います：
- **型安全性**: ジェネリック型がコンパイル時の安全性を保証
- **柔軟なバリデーション**: 異なるエンティティタイプのためのコレクション単位のバリデーター
- **Firebase Native**: FirestoreのネイティブAPIパターンへの直接マッピング
- **パフォーマンス重視**: 最大の型安全性で最小のオーバーヘッド

### コレクション参照

コレクションは型固有バリデーター付きの`collection()`メソッドでアクセスします：

```typescript
// 最大の柔軟性のためコレクション毎にvalidatorを提供
const collection = db.collection<T>(path: string, validator: (data: unknown) => T)
```

### ドキュメント参照

ドキュメントはコレクションの`doc()`メソッドでアクセスします：

```typescript
const doc = collection.doc(id: string)
```

### ドキュメントスナップショット

読み取り操作は型安全なデータアクセス付きの`DocumentSnapshot<T>`を返します：

```typescript
const snapshot = await doc.get()
const data = snapshot.data // 自動バリデーション付きの型安全なデータアクセス
const exists = snapshot.metadata.exists
```

## 設定

### グローバルオプション

```typescript
interface FirestoreTypedOptions {
  validateOnRead?: boolean   // デフォルト: false
  validateOnWrite?: boolean  // デフォルト: true
}
```

### Validator設定

FirestoreTypedは柔軟なエンティティタイプサポートのためにコレクション単位のvalidatorを使用します：

```typescript
// コンパイル時型生成にtypiaを使用
import typia from 'typia'

interface UserEntity {
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

// validator関数を作成
const userValidator = typia.createAssert<UserEntity>()

// FirestoreTypedを初期化
const db = getFirestoreTyped(undefined, {
  validateOnRead: true,
  validateOnWrite: true
})

// validator付き型安全なコレクションを作成
const usersCollection = db.collection<UserEntity>('users', userValidator)
```

### 操作オプション

```typescript
interface ReadOptions {
  validateOnRead?: boolean  // グローバル設定を上書き
}

interface WriteOptions {
  validateOnWrite?: boolean  // グローバル設定を上書き
  failIfExists?: boolean    // 既存ドキュメントの上書きを防止
}
```

## CRUD操作

すべてのCRUD操作にはvalidator付きで作成された型安全なコレクションが必要です：

```typescript
// セットアップ: 型安全なコレクションを作成
const db = getFirestoreTyped()
const collection = db.collection<UserEntity>('users', userValidator)
```

### ドキュメントの作成

```typescript
// 自動生成IDで追加
await collection.add(data)

// 特定IDで設定
await collection.doc('specific-id').set(data)

// 書き込みオプション付きで設定
await collection.doc('id').set(data, { validateOnWrite: false })

// 上書きせずにドキュメントを作成
await collection.doc('id').set(data, { failIfExists: true })
// ドキュメントが既に存在する場合はDocumentAlreadyExistsErrorをスロー
```

### ドキュメントの読み取り

```typescript
// 単一ドキュメントを取得
const snapshot = await collection.doc('id').get()
const data = snapshot.data

// 読み取りオプション付きで単一ドキュメントを取得
const snapshot = await collection.doc('id').get({ validateOnRead: true })

// コレクション内のすべてのドキュメントを取得
const querySnapshot = await collection.get()
const documents = querySnapshot.docs.map(doc => doc.data)
```

### 部分データのマージ

**重要**: 
- FirestoreTypedでは`set(data, { merge: true })`の代わりに専用の`merge()`メソッドを使用します
- `merge`操作は**完全にマージされたデータ**に対してバリデーションを実行します
- **ドキュメントが存在する必要があります** - ドキュメントが存在しない場合は`DocumentNotFoundError`をスロー
- 生のFirestoreの`set(..., { merge: true })`パターンはFirestoreTypedでは利用できません

```typescript
// 既存データと部分マージ
// 1. 既存ドキュメントデータを取得
// 2. 新しい部分データとマージ
// 3. マージ後の完全なデータをエンティティ型に対してバリデーション
await collection.doc('id').merge({ field: 'newValue' })

// バリデーション付きの例
interface User {
  name: string
  email: string
  age: number
}

// 既存ドキュメント: { name: 'John', email: 'john@example.com', age: 30 }
// マージ操作:
await usersCollection.doc('user123').merge({ 
  email: 'john.doe@example.com' 
})
// バリデーション結果: { name: 'John', email: 'john.doe@example.com', age: 30 }
// ✅ 完全なUserエンティティとしてバリデーション通過

// ❌ 以下はバリデーションエラー:
// await usersCollection.doc('user123').merge({ invalidField: 'value' })
// マージ結果にUserインターフェースにない余分なフィールドが含まれるため

// バリデーションオプション付きでマージ
await collection.doc('id').merge(data, { validateOnWrite: true })

// ❌ FirestoreTypedでは利用不可（merge()を使用してください）:
// await collection.doc('id').set(data, { merge: true }) // このパターンはサポートされていません

// ✅ 専用のmerge()メソッドを使用:
await collection.doc('id').merge(data) // これがFirestoreTypedの正しい方法です

// 存在しないドキュメントのエラーハンドリング
try {
  await collection.doc('non-existent').merge({ field: 'value' })
} catch (error) {
  if (error instanceof DocumentNotFoundError) {
    console.log('ドキュメントが存在しません:', error.documentPath)
    // 代わりにドキュメントを作成
    await collection.doc('non-existent').set(fullData)
  }
}
```

### ドキュメントの削除

```typescript
await collection.doc('id').delete()
```

## クエリビルダー

FirestoreTypedは、Firebase Firestoreの強力なクエリ機能を完全な型安全性で使用できる完全な型安全クエリビルダーを提供します。

### 基本クエリ

```typescript
// セットアップ: 型安全なコレクションを作成
const db = getFirestoreTyped()
const usersCollection = db.collection<UserEntity>('users', userValidator)

// 単一条件検索
const johnUsers = await usersCollection
  .where('name', '==', 'John Doe')
  .get()

// ソート機能
const sortedUsers = await usersCollection
  .orderBy('createdAt', 'desc')
  .get()

// 結果制限
const latestUsers = await usersCollection
  .orderBy('updatedAt', 'desc')
  .limit(10)
  .get()
```

### 複雑なクエリとメソッドチェーン

```typescript
// 複数条件組み合わせクエリ
const filteredUsers = await usersCollection
  .where('email', '>=', 'a@example.com')
  .where('email', '<=', 'z@example.com')
  .orderBy('name', 'asc')
  .limit(5)
  .get()

// 商品カテゴリベース検索
const cellProducts = await productsCollection
  .where('category', '==', 'electronics')
  .where('price', '<=', 1000)
  .orderBy('name')
  .get()
```

### 高度なページネーション

```typescript
// カーソルベースページネーション
const firstPage = await usersCollection
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()

if (firstPage.docs.length > 0) {
  const lastDoc = firstPage.docs[firstPage.docs.length - 1]
  
  // 次のページを取得
  const secondPage = await usersCollection
    .orderBy('createdAt', 'desc')
    .startAfter(lastDoc.data!.createdAt)
    .limit(20)
    .get()
}

// 範囲クエリ
const rangeQuery = await usersCollection
  .orderBy('name')
  .startAt('Alice')
  .endAt('John')
  .get()
```

### 型安全性

クエリビルダーはフィールド名と基本的な操作に対して型安全性を提供します：

```typescript
// ✅ 有効な使用法 - フィールド名は型チェックされる
const validQuery = usersCollection.where('name', '==', 'John Doe')
const sortedQuery = usersCollection.orderBy('createdAt', 'desc')

// ❌ 無効なフィールド名のコンパイルエラー
// const invalidQuery = usersCollection.where('invalidField', '==', 'value')

// ⚠️ 注意: 値の型やページネーションパラメータは完全に型チェックされません
// const query = usersCollection.where('name', '==', 123) // 型エラーを捕捉できない可能性
// const paginated = usersCollection.startAt('any', 'values') // パラメータはunknown[]
```

### バリデーション統合

```typescript
// グローバル設定に基づいてクエリ結果を自動バリデーション
const validatedResults = await usersCollection
  .where('name', '!=', '')
  .orderBy('name')
  .get()

// 特定操作でグローバルバリデーション設定を上書き
const fastResults = await usersCollection
  .limit(100)
  .get({ validateOnRead: false })
```

### ネイティブFirebaseアクセス

高度なFirestore機能には、ネイティブクエリオブジェクトにアクセスできます：

```typescript
const query = usersCollection.where('name', '!=', '').orderBy('name')
const nativeQuery = query.native // Firebase Queryオブジェクト
const snapshot = await nativeQuery.get()
```

## バリデーション

### Typiaを使用したランタイムバリデーション

FirestoreTypedはランタイムバリデーションのために[typia](https://github.com/samchon/typia)と統合されています：

```typescript
import typia from 'typia'

interface UserEntity {
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

const userEntityValidator = typia.createAssert<UserEntity>()
const db = getFirestoreTyped()
const usersCollection = db.collection<UserEntity>('users', userEntityValidator)

// データがUserEntityと一致しない場合、バリデーションエラーをスロー
await usersCollection.doc('user-001').set(invalidData)
```

### Typiaの高度な機能

TypiaはJSDocコメントベースの型アノテーションで、より精密なバリデーションをサポートします：

```typescript
interface UserEntity {
  /**
   * 特定フォーマットのユーザーID
   * @format uuid
   */
  id: string

  /**
   * 長さ制約付きのユーザー名
   * @minLength 2
   * @maxLength 50
   */
  name: string

  /**
   * フォーマット検証付きメールアドレス
   * @format email
   */
  email: string

  /**
   * 整数としてのユーザー年齢
   * @type integer
   * @minimum 0
   * @maximum 120
   */
  age: number

  /**
   * 正規表現パターン付き電話番号
   * @pattern ^\\+?[1-9]\\d{1,14}$
   */
  phone: string

  /**
   * 特定値からのユーザーステータス
   * @items.enum ["active", "inactive", "pending"]
   */
  status: "active" | "inactive" | "pending"

  createdAt: Date
  updatedAt: Date
}

const userValidator = typia.createAssert<UserEntity>()
const db = getFirestoreTyped()
const users = db.collection<UserEntity>('users', userValidator)

// これですべての制約がバリデーションされます：
// - idは有効なUUIDフォーマットである必要
// - nameは2-50文字である必要
// - emailは有効なメールフォーマットである必要
// - ageは0-120の整数である必要
// - phoneは正規表現パターンに一致する必要
// - statusは許可された値のいずれかである必要
await db.collection<UserEntity>('users', userValidator).doc('user123').set({
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  phone: '+1234567890',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**サポートされるJSDocタグ:**
- `@type integer` - 整数の検証
- `@format email|uuid|date|uri` - フォーマット検証
- `@pattern <regex>` - 正規表現検証
- `@minimum/@maximum` - 数値範囲検証
- `@minLength/@maxLength` - 文字列長検証
- `@items.enum` - 列挙値検証

これにより、基本的なTypeScript型だけでは実現できない、はるかに精密なバリデーションが可能になります。

### 代替バリデーションライブラリ

**注意**: FirestoreTypedは`(data: unknown) => T`シグネチャのあらゆるvalidator関数を受け入れます。typiaの他に、Zodとの互換性も検証済みです：

```typescript
// Zodの例
import { z } from 'zod'

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date()
})

const zodValidator = (data: unknown): UserEntity => {
  return UserSchema.parse(data) // バリデーション失敗時にスロー
}

const db = getFirestoreTyped()
const users = db.collection<UserEntity>('users', zodValidator)

// Joiの例（未検証）
import Joi from 'joi'

const userJoiSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required()
})

const joiValidator = (data: unknown): UserEntity => {
  const { error, value } = userJoiSchema.validate(data)
  if (error) throw error
  return value
}

const db2 = getFirestoreTyped()
const users2 = db2.collection<UserEntity>('users', joiValidator)
```

⚠️ **重要**: **typia**と**Zod**との互換性は検証済みです。Joiなどの他のバリデーションライブラリは理論的に互換性がありますが検証されていません。十分にテストして問題を報告してください。

### バリデーション制御

```typescript
// 特定操作でバリデーションを有効化
await usersCollection.doc('user-001').set(data, { validateOnWrite: true })

// 特定操作でバリデーションを無効化
await usersCollection.doc('user-001').set(data, { validateOnWrite: false })
```

### バリデーションエラー

```typescript
import { FirestoreTypedValidationError } from '@info-lounge/firestore-typed'

try {
  await usersCollection.doc('user-001').set(invalidData)
} catch (error) {
  if (error instanceof FirestoreTypedValidationError) {
    console.log('Validation failed:', error.message)
    console.log('Original error:', error.originalError)
  }
}
```

## エラーハンドリング

```typescript
// セットアップ: 型安全なコレクションを作成
const db = getFirestoreTyped()
const usersCollection = db.collection<UserEntity>('users', userValidator)
```

### ドキュメントが見つからない場合

```typescript
try {
  const snapshot = await usersCollection.doc('nonexistent').get()
  if (!snapshot.metadata.exists) {
    console.log('User does not exist')
  }
} catch (error) {
  console.error('Error retrieving user:', error)
}
```

### バリデーションエラー

```typescript
try {
  await usersCollection.doc('user-001').set(invalidData)
} catch (error) {
  if (error instanceof FirestoreTypedValidationError) {
    // バリデーションエラーを処理
  }
}
```

### ドキュメントが既に存在する場合

```typescript
import { DocumentAlreadyExistsError } from '@info-lounge/firestore-typed'

try {
  // ドキュメントが既に存在する場合は失敗します
  await usersCollection.doc('user-001').set(data, { failIfExists: true })
} catch (error) {
  if (error instanceof DocumentAlreadyExistsError) {
    console.log('ドキュメントは既に存在します:', error.documentPath)
    // 作成の代わりに更新で対処
    await usersCollection.doc('user-001').merge(data)
  }
}
```

## 自動型変換

FirestoreTypedは書き込み操作時にJavaScript型をFirestore特殊型に自動変換します：

### サポートされる型変換

| JavaScript型 | Firestore型 | 説明 |
|-------------|-------------|-----|
| `Date` | `Timestamp` | 日時データ変換（下記の精度に関する注意事項を参照） |
| `SerializedGeoPoint` | `GeoPoint` | 地理的位置データ変換 |
| `SerializedDocumentReference<TCollection, TDocument>` | `DocumentReference` | 型安全なドキュメント参照復元 |

> **⚠️ Date/Timestamp精度に関する重要な注意事項**: JavaScript `Date`オブジェクトはミリ秒精度ですが、Firestore `Timestamp`オブジェクトはナノ秒精度をサポートしています。`Date`から`Timestamp`への変換時、ナノ秒部分は常に`000000`（ゼロ）になります。これは、元のFirestoreデータのナノ秒レベルの精度が変換プロセス中に失われることを意味します。

### 使用例

```typescript
import { GeoPoint, Timestamp } from 'firebase-admin/firestore'
import { SerializedDocumentReference } from '@info-lounge/firestore-typed'

// JavaScript型は自動的にFirestore型に変換される
const storeData = {
  id: 'store-001',
  name: 'Tokyo Electronics Store',
  address: 'Shibuya, Tokyo',
  phone: '+81-3-1234-5678',
  category: {
    type: 'DocumentReference',
    path: 'categories/electronics',
    collectionId: 'categories',
    documentId: 'electronics'
  } as SerializedDocumentReference<'categories', CategoryEntity>,
  location: {
    type: 'GeoPoint',
    latitude: 35.6762,
    longitude: 139.6503
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date()
}

// セットアップ: 型安全なコレクションを作成し、書き込み時に自動変換：
// - Date → Timestamp
// - SerializedGeoPoint → GeoPoint  
// - SerializedDocumentReference → DocumentReference
const db = getFirestoreTyped()
const storesCollection = db.collection<StoreEntity>('stores', storeValidator)
await storesCollection.doc('store-001').set(storeData)
```

### 処理順序

1. **バリデーション**: データはtypiaアサーションでバリデーション
2. **型変換**: JavaScript型をFirestore型に変換
3. **書き込み**: 適切な型でFirestoreにデータを書き込み

## 型安全なドキュメント参照

FirestoreTypedは`SerializedDocumentReference`インターフェースを通じてドキュメント参照の強化された型安全性を提供します：

### ジェネリック型パラメータ

```typescript
import { SerializedDocumentReference } from '@info-lounge/firestore-typed'

// TCollection: コレクション名（リテラル型）
// TDocument: 参照ドキュメント型（ファントム型）
type ProductRef = SerializedDocumentReference<'products', ProductEntity>

// コンパイル時バリデーション付きの型安全参照
const parentRef: ProductRef = {
  type: 'DocumentReference',
  path: 'products/parent-001',
  collectionId: 'products', // 'products'と一致する必要がある
  documentId: 'parent-001'
}
```

### 型安全性のメリット

- **コレクション名バリデーション**: `collectionId`はジェネリック型と一致する必要がある
- **型安全性**: TypeScriptが正しいコレクション-ドキュメント型ペアを強制
- **ランタイムチェック**: typiaが構造と値をバリデーション
- **IDE サポート**: 完全なIntelliSenseと自動補完

## パフォーマンス

### ベンチマーク

**注意**: これらのパフォーマンスベンチマークは**typia validator**を使用した包括的テストに基づいています。他のバリデーションライブラリではパフォーマンスが異なる可能性があります。

包括的なパフォーマンステストに基づく結果：

#### コア操作パフォーマンス
- **作成操作**: 高パフォーマンスドキュメント作成（平均57ms）
- **読み取り操作**: 最適化されたデータ取得（平均17ms）  
- **マージ操作**: 効率的な部分更新（平均44ms）
- **バッチ操作**: 最適化された一括操作（平均72ms）

#### 型変換パフォーマンス
- **SerializedDocumentReference変換**: 参照あたり<0.1msオーバーヘッド
- **複雑なネスト構造処理**: ベースライン性能の約98%を維持
- **型ガードバリデーション**: 最小のパフォーマンス影響で効率的な型チェック

### バリデーションオーバーヘッド

- ランタイムバリデーションは約1.2%のオーバーヘッドを追加（0.58ms）
- SerializedDocumentReference バリデーションは参照あたり<0.1ms追加  
- パフォーマンス重視パスではバリデーションを操作ごとに無効化可能
- 型ガードはパフォーマンスペナルティなしで安全な変換を保証

### メモリ使用量

- 最小メモリフットプリント（271KB/操作）
- ドキュメント参照付き大規模データセットの効率的処理
- 継続操作でのメモリリークなし
- SerializedDocumentReference変換は最小の追加メモリを使用

## 高度な使い方

### オプション管理

```typescript
// デフォルトオプションで初期化
const db = getFirestoreTyped()

// 現在のオプションを取得
const currentOptions = db.getOptions()

// 異なるオプションで新しいインスタンスを作成
const strictDb = db.withOptions({ validateOnRead: true })
```

### 型安全性

```typescript
// セットアップ: 型安全なコレクションを作成
const db = getFirestoreTyped()
const users = db.collection<UserEntity>('users', userValidator)

// TypeScriptが正しい型を強制
await users.doc('user-001').set({
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
})

// これはコンパイル時エラーを発生
// await users.doc('user-001').set({
//   id: 'user-001',
//   name: 'John Doe',
//   email: 123 // 型エラー: numberはstringに割り当てできません
// })
```

### 既存の型との作業

```typescript
// ドキュメント参照を含むアプリケーション型との統合
import { SerializedDocumentReference } from '@info-lounge/firestore-typed'
import typia from 'typia'

// エンティティ型を定義
interface UserEntity {
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

interface ProductEntity {
  id: string
  name: string
  category: string
  price: number
  parentCategory?: SerializedDocumentReference<'categories', CategoryEntity>
  createdAt: Date
  updatedAt: Date
}

// バリデーターを作成
const userValidator = typia.createAssert<UserEntity>()
const productValidator = typia.createAssert<ProductEntity>()

// 複数のエンティティタイプを扱える単一のFirestoreTypedインスタンスを作成
const db = getFirestoreTyped()

// それぞれのvalidatorで型安全なコレクションを作成
const users = db.collection<UserEntity>('users', userValidator)
const products = db.collection<ProductEntity>('products', productValidator)

// 親カテゴリ参照を持つ商品の操作
const productWithCategory: ProductEntity = {
  id: 'prod-001',
  name: 'Gaming Laptop',
  category: 'electronics',
  price: 1299.99,
  parentCategory: {
    type: 'DocumentReference',
    path: 'categories/electronics-main',
    collectionId: 'categories',
    documentId: 'electronics-main'
  } as SerializedDocumentReference<'categories', CategoryEntity>,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## ベストプラクティス

### 1. 常にValidatorを使用

FirestoreTypedは型安全性とデータ整合性のためにvalidatorが必要です：

```typescript
// ✅ 良い例: コレクション毎に常にvalidatorを提供
const userValidator = typia.createAssert<UserEntity>()
const db = getFirestoreTyped()
const users = db.collection<UserEntity>('users', userValidator)

// ❌ 悪い例: バリデーションをスキップしない
// これはFirestoreTypedの設計では不可能
```

### 2. 適切にデータを型付け

```typescript
// ✅ 良い例: 具体的な型を使用
interface UserEntity {
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

// ❌ 悪い例: ジェネリック型を避ける
// 'any'や過度に広い型を使用しない
```

### 3. エラーを適切に処理

```typescript
import { FirestoreTypedValidationError } from '@info-lounge/firestore-typed'

// セットアップ: 型安全なコレクションを作成
const db = getFirestoreTyped()
const userCollection = db.collection<UserEntity>('users', userValidator)

try {
  await userCollection.doc('user-id').set(userData)
} catch (error) {
  if (error instanceof FirestoreTypedValidationError) {
    // バリデーションエラーを処理
    console.error('Data validation failed:', error.message)
  } else {
    // その他のエラーを処理
    throw error
  }
}
```

### 4. バリデーション設定を最適化

```typescript
// 読み取り重複操作では、読み取りバリデーション無効化を検討
const fastDb = getFirestoreTyped(undefined, {
  validateOnRead: false,  // パフォーマンスのため読み取りバリデーションをスキップ
  validateOnWrite: true   // データ整合性のため書き込みバリデーションは常に有効
})

const userCollection = fastDb.collection<UserEntity>('users', userValidator)

// 必要に応じて操作ごとに上書き
const data = await userCollection.doc('user-id').get({ validateOnRead: true })
```

### 5. コレクショングループクエリを効率的に使用

```typescript
// ✅ 良い例: 横断コレクション検索にコレクショングループクエリを使用
const productsGroup = db.collectionGroup<ProductEntity>('products', productValidator)
const electronicsProducts = await productsGroup
  .where('category', '==', 'electronics')
  .orderBy('name')
  .get()

// ✅ 良い例: 単一コレクション用の通常のコレクションクエリ
const categoryProducts = await db.collection<ProductEntity>('categories/electronics/products', productValidator).get()
```

### 6. パフォーマンス考慮事項

```typescript
// ✅ 高頻度操作では、バリデーションオーバーヘッドを考慮
const performanceDb = getFirestoreTyped(undefined, {
  validateOnRead: false,   // 読み取り重複ログでバリデーションをスキップ
  validateOnWrite: false   // 高頻度書き込みでバリデーションをスキップ
})
const logs = performanceDb.collection<LogEntry>('logs', logValidator)

// ✅ 複数書き込みにはバッチ操作を使用（実装予定機能）
// const batch = db.batch() // ⚠️ まだ実装されていません
// batch.set(userCollection.doc('user1'), userData1)
// batch.set(userCollection.doc('user2'), userData2)
// await batch.commit()

// 現在はネイティブFirestoreのバッチを使用:
const batch = db.native.batch()
batch.set(db.native.collection('users').doc('user1'), userData1)
batch.set(db.native.collection('users').doc('user2'), userData2)
await batch.commit()
```

## APIリファレンス

### ファクトリ関数

```typescript
/**
 * 複数エンティティタイプサポートのためのFirestoreTypedインスタンスを作成
 * @param options - グローバル設定オプション
 * @returns 設定済みFirestoreTypedインスタンス
 * @example
 * ```typescript
 * import { getFirestoreTyped } from '@info-lounge/firestore-typed'
 * 
 * const db = getFirestoreTyped(firestore, options)
 * ```
 */
function getFirestoreTyped(
  firestore?: Firestore,
  options?: FirestoreTypedOptions
): FirestoreTyped
```

### FirestoreTypedインスタンス

```typescript
/**
 * 型安全なFirestore操作を提供するメインFirestoreTypedインスタンス
 */
class FirestoreTyped {
  /**
   * validator付きの型付きコレクション参照を取得
   * @param path - Firestoreコレクションパス
   * @param validator - エンティティタイプのランタイムバリデーション関数
   * @returns 型安全なコレクション参照
   * @example
   * ```typescript
   * const usersCollection = db.collection<UserEntity>('users', userValidator)
   * const userProductsCollection = db.collection<ProductEntity>('users/user-001/products', productValidator)
   * ```
   */
  collection<T>(path: string, validator: (data: unknown) => T): CollectionReference<T>

  /**
   * validator付きの型付きコレクショングループ参照を取得
   * @param collectionId - 複数の親ドキュメント間でクエリするコレクショングループID
   * @param validator - エンティティタイプのランタイムバリデーション関数
   * @returns 型安全なコレクショングループ参照
   * @example
   * ```typescript
   * const allPosts = db.collectionGroup<PostEntity>('posts', postValidator)
   * const userPosts = allPosts.where('userId', '==', 'user123')
   * ```
   */
  collectionGroup<T>(collectionId: string, validator: (data: unknown) => T): CollectionGroup<T>

  /**
   * 現在の設定オプションを取得
   * @returns 現在のFirestoreTypedオプション
   * @example
   * ```typescript
   * const currentOptions = db.getOptions()
   * console.log(`Validation on read: ${currentOptions.validateOnRead}`)
   * ```
   */
  getOptions(): ResolvedFirestoreTypedOptions

  /**
   * 変更されたオプションで新しいインスタンスを作成
   * @param options - 上書きする部分オプション
   * @returns 更新されたオプション付きの新しいFirestoreTypedインスタンス
   * @example
   * ```typescript
   * const strictDb = db.withOptions({ validateOnRead: true })
   * const fastDb = db.withOptions({ validateOnWrite: false })
   * ```
   */
  withOptions(options: Partial<FirestoreTypedOptions>): FirestoreTyped

  /**
   * 高度な操作用のネイティブFirestoreインスタンスへのアクセス
   * @returns ネイティブFirestoreインスタンス
   * @example
   * ```typescript
   * const nativeFirestore = db.native
   * const batch = nativeFirestore.batch()
   * ```
   */
  get native(): Firestore
}
```

### CollectionReferenceクラス

```typescript
/**
 * クエリ機能付きの型安全コレクション参照
 */
class CollectionReference<T> {
  /**
   * コレクションID（パスの最後のセグメント）
   * @example 'users', 'products'
   */
  get id(): string

  /**
   * 完全なコレクションパス
   * @example 'users', 'categories/electronics/products'
   */
  get path(): string

  /**
   * このコレクション内のドキュメント参照を取得
   * @param id - ドキュメントID
   * @returns 型安全なドキュメント参照
   * @example
   * ```typescript
   * const userDoc = usersCollection.doc('user123')
   * const userData = await userDoc.get()
   * ```
   */
  doc(id: string): DocumentReference<T>

  /**
   * 自動生成IDで新しいドキュメントを追加
   * @param data - 追加するドキュメントデータ
   * @param options - 書き込みオプション（バリデーション設定）
   * @returns ドキュメント参照に解決されるPromise
   * @throws FirestoreTypedValidationError バリデーション失敗時
   * @example
   * ```typescript
   * const docRef = await usersCollection.add({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   createdAt: new Date(),
   *   updatedAt: new Date()
   * })
   * console.log(`Created with ID: ${docRef.id}`)
   * ```
   */
  add(data: T, options?: WriteOptions): Promise<DocumentReference<T>>

  /**
   * コレクション内のすべてのドキュメントを取得
   * @param options - 読み取りオプション（バリデーション設定）
   * @returns クエリスナップショットに解決されるPromise
   * @throws FirestoreTypedValidationError バリデーション失敗時
   * @example
   * ```typescript
   * const snapshot = await usersCollection.get()
   * const users = snapshot.docs.map(doc => doc.data!)
   * console.log(`Found ${users.length} users`)
   * ```
   */
  get(options?: ReadOptions): Promise<QuerySnapshot<T>>

  /**
   * where句でクエリを作成
   * @param field - フィルターするフィールド
   * @param operator - 比較演算子
   * @param value - 比較する値
   * @returns メソッドチェーン用のクエリビルダー
   * @example
   * ```typescript
   * const activeUsers = await usersCollection
   *   .where('status', '==', 'active')
   *   .get()
   * ```
   */
  where(field: keyof T, operator: WhereFilterOp, value: any): Query<T>

  /**
   * 指定フィールドでクエリ結果を順序付け
   * @param field - 順序付けするフィールド
   * @param direction - ソート方向（'asc' | 'desc'）
   * @returns メソッドチェーン用のクエリビルダー
   * @example
   * ```typescript
   * const sortedUsers = await usersCollection
   *   .orderBy('createdAt', 'desc')
   *   .limit(10)
   *   .get()
   * ```
   */
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): Query<T>

  /**
   * 結果数を制限
   * @param limit - 返すドキュメントの最大数
   * @returns メソッドチェーン用のクエリビルダー
   */
  limit(limit: number): Query<T>
}
```

### DocumentReferenceクラス

```typescript
/**
 * 個別ドキュメント操作用の型安全ドキュメント参照
 */
class DocumentReference<T> {
  /**
   * ドキュメントID
   */
  get id(): string

  /**
   * 完全なドキュメントパス
   * @example 'users/user123', 'categories/electronics/products/prod456'
   */
  get path(): string

  /**
   * ドキュメントデータを取得
   * @param options - 読み取りオプション（バリデーション設定）
   * @returns ドキュメントスナップショットに解決されるPromise
   * @throws FirestoreTypedValidationError バリデーション失敗時
   * @example
   * ```typescript
   * const snapshot = await userDoc.get()
   * if (snapshot.metadata.exists) {
   *   console.log(`User: ${snapshot.data!.name}`)
   * } else {
   *   console.log('User not found')
   * }
   * ```
   */
  get(options?: ReadOptions): Promise<DocumentSnapshot<T>>

  /**
   * ドキュメントデータを設定（作成または置換）
   * @param data - 完全なドキュメントデータ
   * @param options - 書き込みオプション（バリデーション設定、failIfExists）
   * @returns 操作完了時に解決されるPromise
   * @throws FirestoreTypedValidationError バリデーション失敗時
   * @throws DocumentAlreadyExistsError failIfExistsがtrueでドキュメントが存在する場合
   * @example
   * ```typescript
   * // 通常のset操作
   * await userDoc.set({
   *   id: 'user123',
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   createdAt: new Date(),
   *   updatedAt: new Date()
   * })
   * 
   * // ドキュメントが存在しないことを確認
   * await userDoc.set(data, { failIfExists: true })
   * ```
   */
  set(data: T, options?: WriteOptions): Promise<void>

  /**
   * 部分データを既存ドキュメントとマージ
   * @param data - マージする部分ドキュメントデータ
   * @param options - 書き込みオプション（バリデーション設定）
   * @returns 操作完了時に解決されるPromise
   * @throws DocumentNotFoundError ドキュメントが存在しない場合
   * @throws FirestoreTypedValidationError バリデーション失敗時
   * @example
   * ```typescript
   * await userDoc.merge({
   *   email: 'newemail@example.com',
   *   updatedAt: new Date()
   * })
   * 
   * // エラーハンドリング
   * try {
   *   await userDoc.merge(data)
   * } catch (error) {
   *   if (error instanceof DocumentNotFoundError) {
   *     // ドキュメントが存在しない場合、代わりに作成
   *     await userDoc.set(fullData)
   *   }
   * }
   * ```
   */
  merge(data: Partial<T>, options?: WriteOptions): Promise<void>

  /**
   * ドキュメントを削除
   * @returns 削除完了時に解決されるPromise
   * @example
   * ```typescript
   * await userDoc.delete()
   * console.log('User deleted successfully')
   * ```
   */
  delete(): Promise<void>
}
```

### 型定義

```typescript
interface FirestoreTypedOptions {
  validateOnRead?: boolean
  validateOnWrite?: boolean
}

interface CollectionOptions<T> {
  validator?: (data: unknown) => T
}

interface ReadOptions {
  validateOnRead?: boolean
}

interface WriteOptions {
  validateOnWrite?: boolean
  failIfExists?: boolean    // trueの場合、ドキュメントが既に存在するとエラー
}

interface DocumentSnapshot<T> {
  metadata: DocumentMetadata
  data?: T
}

interface QuerySnapshot<T> {
  docs: DocumentSnapshot<T>[]
  empty: boolean
  size: number
}
```
