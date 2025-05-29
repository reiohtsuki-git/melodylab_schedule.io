// 講師-生徒システム連携ファイル
// 講師が設定したスケジュールを生徒画面に反映するための処理

// スケジュール同期クラス
class ScheduleSync {
    constructor() {
        this.teacherSchedules = new Map();
        this.listeners = [];
    }
    
    // 講師スケジュールの取得と生成
    async generateAvailableSlots(teacherId, startDate, endDate) {
        try {
            // Firestoreから講師スケジュールを取得
            const schedules = await this.getTeacherSchedules(teacherId);
            const exceptions = await this.getTeacherExceptions(teacherId);
            
            const availableSlots = [];
            const currentDate = new Date(startDate);
            const end = new Date(endDate);
            
            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayOfWeek = currentDate.getDay();
                
                // 例外日チェック
                const isException = exceptions.some(ex => ex.date === dateStr);
                if (isException) {
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }
                
                // その日のスケジュールを取得
                const daySchedule = schedules.find(s => 
                    s.type === 'recurring' && 
                    s.recurring && 
                    s.recurring.dayOfWeek === dayOfWeek &&
                    s.recurring.isActive
                );
                
                if (daySchedule) {
                    const slots = this.generateDaySlots(
                        dateStr, 
                        daySchedule.recurring.startTime,
                        daySchedule.recurring.endTime,
                        daySchedule.recurring.duration || 50,
                        daySchedule.recurring.breakTime || 10
                    );
                    
                    availableSlots.push(...slots);
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // 既存の予約をチェックして利用可能な枠のみ返す
            return await this.filterAvailableSlots(availableSlots, teacherId);
            
        } catch (error) {
            console.error('スケジュール生成エラー:', error);
            return [];
        }
    }
    
    // 講師スケジュールの取得
    async getTeacherSchedules(teacherId) {
        if (typeof FirebaseDB !== 'undefined') {
            return await FirebaseDB.getTeacherSchedule(teacherId);
        } else {
            // ローカルストレージからの取得
            const localData = localStorage.getItem(`schedule_${teacherId}`);
            if (localData) {
                const parsed = JSON.parse(localData);
                const schedules = [];
                
                // weekly データを変換
                Object.entries(parsed.weekly || {}).forEach(([dayIndex, dayData]) => {
                    schedules.push({
                        type: 'recurring',
                        recurring: {
                            dayOfWeek: parseInt(dayIndex),
                            ...dayData,
                            duration: parsed.settings?.duration || 50,
                            breakTime: parsed.settings?.breakTime || 10
                        }
                    });
                });
                
                return schedules;
            }
            return [];
        }
    }
    
    // 講師例外日の取得
    async getTeacherExceptions(teacherId) {
        if (typeof FirebaseDB !== 'undefined') {
            const schedules = await FirebaseDB.getTeacherSchedule(teacherId);
            return schedules
                .filter(s => s.type === 'exception')
                .map(s => s.exception);
        } else {
            const localData = localStorage.getItem(`schedule_${teacherId}`);
            if (localData) {
                const parsed = JSON.parse(localData);
                return parsed.exceptions || [];
            }
            return [];
        }
    }
    
    // 1日分のタイムスロットを生成
    generateDaySlots(date, startTime, endTime, duration, breakTime) {
        const slots = [];
        
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime);
        
        let currentTime = start;
        
        while (currentTime + duration <= end) {
            const slotStart = this.minutesToTime(currentTime);
            const slotEnd = this.minutesToTime(currentTime + duration);
            
            slots.push({
                date: date,
                startTime: slotStart,
                endTime: slotEnd,
                duration: duration,
                available: true
            });
            
            currentTime += duration + breakTime;
        }
        
        return slots;
    }
    
    // 予約済みの枠をフィルタリング
    async filterAvailableSlots(slots, teacherId) {
        try {
            const bookings = await FirebaseDB.getBookings(teacherId);
            
            return slots.filter(slot => {
                return !bookings.some(booking => 
                    booking.date === slot.date && 
                    booking.startTime === slot.startTime &&
                    booking.status === 'confirmed'
                );
            });
        } catch (error) {
            console.error('予約フィルタリングエラー:', error);
            return slots;
        }
    }
    
    // 時間文字列を分に変換
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    // 分数を時間文字列に変換
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    // 講師情報の取得
    async getTeacherInfo(teacherId) {
        if (typeof FirebaseDB !== 'undefined') {
            return await FirebaseDB.getTeacher(teacherId);
        } else {
            // デフォルトデータから取得
            return DefaultData.teachers.find(t => t.id === teacherId);
        }
    }
}

// 既存のスケジュール表示システムとの統合
class StudentScheduleIntegration {
    constructor() {
        this.scheduleSync = new ScheduleSync();
    }
    
    // 既存のscript.jsのスケジュール生成を拡張
    async enhanceExistingSchedule() {
        // 既存のgenerateScheduleGrid関数を拡張
        if (typeof window.generateScheduleGrid === 'function') {
            const originalFunction = window.generateScheduleGrid;
            
            window.generateScheduleGrid = async (startDate) => {
                // 元の関数を実行
                const result = originalFunction(startDate);
                
                // 講師の実際のスケジュールでデータを更新
                await this.updateWithRealSchedules(startDate);
                
                return result;
            };
        }
    }
    
