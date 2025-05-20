/**
 * スケジュール表示関連機能 - ScheduleView.js
 * MelodyLabアプリケーションのスケジュール表示機能を提供するモジュール
 */

/**
 * 週表示の実装
 * @param {string} instrumentFilter 楽器フィルター
 * @param {string} teacherFilter 講師フィルター
 * @param {string} lessonType レッスンタイプフィルター
 * @param {string} statusFilter 予約ステータスフィルター
 */
ScheduleManager.prototype.showWeekView = function(instrumentFilter, teacherFilter, lessonType, statusFilter) {
    // スケジュールグリッドをリセット
    const scheduleGrid = document.getElementById('schedule-grid');
    
    // グリッドをクリア
    while (scheduleGrid.firstChild) {
        scheduleGrid.removeChild(scheduleGrid.firstChild);
    }
    
    // 週表示のスタイルを適用
    scheduleGrid.className = 'week-view';
    
    // モバイル対応 - スタイルをリセットして新しいクラスを追加
    scheduleGrid.style.minWidth = '';
    scheduleGrid.style.width = '100%';
    
    if (window.innerWidth <= 480) {
        scheduleGrid.classList.add('mobile-view');
    } else if (window.innerWidth <= 768) {
        scheduleGrid.classList.add('tablet-view');
    }
    
    // 時間列のヘッダー（空のセル）
    const timeHeader = document.createElement('div');
    timeHeader.className = 'day-header';
    scheduleGrid.appendChild(timeHeader);
    
    // 曜日ヘッダーを追加
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const currentDate = new Date(this.app.currentWeekStartDate);
    
    days.forEach((day, index) => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        
        // 日付を計算して表示
        const date = new Date(currentDate);
        date.setDate(date.getDate() + index);
        
        // 今日の日付にはtoday クラスを追加
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date.getTime() === today.getTime()) {
            dayHeader.classList.add('today');
        }
        
        // 日付情報を表示
        const dayName = document.createElement('span');
        dayName.className = 'day-name';
        dayName.textContent = this.dayMapping[day];
        
        const dayDate = document.createElement('span');
        dayDate.className = 'day-date';
        dayDate.textContent = date.getDate();
        
        dayHeader.appendChild(dayName);
        dayHeader.appendChild(dayDate);
        
        scheduleGrid.appendChild(dayHeader);
    });
    
    // フィルタリングされた利用可能スロットを取得
    const availableSlots = this.app.dataManager.getFilteredSlots(instrumentFilter, teacherFilter, lessonType, statusFilter);
    
    // モバイルでは表示範囲を限定する (モバイルでは9:00-18:00だけ表示)
    const startHour = window.innerWidth <= 768 ? 9 : 9;
    const endHour = window.innerWidth <= 768 ? 18 : 23;
    
    // 時間スロット行を追加
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute of ['00', '30']) {
            // 23:30は含めない
            if (hour === 23 && minute === '30') continue;
            
            // 時間ラベルを追加
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = `${hour}:${minute}`;
            scheduleGrid.appendChild(timeLabel);
            
            // 各曜日の時間スロットを追加
            days.forEach((day, index) => {
                const slotKey = `${day}-${hour}-${minute}`;
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                
                // スロットの状態を取得
                const slotStatus = this.app.dataManager.getSlotStatus(slotKey);
                
                if (slotStatus !== 'unavailable') {
                    timeSlot.classList.add(slotStatus);
                    timeSlot.setAttribute('data-slot', slotKey);
                    
                    // 日付を計算
                    const slotDate = new Date(this.app.currentWeekStartDate);
                    slotDate.setDate(slotDate.getDate() + index);
                    slotDate.setHours(hour, parseInt(minute), 0);
                    
                    // クリックイベントで予約モーダルを表示
                    timeSlot.addEventListener('click', () => {
                        this._showBookingModal(slotKey, slotDate);
                    });
                } else {
                    timeSlot.classList.add('unavailable');
                }
                
                scheduleGrid.appendChild(timeSlot);
            });
        }
    }
};

/**
 * 日表示の実装
 * @param {string} instrumentFilter 楽器フィルター
 * @param {string} teacherFilter 講師フィルター
 * @param {string} lessonType レッスンタイプフィルター
 * @param {string} statusFilter 予約ステータスフィルター
 */
ScheduleManager.prototype.showDayView = function(instrumentFilter, teacherFilter, lessonType, statusFilter) {
    const scheduleGrid = document.getElementById('schedule-grid');
    scheduleGrid.className = 'day-view';
    scheduleGrid.innerHTML = '<p style="padding:20px;">日表示は開発中です。現在は週表示のみご利用いただけます。</p>';
};

/**
 * 月表示の実装
 * @param {string} instrumentFilter 楽器フィルター
 * @param {string} teacherFilter 講師フィルター
 * @param {string} lessonType レッスンタイプフィルター
 * @param {string} statusFilter 予約ステータスフィルター
 */
ScheduleManager.prototype.showMonthView = function(instrumentFilter, teacherFilter, lessonType, statusFilter) {
    const scheduleGrid = document.getElementById('schedule-grid');
    scheduleGrid.className = 'month-view';
    scheduleGrid.innerHTML = '<p style="padding:20px;">月表示は開発中です。現在は週表示のみご利用いただけます。</p>';
};

