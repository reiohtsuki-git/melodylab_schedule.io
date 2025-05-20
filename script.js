/**
 * MelodyLab - オンライン音楽教室のスケジュール管理システム
 * script.js - メインのJavaScriptファイル (part1)
 */

// アプリケーション全体を管理するコアクラス
class MelodyLabApp {
    constructor() {
        // 状態の初期化
        this.currentWeekStartDate = this._getDefaultStartDate();
        
        // 子コンポーネントをインスタンス化
        this.scheduleManager = new ScheduleManager(this);
        this.uiManager = new UIManager(this);
        this.dataManager = new DataManager(this);
        this.notificationManager = new NotificationManager(this);
        
        // 初期化処理
        this._initializeEventListeners();
        this._initializeApplication();
    }
    
    /**
     * デフォルトの開始日を取得（現在の日付から最も近い月曜日）
     * @return {Date} 現在週の開始日（月曜日）
     */
    _getDefaultStartDate() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=日, 1=月, ..., 6=土
        const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek - 1;
        
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - daysToMonday);
        
        // 時間部分をリセット
        startDate.setHours(0, 0, 0, 0);
        
        return startDate;
    }
    
    /**
     * イベントリスナーの初期化
     */
    _initializeEventListeners() {
        // グローバルなイベントリスナー（キーボードショートカットなど）
        document.addEventListener('keydown', this._handleKeyboardShortcuts.bind(this));
        
        // オフライン/オンライン状態の監視
        window.addEventListener('online', () => {
            this.notificationManager.showToast('ネットワーク接続が復旧しました', 'success');
            document.getElementById('offline-notification').setAttribute('aria-hidden', 'true');
            this.scheduleManager.syncPendingData();
        });
        
        window.addEventListener('offline', () => {
            this.notificationManager.showToast('ネットワーク接続が切断されました', 'warning');
            document.getElementById('offline-notification').removeAttribute('aria-hidden');
        });
        
        // ウィンドウリサイズイベント（デバウンス処理適用）
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.uiManager.updateResponsiveUI();
                this.scheduleManager.updateScheduleGrid();
            }, 250);
        });
    }
    
    /**
     * キーボードショートカットの処理
     * @param {KeyboardEvent} event キーボードイベント
     */
    _handleKeyboardShortcuts(event) {
        // ESCキーでモーダルを閉じる
        if (event.key === 'Escape') {
            const modal = document.getElementById('booking-modal');
            if (modal.style.display === 'flex') {
                this.uiManager.closeModal();
                event.preventDefault();
            }
        }
        
        // キーボードナビゲーション（左右キーで週の移動）
        if (event.altKey) {
            if (event.key === 'ArrowLeft') {
                this.scheduleManager.navigateToPreviousWeek();
                event.preventDefault();
            } else if (event.key === 'ArrowRight') {
                this.scheduleManager.navigateToNextWeek();
                event.preventDefault();
            }
        }
    }
    
    /**
     * アプリケーションの初期化
     */
    _initializeApplication() {
        // 日付情報の更新
        this.uiManager.updateWeekDisplay();
        
        // スケジュールの初期表示
        this.scheduleManager.updateSchedule('all', 'all', 'all');
        
        // 検索結果の表示
        const searchResults = document.getElementById('search-results');
        searchResults.style.display = 'block';
        
        // レスポンシブUI調整
        this.uiManager.updateResponsiveUI();
        
        // データの同期確認
        this.scheduleManager.checkPendingData();
        
        // 初期化完了通知
        console.log('MelodyLab アプリケーションが初期化されました');
    }
}
/**
 * script.js - ScheduleManager (Part 2)
 */

/**
 * スケジュール管理を担当するクラス
 */
class ScheduleManager {
    constructor(app) {
        this.app = app;
        this.currentView = 'week'; // 'day', 'week', 'month'
        
        // 曜日のマッピング
        this.dayMapping = {
            'mon': '月',
            'tue': '火',
            'wed': '水',
            'thu': '木',
            'fri': '金',
            'sat': '土',
            'sun': '日'
        };
        
        // 日本語曜日から英語コードへの逆マッピング
        this.reverseDayMapping = {
            '月': 'mon',
            '火': 'tue',
            '水': 'wed',
            '木': 'thu',
            '金': 'fri',
            '土': 'sat',
            '日': 'sun'
        };
        
        // イベントリスナーの初期化
        this._initializeEventListeners();
    }
    
    /**
     * イベントリスナーの初期化
     */
    _initializeEventListeners() {
        // 検索ボタンのイベントリスナー
        document.getElementById('search-button').addEventListener('click', this._handleSearch.bind(this));
        
        // 週の移動ボタンのイベントリスナー
        document.getElementById('prev-week').addEventListener('click', this.navigateToPreviousWeek.bind(this));
        document.getElementById('next-week').addEventListener('click', this.navigateToNextWeek.bind(this));
        
        // ビューの切り替えボタンのイベントリスナー
        document.querySelectorAll('.calendar-view-toggle button').forEach(button => {
            button.addEventListener('click', event => {
                this._switchView(event.target.id.replace('-view', ''));
            });
        });
    }
    