    // 実際の講師スケジュールでデータを更新
    async updateWithRealSchedules(startDate) {
        try {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6); // 1週間分
            
            // すべての講師のスケジュールを取得
            const teachers = DefaultData.teachers;
            const allSlots = [];
            
            for (const teacher of teachers) {
                const teacherSlots = await this.scheduleSync.generateAvailableSlots(
                    teacher.id,
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0]
                );
                
                // 講師情報を追加
                teacherSlots.forEach(slot => {
                    slot.teacherId = teacher.id;
                    slot.teacherName = teacher.name;
                    slot.instruments = teacher.instruments;
                });
                
                allSlots.push(...teacherSlots);
            }
            
            // 既存のグリッドを更新
            this.updateScheduleGrid(allSlots);
            
        } catch (error) {
            console.error('スケジュール更新エラー:', error);
        }
    }
    
    // スケジュールグリッドの更新
    updateScheduleGrid(slots) {
        const grid = document.querySelector('#schedule-grid');
        if (!grid) return;
        
        // 既存のタイムスロットを削除
        const existingSlots = grid.querySelectorAll('.time-slot[data-real-schedule="true"]');
        existingSlots.forEach(slot => slot.remove());
        
        // 新しいスロットを追加
        slots.forEach(slot => {
            const slotElement = this.createSlotElement(slot);
            if (slotElement) {
                this.insertSlotIntoGrid(grid, slotElement);
            }
        });
    }
    
    // スロット要素の作成
    createSlotElement(slot) {
        try {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'time-slot available';
            slotDiv.dataset.realSchedule = 'true';
            slotDiv.dataset.date = slot.date;
            slotDiv.dataset.time = slot.startTime;
            slotDiv.dataset.teacher = slot.teacherId;
            slotDiv.dataset.instrument = slot.instruments[0]; // 最初の楽器
            
            slotDiv.innerHTML = `
                <div class="slot-time">${slot.startTime} - ${slot.endTime}</div>
                <div class="slot-teacher">${slot.teacherName}</div>
                <div class="slot-instrument">${DataUtils.getInstrumentName(slot.instruments[0])}</div>
            `;
            
            // クリックイベント
            slotDiv.addEventListener('click', () => {
                if (typeof window.openBookingModal === 'function') {
                    window.openBookingModal(slot);
                }
            });
            
            return slotDiv;
        } catch (error) {
            console.error('スロット要素作成エラー:', error);
            return null;
        }
    }
    
    // グリッドへのスロット挿入
    insertSlotIntoGrid(grid, slotElement) {
        // 日付と時間に基づいて適切な位置に挿入
        const date = slotElement.dataset.date;
        const time = slotElement.dataset.time;
        
        // 既存の実装に合わせて位置を決定
        const dayIndex = new Date(date).getDay();
        const timeRow = this.getTimeRowIndex(time);
        
        // グリッドの適切な位置に配置
        slotElement.style.gridColumn = dayIndex + 2; // 時間列の次から
        slotElement.style.gridRow = timeRow + 2; // ヘッダーの次から
        
        grid.appendChild(slotElement);
    }
    
    // 時間行インデックスの取得
    getTimeRowIndex(time) {
        const timeMinutes = this.scheduleSync.timeToMinutes(time);
        const startMinutes = this.scheduleSync.timeToMinutes('09:00');
        const slotDuration = 60; // 1時間ごとの行
        
        return Math.floor((timeMinutes - startMinutes) / slotDuration);
    }
}

// 初期化関数
function initializeTeacherStudentSync() {
    const integration = new StudentScheduleIntegration();
    
    // 既存システムとの統合
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            integration.enhanceExistingSchedule();
        });
    } else {
        integration.enhanceExistingSchedule();
    }
    
    return integration;
}

// 予約作成時の処理
async function createBookingWithSync(bookingData) {
    try {
        // 講師のZoomリンクを取得
        const teacherInfo = await (new ScheduleSync()).getTeacherInfo(bookingData.teacherId);
        
        if (teacherInfo && teacherInfo.zoomPersonalMeetingId) {
            bookingData.zoomLink = `https://zoom.us/j/${teacherInfo.zoomPersonalMeetingId}`;
        }
        
        // 予約を作成
        if (typeof FirebaseDB !== 'undefined') {
            const bookingId = await FirebaseDB.createBooking(bookingData);
            return bookingId;
        } else {
            // ローカル保存の場合
            console.log('予約データ（ローカル）:', bookingData);
            return 'local-' + Date.now();
        }
    } catch (error) {
        console.error('予約作成エラー:', error);
        throw error;
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ScheduleSync,
        StudentScheduleIntegration,
        initializeTeacherStudentSync,
        createBookingWithSync
    };
}

// グローバル初期化（生徒画面用）
if (typeof window !== 'undefined') {
    window.ScheduleSync = ScheduleSync;
    window.initializeTeacherStudentSync = initializeTeacherStudentSync;
    window.createBookingWithSync = createBookingWithSync;
}