/**
 * スケジュール更新関数
 * @param {string} instrumentFilter 楽器フィルター
 * @param {string} teacherFilter 講師フィルター
 * @param {string} lessonType レッスンタイプフィルター
 * @param {string} statusFilter 予約ステータスフィルター
 */
ScheduleManager.prototype.updateSchedule = function(instrumentFilter, teacherFilter, lessonType, statusFilter) {
    // スケジュールグリッドをリセット
    const scheduleGrid = document.getElementById('schedule-grid');
    
    // すべての子要素を削除
    while (scheduleGrid.firstChild) {
        scheduleGrid.removeChild(scheduleGrid.firstChild);
    }
    
    // 現在のビューに基づいて表示を切り替え
    if (this.currentView === 'day') {
        this.showDayView(instrumentFilter, teacherFilter, lessonType, statusFilter);
    } else if (this.currentView === 'month') {
        this.showMonthView(instrumentFilter, teacherFilter, lessonType, statusFilter);
    } else {
        // デフォルトは週表示
        this.showWeekView(instrumentFilter, teacherFilter, lessonType, statusFilter);
    }
    
    // 結果カウンターを更新
    const resultCount = document.getElementById('result-count');
    const filteredSlots = this.app.dataManager.getFilteredSlots(instrumentFilter, teacherFilter, lessonType, statusFilter);
    resultCount.textContent = filteredSlots.length;
};

/**
 * 予約モーダルを表示する関数
 * @param {string} slotKey スロットの識別キー
 * @param {Date} slotDate スロットの日付
 */
ScheduleManager.prototype._showBookingModal = function(slotKey, slotDate) {
    // スロットキーから曜日と時間情報を解析
    const [day, hour, minute] = slotKey.split('-');
    
    // スロットの状態
    const status = this.app.dataManager.getSlotStatus(slotKey);
    
    // レッスン終了時間（50分後）
    const endHour = minute === '00' ? hour : parseInt(hour) + 1;
    const endMinute = minute === '00' ? '50' : '20';
    
    // 講師情報を取得
    const teacherInfo = this.app.dataManager.getTeacherInfoForSlot(slotKey);
    
    // レッスン情報を取得（すでに予約済みの場合）
    const lessonInfo = this.app.dataManager.getLessonInfo(slotKey);
    
    // モーダルの要素を取得
    const bookingDatetime = document.getElementById('booking-datetime');
    const bookingTeacher = document.getElementById('booking-teacher');
    const bookingInstrument = document.getElementById('booking-instrument');
    const bookingType = document.getElementById('booking-type');
    const bookingStatus = document.getElementById('booking-status');
    
    // 日付の日本語表記を作成
    const formatDate = this.app.uiManager._formatDateJP(slotDate);
    const dayJP = this.dayMapping[day];
    
    // モーダルに情報を表示
    bookingDatetime.textContent = `${formatDate}（${dayJP}） ${hour}:${minute} - ${endHour}:${endMinute}`;
    
    if (status === 'available') {
        // 予約可能な場合は予約モーダルを表示
        bookingTeacher.textContent = teacherInfo.name;
        bookingInstrument.textContent = teacherInfo.instrument;
        bookingType.textContent = '通常レッスン';
        bookingStatus.textContent = '予約可能';
        
        // Zoomリンクを更新
        document.getElementById('zoom-link').value = teacherInfo.zoomLink || 'https://zoom.us/j/1234567890?pwd=abcdefg';
        
        // 備考欄をクリア
        document.getElementById('notes').value = '';
        
        // 予約確定ボタンを表示
        const confirmButton = document.getElementById('confirm-booking');
        confirmButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
            </svg>
            予約する
        `;
        confirmButton.classList.remove('btn-danger', 'btn-warning');
        confirmButton.classList.add('btn-primary');
        
        // 既存のイベントリスナーを削除して新しいものを追加
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // 予約確定ボタンのイベントリスナー
        newConfirmButton.addEventListener('click', () => {
            this._confirmBooking(slotKey, slotDate, teacherInfo);
        });
        
        // キャンセルボタン（モーダルを閉じるボタン）のテキストを変更
        document.getElementById('cancel-booking').textContent = 'キャンセル';
    } else {
        // 既に何らかの予約状態がある場合の表示
        this._showBookingDetailsModal(slotKey, slotDate);
    }
    
    // モーダルを表示
    this.app.uiManager.showModal();
};

/**
 * ビューの切り替え
 * @param {string} view 表示するビュー ('day', 'week', 'month')
 */
ScheduleManager.prototype._switchView = function(view) {
    // ビューの切り替え
    this.currentView = view;
    
    // 表示の更新
    this.updateSchedule(
        document.getElementById('instrument').value,
        document.getElementById('teacher').value,
        document.getElementById('lesson-type').value,
        document.getElementById('status').value
    );
    
    // ビュートグルボタンの表示を更新
    document.querySelectorAll('.calendar-view-toggle button').forEach(button => {
        if (button.id === `${view}-view`) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
};

/**
 * スケジュールグリッドを更新
 */
ScheduleManager.prototype.updateScheduleGrid = function() {
    this.updateSchedule(
        document.getElementById('instrument').value,
        document.getElementById('teacher').value,
        document.getElementById('lesson-type').value,
        document.getElementById('status').value
    );
};