    /**
     * 検索処理のハンドラー
     */
    _handleSearch() {
        // 検索条件の取得
        const instrumentFilter = document.getElementById('instrument').value;
        const teacherFilter = document.getElementById('teacher').value;
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        const lessonType = document.getElementById('lesson-type').value;
        const statusFilter = document.getElementById('status').value;
        
        // 日付範囲からcurrentWeekStartDateを更新
        if (dateFrom) {
            this.app.currentWeekStartDate = new Date(dateFrom);
            this.app.uiManager.updateWeekDisplay();
        }
        
        // ローディング表示
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // 実際のAPIリクエストの代わりにタイマーでシミュレート
        setTimeout(() => {
            // スケジュールの更新処理
            this.updateSchedule(instrumentFilter, teacherFilter, lessonType, statusFilter);
            
            // ローディング非表示
            document.getElementById('loading-overlay').style.display = 'none';
            
            // 検索結果表示
            document.getElementById('search-results').style.display = 'block';
            
            // モバイルビューの場合、検索後にフィルターを閉じる
            if (window.innerWidth <= 768) {
                const filterContent = document.getElementById('filter-content');
                const toggleFilters = document.getElementById('toggle-filters');
                
                filterContent.classList.add('hidden');
                toggleFilters.innerHTML = '<span class="toggle-icon">▼</span> フィルターを表示';
                toggleFilters.setAttribute('aria-expanded', 'false');
            }
            
            // 通知表示
            this.app.notificationManager.showToast('検索が完了しました', 'success');
        }, 800);
    }
    
    /**
     * 前の週に移動
     */
    navigateToPreviousWeek() {
        // 前の週へ
        const newDate = new Date(this.app.currentWeekStartDate);
        newDate.setDate(newDate.getDate() - 7);
        this.app.currentWeekStartDate = newDate;
        this.app.uiManager.updateWeekDisplay();
        
        // 検索ボタンをクリック
        document.getElementById('search-button').click();
    }
    
