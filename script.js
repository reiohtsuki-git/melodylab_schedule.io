// スケジュール初期化処理
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek - 1;
    
    const currentWeekStartDate = new Date(today);
    currentWeekStartDate.setDate(today.getDate() - daysToMonday);
    
    updateWeekDisplay(currentWeekStartDate);
    initializeScheduleGrid(currentWeekStartDate);
    
    document.getElementById('search-button').addEventListener('click', function() {
        handleSearch(currentWeekStartDate);
    });
    
    document.getElementById('prev-week').addEventListener('click', function() {
        navigateToPreviousWeek(currentWeekStartDate);
    });
    
    document.getElementById('next-week').addEventListener('click', function() {
        navigateToNextWeek(currentWeekStartDate);
    });
    
    document.querySelectorAll('.calendar-view-toggle button').forEach(button => {
        button.addEventListener('click', function() {
            switchView(this.id.replace('-view', ''), currentWeekStartDate);
        });
    });
    
    const toggleFilters = document.getElementById('toggle-filters');
    if (toggleFilters) {
        toggleFilters.addEventListener('click', function() {
            toggleFilterContent();
        });
    }
    
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-booking').addEventListener('click', closeModal);
    
    const weekView = document.getElementById('week-view');
    if (weekView && weekView.classList.contains('active')) {
        showWeekView(currentWeekStartDate, 'all', 'all', 'all', 'all');
    }
});

function updateWeekDisplay(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const startFormatted = formatDateJP(startDate);
    const endFormatted = formatDateJP(endDate);
    
    if (window.innerWidth <= 480) {
        document.getElementById('current-week').textContent = `${startDate.getMonth()+1}/${startDate.getDate()}-${endDate.getMonth()+1}/${endDate.getDate()}`;
    } else if (window.innerWidth <= 768) {
        document.getElementById('current-week').textContent = `${startDate.getMonth()+1}月${startDate.getDate()}日-${endDate.getMonth()+1}月${endDate.getDate()}日`;
    } else {
        document.getElementById('current-week').textContent = `${startFormatted} - ${endFormatted}`;
    }
    
    document.getElementById('date-from').value = formatDate(startDate);
    document.getElementById('date-to').value = formatDate(endDate);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateJP(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

function initializeScheduleGrid(currentWeekStartDate) {
    generateAllTimeSlots();
    generateDemoTeacherData();
    showWeekView(currentWeekStartDate, 'all', 'all', 'all', 'all');
}

function generateAllTimeSlots() {
    window.allSlots = [];
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    for (let hour = 9; hour <= 23; hour++) {
        for (let minute of ['00', '30']) {
            if (hour === 23 && minute === '30') continue;
            
            for (const day of days) {
                window.allSlots.push(`${day}-${hour}-${minute}`);
            }
        }
    }
}

function generateDemoTeacherData() {
    window.dayMapping = {
        'mon': '月', 'tue': '火', 'wed': '水', 'thu': '木',
        'fri': '金', 'sat': '土', 'sun': '日'
    };
    
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
    
    window.slotStatus = {
        'wed-10-00': 'booked',
        'wed-10-30': 'booked',
        'thu-15-00': 'booked'
    };
}

function generateRandomSlots(count) {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const hours = [];
    
    for (let hour = 9; hour <= 18; hour++) {
        for (let minute of ['00', '30']) {
            hours.push(`${hour}-${minute}`);
        }
    }
    
    const slots = [];
    for (let i = 0; i < count; i++) {
        const randomDay = days[Math.floor(Math.random() * days.length)];
        const randomHour = hours[Math.floor(Math.random() * hours.length)];
        const slot = `${randomDay}-${randomHour}`;
        
        if (!slots.includes(slot)) {
            slots.push(slot);
        }
    }
    
    return slots;
}

function getSlotStatus(slotKey) {
    if (window.slotStatus[slotKey]) {
        return window.slotStatus[slotKey];
    }
    
    let isAvailable = false;
    Object.keys(window.teachers).forEach(teacherKey => {
        const teacher = window.teachers[teacherKey];
        if (teacher.slots.includes(slotKey)) {
            isAvailable = true;
        }
    });
    
    return isAvailable ? 'available' : 'unavailable';
}

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

function showWeekView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter) {
    const scheduleGrid = document.getElementById('schedule-grid');
    
    while (scheduleGrid.firstChild) {
        scheduleGrid.removeChild(scheduleGrid.firstChild);
    }
    
    scheduleGrid.className = 'week-view';
    
    if (window.innerWidth <= 480) {
        scheduleGrid.classList.add('mobile-view');
    } else if (window.innerWidth <= 768) {
        scheduleGrid.classList.add('tablet-view');
    }
    
    const timeHeader = document.createElement('div');
    timeHeader.className = 'day-header';
    scheduleGrid.appendChild(timeHeader);
    
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const currentDate = new Date(currentWeekStartDate);
    
    days.forEach((day, index) => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        
        const date = new Date(currentDate);
        date.setDate(date.getDate() + index);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date.getTime() === today.getTime()) {
            dayHeader.classList.add('today');
        }
        
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
    
    const startHour = window.innerWidth <= 768 ? 9 : 9;
    const endHour = window.innerWidth <= 768 ? 18 : 23;
    
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute of ['00', '30']) {
            if (hour === 23 && minute === '30') continue;
            
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = `${hour}:${minute}`;
            scheduleGrid.appendChild(timeLabel);
            
            days.forEach((day, index) => {
                const slotKey = `${day}-${hour}-${minute}`;
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                
                const slotStatus = getSlotStatus(slotKey);
                timeSlot.classList.add(slotStatus);
                
                if (slotStatus === 'available') {
                    timeSlot.textContent = '〇';
                    timeSlot.style.textAlign = 'center';
                    timeSlot.style.lineHeight = '40px';
                    timeSlot.style.fontSize = '14px';
                    timeSlot.style.fontWeight = 'bold';
                    timeSlot.setAttribute('data-slot', slotKey);
                    
                    const slotDate = new Date(currentWeekStartDate);
                    slotDate.setDate(slotDate.getDate() + index);
                    slotDate.setHours(hour, parseInt(minute), 0);
                    
                    timeSlot.addEventListener('click', () => {
                        showBookingModal(slotKey, slotDate);
                    });
                } else if (slotStatus === 'booked') {
                    timeSlot.setAttribute('data-slot', slotKey);
                    
                    const slotDate = new Date(currentWeekStartDate);
                    slotDate.setDate(slotDate.getDate() + index);
                    slotDate.setHours(hour, parseInt(minute), 0);
                    
                    timeSlot.addEventListener('click', () => {
                        showBookingModal(slotKey, slotDate);
                    });
                } else {
                    timeSlot.textContent = '×';
                    timeSlot.style.textAlign = 'center';
                    timeSlot.style.lineHeight = '40px';
                    timeSlot.style.fontSize = '14px';
                    timeSlot.style.fontWeight = 'bold';
                    timeSlot.style.color = '#666';
                }
                
                scheduleGrid.appendChild(timeSlot);
            });
        }
    }
}

