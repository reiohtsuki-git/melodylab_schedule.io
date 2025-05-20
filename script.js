// スケジュール初期化処理
document.addEventListener('DOMContentLoaded', function() {
    // 現在の日付から最も近い月曜日を計算して初期表示
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=日, 1=月, ..., 6=土
    const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek - 1;
    
    // 現在週の開始日を設定
    const currentWeekStartDate = new Date(today);
    currentWeekStartDate.setDate(today.getDate() - daysToMonday);
    
    // 週の表示範囲を表示
    updateWeekDisplay(currentWeekStartDate);
    
    // スケジュールグリッドを初期化
    initializeScheduleGrid(currentWeekStartDate);
    
    // 検索ボタンのイベントリスナー
    document.getElementById('search-button').addEventListener('click', function() {
        handleSearch(currentWeekStartDate);
    });
    
    // 週の移動ボタンのイベントリスナー
    document.getElementById('prev-week').addEventListener('click', function() {
        navigateToPreviousWeek(currentWeekStartDate);
    });
    
    document.getElementById('next-week').addEventListener('click', function() {
        navigateToNextWeek(currentWeekStartDate);
    });
    
    // ビューの切り替えボタンのイベントリスナー
    document.querySelectorAll('.calendar-view-toggle button').forEach(button => {
        button.addEventListener('click', function() {
            switchView(this.id.replace('-view', ''), currentWeekStartDate);
        });
    });
    
    // フィルターの表示・非表示を切り替えるボタンのイベントリスナー
    const toggleFilters = document.getElementById('toggle-filters');
    if (toggleFilters) {
        toggleFilters.addEventListener('click', function() {
            toggleFilterContent();
        });
    }
    
    // モーダルを閉じるボタンのイベントリスナー
    document.getElementById('modal-close').addEventListener('click', function() {
        closeModal();
    });
    
    document.getElementById('cancel-booking').addEventListener('click', function() {
        closeModal();
    });
    
    // アクティブなビューをチェック
    const weekView = document.getElementById('week-view');
    if (weekView && weekView.classList.contains('active')) {
        // スケジュールグリッドを初期表示
        showWeekView(currentWeekStartDate, 'all', 'all', 'all', 'all');
    }
});

/**
 * 週の表示範囲を更新する関数
 */
function updateWeekDisplay(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const startFormatted = formatDateJP(startDate);
    const endFormatted = formatDateJP(endDate);
    
    // モバイル表示の場合は短縮表示
    if (window.innerWidth <= 480) {
        document.getElementById('current-week').textContent = `${startDate.getMonth()+1}/${startDate.getDate()}-${endDate.getMonth()+1}/${endDate.getDate()}`;
    } else if (window.innerWidth <= 768) {
        document.getElementById('current-week').textContent = `${startDate.getMonth()+1}月${startDate.getDate()}日-${endDate.getMonth()+1}月${endDate.getDate()}日`;
    } else {
        document.getElementById('current-week').textContent = `${startFormatted} - ${endFormatted}`;
    }
    
    // 日付入力フィールドも更新
    document.getElementById('date-from').value = formatDate(startDate);
    document.getElementById('date-to').value = formatDate(endDate);
}

/**
 * 日付をフォーマットする関数 (YYYY-MM-DD)
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 日付を日本語表示用にフォーマットする関数 (YYYY年MM月DD日)
 */
