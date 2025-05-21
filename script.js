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