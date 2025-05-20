// teachers.js - 講師一覧ページのJavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 講師カードの取得
    const teacherCards = document.querySelectorAll('.teacher-card');
    
    // 検索ボックスの設定
    const searchInput = document.getElementById('teacher-search');
    
    // 楽器フィルターの設定
    const instrumentFilter = document.getElementById('instrument-filter');
    
    // 検索・フィルター処理
    function filterTeachers() {
        const searchText = searchInput.value.toLowerCase();
        const selectedInstrument = instrumentFilter.value;
        
        let hasVisibleCard = false;
        
        // すべての講師カードをチェック
        teacherCards.forEach(card => {
            const teacherName = card.querySelector('.teacher-name').textContent.toLowerCase();
            const teacherInstrument = card.getAttribute('data-instrument');
            
            // 検索テキストと楽器フィルターの両方に一致するかチェック
            const matchesSearch = searchText === '' || teacherName.includes(searchText);
            const matchesInstrument = selectedInstrument === 'all' || teacherInstrument === selectedInstrument;
            
            // 両方のフィルターに一致する場合は表示
            if (matchesSearch && matchesInstrument) {
                card.style.display = 'flex';
                hasVisibleCard = true;
            } else {
                card.style.display = 'none';
            }
        });
        
        // 「結果なし」メッセージの表示/非表示を切り替え
        const noResultsElement = document.getElementById('no-results');
        
        if (!hasVisibleCard) {
            noResultsElement.classList.remove('hidden');
        } else {
            noResultsElement.classList.add('hidden');
        }
    }
    
    // フィルター変更時のイベント
    searchInput.addEventListener('input', filterTeachers);
    instrumentFilter.addEventListener('change', filterTeachers);
    
    // スケジュールを見るボタンのイベント
    document.querySelectorAll('.view-schedule').forEach(button => {
        button.addEventListener('click', function() {
            const teacherKey = this.getAttribute('data-teacher');
            // 予約ページに遷移してフィルターを設定
            window.location.href = `index.html?teacher=${teacherKey}`;
        });
    });
    
    // メッセージを送るボタンのイベント
    document.querySelectorAll('.send-message').forEach(button => {
        button.addEventListener('click', function() {
            const teacherKey = this.getAttribute('data-teacher');
            // チャットページに遷移
            window.location.href = `chat.html?teacher=${teacherKey}`;
        });
    });
    
    // モバイルメニュートグルの設定
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.setAttribute('aria-expanded', 
                this.getAttribute('aria-expanded') === 'false' ? 'true' : 'false'
            );
        });
    }
    
    // URLパラメータからフィルター初期値を設定
    function applyUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const instrumentParam = urlParams.get('instrument');
        
        // 楽器フィルターを設定
        if (instrumentParam) {
            instrumentFilter.value = instrumentParam;
            filterTeachers();
        }
    }
    
    // URLパラメータの適用
    applyUrlParams();
    
    // トースト通知を表示する関数
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        
        // トースト要素を作成
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // トーストのアイコンを設定
        let iconSvg = '';
        
        if (type === 'success') {
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        } else if (type === 'warning') {
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        } else if (type === 'error') {
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        } else {
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
        
        // トーストの内容を設定
        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-close">&times;</div>
        `;
        
        // トーストをコンテナに追加
        toastContainer.appendChild(toast);
        
        // アニメーションを設定
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 閉じるボタンの動作
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            hideToast(toast);
        });
        
        // 自動的に非表示にする
        setTimeout(() => {
            hideToast(toast);
        }, 5000);
    }
    
    // トーストを非表示にする関数
    function hideToast(toast) {
        toast.classList.add('hide');
        
        // アニメーション終了後に削除
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }
});