function formatDateJP(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

/**
 * スケジュールグリッドを初期化する関数
 */
function initializeScheduleGrid(currentWeekStartDate) {
    // 全期間のスロットを準備
    generateAllTimeSlots();
    
    // 講師データの生成
    generateDemoTeacherData();
    
    // スケジュールを表示
    showWeekView(currentWeekStartDate, 'all', 'all', 'all', 'all');
}

/**
 * 全期間のスロットを生成する関数
 */
function generateAllTimeSlots() {
    window.allSlots = [];
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    // 9:00から23:00まで30分刻みでスロットを生成
    for (let hour = 9; hour <= 23; hour++) {
        for (let minute of ['00', '30']) {
            // 23:30は含めない
            if (hour === 23 && minute === '30') continue;
            
            // 各曜日について
            for (const day of days) {
                window.allSlots.push(`${day}-${hour}-${minute}`);
            }
        }
    }
}

/**
 * デモ用の講師データを生成する関数
 */
function generateDemoTeacherData() {
    // 曜日のマッピング
    window.dayMapping = {
        'mon': '月',
        'tue': '火',
        'wed': '水',
        'thu': '木',
        'fri': '金',
        'sat': '土',
        'sun': '日'
    };
    
    // 日本語曜日から英語コードへの逆マッピング
    window.reverseDayMapping = {
        '月': 'mon',
        '火': 'tue',
        '水': 'wed',
        '木': 'thu',
        '金': 'fri',
        '土': 'sat',
        '日': 'sun'
    };
    
    // 講師データ
    window.teachers = {
        'tanaka': {
            name: '田中先生',
            instrument: 'ピアノ',
            slots: generateRandomSlots(14),
            zoomLink: 'https://zoom.us/j/1234567890?pwd=abcdef'
        },
        'suzuki': {
            name: '鈴木先生',
            instrument: 'ギター',
            slots: generateRandomSlots(16),
            zoomLink: 'https://zoom.us/j/2345678901?pwd=bcdefg'
        },
        'sato': {
            name: '佐藤先生',
            instrument: 'バイオリン',
            slots: generateRandomSlots(12),
            zoomLink: 'https://zoom.us/j/3456789012?pwd=cdefgh'
        },
        'nakamura': {
            name: '中村先生',
            instrument: 'ボーカル',
            slots: generateRandomSlots(10),
            zoomLink: 'https://zoom.us/j/4567890123?pwd=defghi'
        },
        'yamamoto': {
            name: '山本先生',
            instrument: 'ドラム',
            slots: generateRandomSlots(8),
            zoomLink: 'https://zoom.us/j/5678901234?pwd=efghij'
        },
        'kato': {
            name: '加藤先生',
            instrument: 'ベース',
            slots: generateRandomSlots(9),
            zoomLink: 'https://zoom.us/j/6789012345?pwd=fghijk'
        }
    };
    
    // 予約済みスロット（デモ用）
    window.bookedSlots = [
        'wed-10-00', 'wed-10-30', 'thu-15-00', 'fri-13-30'
    ];
    
    // スロットのステータス
    window.slotStatus = {
        'wed-10-00': 'booked',
        'wed-10-30': 'booked',
        'thu-15-00': 'pending',
        'fri-13-30': 'cancelled'
    };
}

/**
 * ランダムなスロットを生成する関数
 */
function generateRandomSlots(count) {
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
 */
function getFilteredSlots(instrumentFilter, teacherFilter, lessonType, statusFilter) {
    let filteredSlots = [];
    
    // フィルターが指定されていない場合は「すべて」として扱う
    const useInstrumentFilter = instrumentFilter && instrumentFilter !== 'all';
    const useTeacherFilter = teacherFilter && teacherFilter !== 'all';
    const useLessonTypeFilter = lessonType && lessonType !== 'all';
    const useStatusFilter = statusFilter && statusFilter !== 'all';
    
    // まずすべての利用可能なスロットを取得
    let allSlots = [];
    let allTeachers = Object.keys(window.teachers);
    
    if (useTeacherFilter) {
        // 特定の講師のみフィルタリング
        allTeachers = allTeachers.filter(teacherKey => teacherKey === teacherFilter);
    }
    
    if (useInstrumentFilter) {
        // 特定の楽器のみフィルタリング
        allTeachers = allTeachers.filter(teacherKey => {
            const teacher = window.teachers[teacherKey];
            return teacher.instrument === getJapaneseInstrument(instrumentFilter);
        });
    }
    
    // 適用されたフィルターに基づいて利用可能なスロットを取得
    allTeachers.forEach(teacherKey => {
        const teacher = window.teachers[teacherKey];
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
                return !window.slotStatus[slot.slotKey] || window.slotStatus[slot.slotKey] === 'available';
            }).map(slot => slot.slotKey);
        } else if (statusFilter === 'booked') {
            // 予約済みのスロットのみを表示
            filteredSlots = Object.keys(window.slotStatus).filter(slotKey => {
                return window.slotStatus[slotKey] === 'booked';
            });
        } else if (statusFilter === 'pending') {
            // 確認待ちのスロットのみを表示
            filteredSlots = Object.keys(window.slotStatus).filter(slotKey => {
                return window.slotStatus[slotKey] === 'pending';
            });
        } else if (statusFilter === 'cancelled') {
            // キャンセル済みのスロットのみを表示
            filteredSlots = Object.keys(window.slotStatus).filter(slotKey => {
                return window.slotStatus[slotKey] === 'cancelled';
            });
        }
    } else {
        // ステータスフィルターがない場合は予約可能なスロットも表示
        filteredSlots = allSlots.map(slot => slot.slotKey);
    }
    
    return filteredSlots;
}

