// 小土小紅家 - 轉盤邏輯 spinner.js
// 依賴：jQuery、Bootstrap 5 Modal

(function ($) {

  // ---- 常數 ----
  var STORAGE_KEY = 'spinner_items';
  var MAX_ITEMS = 12;
  var MIN_ITEMS = 2;

  // 轉盤配色（可愛暖色系）
  var COLORS = [
    '#FF8C42', '#FFB347', '#7BC67E', '#74BCFF',
    '#FF7EB3', '#A78BFA', '#34D399', '#FBBF24',
    '#FB7185', '#60A5FA', '#F472B6', '#4ADE80'
  ];

  // ---- 狀態 ----
  var items = [];
  var isSpinning = false;
  var currentAngle = 0;       // 當前旋轉角度（弧度）
  var animationId = null;

  // ---- Canvas 初始化 ----
  var canvas, ctx;

  function initCanvas() {
    canvas = document.getElementById('spinner-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
  }

  function resizeCanvas() {
    // 根據螢幕寬度決定轉盤大小（最大 300px）
    var size = Math.min(300, window.innerWidth - 80);
    canvas.width = size;
    canvas.height = size;
    drawSpinner();
  }

  // ---- 繪製轉盤（全域可呼叫，供 app.js 切頁時重繪） ----
  window.drawSpinner = function () {
    if (!canvas) return;
    var w = canvas.width;
    var h = canvas.height;
    var cx = w / 2;
    var cy = h / 2;
    var r = w / 2 - 4;

    ctx.clearRect(0, 0, w, h);

    if (items.length === 0) {
      // 沒有選項時顯示提示
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#f0f0f0';
      ctx.fill();
      ctx.fillStyle = '#aaa';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('請新增選項', cx, cy);
      return;
    }

    var sliceAngle = (Math.PI * 2) / items.length;

    items.forEach(function (item, i) {
      var startAngle = currentAngle + i * sliceAngle - Math.PI / 2;
      var endAngle   = startAngle + sliceAngle;

      // 扇形
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 文字
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';

      var fontSize = items.length <= 6 ? 14 : 11;
      ctx.font = 'bold ' + fontSize + 'px Noto Sans TC, system-ui';

      // 文字最多顯示 8 個字
      var label = item.length > 8 ? item.substring(0, 7) + '…' : item;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3;
      ctx.fillText(label, r - 10, 0);
      ctx.restore();
    });

    // 外圍圓框
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF8C42';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  // ---- 緩動函數 easeOutCubic ----
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ---- 旋轉動畫 ----
  function spinWheel() {
    if (isSpinning || items.length < MIN_ITEMS) return;
    isSpinning = true;
    $('#spin-btn').prop('disabled', true);

    // 隨機額外旋轉圈數（5~8 圈）+ 隨機落點
    var extraSpins = (5 + Math.random() * 3) * Math.PI * 2;
    var randomOffset = Math.random() * Math.PI * 2;
    var totalRotation = extraSpins + randomOffset;

    var startAngle = currentAngle;
    var startTime = null;
    var duration = 4000 + Math.random() * 1500; // 4~5.5 秒

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutCubic(progress);

      currentAngle = startAngle + totalRotation * eased;
      drawSpinner();

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        currentAngle = currentAngle % (Math.PI * 2);
        isSpinning = false;
        $('#spin-btn').prop('disabled', false);
        showResult();
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  // ---- 計算中獎項目 ----
  function getWinnerIndex() {
    // 扇形 i 的起始角度 = currentAngle + i*sliceAngle - π/2
    // 指針在頂部 = -π/2，對齊條件化簡後：
    // normalized = (-currentAngle + 大倍數*2π) % 2π
    // index = floor(normalized / sliceAngle)
    var sliceAngle = (Math.PI * 2) / items.length;
    var normalized = (-currentAngle % (Math.PI * 2) + Math.PI * 2 * 100) % (Math.PI * 2);
    var index = Math.floor(normalized / sliceAngle) % items.length;
    return index;
  }

  // ---- 顯示結果 Modal ----
  function showResult() {
    var idx = getWinnerIndex();
    var winner = items[idx];
    var color  = COLORS[idx % COLORS.length];

    $('#result-winner-text').text(winner);
    $('#result-winner-text').css('color', color);
    $('#result-modal').modal('show');
  }

  // ---- 選項管理 ----
  function loadItems() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      items = stored ? JSON.parse(stored) : ['小土', '小紅', '布朗'];
    } catch (e) {
      items = ['小土', '小紅', '布朗'];
    }
  }

  function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function renderItemList() {
    var $list = $('#spinner-items-list');
    $list.empty();

    items.forEach(function (item, i) {
      var color = COLORS[i % COLORS.length];
      var $li = $(
        '<li>' +
          '<span class="item-color-dot" style="background:' + color + '"></span>' +
          '<span class="item-label">' + $('<span>').text(item).html() + '</span>' +
          '<button class="delete-item-btn" data-index="' + i + '" title="刪除">✕</button>' +
        '</li>'
      );
      $list.append($li);
    });

    var count = items.length;
    var hint = count + ' 個選項';
    if (count < MIN_ITEMS) hint += '（至少需要 ' + MIN_ITEMS + ' 個）';
    if (count >= MAX_ITEMS) hint += '（已達上限 ' + MAX_ITEMS + ' 個）';
    $('#items-count-hint').text(hint);

    $('#add-item-btn').prop('disabled', count >= MAX_ITEMS);
    $('#spin-btn').prop('disabled', count < MIN_ITEMS);

    drawSpinner();
    saveItems();
  }

  // ---- 事件綁定 ----
  function bindEvents() {
    // 新增選項
    $('#add-item-btn').on('click', function () {
      var val = $('#new-item-input').val().trim();
      if (!val) {
        $('#new-item-input').focus();
        return;
      }
      if (items.length >= MAX_ITEMS) return;
      items.push(val);
      $('#new-item-input').val('');
      renderItemList();
    });

    // Enter 鍵新增
    $('#new-item-input').on('keydown', function (e) {
      if (e.key === 'Enter') {
        $('#add-item-btn').trigger('click');
      }
    });

    // 刪除選項（事件委派）
    $('#spinner-items-list').on('click', '.delete-item-btn', function () {
      var idx = parseInt($(this).data('index'), 10);
      items.splice(idx, 1);
      renderItemList();
    });

    // 旋轉按鈕
    $('#spin-btn').on('click', function () {
      spinWheel();
    });

    // 視窗縮放時重繪
    $(window).on('resize', function () {
      resizeCanvas();
    });
  }

  // ---- 初始化 ----
  $(function () {
    initCanvas();
    loadItems();
    bindEvents();
    renderItemList();
  });

})(jQuery);
