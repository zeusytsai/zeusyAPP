// 小土小紅家 - 投票邏輯 vote.js
// 依賴：jQuery、Bootstrap 5 Modal、Firebase Realtime Database（firebase-config.js）

(function ($) {

  var votesRef = db.ref('votes');

  // ---- 工具：產生裝置唯一 ID（存 localStorage）----
  function getDeviceId() {
    var id = localStorage.getItem('device_id');
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', id);
    }
    return id;
  }

  // ---- 工具：時間格式化 ----
  function formatTime(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // ---- 渲染單張投票卡片 ----
  function renderVoteCard(voteId, vote) {
    var deviceId = getDeviceId();
    var hasVoted  = !!localStorage.getItem('voted_' + voteId);
    var isCreator = localStorage.getItem('created_' + voteId) === deviceId;
    var isOpen    = vote.status === 'open';

    var options = vote.options || [];
    var totalVotes = options.reduce(function (sum, o) { return sum + (o.count || 0); }, 0);

    // 找最高票
    var maxCount = Math.max.apply(null, options.map(function (o) { return o.count || 0; }));

    var $card = $('<div class="vote-card' + (isOpen ? '' : ' closed') + '" data-vote-id="' + voteId + '">');

    // 標題列
    var badgeHtml = isOpen
      ? '<span class="vote-status-badge badge-open">進行中</span>'
      : '<span class="vote-status-badge badge-closed">已結束</span>';
    $card.append(
      '<div class="vote-card-title">' +
        '<span>' + $('<span>').text(vote.title).html() + '</span>' +
        badgeHtml +
      '</div>'
    );

    if (isOpen && !hasVoted) {
      // === 尚未投票：顯示可點擊選項 ===
      var $opts = $('<div class="vote-options">');
      options.forEach(function (opt, idx) {
        var $btn = $(
          '<button class="vote-option-btn" data-vote-id="' + voteId + '" data-option-idx="' + idx + '">' +
            '<span class="option-check" style="visibility:hidden">✓</span>' +
            '<span>' + $('<span>').text(opt.text).html() + '</span>' +
          '</button>'
        );
        $opts.append($btn);
      });
      $card.append($opts);

    } else {
      // === 已投票或已結束：顯示結果長條圖 ===
      var myVotedIdx = parseInt(localStorage.getItem('voted_option_' + voteId), 10);
      var $results = $('<div class="vote-results">');

      options.forEach(function (opt, idx) {
        var count   = opt.count || 0;
        var pct     = totalVotes > 0 ? Math.round(count / totalVotes * 100) : 0;
        var isWinner = count === maxCount && count > 0;
        var isMyVote = idx === myVotedIdx;

        $results.append(
          '<div class="result-row">' +
            '<div class="result-label-row">' +
              '<span class="result-label">' +
                (isMyVote ? '✓ ' : '') +
                $('<span>').text(opt.text).html() +
              '</span>' +
              '<span class="result-count">' + count + ' 票（' + pct + '%）</span>' +
            '</div>' +
            '<div class="result-bar-wrap">' +
              '<div class="result-bar' + (isWinner ? ' is-winner' : '') + '" style="width:' + pct + '%"></div>' +
            '</div>' +
          '</div>'
        );
      });
      $card.append($results);
    }

    // 卡片底部
    var footerHtml = '<div class="vote-card-footer">' +
      '<span>共 ' + totalVotes + ' 票 · ' + formatTime(vote.createdAt) + '</span>';

    if (isOpen && isCreator) {
      footerHtml += '<button class="btn-close-vote" data-vote-id="' + voteId + '">結束投票</button>';
    }
    footerHtml += '</div>';
    $card.append(footerHtml);

    return $card;
  }

  // ---- 渲染整個投票列表 ----
  function renderVoteList(snapshot) {
    var $openList   = $('#vote-open-list');
    var $closedList = $('#vote-closed-list');
    $openList.empty();
    $closedList.empty();

    var hasOpen = false, hasClosed = false;

    if (snapshot.exists()) {
      var votes = snapshot.val();
      // 依建立時間倒序排列
      var keys = Object.keys(votes).sort(function (a, b) {
        return (votes[b].createdAt || 0) - (votes[a].createdAt || 0);
      });

      keys.forEach(function (voteId) {
        var vote  = votes[voteId];
        var $card = renderVoteCard(voteId, vote);
        if (vote.status === 'open') {
          $openList.append($card);
          hasOpen = true;
        } else {
          $closedList.append($card);
          hasClosed = true;
        }
      });
    }

    if (!hasOpen) {
      $openList.html(
        '<div class="empty-hint">' +
          '<span class="empty-emoji">🗳️</span>' +
          '<p>目前沒有進行中的投票<br>按右上角的 ＋ 建立一個吧！</p>' +
        '</div>'
      );
    }
    $('#closed-section').toggle(hasClosed);
  }

  // ---- 投票動作 ----
  $(document).on('click', '.vote-option-btn', function () {
    var $btn      = $(this);
    var voteId    = $btn.data('vote-id');
    var optionIdx = $btn.data('option-idx');

    if (localStorage.getItem('voted_' + voteId)) return;

    // 樂觀 UI：先標記已投
    $btn.addClass('voted');
    $btn.find('.option-check').css('visibility', 'visible');

    // Firebase transaction 保證票數安全遞增
    db.ref('votes/' + voteId + '/options/' + optionIdx + '/count')
      .transaction(function (current) {
        return (current || 0) + 1;
      })
      .then(function () {
        localStorage.setItem('voted_' + voteId, '1');
        localStorage.setItem('voted_option_' + voteId, optionIdx);
      })
      .catch(function (err) {
        console.error('投票失敗', err);
        $btn.removeClass('voted');
        $btn.find('.option-check').css('visibility', 'hidden');
      });
  });

  // ---- 結束投票 ----
  $(document).on('click', '.btn-close-vote', function () {
    var voteId = $(this).data('vote-id');
    db.ref('votes/' + voteId + '/status').set('closed');
  });

  // ---- 新增投票 Modal：動態加選項 ----
  $(document).on('click', '#add-option-btn', function () {
    var count = $('#new-vote-options .option-input-row').length;
    if (count >= 6) return;
    var $row = $(
      '<div class="option-input-row">' +
        '<input type="text" placeholder="選項 ' + (count + 1) + '" maxlength="30" />' +
        '<button class="btn-remove-option" title="刪除">✕</button>' +
      '</div>'
    );
    $('#new-vote-options').append($row);
    $row.find('input').focus();
    if ($('#new-vote-options .option-input-row').length >= 6) {
      $('#add-option-btn').prop('disabled', true);
    }
  });

  // ---- 刪除選項列 ----
  $(document).on('click', '.btn-remove-option', function () {
    var $rows = $('#new-vote-options .option-input-row');
    if ($rows.length <= 2) return; // 最少保留 2 個
    $(this).closest('.option-input-row').remove();
    $('#add-option-btn').prop('disabled', false);
    // 重編 placeholder
    $('#new-vote-options .option-input-row').each(function (i) {
      $(this).find('input').attr('placeholder', '選項 ' + (i + 1));
    });
  });

  // ---- 送出新投票 ----
  $(document).on('click', '#submit-vote-btn', function () {
    var title = $('#new-vote-title').val().trim();
    if (!title) {
      $('#new-vote-title').focus();
      return;
    }

    var options = [];
    var valid = true;
    $('#new-vote-options .option-input-row input').each(function () {
      var val = $(this).val().trim();
      if (!val) { valid = false; $(this).focus(); return false; }
      options.push({ text: val, count: 0 });
    });
    if (!valid || options.length < 2) return;

    var deviceId = getDeviceId();
    var newVote = {
      title:     title,
      status:    'open',
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      creatorId: deviceId,
      options:   options
    };

    var newRef = votesRef.push(newVote);
    // 記錄自己是建立者
    localStorage.setItem('created_' + newRef.key, deviceId);

    // 關閉 Modal 並重置表單
    $('#new-vote-modal').modal('hide');
    $('#new-vote-title').val('');
    $('#new-vote-options').html(
      '<div class="option-input-row">' +
        '<input type="text" placeholder="選項 1" maxlength="30" />' +
        '<button class="btn-remove-option" title="刪除">✕</button>' +
      '</div>' +
      '<div class="option-input-row">' +
        '<input type="text" placeholder="選項 2" maxlength="30" />' +
        '<button class="btn-remove-option" title="刪除">✕</button>' +
      '</div>'
    );
    $('#add-option-btn').prop('disabled', false);
  });

  // ---- 初始化：監聽 Firebase 即時更新 ----
  $(function () {
    votesRef.on('value', function (snapshot) {
      renderVoteList(snapshot);
    });
  });

})(jQuery);
