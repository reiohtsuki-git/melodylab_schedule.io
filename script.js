/**
 * フィルタリングされたスロットを取得する関数
 */
function getFilteredSlots(instrumentFilter, teacherFilter, lessonType, statusFilter) {
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
    
    // スロットキーのみの配列を作成
    let slotKeys = allSlots.map(slot => slot.slotKey);
    
    // 予約状態でフィルタリング
    if (useStatusFilter) {
        switch(statusFilter) {
            case 'available':
                // 予約可能なスロットのみを返す（予約済み、確認待ち、キャンセル済みを除外）
                return slotKeys.filter(slotKey => {
                    return !window.slotStatus[slotKey] || window.slotStatus[slotKey] === 'available';
                });
                
            case 'booked':
                // 予約済みのスロットのみを返す
                return Object.keys(window.slotStatus).filter(slotKey => {
                    return window.slotStatus[slotKey] === 'booked';
                });
                
            case 'pending':
                // 確認待ちのスロットのみを返す
                return Object.keys(window.slotStatus).filter(slotKey => {
                    return window.slotStatus[slotKey] === 'pending';
                });
                
            case 'cancelled':
                // キャンセル済みのスロットのみを返す
                return Object.keys(window.slotStatus).filter(slotKey => {
                    return window.slotStatus[slotKey] === 'cancelled';
                });
                
            default:
                return slotKeys;
        }
    }
    
    return slotKeys;
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
                
                // 予約ステータスによるフィルタリング
                const isFiltered = statusFilter && statusFilter !== 'all';
                
                // 予約ステータスが選択されている場合、表示すべきスロットだけを強調表示
                if (isFiltered) {
                    if (availableSlots.includes(slotKey)) {
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
                        // フィルタリングで除外されたスロットは灰色表示
                        timeSlot.classList.add('unavailable');
                    }
                } else {
                    // フィルタリングがない場合は通常表示
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
                }
                
                scheduleGrid.appendChild(timeSlot);
            });
        }
    }
}