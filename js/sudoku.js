// 小土小紅家 - 數獨遊戲 sudoku.js
// 功能：隨機高難度數獨、三次錯誤機會、第四次錯誤強制刷新

(function () {
  'use strict';

  // =============================================
  //  常數
  // =============================================
  // 玩家有 3 次錯誤機會（顯示 3 顆愛心），第 4 次錯誤強制刷新
  var MAX_MISTAKES = 3;  // 顯示的愛心數（機會數）
  var HINT_MAX     = 3;   // 提示次數

  // =============================================
  //  遊戲狀態
  // =============================================
  var state = {
    board:      [],   // 9x9 目前顯示盤（0 = 空）
    solution:   [],   // 9x9 完整解答
    given:      [],   // 9x9 boolean，是否為初始給定格
    mistakes:   0,
    hintsLeft:  HINT_MAX,
    selected:   null, // {row, col}
    timerSec:   0,
    timerHandle: null,
    gameOver:   false,
    notesMode:  false,
    notes:      []    // 9x9 Set
  };

  // =============================================
  //  數獨產生器
  // =============================================

  /** 洗牌 Fisher-Yates */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /** 建立空白 9x9 陣列 */
  function emptyGrid() {
    var g = [];
    for (var i = 0; i < 9; i++) {
      g.push([0,0,0,0,0,0,0,0,0]);
    }
    return g;
  }

  /** 複製 9x9 陣列 */
  function cloneGrid(g) {
    return g.map(function(r){ return r.slice(); });
  }

  /** 確認放置是否合法 */
  function isValid(grid, row, col, num) {
    // 同列
    for (var c = 0; c < 9; c++) {
      if (grid[row][c] === num) return false;
    }
    // 同行
    for (var r = 0; r < 9; r++) {
      if (grid[r][col] === num) return false;
    }
    // 3x3 宮
    var boxR = Math.floor(row / 3) * 3;
    var boxC = Math.floor(col / 3) * 3;
    for (var dr = 0; dr < 3; dr++) {
      for (var dc = 0; dc < 3; dc++) {
        if (grid[boxR + dr][boxC + dc] === num) return false;
      }
    }
    return true;
  }

  /** 回溯填完整個解答 */
  function fillGrid(grid) {
    for (var row = 0; row < 9; row++) {
      for (var col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          var nums = shuffle([1,2,3,4,5,6,7,8,9]);
          for (var i = 0; i < nums.length; i++) {
            if (isValid(grid, row, col, nums[i])) {
              grid[row][col] = nums[i];
              if (fillGrid(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 用回溯計算解的數量（最多算到 2）
   * 用來確保挖空後唯一解
   */
  function countSolutions(grid, limit) {
    limit = limit || 2;
    var count = 0;
    function solve() {
      for (var row = 0; row < 9; row++) {
        for (var col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            for (var num = 1; num <= 9; num++) {
              if (isValid(grid, row, col, num)) {
                grid[row][col] = num;
                solve();
                grid[row][col] = 0;
                if (count >= limit) return;
              }
            }
            return;
          }
        }
      }
      count++;
    }
    solve();
    return count;
  }

  /**
   * 產生「困難」數獨：
   * 先填好完整解答，再隨機挖空 52~58 格（保留 23~29 個提示）
   * 並確保唯一解
   */
  function generatePuzzle() {
    // 1. 填完整解答
    var sol = emptyGrid();
    fillGrid(sol);

    // 2. 挖空
    var puzzle = cloneGrid(sol);
    var cells = shuffle(
      (function(){
        var arr = [];
        for (var r = 0; r < 9; r++)
          for (var c = 0; c < 9; c++)
            arr.push([r, c]);
        return arr;
      })()
    );

    var targetRemove = 53 + Math.floor(Math.random() * 5); // 53~57 個空格
    var removed = 0;

    for (var i = 0; i < cells.length && removed < targetRemove; i++) {
      var r = cells[i][0], c = cells[i][1];
      var backup = puzzle[r][c];
      puzzle[r][c] = 0;

      // 確認唯一解（超時保護：若超過 25 個空格仍通過則加快驗證）
      var test = cloneGrid(puzzle);
      if (countSolutions(test, 2) !== 1) {
        puzzle[r][c] = backup; // 還原
      } else {
        removed++;
      }
    }

    return { puzzle: puzzle, solution: sol };
  }

  // =============================================
  //  計時器
  // =============================================
  function startTimer() {
    stopTimer();
    state.timerSec = 0;
    renderTimer();
    state.timerHandle = setInterval(function () {
      state.timerSec++;
      renderTimer();
    }, 1000);
  }

  function stopTimer() {
    if (state.timerHandle) {
      clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
  }

  function renderTimer() {
    var m = Math.floor(state.timerSec / 60);
    var s = state.timerSec % 60;
    var txt = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    var el = document.getElementById('sudoku-timer');
    if (el) el.textContent = txt;
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // =============================================
  //  初始化新遊戲
  // =============================================
  function newGame() {
    stopTimer();
    state.mistakes   = 0;
    state.hintsLeft  = HINT_MAX;
    state.selected   = null;
    state.gameOver   = false;
    state.notesMode  = false;

    // 初始化筆記
    state.notes = [];
    for (var r = 0; r < 9; r++) {
      var row = [];
      for (var c = 0; c < 9; c++) row.push(new Set());
      state.notes.push(row);
    }

    var result = generatePuzzle();
    state.board    = result.puzzle;
    state.solution = result.solution;
    state.given    = state.board.map(function(row) {
      return row.map(function(v) { return v !== 0; });
    });

    renderBoard();
    renderMistakes();
    renderHintBtn();
    startTimer();

    // 移除舊的 overlay
    var old = document.getElementById('sudoku-overlay');
    if (old) old.parentNode.removeChild(old);
  }

  // =============================================
  //  渲染棋盤
  // =============================================
  function renderBoard() {
    var container = document.getElementById('sudoku-board');
    if (!container) return;
    container.innerHTML = '';

    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        if ((r + 1) % 3 === 0 && r !== 8) cell.classList.add('row-' + (r + 1));

        var val = state.board[r][c];
        if (state.given[r][c]) {
          cell.classList.add('given');
          cell.textContent = val;
        } else if (val !== 0) {
          // 玩家填入的數字（正確的）
          cell.textContent = val;
          // 筆記清空
        } else {
          // 筆記
          var noteSet = state.notes[r][c];
          if (noteSet.size > 0) {
            var noteGrid = document.createElement('div');
            noteGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);width:100%;height:100%;padding:1px;';
            for (var n = 1; n <= 9; n++) {
              var nd = document.createElement('span');
              nd.style.cssText = 'font-size:clamp(6px,1.5vw,8px);font-weight:600;color:#9E7B5A;text-align:center;line-height:1.2;';
              nd.textContent = noteSet.has(n) ? n : '';
              noteGrid.appendChild(nd);
            }
            cell.appendChild(noteGrid);
          }
        }

        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener('click', onCellClick);
        container.appendChild(cell);
      }
    }

    // 還原選取高亮
    if (state.selected) {
      highlightSelection(state.selected.row, state.selected.col);
    }
  }

  // 更新單一格（不重繪全盤）
  function updateCell(r, c) {
    var container = document.getElementById('sudoku-board');
    if (!container) return;
    var idx = r * 9 + c;
    var cell = container.children[idx];
    if (!cell) return;

    // 清空
    cell.innerHTML = '';
    cell.className = 'sudoku-cell';
    if ((r + 1) % 3 === 0 && r !== 8) cell.classList.add('row-' + (r + 1));

    var val = state.board[r][c];
    if (state.given[r][c]) {
      cell.classList.add('given');
      cell.textContent = val;
    } else if (val !== 0) {
      cell.textContent = val;
    } else {
      var noteSet = state.notes[r][c];
      if (noteSet.size > 0) {
        var noteGrid = document.createElement('div');
        noteGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);width:100%;height:100%;padding:1px;';
        for (var n = 1; n <= 9; n++) {
          var nd = document.createElement('span');
          nd.style.cssText = 'font-size:clamp(6px,1.5vw,8px);font-weight:600;color:#9E7B5A;text-align:center;line-height:1.2;';
          nd.textContent = noteSet.has(n) ? n : '';
          noteGrid.appendChild(nd);
        }
        cell.appendChild(noteGrid);
      }
    }
  }

  // =============================================
  //  高亮選取格
  // =============================================
  function highlightSelection(selR, selC) {
    var container = document.getElementById('sudoku-board');
    if (!container) return;
    var cells = container.children;

    var selVal = state.board[selR][selC];

    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = cells[r * 9 + c];
        cell.classList.remove('selected', 'highlighted');

        if (r === selR && c === selC) {
          cell.classList.add('selected');
        } else if (r === selR || c === selC ||
                   (Math.floor(r/3) === Math.floor(selR/3) && Math.floor(c/3) === Math.floor(selC/3))) {
          cell.classList.add('highlighted');
        } else if (selVal !== 0 && state.board[r][c] === selVal) {
          cell.classList.add('highlighted');
        }
      }
    }
  }

  // =============================================
  //  事件：點擊格子
  // =============================================
  function onCellClick(e) {
    if (state.gameOver) return;
    var r = parseInt(this.dataset.row);
    var c = parseInt(this.dataset.col);
    state.selected = { row: r, col: c };
    highlightSelection(r, c);
  }

  // =============================================
  //  事件：按數字鍵盤
  // =============================================
  function onNumInput(num) {
    if (state.gameOver) return;
    if (!state.selected) return;
    var r = state.selected.row;
    var c = state.selected.col;
    if (state.given[r][c]) return;

    if (state.notesMode) {
      // 筆記模式
      if (state.board[r][c] !== 0) return;
      var ns = state.notes[r][c];
      if (ns.has(num)) ns.delete(num);
      else ns.add(num);
      updateCell(r, c);
      highlightSelection(r, c);
      return;
    }

    // 已填入正確值，不再修改
    if (state.board[r][c] !== 0) return;

    var correct = state.solution[r][c];
    var container = document.getElementById('sudoku-board');
    var cell = container ? container.children[r * 9 + c] : null;

    if (num === correct) {
      // 正確
      state.board[r][c] = num;
      state.notes[r][c].clear();
      updateCell(r, c);
      if (cell) {
        cell.classList.add('correct-flash');
        setTimeout(function(){ cell.classList.remove('correct-flash'); }, 400);
      }
      highlightSelection(r, c);

      // 檢查勝利
      if (checkWin()) {
        stopTimer();
        state.gameOver = true;
        setTimeout(function() { showWinOverlay(); }, 500);
      }
    } else {
      // 錯誤
      state.mistakes++;
      renderMistakes();
      if (cell) {
        cell.textContent = num;
        cell.classList.add('wrong');
        setTimeout(function(){
          cell.classList.remove('wrong');
          cell.textContent = '';
        }, 600);
      }

      // 超過 MAX_MISTAKES 次（第 4 次）才強制刷新
      if (state.mistakes > MAX_MISTAKES) {
        stopTimer();
        state.gameOver = true;
        setTimeout(function() { showLoseOverlay(); }, 700);
      }
    }
  }

  // =============================================
  //  刪除輸入
  // =============================================
  function onDelete() {
    if (state.gameOver) return;
    if (!state.selected) return;
    var r = state.selected.row;
    var c = state.selected.col;
    if (state.given[r][c]) return;
    if (state.board[r][c] !== 0) return; // 已確認正確的不能刪

    state.notes[r][c].clear();
    updateCell(r, c);
    highlightSelection(r, c);
  }

  // =============================================
  //  提示功能
  // =============================================
  function onHint() {
    if (state.gameOver) return;
    if (state.hintsLeft <= 0) return;

    // 找出所有空格
    var empties = [];
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (!state.given[r][c] && state.board[r][c] === 0) {
          empties.push([r, c]);
        }
      }
    }
    if (empties.length === 0) return;

    // 優先提示選取格，否則隨機
    var target;
    if (state.selected &&
        !state.given[state.selected.row][state.selected.col] &&
        state.board[state.selected.row][state.selected.col] === 0) {
      target = [state.selected.row, state.selected.col];
    } else {
      target = empties[Math.floor(Math.random() * empties.length)];
    }

    var tr = target[0], tc = target[1];
    state.board[tr][tc] = state.solution[tr][tc];
    state.notes[tr][tc].clear();
    state.hintsLeft--;
    renderHintBtn();
    updateCell(tr, tc);

    // 標記提示格樣式
    var container = document.getElementById('sudoku-board');
    if (container) {
      var cell = container.children[tr * 9 + tc];
      if (cell) {
        cell.classList.add('hint-cell');
        setTimeout(function(){ cell.classList.remove('hint-cell'); }, 1500);
      }
    }

    state.selected = { row: tr, col: tc };
    highlightSelection(tr, tc);

    if (checkWin()) {
      stopTimer();
      state.gameOver = true;
      setTimeout(function() { showWinOverlay(); }, 500);
    }
  }

  // =============================================
  //  勝利 / 失敗判定
  // =============================================
  function checkWin() {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (state.board[r][c] !== state.solution[r][c]) return false;
      }
    }
    return true;
  }

  // =============================================
  //  顯示 Overlay
  // =============================================
  function showOverlay(emoji, title, msg, extraHtml) {
    var old = document.getElementById('sudoku-overlay');
    if (old) old.parentNode.removeChild(old);

    var overlay = document.createElement('div');
    overlay.className = 'sudoku-overlay';
    overlay.id = 'sudoku-overlay';
    overlay.innerHTML =
      '<div class="sudoku-overlay-card">' +
        '<span class="overlay-emoji">' + emoji + '</span>' +
        '<div class="overlay-title">' + title + '</div>' +
        '<div class="overlay-msg">' + msg + '</div>' +
        (extraHtml || '') +
        '<button id="sudoku-overlay-btn" class="btn-paw" style="width:100%;margin-top:8px;">再來一局</button>' +
      '</div>';

    document.body.appendChild(overlay);
    document.getElementById('sudoku-overlay-btn').addEventListener('click', function() {
      overlay.parentNode.removeChild(overlay);
      newGame();
    });
  }

  function showWinOverlay() {
    var timeStr = formatTime(state.timerSec);
    showOverlay(
      '🎉',
      '恭喜完成！',
      '你成功解出了這道數獨！',
      '<div class="overlay-time">⏱ 用時 ' + timeStr + '</div>'
    );
  }

  function showLoseOverlay() {
    showOverlay(
      '💔',
      '挑戰失敗',
      '錯誤次數達到 ' + MAX_MISTAKES + ' 次，\n即將重新產生新題目⋯'
    );
    // 2 秒後自動刷新
    setTimeout(function() {
      var overlay = document.getElementById('sudoku-overlay');
      if (overlay) overlay.parentNode.removeChild(overlay);
      newGame();
    }, 2000);
  }

  // =============================================
  //  渲染錯誤次數
  // =============================================
  function renderMistakes() {
    var el = document.getElementById('sudoku-hearts');
    if (!el) return;
    var html = '';
    for (var i = 0; i < MAX_MISTAKES; i++) {
      html += '<span class="heart-icon' + (i < state.mistakes ? ' lost' : '') + '">❤️</span>';
    }
    el.innerHTML = html;
  }

  function renderHintBtn() {
    var btn = document.getElementById('sudoku-hint-btn');
    if (!btn) return;
    var span = btn.querySelector('.hint-count');
    if (span) span.textContent = state.hintsLeft;
    btn.disabled = (state.hintsLeft <= 0);
    btn.style.opacity = state.hintsLeft <= 0 ? '0.4' : '1';
  }

  // =============================================
  //  鍵盤支援
  // =============================================
  document.addEventListener('keydown', function(e) {
    if (!document.getElementById('page-sudoku').classList.contains('active')) return;
    if (state.gameOver) return;

    var key = e.key;
    if (key >= '1' && key <= '9') {
      onNumInput(parseInt(key));
    } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
      onDelete();
    } else if (key === 'ArrowUp' && state.selected) {
      e.preventDefault();
      state.selected.row = Math.max(0, state.selected.row - 1);
      highlightSelection(state.selected.row, state.selected.col);
    } else if (key === 'ArrowDown' && state.selected) {
      e.preventDefault();
      state.selected.row = Math.min(8, state.selected.row + 1);
      highlightSelection(state.selected.row, state.selected.col);
    } else if (key === 'ArrowLeft' && state.selected) {
      e.preventDefault();
      state.selected.col = Math.max(0, state.selected.col - 1);
      highlightSelection(state.selected.row, state.selected.col);
    } else if (key === 'ArrowRight' && state.selected) {
      e.preventDefault();
      state.selected.col = Math.min(8, state.selected.col + 1);
      highlightSelection(state.selected.row, state.selected.col);
    }
  });

  // =============================================
  //  DOM 初始化（等 jQuery ready）
  // =============================================
  $(function () {

    // 數字鍵盤按鈕
    var numpad = document.getElementById('sudoku-numpad');
    if (numpad) {
      for (var n = 1; n <= 9; n++) {
        (function(num){
          var btn = document.createElement('button');
          btn.className = 'numpad-btn';
          btn.textContent = num;
          btn.addEventListener('click', function(){ onNumInput(num); });
          numpad.appendChild(btn);
        })(n);
      }
    }

    // 刪除按鈕
    document.getElementById('sudoku-delete-btn') &&
      document.getElementById('sudoku-delete-btn').addEventListener('click', onDelete);

    // 筆記模式按鈕
    var notesBtn = document.getElementById('sudoku-notes-btn');
    if (notesBtn) {
      notesBtn.addEventListener('click', function() {
        state.notesMode = !state.notesMode;
        notesBtn.classList.toggle('active-mode', state.notesMode);
        var span = notesBtn.querySelector('span');
        if (span) span.textContent = state.notesMode ? '筆記 ON' : '筆記';
      });
    }

    // 提示按鈕
    document.getElementById('sudoku-hint-btn') &&
      document.getElementById('sudoku-hint-btn').addEventListener('click', onHint);

    // 新遊戲按鈕
    document.getElementById('sudoku-new-btn') &&
      document.getElementById('sudoku-new-btn').addEventListener('click', newGame);

    // 僅綁定事件，不立即開始遊戲
    // 等使用者切換到數獨頁（sudokuInit）再產生題目
  });

  // 暴露給外部（app.js 切換頁面時呼叫）
  window.sudokuInit = function() {
    // 已產生過題目（計時器在跑 或 遊戲結束中 overlay 存在）則不重置
    if (state.timerHandle) return;
    if (document.getElementById('sudoku-overlay')) return;
    newGame();
  };

})();
