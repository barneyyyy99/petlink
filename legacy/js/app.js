/* 路由、Tab、首页与我的、初始化装配 */
(function (global) {
  'use strict';
  var S = global.PetState, UI = global.UI;
  var history = ['home'];
  var TAB_SCREENS = ['home', 'map', 'records', 'mine'];

  function go(screen) {
    if (screen !== history[history.length - 1]) history.push(screen);
    show(screen);
  }
  function back() {
    if (history.length > 1) history.pop();
    show(history[history.length - 1]);
  }
  function show(screen) {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.toggle('active', s.getAttribute('data-screen') === screen);
    });
    document.querySelectorAll('.tabbar .tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === screen);
    });
    document.querySelector('.screens').scrollTop = 0;
    var scr = document.getElementById('screen-' + screen);
    if (scr) scr.scrollTop = 0;
    renderScreen(screen);
  }

  function renderScreen(screen) {
    switch (screen) {
      case 'home': renderHome(); break;
      case 'map': global.PetMap.render(); break;
      case 'records': global.PetScreens.renderRecords(); break;
      case 'mine': renderMine(); break;
      case 'build': global.PetBuild.renderEntry(); break;
      case 'devices': global.PetBuild.renderDevices(); break;
      case 'camera': global.PetScreens.renderCamera(); break;
      case 'video': global.PetScreens.renderVideo(); break;
      case 'voice': global.PetScreens.renderVoice(); break;
      case 'feed': global.PetScreens.renderFeed(); break;
      case 'automation': global.PetScreens.renderAutomation(); break;
      case 'track': global.PetScreens.renderTrack(); break;
      case 'behavior': global.PetScreens.renderBehavior(); break;
      case 'sound': global.PetScreens.renderSound(); break;
      case 'diary': global.PetScreens.renderDiary(); break;
      case 'fence': global.PetScreens.renderFence(); break;
      case 'lost': global.PetScreens.renderLost(); break;
      case 'chat': global.PetScreens.renderChat(); break;
      case 'friends': global.PetScreens.renderFriends(); break;
    }
  }

  // ===== Task4 首页 =====
  function renderHome() {
    var r = S.ROOMS[S.pet.room], b = S.BEHAVIORS[S.pet.behavior];
    var alertHtml = S.alerts.map(function (a) {
      return '<div class="card" style="border-left:4px solid var(--warn)"><div class="row"><span style="font-size:20px">⚠️</span>' +
        '<div style="flex:1;margin-left:10px;font-size:13px">' + a.text + '</div>' +
        '<button class="btn sm primary" onclick="PetApp.go(\'map\')">去看看</button></div></div>';
    }).join('');
    document.getElementById('screen-home').innerHTML =
      '<div class="page-head"><div><div class="page-title">早安，主人 👋</div><div class="page-sub">温馨小窝 · 家庭陪伴中</div></div>' +
      '<button class="icon-btn" onclick="PetApp.go(\'mine\')">👤</button></div>' +
      '<div class="hero-pet" onclick="PetApp.go(\'map\')"><div class="big-emoji">🐶</div>' +
        '<h2>' + S.pet.name + '正在' + r.name + '</h2>' +
        '<div class="st">' + b.label + '中 · ' + S.pet.updatedAt + '更新 · 项圈电量 ' + S.pet.battery + '%</div>' +
        '<div style="margin-top:12px"><span class="badge" style="background:rgba(255,255,255,.25);color:#fff">点击进入家庭地图 →</span></div>' +
      '</div>' +
      '<div class="seg-title" style="margin-left:2px">快捷互动</div>' +
      '<div class="quick-tiles" style="margin-bottom:14px">' +
        qt('👁️', '看一眼', 'go', 'camera') + qt('🔍', '寻宠', 'go', 'map') +
        qt('🍚', '投喂', 'go', 'feed') + qt('📣', '叫它', 'call') +
      '</div>' +
      alertHtml +
      '<div class="card"><div class="card-title">📋 今日摘要</div>' +
        '<div class="grid4">' +
          sumCell('4.2h', '睡眠') + sumCell('1.8h', '玩耍') + sumCell('5次', '饮水') + sumCell('3.1km', '活动') +
        '</div></div>' +
      '<div class="card" style="cursor:pointer" onclick="PetApp.go(\'diary\')"><div class="card-title">📔 今日 AI 日记</div>' +
        '<div class="muted" style="line-height:1.7">' + S.diary.text.slice(0, 46) + '… <span style="color:var(--teal)">查看全文</span></div></div>';
    bindHome();
  }
  function qt(ico, label, act, target) {
    return '<button class="q-tile" data-act="' + act + '"' + (target ? ' data-target="' + target + '"' : '') + '><div class="qi">' + ico + '</div><div class="ql">' + label + '</div></button>';
  }
  function sumCell(v, l) { return '<div style="text-align:center"><div style="font-weight:700;font-size:16px">' + v + '</div><div class="muted">' + l + '</div></div>'; }
  function bindHome() {
    document.querySelectorAll('#screen-home [data-act]').forEach(function (b) {
      b.onclick = function () {
        var act = b.getAttribute('data-act');
        if (act === 'go') go(b.getAttribute('data-target'));
        else if (act === 'call') UI.sendCommand(b, '已向' + S.ROOMS[S.pet.room].name + '音箱发送呼叫指令', 'ok');
      };
    });
  }
  function refreshHome() {
    if (document.getElementById('screen-home').classList.contains('active')) renderHome();
  }

  // ===== Task12 我的 / 设置 =====
  function renderMine() {
    document.getElementById('screen-mine').innerHTML =
      '<div class="page-head"><div class="page-title">我的</div></div>' +
      '<div class="card"><div class="row"><div style="width:56px;height:56px;border-radius:50%;background:var(--teal-soft);display:flex;align-items:center;justify-content:center;font-size:30px">🐶</div>' +
        '<div style="flex:1;margin-left:14px"><div style="font-weight:700;font-size:17px">' + S.pet.name + '</div><div class="muted">' + S.pet.breed + '</div></div>' +
        '<button class="btn sm ghost" onclick="UI.toast(\'打开宠物档案\')">档案</button></div></div>' +
      group('家庭与设备', [
        mi('🗺️', '家庭地图管理', 'build'),
        mi('📟', '设备管理', 'devices'),
        mi('🤖', '智能联动设置', 'automation')
      ]) +
      group('安全守护', [
        mi('🚧', '虚拟栅栏', 'fence'),
        mi('🆘', '走失模式', 'lost')
      ]) +
      group('陪伴与社交', [
        mi('💬', '宠物对话框', 'chat'),
        mi('🐕', '毛茸茸好友', 'friends'),
        mi('🎙️', '主人声音管理', 'voice')
      ]) +
      group('通知与权限', [
        miToggle('🔔', '异常推送通知', true),
        miToggle('📍', '位置持续上报', true),
        miToggle('🎥', '摄像头访问权限', true)
      ]);
  }
  function group(title, items) {
    return '<div class="seg-title" style="margin-left:2px">' + title + '</div><div class="card" style="padding:2px 16px">' + items.join('') + '</div>';
  }
  function mi(ico, title, screen) {
    return '<div class="list-item" onclick="PetApp.go(\'' + screen + '\')"><div class="li-ico">' + ico + '</div><div class="li-body"><div class="li-title">' + title + '</div></div><span style="color:var(--ink-3)">›</span></div>';
  }
  function miToggle(ico, title, on) {
    return '<div class="list-item"><div class="li-ico">' + ico + '</div><div class="li-body"><div class="li-title">' + title + '</div></div><div class="switch ' + (on ? 'on' : '') + '" onclick="this.classList.toggle(\'on\')"></div></div>';
  }

  function init() {
    document.querySelectorAll('.tabbar .tab').forEach(function (t) {
      t.onclick = function () { go(t.getAttribute('data-tab')); };
    });
    document.getElementById('consoleFab').onclick = function () { global.PetConsole.open(); };
    renderHome();
  }

  global.PetApp = { go: go, back: back, refreshHome: refreshHome };
  document.addEventListener('DOMContentLoaded', init);
})(window);
