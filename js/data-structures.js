// データ構造定義とバリデーション
// MelodyLab講師管理システム

// データ構造定義
const DataStructures = {
    // 講師データ構造
    Teacher: {
        id: '', // 講師ID (文字列)
        name: '', // 講師名
        email: '', // メールアドレス
        instruments: [], // 担当楽器 ['piano', 'guitar', 'dtm', etc.]
        bio: '', // 自己紹介
        avatar: '', // プロフィール画像URL
        isActive: true, // アクティブ状態
        zoomPersonalMeetingId: '', // Zoom個人ミーティングID（オプション）
        createdAt: null, // 作成日時
        updatedAt: null // 更新日時
    },
    
    // スケジュールデータ構造
    Schedule: {
        id: '', // スケジュールID
        teacherId: '', // 講師ID
        type: 'recurring', // 'recurring' | 'single' | 'exception'
        
        // 繰り返しスケジュール（通常の空き時間）
        recurring: {
            dayOfWeek: 0, // 0=日曜, 1=月曜, ..., 6=土曜
            startTime: '09:00', // 開始時間
            endTime: '17:00', // 終了時間
            duration: 50, // レッスン時間（分）
            breakTime: 10, // 休憩時間（分）
            isActive: true // 有効フラグ
        },
        
        // 単発スケジュール
        single: {
            date: '', // YYYY-MM-DD形式
            startTime: '10:00',
            endTime: '10:50',
            isAvailable: true
        },
        
        // 例外日（休講日など）
        exception: {
            date: '', // YYYY-MM-DD形式
            reason: '', // 理由
            isUnavailable: true // 利用不可フラグ
        },
        
        createdAt: null,
        updatedAt: null
    },
    
    // 予約データ構造
    Booking: {
        id: '', // 予約ID
        teacherId: '', // 講師ID
        studentId: '', // 生徒ID（現在は固定値、将来的に拡張）
        date: '', // YYYY-MM-DD形式
        startTime: '10:00', // 開始時間
        endTime: '10:50', // 終了時間
        instrument: '', // 楽器
        lessonType: 'regular', // 'regular' | 'trial' | 'group'
        status: 'confirmed', // 'confirmed' | 'cancelled'
        zoomLink: '', // Zoomリンク
        notes: '', // 備考
        createdAt: null,
        updatedAt: null
    },
    
    // 生徒データ構造（将来拡張用）
    Student: {
        id: 'yamada-taro', // 現在は固定
        name: '山田太郎',
        email: '',
        avatar: '山',
        createdAt: null,
        updatedAt: null
    }
};

// バリデーション関数
const DataValidators = {
    // 講師データのバリデーション
    validateTeacher(teacherData) {
        const errors = [];
        
        if (!teacherData.name || teacherData.name.trim().length < 1) {
            errors.push('講師名は必須です');
        }
        
        if (!teacherData.email || !this.isValidEmail(teacherData.email)) {
            errors.push('有効なメールアドレスが必要です');
        }
        
        if (!Array.isArray(teacherData.instruments) || teacherData.instruments.length === 0) {
            errors.push('少なくとも1つの楽器を選択してください');
        }
        
        return errors;
    },
    
    // スケジュールデータのバリデーション
    validateSchedule(scheduleData) {
        const errors = [];
        
        if (!scheduleData.teacherId) {
            errors.push('講師IDは必須です');
        }
        
        if (!scheduleData.type || !['recurring', 'single', 'exception'].includes(scheduleData.type)) {
            errors.push('有効なスケジュールタイプを選択してください');
        }
        
        if (scheduleData.type === 'recurring' && scheduleData.recurring) {
            const r = scheduleData.recurring;
            if (r.dayOfWeek < 0 || r.dayOfWeek > 6) {
                errors.push('有効な曜日を選択してください');
            }
            if (!this.isValidTime(r.startTime) || !this.isValidTime(r.endTime)) {
                errors.push('有効な時間形式で入力してください (HH:MM)');
            }
            if (this.timeToMinutes(r.startTime) >= this.timeToMinutes(r.endTime)) {
                errors.push('終了時間は開始時間より後にしてください');
            }
        }
        
        return errors;
    },
    
    // 予約データのバリデーション
    validateBooking(bookingData) {
        const errors = [];
        
        if (!bookingData.teacherId) {
            errors.push('講師IDは必須です');
        }
        
        if (!bookingData.date || !this.isValidDate(bookingData.date)) {
            errors.push('有効な日付形式で入力してください (YYYY-MM-DD)');
        }
        
        if (!this.isValidTime(bookingData.startTime) || !this.isValidTime(bookingData.endTime)) {
            errors.push('有効な時間形式で入力してください (HH:MM)');
        }
        
        if (!bookingData.instrument) {
            errors.push('楽器の選択は必須です');
        }
        
        return errors;
    },
    
    // ヘルパー関数
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    isValidTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    },
    
    isValidDate(date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return false;
        
        const dateObj = new Date(date + 'T00:00:00');
        return dateObj.toISOString().substr(0, 10) === date;
    },
    
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
};

