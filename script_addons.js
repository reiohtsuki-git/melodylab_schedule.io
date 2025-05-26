/**
 * デバッグログ関数
 */
function logDebugInfo(message, data = null) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`[MelodyLab Debug] ${message}`, data);
    }
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
    
    // デバッグ情報
    logDebugInfo('次の週に移動しました', {
        currentWeekStartDate: currentWeekStartDate.toISOString()
    });
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
    
    // デバッグ情報
    logDebugInfo('フィルター表示を切り替えました', {
        isVisible: !filterContent.classList.contains('hidden')
    });
}

/**
 * Zoomリンクのコピー機能
 */
function initializeCopyFunction() {
    const copyBtn = document.getElementById('copy-zoom-link');
    const copySuccess = document.getElementById('copy-success');
    const zoomLinkInput = document.getElementById('zoom-link');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            if (zoomLinkInput) {
                zoomLinkInput.select();
                zoomLinkInput.setSelectionRange(0, 99999);
                
                try {
                    navigator.clipboard.writeText(zoomLinkInput.value).then(function() {
                        showCopySuccess();
                    }).catch(function() {
                        // フォールバック
                        document.execCommand('copy');
                        showCopySuccess();
                    });
                } catch (err) {
                    logDebugInfo('コピーに失敗しました', err);
                }
            }
        });
    }
    
    function showCopySuccess() {
        if (copySuccess) {
            copySuccess.classList.add('show');
            setTimeout(function() {
                copySuccess.classList.remove('show');
            }, 2000);
        }
    }
}

/**
 * 予約確認機能
 */
function initializeBookingFunction() {
    const confirmBookingBtn = document.getElementById('confirm-booking');
    
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', function() {
            const notes = document.getElementById('notes').value;
            const datetime = document.getElementById('booking-datetime').textContent;
            const teacher = document.getElementById('booking-teacher').textContent;
            
            // ローディング表示
            showLoadingOverlay();
            
            // 実際の予約処理をシミュレート
            setTimeout(function() {
                hideLoadingOverlay();
                closeModal();
                showToast('success', '予約が完了しました！');
                
                logDebugInfo('予約が完了しました', {
                    datetime: datetime,
                    teacher: teacher,
                    notes: notes
                });
                
                // スケジュールを再読み込み
                const currentWeekStartDate = new Date();
                handleSearch(currentWeekStartDate);
            }, 1500);
        });
    }
}

/**
 * ローディングオーバーレイ表示
 */
function showLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * ローディングオーバーレイ非表示
 */
function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * トースト通知表示
 */
function showToast(type, message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div>
            <strong>${type === 'success' ? '成功' : type === 'error' ? 'エラー' : '警告'}</strong>
            <div>${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // 3秒後に自動削除
    setTimeout(function() {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

/**
 * オフライン状態の監視
 */
function initializeOfflineMonitoring() {
    const offlineNotification = document.getElementById('offline-notification');
    
    function updateOnlineStatus() {
        if (offlineNotification) {
            if (navigator.onLine) {
                offlineNotification.setAttribute('aria-hidden', 'true');
            } else {
                offlineNotification.setAttribute('aria-hidden', 'false');
            }
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // 初期状態を設定
    updateOnlineStatus();
}

/**
 * モバイルメニューの初期化
 */
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            navLinks.classList.toggle('active');
            
            logDebugInfo('モバイルメニューが切り替えられました', { isExpanded: !isExpanded });
        });
    }
}

/**
 * 初期化完了後の追加設定
 */
document.addEventListener('DOMContentLoaded', function() {
    // 追加機能の初期化
    initializeCopyFunction();
    initializeBookingFunction();
    initializeOfflineMonitoring();
    initializeMobileMenu();
    
    logDebugInfo('追加機能の初期化が完了しました');
});