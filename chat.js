/**
 * チャット機能のJavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // 連絡先クリックでアクティブ状態を切り替え
    initializeContactSelection();
    
    // メッセージ送信機能
    initializeMessageSending();
    
    // メニュートグル機能 - モバイル表示用
    initializeMobileMenu();
    
    // 未読バッジをクリックしたときに消す
    initializeUnreadBadges();
    
    // 講師一覧からのチャット遷移
    handleSendMessageFromTeachersList();
});

/**
 * 連絡先選択の初期化
 */
function initializeContactSelection() {
    const contacts = document.querySelectorAll('.contact');
    
    contacts.forEach(contact => {
        contact.addEventListener('click', function() {
            // すべての連絡先からアクティブクラスを削除
            contacts.forEach(c => c.classList.remove('active'));
            
            // クリックした連絡先にアクティブクラスを追加
            this.classList.add('active');
            
            // 選択した講師のデータを取得
            const teacherKey = this.getAttribute('data-teacher');
            const teacherName = this.querySelector('.contact-name').textContent;
            const teacherInitial = teacherName.charAt(0);
            
            // チャットヘッダーを更新
            updateChatHeader(teacherInitial, teacherName);
            
            // メッセージをロード
            loadMessages(teacherKey);
            
            // モバイル表示の場合はサイドバーを閉じる
            if (window.innerWidth <= 768) {
                document.querySelector('.chat-sidebar').classList.remove('show');
            }
        });
    });
}

/**
 * チャットヘッダーを更新する関数
 */
function updateChatHeader(initial, name) {
    document.querySelector('.recipient-avatar').textContent = initial;
    document.querySelector('.recipient-name').textContent = name;
}

/**
 * メッセージを送信する機能の初期化
 */
function initializeMessageSending() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    // 送信ボタンのクリックでメッセージを送信
    sendBtn.addEventListener('click', function() {
        sendMessage();
    });
    
    // Enterキーでもメッセージを送信
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

/**
 * メッセージを送信する関数
 */
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (message) {
        // 現在の日時を取得
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        // メッセージを追加
        addMessage(message, 'sent', timeString);
        
        // 入力フィールドをクリア
        messageInput.value = '';
        
        // 自動返信（デモ用）
        setTimeout(() => {
            const replies = [
                "承知しました。ありがとうございます。",
                "次回のレッスンでお話しましょう。",
                "ご質問があればいつでもどうぞ。"
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            addMessage(randomReply, 'received', timeString);
        }, 1000);
    }
}

/**
 * メッセージを追加する関数
 */
function addMessage(text, type, time) {
    const chatMessages = document.getElementById('chat-messages');
    
    // メッセージ要素を作成
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // メッセージコンテンツを作成
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // テキストを段落に変換
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    contentDiv.appendChild(paragraph);
    
    // 時間要素を作成
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = time;
    
    // 要素を組み立て
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    // メッセージリストに追加
    chatMessages.appendChild(messageDiv);
    
    // 最新のメッセージが見えるようにスクロール
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * 特定の講師のメッセージをロードする関数
 */
function loadMessages(teacherKey) {
    // メッセージコンテナをクリア
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    
    // 今日の日付
    const today = new Date();
    const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    
    // 日付区切りを追加
    const dateDiv = document.createElement('div');
    dateDiv.className = 'message-date';
    dateDiv.textContent = dateString;
    chatMessages.appendChild(dateDiv);
    
    // デモメッセージを追加（実際のアプリではAPIからデータを取得）
    if (teacherKey === 'tanaka') {
        // 田中先生とのチャット
        addMessage("こんにちは山田さん。次回のレッスンについて何か質問はありますか？", "received", "14:30");
        addMessage("田中先生、こんにちは！次回のレッスンでは「ソナチネアルバム1巻のNo.5」を続けたいと思っています。", "sent", "14:35");
        addMessage("了解しました。特に3ページ目の16分音符の部分を重点的に見ていきましょう。練習のポイントとしては、まず遅いテンポから始めて徐々に速くしていくといいですよ。", "received", "14:38");
    } else if (teacherKey === 'suzuki') {
        // 鈴木先生とのチャット
        addMessage("山田さん、次回のギターレッスンについてお知らせです。", "received", "10:15");
        addMessage("はい、鈴木先生、何でしょうか？", "sent", "10:20");
        addMessage("次回は基本的なアルペジオの練習をしたいと思いますので、教則本の32ページを予習しておいてください。", "received", "10:22");
    } else if (teacherKey === 'sato') {
        // 佐藤先生とのチャット
        addMessage("山田さん、バイオリンの調弦はできていますか？", "received", "13:05");
        addMessage("先生、実は少し難しくて上手くできていません。", "sent", "13:10");
        addMessage("大丈夫ですよ。次回のレッスンで一緒に確認しましょう。初めは難しいものです。", "received", "13:12");
    } else {
        // その他の講師（デフォルトメッセージ）
        addMessage("こんにちは山田さん。次回のレッスンを楽しみにしています。", "received", "13:00");
    }
}

/**
 * モバイルメニューの初期化
 */
function initializeMobileMenu() {
    // モバイル表示の際のメニュートグル
    const menuToggle = document.getElementById('menu-toggle');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const chatSidebar = document.querySelector('.chat-sidebar');
            chatSidebar.classList.toggle('show');
        });
    }
}

/**
 * 未読バッジの初期化
 */
function initializeUnreadBadges() {
    const unreadBadges = document.querySelectorAll('.unread-badge');
    
    unreadBadges.forEach(badge => {
        const contact = badge.closest('.contact');
        
        contact.addEventListener('click', function() {
            // 未読バッジを非表示にする
            badge.style.display = 'none';
        });
    });
}

/**
 * 講師一覧ページからのチャット遷移処理
 */
function handleSendMessageFromTeachersList() {
    // URLからパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const teacherParam = urlParams.get('teacher');
    
    if (teacherParam) {
        // 対応する連絡先を見つけてクリックイベントを発火
        const contact = document.querySelector(`.contact[data-teacher="${teacherParam}"]`);
        if (contact) {
            contact.click();
        }
    }
}