    /**
     * 次の週に移動
     */
    navigateToNextWeek() {
 /**
 * script.js - ScheduleManager (Part 3)
 */

    /**
     * 予約詳細モーダルのステータス表示を続き
     */
    _showBookingDetailsModal(slotKey, slotDate) {
        // 前の部分は省略（Part2の最後から続く）
        
        // 前後関係から必要な処理を再度実装
        const [day, hour, minute] = slotKey.split('-');
        const lessonInfo = this.app.dataManager.getLessonInfo(slotKey);
        
        // ステータスインジケーターを作成・更新
        let statusIndicator = document.getElementById('status-indicator');
        if (!statusIndicator) {
            statusIndicator = document.createElement('span');
            statusIndicator.id = 'status-indicator';
            statusIndicator.className = 'status-indicator';
            document.getElementById('booking-status').appendChild(statusIndicator);
        }
        
        // スロットの状態によって表示を変える
        if (lessonInfo.status === 'booked') {
            statusIndicator.textContent = '予約済み';
            statusIndicator.className = 'status-indicator confirmed';
        } else if (lessonInfo.status === 'pending') {
            statusIndicator.textContent = '確認待ち';
            statusIndicator.className = 'status-indicator pending';
        } else if (lessonInfo.status === 'cancelled') {
            statusIndicator.textContent = 'キャンセル済み';
            statusIndicator.className = 'status-indicator cancelled';
        }
        
        // Zoomリンクを更新
        document.getElementById('zoom-link').value = lessonInfo.zoomLink || 'https://zoom.us/j/1234567890?pwd=abcdefg';
        
        // 備考欄を更新
        document.getElementById('notes').value = lessonInfo.notes || '';
        
        // モーダルを表示
        this.app.uiManager.showModal();
        
        // 予約確定ボタンのテキストとイベントリスナーを更新
        const confirmButton = document.getElementById('confirm-booking');
        
        // 既存のイベントリスナーを削除
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // 予約状態によってボタン表示を変更
        if (lessonInfo.status === 'booked') {
            // 予約済みの場合はキャンセルボタンを表示
            newConfirmButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                予約をキャンセル
            `;
            newConfirmButton.classList.remove('btn-primary');
            newConfirmButton.classList.add('btn-danger');
            
            // キャンセルボタンのイベントリスナー
            newConfirmButton.addEventListener('click', () => {
                this._cancelBooking(slotKey, slotDate);
            });
        } else if (lessonInfo.status === 'pending') {
            // 確認待ちの場合はキャンセルボタンを表示
            newConfirmButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                予約リクエストをキャンセル
            `;
            newConfirmButton.classList.remove('btn-primary');
            newConfirmButton.classList.add('btn-warning');
            
            // キャンセルボタンのイベントリスナー
            newConfirmButton.addEventListener('click', () => {
                this._cancelPendingBooking(slotKey, slotDate);
            });
        } else if (lessonInfo.status === 'cancelled') {
            // キャンセル済みの場合は再予約ボタンを表示
            newConfirmButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 2v6h-6"></path>
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                    <path d="M3 22v-6h6"></path>
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>
                再予約する
            `;
            newConfirmButton.classList.remove('btn-danger');
            newConfirmButton.classList.add('btn-primary');
            
            // 再予約ボタンのイベントリスナー
            newConfirmButton.addEventListener('click', () => {
                this._rebookCancelled(slotKey, slotDate);
            });
        }
        
        // キャンセルボタン（モーダルを閉じるボタン）のテキスト変更
        const cancelButton = document.getElementById('cancel-booking');
        cancelButton.textContent = '閉じる';
    }
    
    /**
     * 予約確定処理
     * @param {string} slotKey スロットの識別キー
     * @param {Date} slotDate スロットの日付
     * @param {Object} teacherInfo 講師情報
     */
    _confirmBooking(slotKey, slotDate, teacherInfo) {
        // ローディングを表示
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // 備考欄のテキストを取得
        const notes = document.getElementById('notes').value;
        
        // 予約データを作成
        const bookingData = {
            slotKey: slotKey,
            date: slotDate,
            teacher: teacherInfo.name,
            instrument: teacherInfo.instrument,
            notes: notes,
            status: 'booked',
            zoomLink: teacherInfo.zoomLink
        };
        
        // オフライン時は保留データとして保存
        if (!navigator.onLine) {
            this.app.dataManager.savePendingBooking(bookingData);
            
            // 予約モーダルを閉じる
            this.app.uiManager.closeModal();
            
            // ローディングを非表示
            document.getElementById('loading-overlay').style.display = 'none';
            
            // オフライン通知
            this.app.notificationManager.showToast('オフラインモードで予約リクエストを保存しました。インターネット接続時に自動的に送信されます。', 'warning');
            
            // スケジュールを更新（オフラインデータを表示）
            this.updateSchedule(
                document.getElementById('instrument').value,
                document.getElementById('teacher').value,
                document.getElementById('lesson-type').value,
                document.getElementById('status').value
            );
            
            return;
        }
        
        // 実際の予約処理の代わりにタイマーでシミュレート
        setTimeout(() => {
            // 予約データを保存
            this.app.dataManager.saveBooking(bookingData);
            
            // 予約モーダルを閉じる
            this.app.uiManager.closeModal();
            
            // ローディングを非表示
            document.getElementById('loading-overlay').style.display = 'none';
            
            // 予約完了通知
            this.app.notificationManager.showToast('レッスンの予約が完了しました！', 'success');
            
            // スケジュールを更新
            this.updateSchedule(
                document.getElementById('instrument').value,
                document.getElementById('teacher').value,
                document.getElementById('lesson-type').value,
                document.getElementById('status').value
            );
        }, 1000);
    }
    
    /**
     * 予約キャンセル処理
     * @param {string} slotKey スロットの識別キー
     * @param {Date} slotDate スロットの日付
     */
    _cancelBooking(slotKey, slotDate) {
        // キャンセル確認
        if (!confirm('予約をキャンセルしますか？')) {
            return;
        }
        
        // ローディングを表示
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // 実際のキャンセル処理の代わりにタイマーでシミュレート
        setTimeout(() => {
            // 予約データを更新
            this.app.dataManager.updateBookingStatus(slotKey, 'cancelled');
            
            // 予約モーダルを閉じる
            this.app.uiManager.closeModal();
            
            // ローディングを非表示
            document.getElementById('loading-overlay').style.display = 'none';
            
            // キャンセル完了通知
            this.app.notificationManager.showToast('レッスンの予約をキャンセルしました', 'info');
            
            // スケジュールを更新
            this.updateSchedule(
                document.getElementById('instrument').value,
                document.getElementById('teacher').value,
                document.getElementById('lesson-type').value,
                document.getElementById('status').value
            );
        }, 1000);
    }
    
    /**
     * 確認待ち予約のキャンセル処理
     * @param {string} slotKey スロットの識別キー
     * @param {Date} slotDate スロットの日付
     */
    _cancelPendingBooking(slotKey, slotDate) {
        // キャンセル確認
        if (!confirm('予約リクエストをキャンセルしますか？')) {
            return;
        }
        
        // ローディングを表示
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // 実際のキャンセル処理の代わりにタイマーでシミュレート
        setTimeout(() => {
            // 予約データを更新
            this.app.dataManager.updateBookingStatus(slotKey, 'cancelled');
            
            // 予約モーダルを閉じる
            this.app.uiManager.closeModal();
            
            // ローディングを非表示
            document.getElementById('loading-overlay').style.display = 'none';
            
            // キャンセル完了通知
            this.app.notificationManager.showToast('予約リクエストをキャンセルしました', 'info');
            
            // スケジュールを更新
            this.updateSchedule(
                document.getElementById('instrument').value,
                document.getElementById('teacher').value,
                document.getElementById('lesson-type').value,
                document.getElementById('status').value
            );
        }, 1000);
    }
    
    /**
     * キャンセル済み予約の再予約処理
     * @param {string} slotKey スロットの識別キー
     * @param {Date} slotDate スロットの日付
     */
    _rebookCancelled(slotKey, slotDate) {
        // ローディングを表示
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // レッスン情報を取得
        const lessonInfo = this.app.dataManager.getLessonInfo(slotKey);
        
        // 備考欄のテキストを取得
        const notes = document.getElementById('notes').value;
        
        // 予約データを更新
        const updatedBookingData = {
            ...lessonInfo,
            notes: notes,
            status: 'booked'
        };
        
        // 実際の再予約処理の代わりにタイマーでシミュレート
        setTimeout(() => {
            // 予約データを更新
            this.app.dataManager.saveBooking(updatedBookingData);
            
            // 予約モーダルを閉じる
            this.app.uiManager.closeModal();
            
            // ローディングを非表示
            document.getElementById('loading-overlay').style.display = 'none';
            
            // 再予約完了通知
            this.app.notificationManager.showToast('レッスンを再予約しました', 'success');
            
            // スケジュールを更新
            this.updateSchedule(
                document.getElementById('instrument').value,
                document.getElementById('teacher').value,
                document.getElementById('lesson-type').value,
                document.getElementById('status').value
            );
        }, 1000);
    }
    
    /**
     * ペンディングデータの同期確認
     */
    checkPendingData() {
        const pendingCount = this.app.dataManager.getPendingBookingsCount();
        
        if (pendingCount > 0 && navigator.onLine) {
            this.app.notificationManager.showToast(`オフラインで保存された${pendingCount}件の予約データを同期しています...`, 'info');
            this.syncPendingData();
        }
    }
    
    /**
     * ペンディングデータの同期処理
     */
    syncPendingData() {
        if (!navigator.onLine) {
            return;
        }
        
        const pendingBookings = this.app.dataManager.getPendingBookings();
        
        if (pendingBookings.length === 0) {
            return;
        }
        
        // ローディングを表示
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // 実際の同期処理の代わりにタイマーでシミュレート
        setTimeout(() => {
            // 各保留中の予約を処理
            pendingBookings.forEach(booking => {
                // 予約データを保存
                this.app.dataManager.saveBooking(booking);
                
                // 保留中データを削除
                this.app.dataManager.removePendingBooking(booking.slotKey);
            });
            
            // ローディングを非表示
            document.getElementById('loading-overlay').style.display = 'none';
            
            // 同期完了通知
            this.app.notificationManager.showToast(`${pendingBookings.length}件の予約データを同期しました`, 'success');
            
            // スケジュールを更新
            this.updateSchedule(
                document.getElementById('instrument').value,
                document.getElementById('teacher').value,
                document.getElementById('lesson-type').value,
                document.getElementById('status').value
            );
        }, 1500);
    }
    
    /**
     * スケジュールグリッドを更新
     */
    updateScheduleGrid() {
        this.updateSchedule(
            document.getElementById('instrument').value,
            document.getElementById('teacher').value,
            document.getElementById('lesson-type').value,
            document.getElementById('status').value
        );
    /**
 * script.js - UIManager (Part 4)
 */

/**
 * UI管理を担当するクラス
 */
class UIManager {
    constructor(app) {
        this.app = app;
        
        // モーダル要素
        this.modal = document.getElementById('booking-modal');
        this.modalContent = document.querySelector('.modal-content');
        
        // イベントリスナーの初期化
        this._initializeEventListeners();
    }
    
    /**
     * イベントリスナーの初期化
     */
    _initializeEventListeners() {
        // モーダルを閉じるボタンのイベント
        document.getElementById('modal-close').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('cancel-booking').addEventListener('click', this.closeModal.bind(this));
        
        // モーダルの外側をクリックして閉じる
        this.modal.addEventListener('click', event => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Zoomリンクコピー機能
        document.getElementById('copy-zoom-link').addEventListener('click', this._handleCopyZoomLink.bind(this));
        
        // フィルターの表示・非表示を切り替えるボタンのイベント
        const toggleFiltersButton = document.getElementById('toggle-filters');
        if (toggleFiltersButton) {
            toggleFiltersButton.addEventListener('click', this._toggleFilters.bind(this));
        }
        
        // メニュートグルボタンのイベント（モバイル用）
        const menuToggleButton = document.getElementById('menu-toggle');
        if (menuToggleButton) {
            menuToggleButton.addEventListener('click', this._toggleMobileMenu.bind(this));
        }
        
        // ユーザーメニューのイベント
        const userMenuButton = document.getElementById('user-menu-button');
        if (userMenuButton) {
            userMenuButton.addEventListener('click', this._toggleUserMenu.bind(this));
        }
    }
    
    /**
     * 週の表示範囲を更新する関数
     */
    updateWeekDisplay() {
        const endDate = new Date(this.app.currentWeekStartDate);
        endDate.setDate(endDate.getDate() + 6);
        
        const startFormatted = this._formatDateJP(this.app.currentWeekStartDate);
        const endFormatted = this._formatDateJP(endDate);
        
        // モバイル表示の場合は短縮表示
        if (window.innerWidth <= 480) {
            document.getElementById('current-week').textContent = `${this.app.currentWeekStartDate.getMonth()+1}/${this.app.currentWeekStartDate.getDate()}-${endDate.getMonth()+1}/${endDate.getDate()}`;
        } else if (window.innerWidth <= 768) {
            document.getElementById('current-week').textContent = `${this.app.currentWeekStartDate.getMonth()+1}月${this.app.currentWeekStartDate.getDate()}日-${endDate.getMonth()+1}月${endDate.getDate()}日`;
        } else {
            document.getElementById('current-week').textContent = `${startFormatted} - ${endFormatted}`;
        }
        
        // 日付入力フィールドも更新
        document.getElementById('date-from').value = this._formatDate(this.app.currentWeekStartDate);
        document.getElementById('date-to').value = this._formatDate(endDate);
    }
    
    /**
     * 日付をフォーマットする関数 (YYYY-MM-DD)
     * @param {Date} date フォーマットする日付
     * @return {string} フォーマット済みの日付文字列
     */
    _formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * 日付を日本語表示用にフォーマットする関数 (YYYY年MM月DD日)
     * @param {Date} date フォーマットする日付
     * @return {string} フォーマット済みの日付文字列
     */
    _formatDateJP(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    }
    
    /**
     * モーダルを表示する関数
     */
    showModal() {
        this.modal.style.display = 'flex';
        
        // フォーカスをモーダルコンテンツに設定（キーボードトラップ）
        setTimeout(() => {
            this.modalContent.focus();
        }, 100);
        
        // スクロール停止
        document.body.style.overflow = 'hidden';
        
        // アクセシビリティ属性を更新
        this.modal.setAttribute('aria-hidden', 'false');
    }
    
    /**
     * モーダルを閉じる関数
     */
    closeModal() {
        this.modal.style.display = 'none';
        
        // スクロール再開
        document.body.style.overflow = '';
        
        // アクセシビリティ属性を更新
        this.modal.setAttribute('aria-hidden', 'true');
    }
    
    /**
     * Zoomリンクコピー機能
     */
    _handleCopyZoomLink() {
        const zoomLink = document.getElementById('zoom-link');
        zoomLink.select();
        
        // モダンなクリップボードAPI（iOS Safariなどでも動作）を使用
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(zoomLink.value)
                .then(() => {
                    // コピー成功メッセージを表示
                    const copySuccess = document.getElementById('copy-success');
                    copySuccess.style.display = 'block';
                    
                    // 3秒後にメッセージを非表示
                    setTimeout(() => {
                        copySuccess.style.display = 'none';
                    }, 3000);
                })
                .catch(err => {
                    // フォールバック: execCommandを試す
                    this._fallbackCopy(zoomLink);
                });
        } else {
            // 古いブラウザ向けフォールバック
            this._fallbackCopy(zoomLink);
        }
    }
    
    /**
     * コピー機能のフォールバック
     * @param {HTMLElement} element コピー対象の要素
     */
    _fallbackCopy(element) {
        element.select();
        const success = document.execCommand('copy');
        
        if (success) {
            // コピー成功メッセージを表示
            const copySuccess = document.getElementById('copy-success');
            copySuccess.style.display = 'block';
            
            // 3秒後にメッセージを非表示
            setTimeout(() => {
                copySuccess.style.display = 'none';
            }, 3000);
        } else {
            this.app.notificationManager.showToast('コピーに失敗しました。URLを手動でコピーしてください。', 'error');
        }
    }
    
    /**
     * フィルターの表示・非表示を切り替える関数
     */
    _toggleFilters() {
        const filterContent = document.getElementById('filter-content');
        const toggleFiltersButton = document.getElementById('toggle-filters');
        
        // hiddenクラスの有無でトグル
        if (filterContent.classList.contains('hidden')) {
            filterContent.classList.remove('hidden');
            toggleFiltersButton.innerHTML = '<span class="toggle-icon">▲</span> フィルターを非表示';
            toggleFiltersButton.setAttribute('aria-expanded', 'true');
        } else {
            filterContent.classList.add('hidden');
            toggleFiltersButton.innerHTML = '<span class="toggle-icon">▼</span> フィルターを表示';
            toggleFiltersButton.setAttribute('aria-expanded', 'false');
        }
    }
    
    /**
     * モバイルメニューの表示・非表示を切り替える関数
     */
    _toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        const menuToggle = document.getElementById('menu-toggle');
        
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
        
        // アクセシビリティ属性を更新
        const isExpanded = navLinks.classList.contains('active');
        menuToggle.setAttribute('aria-expanded', isExpanded.toString());
    }
    
    /**
     * ユーザーメニューの表示・非表示を切り替える関数
     */
    _toggleUserMenu() {
        // 未実装の場合はメッセージを表示
        this.app.notificationManager.showToast('ユーザーメニューは開発中です', 'info');
    }
    
    /**
     * レスポンシブ対応の調整
     */
    updateResponsiveUI() {
        // モバイルビューの場合、フィルターを閉じた状態にする
        if (window.innerWidth <= 768) {
            const filterContent = document.getElementById('filter-content');
            const toggleFilters = document.getElementById('toggle-filters');
            
            // デスクトップから小さいサイズに変わった場合のみ隠す
            if (!filterContent.classList.contains('hidden') && toggleFilters.style.display !== 'none') {
                filterContent.classList.add('hidden');
                toggleFilters.innerHTML = '<span class="toggle-icon">▼</span> フィルターを表示';
                toggleFilters.setAttribute('aria-expanded', 'false');
            }
            
            // トグルボタンを表示
            toggleFilters.style.display = 'block';
        } else {
            // デスクトップビューでは常にフィルターを表示
            const filterContent = document.getElementById('filter-content');
            const toggleFilters = document.getElementById('toggle-filters');
            
            filterContent.classList.remove('hidden');
            toggleFilters.style.display = 'none';
        }
        
        // 週の表示を更新
        this.updateWeekDisplay();
    }
}
}
}
       // 次の週へ
        const newDate = new Date(this.app.currentWeekStartDate);
        newDate.setDate(newDate.getDate() + 7);
        this.app.currentWeekStartDate = newDate;
        this.app.uiManager.updateWeekDisplay();
        
        // 検索ボタンをクリック
        document.getElementById('search-button').click();
    }
}
/**
 * script.js - DataManager (Part 5)
 */

/**
 * データ管理を担当するクラス
 */
class DataManager {
    constructor(app) {
        this.app = app;
        
        // データの初期化
        this._initializeData();
    }
    
    /**
     * データの初期化
     */
    _initializeData() {
        // ローカルストレージからデータを読み込み
        this._loadFromLocalStorage();
        
        // データが存在しない場合はデモデータを生成
        if (!this.teachers || Object.keys(this.teachers).length === 0) {
            this._generateDemoData();
        }
        
        if (!this.bookings) {
            this.bookings = {};
        }
        
        if (!this.pendingBookings) {
            this.pendingBookings = {};
        }
    }
    
    /**
     * ローカルストレージからデータを読み込む
     */
    _loadFromLocalStorage() {
        try {
            // 講師データ
            const teachersData = localStorage.getItem('melodylab_teachers');
            this.teachers = teachersData ? JSON.parse(teachersData) : {};
            
            // 予約データ
            const bookingsData = localStorage.getItem('melodylab_bookings');
            this.bookings = bookingsData ? JSON.parse(bookingsData) : {};
            
            // ペンディング予約データ
            const pendingBookingsData = localStorage.getItem('melodylab_pending_bookings');
            this.pendingBookings = pendingBookingsData ? JSON.parse(pendingBookingsData) : {};
        } catch (error) {
            console.error('ローカルストレージからの読み込みに失敗しました', error);
            
            // エラー時はデフォルトデータを設定
            this.teachers = {};
            this.bookings = {};
            this.pendingBookings = {};
        }
    }
    
    /**
     * ローカルストレージにデータを保存
     */
    _saveToLocalStorage() {
        try {
            localStorage.setItem('melodylab_teachers', JSON.stringify(this.teachers));
            localStorage.setItem('melodylab_bookings', JSON.stringify(this.bookings));
            localStorage.setItem('melodylab_pending_bookings', JSON.stringify(this.pendingBookings));
        } catch (error) {
            console.error('ローカルストレージへの保存に失敗しました', error);
            
            // エラー通知
            this.app.notificationManager.showToast('データの保存に失敗しました。ブラウザのストレージ設定を確認してください。', 'error');
        }
    }
    
    /**
     * デモデータの生成
     */
    _generateDemoData() {
        // 講師データ
        this.teachers = {
            'tanaka': {
                id: 'tanaka',
                name: '田中先生',
                instrument: 'ピアノ',
                slots: this._generateRandomSlots(14),
                zoomLink: 'https://zoom.us/j/1234567890?pwd=abcdef'
            },
            'suzuki': {
                id: 'suzuki',
                name: '鈴木先生',
                instrument: 'ギター',
                slots: this._generateRandomSlots(16),
                zoomLink: 'https://zoom.us/j/2345678901?pwd=bcdefg'
            },
            'sato': {
                id: 'sato',
                name: '佐藤先生',
                instrument: 'バイオリン',
                slots: this._generateRandomSlots(12),
                zoomLink: 'https://zoom.us/j/3456789012?pwd=cdefgh'
            },
            'nakamura': {
                id: 'nakamura',
                name: '中村先生',
                instrument: 'ボーカル',
                slots: this._generateRandomSlots(10),
                zoomLink: 'https://zoom.us/j/4567890123?pwd=defghi'
            },
            'yamamoto': {
                id: 'yamamoto',
                name: '山本先生',
                instrument: 'ドラム',
                slots: this._generateRandomSlots(8),
                zoomLink: 'https://zoom.us/j/5678901234?pwd=efghij'
            },
            'kato': {
                id: 'kato',
                name: '加藤先生',
                instrument: 'ベース',
                slots: this._generateRandomSlots(9),
                zoomLink: 'https://zoom.us/j/6789012345?pwd=fghijk'
            }
        };
        
        // サンプル予約
        this.bookings = {
            'wed-10-00': {
                slotKey: 'wed-10-00',
                date: new Date(2025, 4, 20, 10, 0, 0),
                teacher: '田中先生',
                instrument: 'ピアノ',
                title: 'ピアノレッスン',
                type: '通常レッスン',
                notes: 'ショパンの練習曲を練習中です。',
                status: 'booked',
                zoomLink: 'https://zoom.us/j/1234567890?pwd=abcdef'
            },
            'wed-10-30': {
                slotKey: 'wed-10-30',
                date: new Date(2025, 4, 20, 10, 30, 0),
                teacher: '田中先生',
                instrument: 'ピアノ',
                title: 'ピアノレッスン',
                type: '通常レッスン',
                notes: 'モーツァルトのソナタを練習中です。',
                status: 'booked',
                zoomLink: 'https://zoom.us/j/1234567890?pwd=abcdef'
            },
            'thu-15-00': {
                slotKey: 'thu-15-00',
                date: new Date(2025, 4, 21, 15, 0, 0),
                teacher: '鈴木先生',
                instrument: 'ギター',
                title: 'ギターレッスン',
                type: '通常レッスン',
                notes: '',
                status: 'pending',
                zoomLink: 'https://zoom.us/j/2345678901?pwd=bcdefg'
            },
            'fri-13-30': {
                slotKey: 'fri-13-30',
                date: new Date(2025, 4, 22, 13, 30, 0),
                teacher: '佐藤先生',
                instrument: 'バイオリン',
                title: 'バイオリンレッスン',
                type: '通常レッスン',
                notes: '弓の持ち方を重点的に練習したいです。',
                status: 'cancelled',
                zoomLink: 'https://zoom.us/j/3456789012?pwd=cdefgh'
            }
        };
        
        // ローカルストレージに保存
        this._saveToLocalStorage();
    }
    
    /**
     * ランダムなスロットを生成する関数
     * @param {number} count 生成するスロット数
     * @return {Array} 生成されたスロットの配列
     */
    _generateRandomSlots(count) {
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        const hours = [];
        
        // 9:00から18:00まで30分刻みで時間を生成
        for (let hour = 9; hour <= 18; hour++) {
            for (let minute of ['00', '30']) {
                hours.push(`${hour}-${minute}`);
            }
        }
        
        const slots = [];
        // ランダムにスロットを選択
        for (let i = 0; i < count; i++) {
            const randomDay = days[Math.floor(Math.random() * days.length)];
            const randomHour = hours[Math.floor(Math.random() * hours.length)];
            const slot = `${randomDay}-${randomHour}`;
            
            // 重複をチェック
            if (!slots.includes(slot)) {
                slots.push(slot);
            }
        }
        
        return slots;
    }
    
    /**
     * フィルタリングされたスロットを取得する関数
     * @param {string} instrumentFilter 楽器フィルター
     * @param {string} teacherFilter 講師フィルター
     * @param {string} lessonType レッスンタイプフィルター
     * @param {string} statusFilter 予約ステータスフィルター
     * @return {Array} フィルタリングされたスロットの配列
     */
    getFilteredSlots(instrumentFilter, teacherFilter, lessonType, statusFilter) {
        let filteredSlots = [];
        
        // フィルターが指定されていない場合は「すべて」として扱う
        const useInstrumentFilter = instrumentFilter && instrumentFilter !== 'all';
        const useTeacherFilter = teacherFilter && teacherFilter !== 'all';
        const useLessonTypeFilter = lessonType && lessonType !== 'all';
        const useStatusFilter = statusFilter && statusFilter !== 'all';
        
        // まずすべての利用可能なスロットを取得
        let allSlots = [];
        let allTeachers = Object.keys(this.teachers);
        
        if (useTeacherFilter) {
            // 特定の講師のみフィルタリング
            allTeachers = allTeachers.filter(teacherKey => teacherKey === teacherFilter);
        }
        
        if (useInstrumentFilter) {
            // 特定の楽器のみフィルタリング
            allTeachers = allTeachers.filter(teacherKey => {
                const teacher = this.teachers[teacherKey];
                return teacher.instrument === this._getJapaneseInstrument(instrumentFilter);
            });
        }
        
        // 適用されたフィルターに基づいて利用可能なスロットを取得
        allTeachers.forEach(teacherKey => {
            const teacher = this.teachers[teacherKey];
            teacher.slots.forEach(slot => {
                allSlots.push({
                    slotKey: slot,
                    teacherKey: teacherKey
                });
            });
        });
        
        // 予約状態でフィルタリング
        if (useStatusFilter) {
            // ステータスに応じたスロットを表示
            if (statusFilter === 'available') {
                // 予約可能なスロットのみを表示（既存の予約とペンディング予約を除外）
                filteredSlots = allSlots.filter(slot => {
                    return !this.bookings[slot.slotKey] && !this.pendingBookings[slot.slotKey];
                }).map(slot => slot.slotKey);
            } else if (statusFilter === 'booked') {
                // 予約済みのスロットのみを表示
                filteredSlots = Object.keys(this.bookings).filter(slotKey => {
                    return this.bookings[slotKey].status === 'booked';
                });
            } else if (statusFilter === 'pending') {
                // 確認待ちのスロットのみを表示
                filteredSlots = Object.keys(this.bookings).filter(slotKey => {
                    return this.bookings[slotKey].status === 'pending';
                });
            } else if (statusFilter === 'cancelled') {
                // キャンセル済みのスロットのみを表示
                filteredSlots = Object.keys(this.bookings).filter(slotKey => {
                    return this.bookings[slotKey].status === 'cancelled';
                });
            }
        } else {
            // ステータスフィルターがない場合は予約可能なスロットのみを表示
            filteredSlots = allSlots.filter(slot => {
                // 既存の予約やペンディング予約を除外
                if (this.bookings[slot.slotKey]) {
                    return this.bookings[slot.slotKey].status !== 'booked' && 
                           this.bookings[slot.slotKey].status !== 'pending';
                }
                
                return !this.pendingBookings[slot.slotKey];
            }).map(slot => slot.slotKey);
        }
        
        return filteredSlots;
    }
    
    /**
     * 楽器名を日本語に変換
     * @param {string} instrument 英語の楽器名
     * @return {string} 日本語の楽器名
     */
    _getJapaneseInstrument(instrument) {
        const instrumentMap = {
            'piano': 'ピアノ',
            'guitar': 'ギター',
            'violin': 'バイオリン',
            'vocal': 'ボーカル',
            'drums': 'ドラム',
            'bass': 'ベース',
            'flute': 'フルート',
            'saxophone': 'サックス'
        };
        
        return instrumentMap[instrument] || instrument;
    }
    
    /**
     * スロットの状態を取得
     * @param {string} slotKey スロットの識別キー
     * @return {string} スロットの状態 ('available', 'booked', 'pending', 'cancelled', 'unavailable')
     */
    getSlotStatus(slotKey) {
        // 予約データをチェック
        if (this.bookings[slotKey]) {
            return this.bookings[slotKey].status;
        }
        
        // ペンディング予約をチェック
        if (this.pendingBookings[slotKey]) {
            return 'pending';
        }
        
        // 講師の利用可能スロットをチェック
        let isAvailable = false;
        
        Object.keys(this.teachers).forEach(teacherKey => {
            const teacher = this.teachers[teacherKey];
            if (teacher.slots.includes(slotKey)) {
                isAvailable = true;
            }
        });
        
        return isAvailable ? 'available' : 'unavailable';
    }
    
    /**
     * レッスン情報を取得
     * @param {string} slotKey スロットの識別キー
     * @return {Object} レッスン情報
     */
    getLessonInfo(slotKey) {
        // 予約データをチェック
        if (this.bookings[slotKey]) {
            return this.bookings[slotKey];
        }
        
        // ペンディング予約をチェック
        if (this.pendingBookings[slotKey]) {
            return this.pendingBookings[slotKey];
        }
        
        // 存在しない場合はnullを返す
        return null;
    }
    
    /**
     * スロットに対応する講師情報を取得
     * @param {string} slotKey スロットの識別キー
     * @return {Object} 講師情報
     */
    getTeacherInfoForSlot(slotKey) {
        let teacherInfo = null;
        
        Object.keys(this.teachers).forEach(teacherKey => {
            const teacher = this.teachers[teacherKey];
            if (teacher.slots.includes(slotKey)) {
                teacherInfo = {
                    key: teacherKey,
                    name: teacher.name,
                    instrument: teacher.instrument,
                    zoomLink: teacher.zoomLink
                };
            }
        });
        
        return teacherInfo;
    }
    
    /**
     * 予約データを保存
     * @param {Object} bookingData 予約データ
     */
    saveBooking(bookingData) {
        // 予約データを保存
        this.bookings[bookingData.slotKey] = bookingData;
        
        // ローカルストレージに保存
        this._saveToLocalStorage();
    }
    
    /**
     * 予約ステータスを更新
     * @param {string} slotKey スロットの識別キー
     * @param {string} status 新しいステータス
     */
    updateBookingStatus(slotKey, status) {
        // 予約データをチェック
        if (this.bookings[slotKey]) {
            this.bookings[slotKey].status = status;
            
            // ローカルストレージに保存
            this._saveToLocalStorage();
        }
    }
    
    /**
     * ペンディング予約を保存
     * @param {Object} bookingData 予約データ
     */
    savePendingBooking(bookingData) {
        // ペンディング予約データを保存
        this.pendingBookings[bookingData.slotKey] = {
            ...bookingData,
            status: 'pending'
        };
        
        // ローカルストレージに保存
        this._saveToLocalStorage();
    }
    
    /**
     * ペンディング予約を削除
     * @param {string} slotKey スロットの識別キー
     */
    removePendingBooking(slotKey) {
        // ペンディング予約データを削除
        if (this.pendingBookings[slotKey]) {
            delete this.pendingBookings[slotKey];
            
            // ローカルストレージに保存
            this._saveToLocalStorage();
        }
    }
    
    /**
     * ペンディング予約の数を取得
     * @return {number} ペンディング予約の数
     */
    getPendingBookingsCount() {
        return Object.keys(this.pendingBookings).length;
    }
    
    /**
     * ペンディング予約のリストを取得
     * @return {Array} ペンディング予約の配列
     */
    getPendingBookings() {
        return Object.values(this.pendingBookings);
    }
}
/**
 * script.js - NotificationManager (Part 6 - 最終部分)
 */

/**
 * 通知管理を担当するクラス
 */
class NotificationManager {
    constructor(app) {
        this.app = app;
        
        // トーストコンテナの参照
        this.toastContainer = document.getElementById('toast-container');
        
        // アクティブなトーストのカウンター（ユニークIDに使用）
        this.toastCounter = 0;
    }
    
    /**
     * トースト通知を表示する関数
     * @param {string} message 表示するメッセージ
     * @param {string} type 通知のタイプ ('success', 'warning', 'error', 'info')
     * @param {number} duration 表示時間（ミリ秒）
     */
    showToast(message, type = 'info', duration = 4000) {
        // トーストのユニークID
        const toastId = `toast-${this.toastCounter++}`;
        
        // トースト要素を作成
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        // トーストアイコンを取得
        const icon = this._getToastIcon(type);
        
        // トースト内容
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${this._getToastTitle(type)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="閉じる">×</button>
        `;
        
        // トーストを追加
        this.toastContainer.appendChild(toast);
        
        // アニメーションのために微小な遅延を入れる
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 閉じるボタンのイベントリスナー
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            this._hideToast(toast);
        });
        
        // 自動的に閉じるタイマー
        const autoCloseTimeout = setTimeout(() => {
            this._hideToast(toast);
        }, duration);
        
        // マウスホバー時にタイマーを一時停止
        toast.addEventListener('mouseenter', () => {
            clearTimeout(autoCloseTimeout);
        });
        
        // マウスが離れたら再度タイマーをセット
        toast.addEventListener('mouseleave', () => {
            const newTimeout = setTimeout(() => {
                this._hideToast(toast);
            }, 2000);
            
            // データ属性にタイマーIDを保存
            toast.dataset.timeoutId = newTimeout;
        });
        
        return toastId;
    }
    