// デフォルトデータ
const DefaultData = {
    // サンプル講師データ
    teachers: [
        {
            id: 'tanaka',
            name: '田中先生',
            email: 'tanaka@melodylab.com',
            instruments: ['piano'],
            bio: 'クラシックピアノを専門とし、初心者から上級者まで幅広く指導しています。',
            avatar: '田',
            isActive: true,
            zoomPersonalMeetingId: '123-456-789'
        },
        {
            id: 'suzuki',
            name: '鈴木先生',
            email: 'suzuki@melodylab.com',
            instruments: ['guitar'],
            bio: 'アコースティックギター、エレキギターの指導を行っています。',
            avatar: '鈴',
            isActive: true,
            zoomPersonalMeetingId: '234-567-890'
        },
        {
            id: 'sato',
            name: '佐藤先生',
            email: 'sato@melodylab.com',
            instruments: ['dtm'],
            bio: 'DTM・作曲を専門とし、現代の音楽制作をサポートします。',
            avatar: '佐',
            isActive: true,
            zoomPersonalMeetingId: '345-678-901'
        }
    ],
    
    // サンプルスケジュールデータ
    schedules: [
        {
            teacherId: 'suzuki',
            type: 'recurring',
            recurring: {
                dayOfWeek: 6, // 土曜日
                startTime: '09:00',
                endTime: '17:00',
                duration: 50,
                breakTime: 10,
                isActive: true
            }
        }
    ]
};

// ユーティリティ関数
const DataUtils = {
    // 時間スロットの生成
    generateTimeSlots(startTime, endTime, duration = 50, breakTime = 10) {
        const slots = [];
        let currentTime = this.timeToMinutes(startTime);
        const endTimeMinutes = this.timeToMinutes(endTime);
        
        while (currentTime + duration <= endTimeMinutes) {
            const slotStart = this.minutesToTime(currentTime);
            const slotEnd = this.minutesToTime(currentTime + duration);
            
            slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                duration: duration
            });
            
            currentTime += duration + breakTime;
        }
        
        return slots;
    },
    
    // 曜日名の取得
    getDayName(dayOfWeek) {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days[dayOfWeek];
    },
    
    // 楽器名の日本語表示
    getInstrumentName(instrument) {
        const instruments = {
            'piano': 'ピアノ',
            'guitar': 'ギター',
            'dtm': 'DTM',
            'composition': '作曲',
            'classical-guitar': 'クラシックギター',
            'bass': 'ベース',
            'violin': 'バイオリン',
            'vocal': 'ボーカル',
            'drums': 'ドラム'
        };
        return instruments[instrument] || instrument;
    },
    
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    },
    
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
};

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DataStructures,
        DataValidators,
        DefaultData,
        DataUtils
    };
}