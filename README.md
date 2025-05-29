# MelodyLab 講師管理システム

## 🎵 概要

MelodyLabは音楽教室向けのオンライン予約システムです。講師が事前にスケジュールを設定し、生徒が空き時間を確認して予約できるシステムを実装しています。

## ✨ 新機能（講師管理システム）

### 追加された機能
- **講師専用管理画面**: スケジュール設定・予約管理
- **リアルタイム同期**: Firebase Firestoreによる即座反映
- **スケジュール管理**: 曜日別・時間帯別の空き時間設定
- **例外日設定**: 休講日・特別日程の管理
- **予約統計**: 今週・今月の予約状況表示

## 🏗️ システム構成

```
├── admin/                      # 講師管理画面
│   ├── teacher-login.html      # 講師ログイン
│   ├── teacher-dashboard.html  # ダッシュボード
│   └── schedule-setup.html     # スケジュール設定
├── js/                         # JavaScript ファイル
│   ├── firebase-config.js      # Firebase設定
│   ├── data-structures.js      # データ構造定義
│   └── teacher-student-sync.js # システム連携
├── css/
│   └── admin-styles.css        # 管理画面スタイル
└── index.html                  # 生徒用予約画面（既存）
```

## 🚀 セットアップ手順

### 1. Firebase プロジェクト設定（推奨）

**無償で永続利用可能:**
- 読み取り: 50,000回/日
- 書き込み: 20,000回/日
- ストレージ: 1GB

#### Firebaseプロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. Firestoreデータベースを有効化
4. プロジェクト設定から設定情報を取得

#### 設定ファイル更新
`js/firebase-config.js`の設定値を実際の値に置き換え:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "your-app-id"
};
```

### 2. ローカル環境での動作確認

Firebase未設定でも基本機能が動作します：
- スケジュール設定: ローカルストレージに保存
- 予約管理: サンプルデータで動作確認

## 📖 使用方法

### 講師側の操作

#### 1. ログイン
- URL: `/admin/teacher-login.html`
- デモ用ID: `suzuki` / パスワード: `demo123`

#### 2. スケジュール設定
1. ダッシュボードから「📅 スケジュール設定」をクリック
2. 曜日ごとに営業時間を設定
3. レッスン時間・休憩時間を調整
4. 例外日（休講日）を追加
5. 「💾 保存」で設定完了

#### 3. 予約管理
- ダッシュボードで今日の予約確認
- 週間予約一覧の表示
- 統計情報（今週・今月の予約数）

### 生徒側の操作

#### 既存システムと連携
- URL: `/index.html`（既存の予約画面）
- 講師が設定したスケジュールが自動反映
- 空き時間のみ予約可能として表示

## 🔧 技術仕様

### データ構造

#### 講師データ
```javascript
{
  id: "suzuki",
  name: "鈴木先生",
  instruments: ["guitar"],
  zoomPersonalMeetingId: "123-456-789"
}
```

#### スケジュールデータ
```javascript
{
  teacherId: "suzuki",
  type: "recurring",
  recurring: {
    dayOfWeek: 6,        // 土曜日
    startTime: "09:00",
    endTime: "17:00",
    duration: 50,        // 50分レッスン
    breakTime: 10,       // 10分休憩
    isActive: true
  }
}
```

#### 予約データ
```javascript
{
  teacherId: "suzuki",
  studentId: "yamada-taro",
  date: "2025-05-31",
  startTime: "10:00",
  endTime: "10:50",
  status: "confirmed",
  zoomLink: "https://zoom.us/j/123-456-789"
}
```

### リアルタイム同期

Firebase Firestoreの`onSnapshot`を使用:
- 講師がスケジュール変更 → 生徒画面に即座反映
- 生徒が予約 → 講師ダッシュボードに即座表示

## 🎯 運用のポイント

### 講師10-30人規模での運用
- **Firebase無償枠で十分**: 月間読み込み150万回、書き込み60万回
- **予約の即座確定**: 講師承認不要でスムーズな予約体験
- **オフライン対応**: PWA機能でネット接続不安定時も動作

### セキュリティ
- **簡易認証**: デモ用（実運用時は適切な認証システムを実装）
- **データ分離**: 講師ごとのデータを適切に分離
- **バックアップ**: Firestoreの自動バックアップ機能

## 🔄 システムフロー

### スケジュール設定フロー
1. 講師ログイン
2. 基本スケジュール設定（曜日・時間）
3. 例外日設定（休講日）
4. Firebase/ローカルストレージに保存
5. 生徒画面に自動反映

### 予約フロー
1. 生徒が空き枠を確認
2. 予約リクエスト送信
3. 即座に予約確定
4. 講師ダッシュボードに表示
5. Zoomリンク自動生成・共有

## 🚨 注意事項

### Firebase未設定時
- ローカルストレージでの保存
- リアルタイム同期は無効
- サンプルデータでの動作

### 本格運用時の推奨設定
- Firebase Authentication導入
- セキュリティルール設定
- 適切なバックアップ戦略
- ログ・監視システム

## 📝 今後の拡張予定

### 短期拡張
- メール通知システム
- キャンセル・振替機能
- 複数講師同時予約

### 長期拡張
- 生徒管理システム
- 決済システム連携
- レッスン記録・評価機能
- 分析・レポート機能

## 🆘 トラブルシューティング

### よくある問題

#### Firebase接続エラー
- `firebase-config.js`の設定値を確認
- Firestoreのセキュリティルールを確認

#### スケジュールが反映されない
- ブラウザのキャッシュをクリア
- 開発者ツールでJavaScriptエラーを確認

#### ログインできない
- デモ用認証: パスワード`demo123`を確認
- ローカルストレージの`currentTeacher`キーを確認

### サポート
実装に関する質問やサポートが必要な場合は、GitHubのIssuesまたはDiscussionsをご利用ください。

---

**🎵 MelodyLab** - 音楽教室のための、シンプルで効果的な予約管理システム