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