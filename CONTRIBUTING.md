# 開発参加ガイド

## 開発フロー

1. **Issue作成**
   - 新機能の提案や不具合報告はIssueで管理
   - テンプレートに従って記載

2. **ブランチ運用**
   - `main`: プロダクションブランチ
   - `develop`: 開発ブランチ
   - `feature/xxx`: 機能追加
   - `fix/xxx`: バグ修正

3. **コミットメッセージ**
```
[add] タスク登録機能の追加
[fix] リマインド機能のバグ修正
[update] キャラクター設定の更新
[docs] READMEの更新
```

## コーディング規約

- TypeScriptの厳格な型付けを推奨
- ESLint/Prettierの設定に従う
- 関数にはJSDocコメントを付ける

## Pull Request

1. レビュー前チェックリスト
   - [ ] テストの追加・実行
   - [ ] リンター/フォーマッターの実行
   - [ ] ドキュメントの更新

2. PRテンプレートに従って記載

## チーム別ガイドライン

各チームのガイドラインは `docs/teams/` 以下を参照してください：
- タスク管理チーム: `task-management/`
- キャラクターチーム: `character/`
- LLM統合チーム: `llm-integration/`
- インフラチーム: `infrastructure/`
- UIデザインチーム: `ui-design/`