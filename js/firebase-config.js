// Firebase設定ファイル
// 実際のFirebaseプロジェクトを作成後、正しい設定値に置き換えてください

// Firebase SDKのインポート（HTMLで読み込む場合）
// <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"></script>

// Firebase設定オブジェクト（サンプル - 実際の値に置き換える）
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "melodylab-schedule.firebaseapp.com",
    projectId: "melodylab-schedule",
    storageBucket: "melodylab-schedule.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnop"
};

// Firebase初期化
let app, db, auth;

// 初期化関数
function initializeFirebase() {
    try {
        // Firebase アプリの初期化
        app = firebase.initializeApp(firebaseConfig);
        
        // Firestoreの初期化
        db = firebase.firestore();
        
        // 認証の初期化
        auth = firebase.auth();
        
        // オフライン対応の設定
        db.enablePersistence()
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code == 'unimplemented') {
                    console.warn('The current browser does not support all features required for persistence.');
                }
            });
        
        console.log('Firebase初期化完了');
        return true;
    } catch (error) {
        console.error('Firebase初期化エラー:', error);
        return false;
    }
}

// データベース操作のヘルパー関数
const FirebaseDB = {
    // 講師データの取得
    async getTeacher(teacherId) {
        try {
            const doc = await db.collection('teachers').doc(teacherId).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error('講師データ取得エラー:', error);
            return null;
        }
    },
    
    // 講師スケジュールの取得
    async getTeacherSchedule(teacherId) {
        try {
            const snapshot = await db.collection('schedules')
                .where('teacherId', '==', teacherId)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('スケジュール取得エラー:', error);
            return [];
        }
    },
    
    // 講師スケジュールの保存
    async saveTeacherSchedule(teacherId, scheduleData) {
        try {
            const docRef = await db.collection('schedules').add({
                teacherId: teacherId,
                ...scheduleData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('スケジュール保存完了:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('スケジュール保存エラー:', error);
            return null;
        }
    },
    
    // 予約データの取得
    async getBookings(teacherId = null, studentId = null) {
        try {
            let query = db.collection('bookings');
            
            if (teacherId) {
                query = query.where('teacherId', '==', teacherId);
            }
            if (studentId) {
                query = query.where('studentId', '==', studentId);
            }
            
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('予約データ取得エラー:', error);
            return [];
        }
    },
    
    // 予約の作成
    async createBooking(bookingData) {
        try {
            const docRef = await db.collection('bookings').add({
                ...bookingData,
                status: 'confirmed', // 即座に確定
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('予約作成完了:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('予約作成エラー:', error);
            return null;
        }
    }
};

// リアルタイムリスナーの管理
const FirebaseListeners = {
    // スケジュール変更のリスナー
    listenToScheduleChanges(teacherId, callback) {
        return db.collection('schedules')
            .where('teacherId', '==', teacherId)
            .onSnapshot((snapshot) => {
                const schedules = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(schedules);
            });
    },
    
    // 予約変更のリスナー
    listenToBookingChanges(teacherId, callback) {
        return db.collection('bookings')
            .where('teacherId', '==', teacherId)
            .onSnapshot((snapshot) => {
                const bookings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(bookings);
            });
    }
};

// ユーティリティ関数
const FirebaseUtils = {
    // タイムスタンプを日付文字列に変換
    timestampToDate(timestamp) {
        return timestamp ? timestamp.toDate() : new Date();
    },
    
    // 現在の日時を取得
    now() {
        return firebase.firestore.FieldValue.serverTimestamp();
    }
};

// エクスポート（モジュール使用時）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeFirebase,
        FirebaseDB,
        FirebaseListeners,
        FirebaseUtils
    };
}