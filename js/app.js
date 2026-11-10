// 小土小紅家 - 應用主控制 app.js
// 負責：頁面切換、Service Worker 註冊

$(function () {

  // ---- Service Worker 註冊 ----
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(function (reg) {
        console.log('[SW] 註冊成功:', reg.scope);
      })
      .catch(function (err) {
        console.warn('[SW] 註冊失敗:', err);
      });
  }

  // ---- 底部導覽列切換 ----
  function showPage(pageId) {
    $('.page-section').removeClass('active');
    $('#page-' + pageId).addClass('active');

    $('.bottom-nav .nav-item').removeClass('active');
    $('.bottom-nav .nav-item[data-page="' + pageId + '"]').addClass('active');

    // 切換到轉盤頁時，重繪轉盤（確保 canvas 尺寸正確）
    if (pageId === 'spinner' && typeof drawSpinner === 'function') {
      drawSpinner();
    }
  }

  // 點擊導覽項目
  $(document).on('click', '.bottom-nav .nav-item', function () {
    var pageId = $(this).data('page');
    showPage(pageId);
  });

  // 預設顯示轉盤頁
  showPage('spinner');

});
