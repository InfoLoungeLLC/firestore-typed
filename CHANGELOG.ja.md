# 変更履歴

@info-lounge/firestore-typedの全ての注目すべき変更はこのファイルに記録されます。

このフォーマットは[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)に基づいており、
このプロジェクトは[セマンティックバージョニング](https://semver.org/spec/v2.0.0.html)に準拠しています。

## [0.5.1] - 2025-01-26

### 追加

- **バリデーションライブラリサポート**: typiaとZodバリデーターの統合を実証する包括的なテスト例を追加
- **開発ツール**: `typia:generate`と`typia:postprocess`スクリプトによる自動typiaコード生成を追加
- **複雑なスキーマ例**: ネストされたオブジェクト（UserProfile、Order、AnalyticsEvent）の実世界バリデーションスキーマを追加
- **ピア依存関係**: より良い依存関係管理のため、typia（^9.6.1）とZod（^4.0.14）をオプショナルピア依存関係として宣言

### 変更

- **ドキュメント**: バリデーションライブラリの選択肢と使用例でREADMEを強化
- **テストインフラ**: プロジェクト全体でのアクセシビリティのため、テストヘルパーを`src/core/__tests__/__helpers__`から`src/__tests__/__helpers__`に統合
- **統合テスト**: 手動バリデーションロジックの代わりに実際のtypiaバリデーターを使用してテストの現実性を向上
- **パッケージキーワード**: より良い発見可能性のため'typia'と'zod'キーワードを追加

### 修正

- **TypeScriptコンパイル**: オプショナルテストデータプロパティの適切な型アサーションでコンパイルエラーを修正
- **テストエラーハンドリング**: 元のエラー詳細への適切なアクセスのためバリデーションエラーテストを改善

### 内部

- **テスト組織**: より良い保守性のため、すべてのテストユーティリティをグローバルヘルパーディレクトリに集約
- **コード品質**: より正確なバリデーションテストのため、生成されたバリデーターを使用するよう統合テストを更新
- **開発ワークフロー**: 自動後処理によるtypiaコード生成プロセスを合理化

## [0.5.0] - 2025-07-31

### 変更

- **開発環境**: package.jsonに`"type": "module"`を追加し、開発環境をESモジュールに移行
- **ビルド設定**: 開発用にTypeScript設定をESNextモジュールを使用するよう更新、デュアルCommonJS/ESMビルド出力は維持
- **設定ファイル**: Prettier設定をCommonJSからESモジュール形式に変換
- **CIワークフロー**: GitHub Actionsワークフローを以下の点で強化:
  - より高速なCI実行のためnpmキャッシュを追加
  - フォーマットチェックステップを追加
  - エラー視認性向上のためステップ順序を再構成
  - lint、フォーマットチェック、型チェックステップを`continue-on-error`で非ブロッキング化

### 修正

- **ドキュメント**: npmパッケージ配布に日本語ドキュメントファイル（README.ja.md、CHANGELOG.ja.md）を追加

### 内部

- ESモジュールをサポートするよう開発ツールを更新
- キャッシングによるCIパイプラインの効率化
- 継続的インテグレーションにおけるコード品質チェックの強化

## [0.4.2] - 2025-07-28

### 追加

- **資金支援サポート**: InfoLoungeLLC組織のGitHub Sponsorsファンディング情報をpackage.jsonに追加

### 変更

- **テストフレームワーク**: パフォーマンス改善とモダンなツールチェーンのため、JestからVitestに移行
- **ビルドシステム**: より高速なテスト実行のためVitestとv8カバレッジプロバイダーを使用するよう更新
- **コード品質**: より良い開発体験のためESLint設定を更新し、設定をトップレベルに移動

### 修正

- **テストカバレッジ**: バリデーションロジックの条件分岐におけるテストカバレッジを改善
- **コード品質**: コレクションとドキュメント操作のエッジケースをカバーするテストスイートを強化
- **ドキュメント**: 防御的プログラミングのコンテキストをカバレッジ無視文に追加
- **依存関係**: typia peer dependencyを^9.6.0（>=5.3.0から）に更新、完全な後方互換性を維持
- **リンティング**: ESLint設定の問題を修正し、一貫性のあるコードフォーマットを適用

### 内部

- JestをVitestの設定とテストユーティリティに置き換え
- 全テストファイルをVitestのインポート（`vi`, `describe`, `it`, `expect`）を使用するよう更新
- `jest.mock()`から`vi.mock()`へのモック機能移行
- `validateOnRead: false`と`validateOnWrite: false`のコードパスの包括的テストを追加
- null既存データでのドキュメントマージ操作のテストカバレッジを追加
- 冗長なテストケースを削除してコードの重複を軽減
- 防御的プログラミングのコンテキストでc8 ignoreコメントを更新
- TypeScript型チェックのため@google-cloud/firestoreオプショナル依存関係が適切に利用可能であることを保証
- IDE統合改善のためESLint設定をプロジェクトルートに移動
- 一貫性のためコードベース全体にPrettierフォーマットを適用
- CIワークフローでCodecovカバレッジアップロードをmainとdevelopブランチのみに制限

## [0.4.1] - 2025-07-28

### 修正

- **テスト**: テストファイル内の非推奨な`firestoreTyped()`呼び出しを全て`getFirestoreTyped()`に更新
- **コード品質**: テストスイートを新しいファクトリ関数を使用するよう移行し、一貫性を向上

### 内部

- テストファイル全体で推奨される`getFirestoreTyped()`関数を使用
- 非推奨な`firestoreTyped()`関数の後方互換性テストは維持

## [0.4.0] - 2025-07-28

### 追加

- **新しいファクトリ関数**: Firebase命名規則との一貫性のため`getFirestoreTyped()`関数を追加
- **カスタムFirestoreインスタンスサポート**: `getFirestoreTyped()`はマルチプロジェクトシナリオ用に第一引数としてオプショナルなFirestoreインスタンスを受け取り可能

### 変更

- **ファクトリ関数**: `firestoreTyped()`は`getFirestoreTyped()`に変更され、非推奨となりました
- **API強化**: カスタムFirestoreインスタンスとデータベースのサポートを強化

### 例

```typescript
// デフォルトのFirestoreインスタンスを使用
const db = getFirestoreTyped();

// カスタムFirestoreインスタンスを使用
const customApp = initializeApp(customConfig, 'custom');
const customFirestore = getFirestore(customApp);
const customDb = getFirestoreTyped(customFirestore);

// オプション付き
const dbWithOptions = getFirestoreTyped(undefined, { validateOnRead: true });
```

### 非推奨

- `firestoreTyped()`関数は非推奨ですが、後方互換性のため利用可能です
- 全てのテストファイルを新しい`getFirestoreTyped()`関数を使用するよう更新

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