/**
 * スロットの状態を取得
 */
function getSlotStatus(slotKey) {
    // 予約データをチェック
    if (window.slotStatus[slotKey]) {
        return window.slotStatus[slotKey];
    }
    
    // 講師の利用可能スロットをチェック
    let isAvailable = false;
    
    Object.keys(window.teachers).forEach(teacherKey => {
        const teacher = window.teachers[teacherKey];
        if (teacher.slots.includes(slotKey)) {
            isAvailable = true;
        }
    });
    
    return isAvailable ? 'available' : 'unavailable';
}

/**
 * 講師情報を取得
 */
function getTeacherInfoForSlot(slotKey) {
    let teacherInfo = null;
    
    Object.keys(window.teachers).forEach(teacherKey => {
        const teacher = window.teachers[teacherKey];
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
 * 楽器名を日本語に変換
 */
function getJapaneseInstrument(instrument) {
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
 * 週表示の実装
 */
function showWeekView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter) {
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
    const currentDate = new Date(currentWeekStartDate);
    
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
        dayName.textContent = window.dayMapping[day];
        
        const dayDate = document.createElement('span');
        dayDate.className = 'day-date';
        dayDate.textContent = date.getDate();
        
        dayHeader.appendChild(dayName);
        dayHeader.appendChild(dayDate);
        
        scheduleGrid.appendChild(dayHeader);
    });
    
    // フィルタリングされた利用可能スロットを取得
    const availableSlots = getFilteredSlots(instrumentFilter, teacherFilter, lessonType, statusFilter);
    
    // 結果カウンターを更新
    document.getElementById('result-count').textContent = availableSlots.length;
    
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
                const slotStatus = getSlotStatus(slotKey);
                
                if (slotStatus !== 'unavailable') {
                    timeSlot.classList.add(slotStatus);
                    timeSlot.setAttribute('data-slot', slotKey);
                    
                    // 日付を計算
                    const slotDate = new Date(currentWeekStartDate);
                    slotDate.setDate(slotDate.getDate() + index);
                    slotDate.setHours(hour, parseInt(minute), 0);
                    
                    // クリックイベントで予約モーダルを表示
                    timeSlot.addEventListener('click', () => {
                        showBookingModal(slotKey, slotDate);
                    });
                } else {
                    timeSlot.classList.add('unavailable');
                }
                
                scheduleGrid.appendChild(timeSlot);
            });
        }
    }
}

/**
 * 日表示の実装
 */
function showDayView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter) {
    const scheduleGrid = document.getElementById('schedule-grid');
    scheduleGrid.className = 'day-view';
    scheduleGrid.innerHTML = '<p style="padding:20px;">日表示は開発中です。現在は週表示のみご利用いただけます。</p>';
}

/**
 * 月表示の実装
 */
function showMonthView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter) {
    const scheduleGrid = document.getElementById('schedule-grid');
    scheduleGrid.className = 'month-view';
    scheduleGrid.innerHTML = '<p style="padding:20px;">月表示は開発中です。現在は週表示のみご利用いただけます。</p>';
}

/**
 * 予約モーダルを表示する関数
 */
