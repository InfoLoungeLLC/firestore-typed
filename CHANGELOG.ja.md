# 変更履歴

@info-lounge/firestore-typedの全ての注目すべき変更はこのファイルに記録されます。

このフォーマットは[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)に基づいており、
このプロジェクトは[セマンティックバージョニング](https://semver.org/spec/v2.0.0.html)に準拠しています。

## [0.3.1] - 2025-07-26

### 修正

- **ドキュメント**: README.mdとREADME.ja.mdをfirebase-admin v13.4.0互換性に合わせて更新
- **互換性注記**: ドキュメントから古いv13非互換性警告を削除

### 内部

- 実際のfirebase-admin v13.4.0サポート状況に合わせたドキュメント同期

## [0.3.0] - 2025-07-26

### 変更

**破壊的変更**: firebase-adminの最小バージョン要件を更新しました。

- **firebase-admin**: peer dependencyを`>=12.7.0 <13.0.0`から`^13.4.0`に更新
- **互換性**: firebase-admin v13.4.0および@google-cloud/firestore v7.11.3との完全な互換性を検証

### 追加

- firebase-admin v13.xシリーズ（13.4.0以上）のサポート
- 最新のGoogle Cloud Firestoreパッケージによる安定性の向上

### 削除

- **GitHub デプロイメント追跡**: リリースワークフローから不要なGitHubデプロイメント作成を削除
- **リリースワークフロー**: npm公開のみに集中するよう簡素化

### 技術的詳細

- firebase-admin v13.4.0で全209テストが通過
- TypeScript/ESLintの互換性問題は発見されず
- 以前のv13型推論問題は後続バージョンで解決されたようです

### 移行ガイド

v0.2.xからアップグレードするユーザー：
- firebase-adminをバージョン13.4.0以上に更新してください
- コード変更は不要です - APIは同じままです

## [0.2.1] - 2025-07-26

### 修正

- **リリースワークフロー**: GitHub Actionsのデプロイメント作成エラーを修正するため`deployments: write`権限を追加
- **バージョン**: package.jsonのバージョンを0.2.1にバンプ

### 内部

- npm publish時のデプロイメント追跡を阻害していたGitHub Actions権限問題を修正

## [0.2.0] - 2025-07-26

### 変更

**破壊的変更**: バリデーターの処理方法を変更する主要なアーキテクチャ再設計を導入しました。

- **コレクションレベルバリデーター**: バリデーターがFirestoreTypedコンストラクタではなく、個別の`collection()`および`collectionGroup()`メソッド呼び出しに渡されるようになりました
- **単一インスタンスの柔軟性**: 一つのFirestoreTypedインスタンスで異なるバリデーターを持つ複数のエンティティタイプを処理可能
- **簡素化されたファクトリ関数**: `firestoreTyped()`はバリデーターパラメータが不要になりました

### 移行ガイド

**変更前 (v0.1.x):**
```typescript
const userDb = firestoreTyped({ validator: userValidator });
const userCollection = userDb.collection<UserEntity>('users');

const productDb = firestoreTyped({ validator: productValidator });
const productCollection = productDb.collection<ProductEntity>('products');
```

**変更後 (v0.2.0):**
```typescript
const db = firestoreTyped();
const userCollection = db.collection<UserEntity>('users', userValidator);
const productCollection = db.collection<ProductEntity>('products', productValidator);
```

### 追加

- `collectionGroup()`メソッドでクロスコレクションクエリのバリデーターパラメータサポート
- コレクション固有のバリデーターによる型安全性の向上
- 複数のFirestoreTypedインスタンスが不要になることによるパフォーマンス向上

### 利点

- **簡素化されたセットアップ**: 複数のエンティティタイプに対する単一データベースインスタンス
- **リソース利用の改善**: メモリフットプリントと接続オーバーヘッドの削減
- **柔軟性の向上**: 同一アプリケーションインスタンスで異なるバリデーターの混在
- **開発者体験の改善**: Firestoreのネイティブパターンに合わせたより直感的なAPI

### 依存関係

- **firebase-admin**: v12.7.0以降のv12.xバージョンと互換性があります。**注**: v13.xはテスト中に遭遇したTypeScript/ESLint互換性問題により現在サポートされていません。v13.xサポートの更新については[issue tracking](https://github.com/InfoLoungeLLC/firestore-typed/issues)を参照してください。

## [0.1.0] - 2025-07-25

### 追加
- 初のベータリリース
- Firebase Firestore用の型安全なラッパー
- typiaによる自動バリデーション
- DateからTimestampへの変換サポート
- SerializedGeoPointとSerializedDocumentReferenceのサポート
- 包括的なエラーハンドリング
- TypeScript strictモードサポート
- 完全なテストカバレッジ