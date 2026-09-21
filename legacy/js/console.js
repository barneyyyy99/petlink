/* 模拟数据控制台：演示时可控切换宠物位置/行为、房间环境、触发事件与联动 */
(function (global) {
  'use strict';
  var S = global.PetState, UI = global.UI;

  function open() {
    var roomChips = Object.keys(S.ROOMS).map(function (id) {
      return '<div class="chip ' + (S.pet.room === id ? 'on' : '') + '" data-room="' + id + '">' + S.ROOMS[id].name + '</div>';
    }).join('');
    var behChips = Object.keys(S.BEHAVIORS).map(function (k) {
      return '<div class="chip ' + (S.pet.behavior === k ? 'on' : '') + '" data-beh="' + k + '">' + S.BEHAVIORS[k].label + '</div>';
    }).join('');
    UI.openSheet(
      '<div style="font-size:19px;font-weight:700;margin-bottom:2px">🎛️ 模拟控制台</div>' +
      '<div class="muted" style="margin-bottom:12px">演示专用 · 修改后地图与页面实时刷新</div>' +
      '<div class="seg-title">宠物位置</div><div class="chip-row" id="roomChips">' + roomChips + '</div>' +
      '<div class="seg-title">宠物行为</div><div class="chip-row" id="behChips">' + behChips + '</div>' +
      '<div class="seg-title">房间环境（客厅）</div><div class="chip-row">' +
        envChip('正常', 25) + envChip('高温', 31) + envChip('高湿', 25, 78) + envChip('低温', 18) + '</div>' +
      '<div class="seg-title">触发事件</div><div class="chip-row">' +
        '<div class="chip" data-ev="findme">宠物找人</div>' +
        '<div class="chip" data-ev="detect">摄像头识别到</div>' +
        '<div class="chip" data-ev="fed">投喂完成</div>' +
        '<div class="chip" data-ev="drink">饮水记录</div>' +
        '<div class="chip" data-ev="fence">围栏告警</div>' +
      '</div>' +
      '<div class="seg-title">联动事件</div><div class="chip-row">' +
        '<div class="chip" data-ev="ac">建议开空调</div>' +
        '<div class="chip" data-ev="relay">切换摄像头</div>' +
        '<div class="chip" data-ev="voice">音箱播放主人声音</div>' +
      '</div>'
    );
    bindConsole();
  }

  function envChip(label, temp, hum) {
    return '<div class="chip" data-temp="' + temp + '"' + (hum ? ' data-hum="' + hum + '"' : '') + '>' + label + '</div>';
  }

  function bindConsole() {
    var body = document.getElementById('sheetBody');
    body.querySelectorAll('[data-room]').forEach(function (c) {
      c.onclick = function () {
        var prev = S.pet.room;
        S.setPet({ room: c.getAttribute('data-room') });
        S.pushTimeline({ time: '现在', type: 'move', text: S.ROOMS[prev].name + ' → ' + S.ROOMS[S.pet.room].name, room: S.pet.room });
        refreshChips('roomChips', 'data-room', S.pet.room);
        rerender();
        UI.toast('宠物已移动到' + S.ROOMS[S.pet.room].name);
      };
    });
    body.querySelectorAll('[data-beh]').forEach(function (c) {
      c.onclick = function () {
        S.setPet({ behavior: c.getAttribute('data-beh') });
        refreshChips('behChips', 'data-beh', S.pet.behavior);
        rerender();
      };
    });
    body.querySelectorAll('[data-temp]').forEach(function (c) {
      c.onclick = function () {
        S.ROOMS.living.temp = parseInt(c.getAttribute('data-temp'), 10);
        if (c.getAttribute('data-hum')) S.ROOMS.living.humidity = parseInt(c.getAttribute('data-hum'), 10);
        S.notify(); rerender();
        UI.toast('客厅环境已更新：' + S.ROOMS.living.temp + '℃');
      };
    });
    body.querySelectorAll('[data-ev]').forEach(function (c) {
      c.onclick = function () { trigger(c.getAttribute('data-ev')); };
    });
  }

  function refreshChips(wrapId, attr, val) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.querySelectorAll('[' + attr + ']').forEach(function (c) {
      c.classList.toggle('on', c.getAttribute(attr) === val);
    });
  }

  function trigger(ev) {
    switch (ev) {
      case 'findme':
        UI.closeLayers();
        UI.openModal('<div style="font-size:17px;font-weight:700;margin-bottom:8px">🐶 ' + S.pet.name + '在找你</div>' +
          '<div style="font-size:14px;color:var(--ink-2);line-height:1.6">检测到' + S.pet.name + '在' + S.ROOMS[S.pet.room].name + '发出呜咽并四处张望，可能在找主人。</div>' +
          '<div class="row" style="gap:10px;margin-top:18px"><button class="btn ghost" onclick="UI.closeLayers()">稍后</button>' +
          '<button class="btn primary" onclick="UI.closeLayers();UI.toast(\'已向' + S.ROOMS[S.pet.room].name + '音箱播放主人声音\',\'ok\')">回应它</button></div>');
        break;
      case 'detect': UI.toast('摄像头识别到' + S.pet.name + '在' + S.ROOMS[S.pet.room].name, 'ok'); break;
      case 'fed': S.pushTimeline({ time: '现在', type: 'eat', text: '投喂完成', room: S.pet.room }); UI.toast('投喂完成，已记录', 'ok'); break;
      case 'drink': S.pushTimeline({ time: '现在', type: 'drink', text: '饮水记录', room: S.pet.room }); UI.toast('新增饮水记录', 'ok'); break;
      case 'fence': UI.closeLayers(); UI.toast('⚠️ 围栏告警：' + S.pet.name + '进入禁区', 'warn'); break;
      case 'ac': UI.closeLayers(); global.PetMap.suggestAC(S.pet.room); break;
      case 'relay': UI.closeLayers(); global.PetMap.relayPrompt(S.pet.room); break;
      case 'voice': UI.toast('已向' + S.ROOMS[S.pet.room].name + '音箱播放主人声音', 'ok'); break;
    }
  }

  function rerender() {
    global.PetMap.renderFloor();
    global.PetMap.renderTrackSummary();
    if (global.PetApp) global.PetApp.refreshHome();
  }

  global.PetConsole = { open: open };
})(window);