function showBookingModal(slotKey, slotDate) {
    // スロットキーから曜日と時間情報を解析
    const [day, hour, minute] = slotKey.split('-');
    
    // スロットの状態
    const status = getSlotStatus(slotKey);
    
    // レッスン終了時間（50分後）
    const endHour = minute === '00' ? hour : parseInt(hour) + 1;
    const endMinute = minute === '00' ? '50' : '20';
    
    // 講師情報を取得
    const teacherInfo = getTeacherInfoForSlot(slotKey);
    if (!teacherInfo) return;
    
    // モーダルの要素を取得
    const bookingDatetime = document.getElementById('booking-datetime');
    const bookingTeacher = document.getElementById('booking-teacher');
    const bookingInstrument = document.getElementById('booking-instrument');
    const bookingType = document.getElementById('booking-type');
    const bookingStatus = document.getElementById('booking-status');
    
    // 日付の日本語表記を作成
    const formatDate = formatDateJP(slotDate);
    const dayJP = window.dayMapping[day];
    
    // モーダルに情報を表示
    bookingDatetime.textContent = `${formatDate}（${dayJP}） ${hour}:${minute} - ${endHour}:${endMinute}`;
    bookingTeacher.textContent = teacherInfo.name;
    bookingInstrument.textContent = teacherInfo.instrument;
    bookingType.textContent = '通常レッスン';
    
    // ステータスによって表示を変更
    if (status === 'available') {
        bookingStatus.textContent = '予約可能';
    } else if (status === 'booked') {
        bookingStatus.textContent = '予約済み';
    } else if (status === 'pending') {
        bookingStatus.textContent = '確認待ち';
    } else if (status === 'cancelled') {
        bookingStatus.textContent = 'キャンセル済み';
    }
    
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
    
    // モーダルを表示
    const modal = document.getElementById('booking-modal');
    modal.style.display = 'flex';
}

/**
 * モーダルを閉じる関数
 */
function closeModal() {
    const modal = document.getElementById('booking-modal');
    modal.style.display = 'none';
}

/**
 * 検索処理のハンドラー
 */
function handleSearch(currentWeekStartDate) {
    // 検索条件の取得
    const instrumentFilter = document.getElementById('instrument').value;
    const teacherFilter = document.getElementById('teacher').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const lessonType = document.getElementById('lesson-type').value;
    const statusFilter = document.getElementById('status').value;
    
    // 日付範囲からcurrentWeekStartDateを更新
    if (dateFrom) {
        currentWeekStartDate.setTime(new Date(dateFrom).getTime());
        updateWeekDisplay(currentWeekStartDate);
    }
    
    // ローディング表示
    document.getElementById('loading-overlay').style.display = 'flex';
    
    // 実際のAPIリクエストの代わりにタイマーでシミュレート
    setTimeout(function() {
        // スケジュールの更新処理
        const activeViewButton = document.querySelector('.calendar-view-toggle button.active');
        if (activeViewButton) {
            const view = activeViewButton.id.replace('-view', '');
            switchView(view, currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter);
        } else {
            showWeekView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter);
        }
        
        // ローディング非表示
        document.getElementById('loading-overlay').style.display = 'none';
        
        // 検索結果表示
        document.getElementById('search-results').style.display = 'block';
        
        // モバイルビューの場合、検索後にフィルターを閉じる
        if (window.innerWidth <= 768) {
            document.getElementById('filter-content').classList.add('hidden');
            document.getElementById('toggle-filters').innerHTML = '<span class="toggle-icon">▼</span> フィルターを表示';
        }
    }, 400);
}

/**
 * ビューの切り替え
 */
function switchView(view, currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter) {
    // 表示の更新
    if (view === 'day') {
        showDayView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter);
    } else if (view === 'month') {
        showMonthView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter);
    } else {
        // デフォルトは週表示
        showWeekView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter);
    }
    
    // ビュートグルボタンの表示を更新
    document.querySelectorAll('.calendar-view-toggle button').forEach(button => {
        if (button.id === `${view}-view`) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

/**
 * 前の週に移動
 */
function navigateToPreviousWeek(currentWeekStartDate) {
    // 前の週へ
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() - 7);
    updateWeekDisplay(currentWeekStartDate);
    
    // 検索条件を取得して検索実行
    handleSearch(currentWeekStartDate);
}

/**
 * 次の週に移動
 */
function navigateToNextWeek(currentWeekStartDate) {
    // 次の週へ
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() + 7);
    updateWeekDisplay(currentWeekStartDate);
    
    // 検索条件を取得して検索実行
    handleSearch(currentWeekStartDate);
}

/**
 * フィルター表示の切り替え
 */
function toggleFilterContent() {
    const filterContent = document.getElementById('filter-content');
    const toggleFilters = document.getElementById('toggle-filters');
    
    // hiddenクラスの有無でトグル
    if (filterContent.classList.contains('hidden')) {
        filterContent.classList.remove('hidden');
        toggleFilters.innerHTML = '<span class="toggle-icon">▲</span> フィルターを非表示';
    } else {
        filterContent.classList.add('hidden');
        toggleFilters.innerHTML = '<span class="toggle-icon">▼</span> フィルターを表示';
    }
}
