/* 地图页：平面图渲染、Avatar 移动、行为切换、点击交互、踪迹抽屉 */
(function (global) {
  'use strict';
  var S = global.PetState, UI = global.UI;

  function renderMapScreen() {
    var el = document.getElementById('screen-map');
    el.innerHTML =
      '<div class="page-head">' +
        '<div><div class="page-title">家庭地图</div><div class="page-sub">温馨小窝 · ' + S.pet.name + '</div></div>' +
        '<div class="row">' +
          '<button class="icon-btn" onclick="PetApp.go(\'devices\')">📟</button>' +
          '<button class="icon-btn" onclick="PetMap.editMode()">✏️</button>' +
        '</div>' +
      '</div>' +
      '<div class="map-wrap" id="mapWrap">' +
        '<div class="floorplan" id="floorplan"></div>' +
        '<div class="track-handle" id="trackHandle">📍 宠物踪迹 <span>▲</span></div>' +
      '</div>' +
      '<div style="margin-top:14px" class="card">' +
        '<div class="card-title">🐾 实时追踪</div>' +
        '<div id="trackSummary"></div>' +
      '</div>';
    renderFloor();
    renderTrackSummary();
    document.getElementById('trackHandle').addEventListener('click', openTrackDrawer);
  }

  function renderFloor() {
    var fp = document.getElementById('floorplan');
    if (!fp) return;
    var html = '';
    Object.keys(S.ROOMS).forEach(function (id) {
      var r = S.ROOMS[id];
      var hot = r.temp >= 29 ? ' hot' : '';
      html += '<div class="room' + hot + '" style="left:' + r.x + '%;top:' + r.y + '%;width:' + r.w + '%;height:' + r.h + '%" onclick="PetMap.openRoom(\'' + id + '\')">' +
              '<span class="rname">' + r.name + '</span>' +
              '<span class="renv">' + r.temp + '℃</span></div>';
    });
    // 设备点位
    S.DEVICES.forEach(function (d) {
      if (!d.bound) return;
      var r = S.ROOMS[d.room];
      var cx = r.x + r.w * 0.72, cy = r.y + r.h * 0.72;
      var ico = deviceIcon(d.type);
      html += '<div class="dev-pin' + (d.online ? '' : ' off') + '" style="left:' + cx + '%;top:' + cy + '%" title="' + d.name + '">' + ico + '</div>';
    });
    // Avatar
    var pr = S.ROOMS[S.pet.room];
    var b = S.BEHAVIORS[S.pet.behavior];
    var ax = pr.x + pr.w / 2, ay = pr.y + pr.h / 2;
    html += '<div class="avatar anim-' + b.anim + '" id="avatar" style="left:' + ax + '%;top:' + ay + '%" onclick="PetMap.openPet()">' +
              '<div class="pulse"></div>' +
              '<div class="bubble">' + petEmoji(b) + '</div>' +
              '<div class="tag">' + b.label + '</div>' +
            '</div>';
    fp.innerHTML = html;
  }

  function petEmoji(b) {
    if (S.pet.behavior === 'sleep') return '😴';
    if (S.pet.behavior === 'eat') return '🍖';
    if (S.pet.behavior === 'drink') return '💧';
    if (S.pet.behavior === 'play') return '🐕';
    return '🐕';
  }
  function deviceIcon(t) {
    return { camera: '📷', speaker: '🔊', screen: '📺', feeder: '🍚', water: '🚰', ac: '❄️', toy: '🎾' }[t] || '📟';
  }

  function renderTrackSummary() {
    var el = document.getElementById('trackSummary');
    if (!el) return;
    var r = S.ROOMS[S.pet.room], b = S.BEHAVIORS[S.pet.behavior];
    el.innerHTML =
      '<div class="row between"><span class="muted">当前位置</span><b>' + r.name + '</b></div>' +
      '<div class="row between" style="margin-top:8px"><span class="muted">当前行为</span><b>' + b.label + '</b></div>' +
      '<div class="row between" style="margin-top:8px"><span class="muted">更新时间</span><span>' + S.pet.updatedAt + '</span></div>' +
      '<div class="row between" style="margin-top:8px"><span class="muted">项圈电量</span><span>' + S.pet.battery + '%</span></div>';
  }

  // 点击 Avatar -> 详情卡
  function openPet() {
    var r = S.ROOMS[S.pet.room], b = S.BEHAVIORS[S.pet.behavior];
    var cam = S.cameraInRoom(S.pet.room);
    var devs = S.devicesInRoom(S.pet.room).filter(function (d) { return d.bound; })
      .map(function (d) { return d.name; }).join(' · ') || '无';
    UI.openSheet(
      '<div class="row" style="gap:14px;margin-bottom:6px">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:var(--teal-soft);display:flex;align-items:center;justify-content:center;font-size:34px">' + petEmoji(b) + '</div>' +
        '<div><div style="font-size:19px;font-weight:700">' + S.pet.name + '</div>' +
        '<div class="muted">' + S.pet.breed + '</div></div>' +
        '<span class="badge online" style="margin-left:auto">在线</span>' +
      '</div>' +
      '<div class="card" style="box-shadow:none;background:var(--bg);margin-top:10px">' +
        '<div class="row between"><span class="muted">所在房间</span><b>' + r.name + '</b></div>' +
        '<div class="row between" style="margin-top:7px"><span class="muted">当前状态</span><b>' + b.label + '中</b></div>' +
        '<div class="row between" style="margin-top:7px"><span class="muted">最近更新</span><span>' + S.pet.updatedAt + '</span></div>' +
        '<div class="row between" style="margin-top:7px"><span class="muted">相关设备</span><span style="text-align:right;max-width:60%;font-size:12px">' + devs + '</span></div>' +
      '</div>' +
      '<div class="act-grid">' +
        '<button class="act" onclick="PetMap.watch()"><span class="ai">👁️</span>看看它</button>' +
        '<button class="act" id="actCall"><span class="ai">📣</span>叫它</button>' +
        '<button class="act" id="actVoice"><span class="ai">🎙️</span>主人声音</button>' +
        '<button class="act" onclick="PetApp.go(\'video\')"><span class="ai">📹</span>视频互动</button>' +
        '<button class="act" id="actFeed"><span class="ai">🍚</span>投喂</button>' +
        '<button class="act" id="actToy"><span class="ai">🎾</span>奖励逗玩</button>' +
      '</div>'
    );
    document.getElementById('actCall').onclick = function () {
      var spk = S.devicesInRoom(S.pet.room).find(function (d) { return d.type === 'speaker' || d.type === 'screen'; });
      UI.sendCommand(this, '已向' + (spk ? spk.name : S.ROOMS[S.pet.room].name + '设备') + '发送呼叫指令', 'ok');
    };
    document.getElementById('actVoice').onclick = function () { UI.closeLayers(); PetApp.go('voice'); };
    document.getElementById('actFeed').onclick = function () { UI.closeLayers(); PetApp.go('feed'); };
    document.getElementById('actToy').onclick = function () {
      UI.sendCommand(this, '已向逗宠器发送逗玩指令', 'ok');
    };
  }

  function watch() {
    UI.closeLayers();
    PetApp.go('camera');
  }

  // 点击房间
  function openRoom(id) {
    var r = S.ROOMS[id];
    var devs = S.devicesInRoom(id);
    var hasPet = S.pet.room === id;
    var ac = devs.find(function (d) { return d.type === 'ac'; });
    var devHtml = devs.map(function (d) {
      return '<div class="list-item"><div class="li-ico">' + deviceIcon(d.type) + '</div>' +
        '<div class="li-body"><div class="li-title">' + d.name + '</div>' +
        '<div class="li-sub">' + (d.bound ? (d.online ? '在线' : '离线') : '未绑定') + '</div></div>' +
        '<span class="dot ' + (d.online ? 'ok' : 'off') + '"></span></div>';
    }).join('');
    UI.openSheet(
      '<div style="font-size:19px;font-weight:700;margin-bottom:4px">' + r.name + '</div>' +
      '<div class="muted" style="margin-bottom:12px">' + (hasPet ? '🐾 ' + S.pet.name + '正在这里' : '暂无宠物') + '</div>' +
      '<div class="grid2">' +
        '<div class="card" style="box-shadow:none;background:var(--bg);text-align:center;margin:0"><div style="font-size:22px;font-weight:700">' + r.temp + '℃</div><div class="muted">温度</div></div>' +
        '<div class="card" style="box-shadow:none;background:var(--bg);text-align:center;margin:0"><div style="font-size:22px;font-weight:700">' + r.humidity + '%</div><div class="muted">湿度</div></div>' +
      '</div>' +
      '<div class="seg-title">房间设备</div>' + devHtml +
      (ac && r.temp >= 29 ? '<button class="btn primary" style="margin-top:14px" id="acBtn">🌬️ 一键开启' + ac.name + '至 26℃</button>' : '')
    );
    if (ac && r.temp >= 29) {
      document.getElementById('acBtn').onclick = function () {
        UI.sendCommand(this, '已向' + ac.name + '发送开启指令 · 26℃', 'ok', function () {
          ac.on = true; r.temp = 26; renderFloor();
        });
      };
    }
  }

  // 环境联动建议（由控制台高温事件触发）
  function suggestAC(roomId) {
    var r = S.ROOMS[roomId];
    var ac = S.devicesInRoom(roomId).find(function (d) { return d.type === 'ac'; });
    if (!ac) return;
    UI.openModal(
      '<div style="font-size:17px;font-weight:700;margin-bottom:8px">🌡️ 环境提醒</div>' +
      '<div style="font-size:14px;color:var(--ink-2);line-height:1.6">' + S.pet.name + '已在' + r.name + '停留 12 分钟，当前温度偏高 <b>' + r.temp + '℃</b>，是否开启空调至 26℃？</div>' +
      '<div class="row" style="gap:10px;margin-top:18px">' +
        '<button class="btn ghost" onclick="UI.closeLayers()">暂不</button>' +
        '<button class="btn primary" id="sugAc">开启空调</button>' +
      '</div>'
    );
    document.getElementById('sugAc').onclick = function () {
      var btn = this;
      UI.sendCommand(btn, '已向' + ac.name + '发送开启指令 · 26℃', 'ok', function () {
        ac.on = true; r.temp = 26; renderFloor();
        setTimeout(UI.closeLayers, 600);
      });
    };
  }

  // 摄像头接力：宠物进入新房间提示切换
  function relayPrompt(roomId) {
    var r = S.ROOMS[roomId];
    var cam = S.cameraInRoom(roomId);
    UI.openModal(
      '<div style="font-size:17px;font-weight:700;margin-bottom:8px">📷 检测到移动</div>' +
      '<div style="font-size:14px;color:var(--ink-2);line-height:1.6">已检测到' + S.pet.name + '进入<b>' + r.name + '</b>，是否切换到' + (cam ? cam.name : '该房间摄像头') + '继续追踪？</div>' +
      '<div class="row" style="gap:10px;margin-top:18px">' +
        '<button class="btn ghost" onclick="UI.closeLayers()">保持当前</button>' +
        '<button class="btn primary" id="relayBtn">切换摄像头</button>' +
      '</div>'
    );
    document.getElementById('relayBtn').onclick = function () {
      UI.closeLayers();
      UI.toast('已切换至' + (cam ? cam.name : r.name + '摄像头'), 'ok');
      PetApp.go('camera');
    };
  }

  function editMode() {
    UI.toast('进入地图编辑态：可调整房间名称、边界与设备归属', 'ok');
  }

  // 踪迹抽屉
  function openTrackDrawer() {
    var items = S.timeline.slice().reverse().map(function (t, i) {
      return '<div class="tl-item" onclick="PetMap.trackDetail(' + (S.timeline.length - 1 - i) + ')">' +
        '<div class="tl-dot"><span class="c"></span>' + (i < S.timeline.length - 1 ? '<span class="l"></span>' : '') + '</div>' +
        '<div class="tl-body"><div class="tl-time">' + t.time + ' · ' + S.ROOMS[t.room].name + '</div>' +
        '<div class="tl-text">' + t.text + '</div></div></div>';
    }).join('');
    UI.openSheet(
      '<div style="font-size:19px;font-weight:700;margin-bottom:4px">🐾 宠物踪迹</div>' +
      '<div class="muted" style="margin-bottom:14px">今日活动时间线</div>' +
      '<div class="timeline">' + items + '</div>' +
      '<button class="btn ghost" style="margin-top:12px" onclick="UI.closeLayers();PetApp.go(\'track\')">查看完整历史行踪</button>'
    );
  }

  function trackDetail(idx) {
    var t = S.timeline[idx];
    UI.openModal(
      '<div style="font-size:17px;font-weight:700;margin-bottom:10px">' + t.time + ' · ' + t.text + '</div>' +
      '<div class="cam-view" style="height:150px"><span style="font-size:40px">📸</span></div>' +
      '<div class="card" style="box-shadow:none;background:var(--bg);margin-top:12px">' +
        '<div class="row between"><span class="muted">发生房间</span><b>' + S.ROOMS[t.room].name + '</b></div>' +
        '<div class="row between" style="margin-top:7px"><span class="muted">行为标签</span><span>' + t.text + '</span></div>' +
        '<div class="row between" style="margin-top:7px"><span class="muted">相关设备</span><span>' + (S.cameraInRoom(t.room) ? S.cameraInRoom(t.room).name : '—') + '</span></div>' +
      '</div>' +
      '<button class="btn primary" style="margin-top:14px" onclick="UI.toast(\'正在加载回放片段…\')">▶️ 查看视频片段</button>'
    );
  }

  global.PetMap = {
    render: renderMapScreen, renderFloor: renderFloor, renderTrackSummary: renderTrackSummary,
    openPet: openPet, watch: watch, openRoom: openRoom,
    suggestAC: suggestAC, relayPrompt: relayPrompt, editMode: editMode,
    openTrackDrawer: openTrackDrawer, trackDetail: trackDetail
  };
})(window);