function showBookingModal(slotKey, slotDate) {
    const [day, hour, minute] = slotKey.split('-');
    const status = getSlotStatus(slotKey);
    const endHour = minute === '00' ? hour : parseInt(hour) + 1;
    const endMinute = minute === '00' ? '50' : '20';
    
    const teacherInfo = getTeacherInfoForSlot(slotKey);
    if (!teacherInfo) return;
    
    const formatDate = formatDateJP(slotDate);
    const dayJP = window.dayMapping[day];
    
    document.getElementById('booking-datetime').textContent = `${formatDate}（${dayJP}） ${hour}:${minute} - ${endHour}:${endMinute}`;
    document.getElementById('booking-teacher').textContent = teacherInfo.name;
    document.getElementById('booking-instrument').textContent = teacherInfo.instrument;
    document.getElementById('booking-type').textContent = '通常レッスン';
    
    if (status === 'available') {
        document.getElementById('booking-status').textContent = '予約可能';
    } else if (status === 'booked') {
        document.getElementById('booking-status').textContent = '予約済み';
    }
    
    document.getElementById('zoom-link').value = teacherInfo.zoomLink || 'https://zoom.us/j/1234567890?pwd=abcdefg';
    document.getElementById('notes').value = '';
    
    document.getElementById('booking-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('booking-modal').style.display = 'none';
}

function handleSearch(currentWeekStartDate) {
    const instrumentFilter = document.getElementById('instrument').value;
    const teacherFilter = document.getElementById('teacher').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const lessonType = document.getElementById('lesson-type').value;
    const statusFilter = document.getElementById('status').value;
    
    if (dateFrom) {
        currentWeekStartDate.setTime(new Date(dateFrom).getTime());
        updateWeekDisplay(currentWeekStartDate);
    }
    
    document.getElementById('loading-overlay').style.display = 'flex';
    
    setTimeout(function() {
        showWeekView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter);
        document.getElementById('loading-overlay').style.display = 'none';
        document.getElementById('search-results').style.display = 'block';
        
        if (window.innerWidth <= 768) {
            document.getElementById('filter-content').classList.add('hidden');
            document.getElementById('toggle-filters').innerHTML = '<span class="toggle-icon">▼</span> フィルターを表示';
        }
    }, 400);
}

function switchView(view, currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter) {
    if (view === 'week') {
        showWeekView(currentWeekStartDate, instrumentFilter, teacherFilter, lessonType, statusFilter);
    }
    
    document.querySelectorAll('.calendar-view-toggle button').forEach(button => {
        if (button.id === `${view}-view`) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function navigateToPreviousWeek(currentWeekStartDate) {
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() - 7);
    updateWeekDisplay(currentWeekStartDate);
    handleSearch(currentWeekStartDate);
}

function navigateToNextWeek(currentWeekStartDate) {
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() + 7);
    updateWeekDisplay(currentWeekStartDate);
    handleSearch(currentWeekStartDate);
}

function toggleFilterContent() {
    const filterContent = document.getElementById('filter-content');
    const toggleFilters = document.getElementById('toggle-filters');
    
    if (filterContent.classList.contains('hidden')) {
        filterContent.classList.remove('hidden');
        toggleFilters.innerHTML = '<span class="toggle-icon">▲</span> フィルターを非表示';
    } else {
        filterContent.classList.add('hidden');
        toggleFilters.innerHTML = '<span class="toggle-icon">▼</span> フィルターを表示';
    }
}