    /**
     * トースト通知を非表示にする関数
     * @param {HTMLElement} toast トースト要素
     */
    _hideToast(toast) {
        // すでに非表示処理が行われている場合は何もしない
        if (toast.classList.contains('hide')) {
            return;
        }
        
        // 非表示アニメーションのクラスを追加
        toast.classList.add('hide');
        toast.classList.remove('show');
        
        // アニメーション完了後に要素を削除
        setTimeout(() => {
            // 要素がまだ存在する場合のみ削除
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
        
        // タイマーが設定されている場合はクリア
        if (toast.dataset.timeoutId) {
            clearTimeout(parseInt(toast.dataset.timeoutId));
        }
    }
    
    /**
     * トースト通知のタイプに応じたアイコンを取得
     * @param {string} type 通知のタイプ
     * @return {string} SVGアイコンのHTML
     */
    _getToastIcon(type) {
        switch (type) {
            case 'success':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            case 'warning':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
            case 'error':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
            case 'info':
            default:
                return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }
    }
    
    /**
     * トースト通知のタイプに応じたタイトルを取得
     * @param {string} type 通知のタイプ
     * @return {string} タイトル
     */
    _getToastTitle(type) {
        switch (type) {
            case 'success':
                return '成功';
            case 'warning':
                return '注意';
            case 'error':
                return 'エラー';
            case 'info':
            default:
                return 'お知らせ';
        }
    }
    
    /**
     * プッシュ通知を送信する関数（PWA用）
     * @param {string} title 通知のタイトル
     * @param {string} message 通知のメッセージ
     * @param {Object} options 通知オプション
     */
    sendPushNotification(title, message, options = {}) {
        // 通知APIをサポートしているか確認
        if (!('Notification' in window)) {
            console.log('このブラウザは通知をサポートしていません');
            return;
        }
        
        // 通知の権限をチェック
        if (Notification.permission === 'granted') {
            // 通知を作成
            this._createNotification(title, message, options);
        } else if (Notification.permission !== 'denied') {
            // 通知の許可を要求
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this._createNotification(title, message, options);
                }
            });
        }
    }
    
    /**
     * 通知を作成する関数
     * @param {string} title 通知のタイトル
     * @param {string} message 通知のメッセージ
     * @param {Object} options 通知オプション
     */
    _createNotification(title, message, options) {
        // デフォルトオプションをマージ
        const defaultOptions = {
            body: message,
            icon: 'assets/icon-192.png',
            badge: 'assets/badge.png',
            vibrate: [100, 50, 100],
            timestamp: Date.now()
        };
        
        const notificationOptions = { ...defaultOptions, ...options };
        
        // 通知を作成
        const notification = new Notification(title, notificationOptions);
        
        // 通知がクリックされたときの処理
        notification.onclick = function(event) {
            event.preventDefault();
            
            // 指定されたURLがある場合はそこに遷移
            if (options.url) {
                window.open(options.url, '_blank');
            } else {
                // アプリがすでに開いている場合はフォーカス
                window.focus();
            }
            
            // 通知を閉じる
            notification.close();
        };
    }
}

// アプリケーションの初期化（DOMコンテンツの読み込み完了後）
document.addEventListener('DOMContentLoaded', function() {
    // アプリケーションのインスタンス化
    const app = new MelodyLabApp();
    
    // グローバル変数として参照できるようにする（開発用）
    window.melodyLabApp = app;
});
