/* 通用交互组件：toast / 弹层 / 抽屉 / 路由辅助 */
(function (global) {
  'use strict';
  var overlay = function () { return document.getElementById('overlay'); };
  var sheet = function () { return document.getElementById('sheet'); };
  var modal = function () { return document.getElementById('modal'); };

  function toast(msg, type) {
    var wrap = document.getElementById('toastWrap');
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    var icon = type === 'ok' ? '✅' : type === 'warn' ? '⚠️' : '📡';
    el.innerHTML = '<span>' + icon + '</span><span>' + msg + '</span>';
    wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 2800);
  }

  function openSheet(html) {
    document.getElementById('sheetBody').innerHTML = html;
    overlay().classList.add('show');
    sheet().classList.add('show');
  }
  function openModal(html) {
    document.getElementById('modalBody').innerHTML = html;
    overlay().classList.add('show');
    modal().classList.add('show');
  }
  function closeLayers() {
    overlay().classList.remove('show');
    sheet().classList.remove('show');
    modal().classList.remove('show');
  }

  // 按钮：点击后 loading -> sent，用于「已发送指令」统一反馈
  function sendCommand(btn, msg, type, after) {
    if (!btn) { toast(msg, type || 'ok'); if (after) after(); return; }
    var orig = btn.innerHTML;
    btn.classList.add('loading');
    btn.innerHTML = '发送中…';
    setTimeout(function () {
      btn.classList.remove('loading');
      btn.classList.add('sent');
      btn.innerHTML = '✓ 已发送';
      toast(msg, type || 'ok');
      if (after) after();
      setTimeout(function () { btn.classList.remove('sent'); btn.innerHTML = orig; }, 1800);
    }, 700);
  }

  global.UI = {
    toast: toast, openSheet: openSheet, openModal: openModal,
    closeLayers: closeLayers, sendCommand: sendCommand
  };

  document.addEventListener('DOMContentLoaded', function () {
    overlay().addEventListener('click', closeLayers);
  });
})(window);
