/* 记录、互动、安全、社交等二级页面渲染 */
(function (global) {
  'use strict';
  var S = global.PetState, UI = global.UI;
  var bh = function (t, s) { return global.PetBuild.backHead(t, s); };

  // ===== Task9 互动与联动 =====
  function renderCamera() {
    var cam = S.cameraInRoom(S.pet.room);
    var r = S.ROOMS[S.pet.room];
    document.getElementById('screen-camera').innerHTML =
      bh('实时画面', (cam ? cam.name : r.name)) +
      '<div class="cam-view"><span class="live"><span class="dot"></span>LIVE</span>' +
      '<div style="text-align:center"><div style="font-size:60px">' + petFace() + '</div>' +
      '<div style="font-size:13px;opacity:.8;margin-top:8px">' + S.pet.name + '正在' + r.name + '·' + S.BEHAVIORS[S.pet.behavior].label + '</div></div></div>' +
      '<div class="grid4" style="margin-top:14px">' +
        qa('🔊', '叫它', 'callBtn') + qa('🎙️', '喊话', 'talkBtn') +
        qa('📸', '截图', 'snapBtn') + qa('🔄', '切摄像头', 'switchBtn') +
      '</div>' +
      '<button class="btn primary" style="margin-top:16px" onclick="PetApp.go(\'video\')">📹 发起视频互动</button>';
    bind('callBtn', '已向' + r.name + '设备发送呼叫指令');
    bind('talkBtn', '麦克风已开启，可对' + S.pet.name + '喊话');
    bind('snapBtn', '已抓拍并保存到记录');
    document.getElementById('switchBtn').onclick = function () { showCamSwitch(); };
  }
  function showCamSwitch() {
    var cams = S.DEVICES.filter(function (d) { return d.type === 'camera' && d.bound; });
    UI.openSheet('<div style="font-size:17px;font-weight:700;margin-bottom:12px">切换摄像头</div>' +
      cams.map(function (c) {
        return '<div class="list-item" onclick="UI.closeLayers();UI.toast(\'已切换至' + c.name + '\',\'ok\')"><div class="li-ico">📷</div>' +
          '<div class="li-body"><div class="li-title">' + c.name + '</div><div class="li-sub">' + (c.online ? '在线' : '离线') + '</div></div>›</div>';
      }).join(''));
  }
  function renderVideo() {
    document.getElementById('screen-video').innerHTML =
      bh('视频 / 语音互动', S.pet.name) +
      '<div class="cam-view" style="height:300px"><span class="live"><span class="dot"></span>通话中</span>' +
      '<div style="font-size:70px">' + petFace() + '</div>' +
      '<div style="position:absolute;right:12px;bottom:12px;width:70px;height:96px;background:#26433d;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:30px">🧑</div></div>' +
      '<div class="grid4" style="margin-top:16px">' +
        qa('🎤', '麦克风', 'mic') + qa('🔊', '扬声器', 'spk') + qa('🖥️', '投屏', 'cast') + qa('📞', '挂断', 'hang') +
      '</div>';
    bind('mic', '麦克风已开启'); bind('spk', '扬声器已开启'); bind('cast', '已投屏到小度智能屏');
    document.getElementById('hang').onclick = function () { UI.toast('通话已结束'); PetApp.back(); };
  }
  function renderVoice() {
    document.getElementById('screen-voice').innerHTML =
      bh('主人声音管理', '录制并训练你的专属声线') +
      '<div class="card" style="text-align:center;padding:24px 16px"><div style="font-size:44px">🎙️</div>' +
      '<div style="font-weight:700;margin-top:10px">长按录制主人声音</div>' +
      '<div class="muted" style="margin-top:6px">建议录制 3 段，每段 5 秒以上</div>' +
      '<button class="btn primary" style="margin-top:16px" id="recBtn">● 开始录制</button></div>' +
      '<div class="card"><div class="card-title">已有声线</div>' +
        voiceItem('主人温柔版', '已训练') + voiceItem('主人呼唤版', '已训练') + voiceItem('系统预设 · 亲切女声', '预设') +
      '</div>';
    document.getElementById('recBtn').onclick = function () {
      UI.sendCommand(this, '录制完成，正在训练声线…', 'ok');
    };
  }
  function voiceItem(name, tag) {
    return '<div class="list-item"><div class="li-ico">🔊</div><div class="li-body"><div class="li-title">' + name + '</div><div class="li-sub">' + tag + '</div></div>' +
      '<button class="btn sm" onclick="UI.sendCommand(this,\'已向' + S.ROOMS[S.pet.room].name + '音箱播放：' + name + '\',\'ok\')">播放</button></div>';
  }
  function renderFeed() {
    document.getElementById('screen-feed').innerHTML =
      bh('投喂 · 奖励 · 逗宠', '智能喂食器 · 客厅') +
      '<div class="card" style="text-align:center"><div style="font-size:44px">🍚</div>' +
      '<div style="font-weight:700;margin-top:8px">远程投喂</div>' +
      '<div class="row" style="justify-content:center;gap:10px;margin-top:14px">' +
        '<button class="btn sm ghost" onclick="PetScreens.feedStep(-5)">−</button>' +
        '<span id="feedAmt" style="font-weight:700;font-size:18px">15g</span>' +
        '<button class="btn sm ghost" onclick="PetScreens.feedStep(5)">+</button></div>' +
      '<button class="btn primary" style="margin-top:16px" id="feedBtn">🍚 立即投喂</button></div>' +
      '<div class="grid2">' +
        '<div class="card" style="text-align:center;margin:0"><div style="font-size:34px">🦴</div><div style="font-weight:600;margin:8px 0 10px">发放奖励</div><button class="btn sm primary" id="rewardBtn">奖励零食</button></div>' +
        '<div class="card" style="text-align:center;margin:0"><div style="font-size:34px">🎾</div><div style="font-weight:600;margin:8px 0 10px">逗宠互动</div><button class="btn sm primary" id="toyBtn2">开始逗玩</button></div>' +
      '</div>';
    document.getElementById('feedBtn').onclick = function () { UI.sendCommand(this, '已向喂食器发送投喂指令 · 15g', 'ok', function () { S.pushTimeline({ time: '现在', type: 'eat', text: '主人远程投喂', room: 'living' }); }); };
    bind('rewardBtn', '已发放零食奖励'); bind('toyBtn2', '逗宠器已启动');
  }
  function renderAutomation() {
    document.getElementById('screen-automation').innerHTML =
      bh('智能联动 · 自动化规则', '默认关闭，开启后系统将主动建议') +
      '<div class="card"><div class="muted" style="margin-bottom:6px">💡 联动以「建议 + 确认」为主，不会擅自控制家电</div></div>' +
      ruleItem('宠物进入房间且温度>29℃ → 建议开空调', true) +
      ruleItem('宠物在某房间停留>10min → 自动切换该房间摄像头', true) +
      ruleItem('宠物到喂食区 → 弹出「是否投喂」', false) +
      ruleItem('宠物触发「找主人」→ 音箱播放主人声音', true);
  }
  function ruleItem(text, on) {
    return '<div class="card"><div class="row between"><div style="flex:1;font-size:14px;padding-right:12px">' + text + '</div>' +
      '<div class="switch ' + (on ? 'on' : '') + '" onclick="this.classList.toggle(\'on\');UI.toast(this.classList.contains(\'on\')?\'规则已开启\':\'规则已关闭\')"></div></div></div>';
  }

  function petFace() { return S.pet.behavior === 'sleep' ? '😴' : '🐕'; }
  function qa(ico, label, id) { return '<button class="q-tile" id="' + id + '"><div class="qi">' + ico + '</div><div class="ql">' + label + '</div></button>'; }
  function bind(id, msg) { var b = document.getElementById(id); if (b) b.onclick = function () { UI.sendCommand(this, msg, 'ok'); }; }

  // ===== Task10 记录与洞察 =====
  function renderRecords() {
    document.getElementById('screen-records').innerHTML =
      '<div class="page-head"><div><div class="page-title">记录</div><div class="page-sub">行为 · 轨迹 · 日记沉淀</div></div></div>' +
      '<div class="grid2">' +
        entry('🗺️', '历史行踪', 'track') + entry('🏃', '行为识别', 'behavior') +
        entry('👂', '声音识别', 'sound') + entry('📔', 'AI 宠物日记', 'diary') +
      '</div>' +
      '<div class="card"><div class="card-title">📊 今日行为统计</div>' +
        S.behaviorStats.map(function (s) {
          return '<div class="row between" style="padding:6px 0"><span>' + s.label + '</span><b>' + s.value + '</b></div>';
        }).join('') + '</div>' +
      '<div class="card"><div class="card-title">🐾 今日轨迹</div>' + miniTimeline() + '</div>';
  }
  function entry(ico, title, screen) {
    return '<div class="card" style="text-align:center;cursor:pointer;margin:0" onclick="PetApp.go(\'' + screen + '\')"><div style="font-size:30px">' + ico + '</div><div style="font-weight:600;margin-top:8px;font-size:14px">' + title + '</div></div>';
  }
  function miniTimeline() {
    return '<div class="timeline">' + S.timeline.map(function (t, i) {
      return '<div class="tl-item"><div class="tl-dot"><span class="c"></span>' + (i < S.timeline.length - 1 ? '<span class="l"></span>' : '') + '</div>' +
        '<div class="tl-body"><div class="tl-time">' + t.time + ' · ' + S.ROOMS[t.room].name + '</div><div class="tl-text">' + t.text + '</div></div></div>';
    }).join('') + '</div>';
  }
  function renderTrack() {
    var rooms = '';
    Object.keys(S.ROOMS).forEach(function (id) {
      var r = S.ROOMS[id];
      rooms += '<div class="room" style="left:' + r.x + '%;top:' + r.y + '%;width:' + r.w + '%;height:' + r.h + '%"><span class="rname">' + r.name + '</span></div>';
    });
    document.getElementById('screen-track').innerHTML =
      bh('历史行踪', '今日 · ' + S.timeline.length + ' 条移动记录') +
      '<div class="map-wrap" style="height:260px"><div class="floorplan">' + rooms +
      '<svg class="trace-line" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="30,55 30,20 74,25 74,60 30,60 30,55" fill="none" stroke="#2FB7A8" stroke-width="1.2" stroke-dasharray="3 2"/></svg></div></div>' +
      '<div class="card" style="margin-top:14px"><div class="card-title">移动时间线</div>' + miniTimeline() + '</div>';
  }
  function renderBehavior() {
    document.getElementById('screen-behavior').innerHTML =
      bh('行为识别', 'AI 视觉 + 项圈 IMU 融合识别') +
      '<div class="grid2">' + S.behaviorStats.map(function (s) {
        return '<div class="card" style="text-align:center;margin:0"><div style="font-size:28px">' + (S.BEHAVIORS[s.key] ? S.BEHAVIORS[s.key].emoji : '🐾') + '</div><div style="font-weight:700;font-size:18px;margin-top:6px">' + s.value + '</div><div class="muted">' + s.label + '</div></div>';
      }).join('') + '</div>' +
      '<div class="card"><div class="card-title">🏷️ 行为事件卡</div>' +
        behaviorCard('12:18', '进食', '在客厅喂食器进食约 3 分钟') +
        behaviorCard('13:40', '睡觉', '在主卧休息约 1.2 小时') +
        behaviorCard('15:26', '玩耍', '在客厅追逐玩具活跃度高') + '</div>';
  }
  function behaviorCard(time, tag, desc) {
    return '<div class="list-item"><div class="li-ico">🐾</div><div class="li-body"><div class="li-title">' + time + ' · ' + tag + '</div><div class="li-sub">' + desc + '</div></div></div>';
  }
  function renderSound() {
    document.getElementById('screen-sound').innerHTML =
      bh('声音识别', '识别叫声 / 呼噜 / 异常声响') +
      '<div class="card"><div class="card-title">🔊 今日声音事件</div>' +
        soundItem('09:12', '吠叫', '门铃响起时短促吠叫 3 声') +
        soundItem('13:45', '呼噜', '睡眠中检测到平稳呼噜声') +
        soundItem('16:02', '呜咽', '疑似寻找主人，已触发提醒') + '</div>';
  }
  function soundItem(time, tag, desc) {
    return '<div class="list-item"><div class="li-ico">👂</div><div class="li-body"><div class="li-title">' + time + ' · ' + tag + '</div><div class="li-sub">' + desc + '</div></div><button class="btn sm ghost" onclick="UI.toast(\'播放声音片段…\')">▶</button></div>';
  }
  function renderDiary() {
    document.getElementById('screen-diary').innerHTML =
      bh('AI 宠物日记', S.diary.date) +
      '<div class="hero-pet"><div class="big-emoji">🐶</div><h2>' + S.pet.name + '的日记</h2><div class="st">心情：' + S.diary.mood + ' 😊</div></div>' +
      '<div class="card"><div style="font-size:15px;line-height:1.9;color:var(--ink-2)">' + S.diary.text + '</div></div>' +
      '<div class="card"><div class="card-title">😺 情绪日报</div><div class="muted" style="line-height:1.7">今日整体情绪积极，活跃度中等。傍晚出现轻微分离焦虑，建议下班后多陪伴、增加互动时间。</div>' +
      '<button class="btn primary" style="margin-top:12px" onclick="UI.toast(\'已生成分享卡片\')">生成分享卡片</button></div>';
  }

  // ===== Task11 安全与社交 =====
  function renderFence() {
    document.getElementById('screen-fence').innerHTML =
      bh('虚拟栅栏', '设置安全区域，越界自动告警') +
      '<div class="card"><div class="row between"><div><div style="font-weight:700">安全区域告警</div><div class="muted">离开家或进入禁区时提醒</div></div>' +
      '<div class="switch on" onclick="this.classList.toggle(\'on\')"></div></div></div>' +
      '<div class="card"><div class="card-title">禁区设置</div>' +
        fenceRow('厨房', '禁止进入', true) + fenceRow('阳台', '仅白天允许', true) + fenceRow('书房', '允许', false) + '</div>' +
      '<div class="card"><div class="card-title">🚨 最近告警</div>' +
        '<div class="list-item"><div class="li-ico">⚠️</div><div class="li-body"><div class="li-title">14:20 进入禁区</div><div class="li-sub">检测到毛球进入厨房，已提醒</div></div></div></div>';
  }
  function fenceRow(room, status, on) {
    return '<div class="list-item"><div class="li-ico">🚧</div><div class="li-body"><div class="li-title">' + room + '</div><div class="li-sub">' + status + '</div></div><div class="switch ' + (on ? 'on' : '') + '" onclick="this.classList.toggle(\'on\')"></div></div>';
  }
  function renderLost() {
    document.getElementById('screen-lost').innerHTML =
      bh('走失模式', '一键发起寻宠') +
      '<div class="card" style="text-align:center;padding:24px 16px"><div style="font-size:44px">🆘</div>' +
      '<div style="font-weight:700;margin-top:10px">开启走失模式</div>' +
      '<div class="muted" style="margin-top:6px">将持续上报位置、发布寻宠动态并通知附近用户</div>' +
      '<button class="btn primary" style="margin-top:16px;background:var(--danger)" id="lostBtn">开启走失模式</button></div>' +
      '<div class="card"><div class="card-title">功能说明</div>' +
        lostRow('📍', '实时位置共享', '持续上报项圈 GPS/BLE 位置') +
        lostRow('📢', '发布寻宠动态', '一键生成寻宠启事分享') +
        lostRow('👥', '附近用户协助', '通知附近宠友帮忙留意') + '</div>';
    document.getElementById('lostBtn').onclick = function () {
      var on = this.classList.toggle('sent');
      this.innerHTML = on ? '✓ 走失模式已开启（点击关闭）' : '开启走失模式';
      UI.toast(on ? '走失模式已开启，正在共享位置' : '走失模式已关闭', on ? 'warn' : 'ok');
    };
  }
  function lostRow(ico, title, desc) {
    return '<div class="list-item"><div class="li-ico">' + ico + '</div><div class="li-body"><div class="li-title">' + title + '</div><div class="li-sub">' + desc + '</div></div></div>';
  }
  function renderChat() {
    document.getElementById('screen-chat').innerHTML =
      bh('宠物对话框', S.pet.name + ' · 在线') +
      '<div style="padding:8px 0 80px">' +
        '<div class="im-msg pet">汪！主人你回来啦～ 🐾</div>' +
        '<div class="im-msg pet">我今天在客厅玩了好久的球</div>' +
        '<div class="im-msg me">乖，有没有好好喝水呀</div>' +
        '<div class="im-msg pet">喝啦！喝了 5 次水，你远程帮我开空调好凉快 ❄️</div>' +
        '<div class="im-msg me">晚上就回家陪你</div>' +
      '</div>' +
      '<div class="card" style="position:absolute;left:16px;right:16px;bottom:88px;margin:0;padding:8px"><div class="row" style="gap:8px">' +
        '<button class="btn sm ghost" onclick="PetApp.go(\'feed\')">🍚</button>' +
        '<input placeholder="陪它说说话…" style="flex:1;border:none;background:var(--bg);border-radius:10px;padding:10px 12px"/>' +
        '<button class="btn sm primary" onclick="UI.toast(\'消息已发送\')">发送</button></div></div>';
  }
  function renderFriends() {
    document.getElementById('screen-friends').innerHTML =
      bh('毛茸茸好友', '发现附近的宠友') +
      ['豆豆 · 200m', '奶糖 · 350m', '可乐 · 500m', '布丁 · 800m'].map(function (n) {
        var parts = n.split(' · ');
        return '<div class="card"><div class="row"><div style="width:48px;height:48px;border-radius:50%;background:var(--teal-soft);display:flex;align-items:center;justify-content:center;font-size:26px">🐕</div>' +
          '<div style="flex:1;margin-left:12px"><div style="font-weight:700">' + parts[0] + '</div><div class="muted">' + parts[1] + ' · 柯基</div></div>' +
          '<button class="btn sm primary" onclick="UI.toast(\'已发送好友申请\')">加好友</button></div></div>';
      }).join('');
  }

  function petFace() { return S.pet.behavior === 'sleep' ? '😴' : '🐕'; }
  function qa(ico, label, id) { return '<button class="q-tile" id="' + id + '"><div class="qi">' + ico + '</div><div class="ql">' + label + '</div></button>'; }

  global.PetScreens = {
    renderCamera: renderCamera, renderVideo: renderVideo, renderVoice: renderVoice,
    renderFeed: renderFeed, renderAutomation: renderAutomation,
    feedStep: function (d) {
      var el = document.getElementById('feedAmt');
      if (!el) return;
      var v = Math.max(5, parseInt(el.textContent, 10) + d);
      el.textContent = v + 'g';
    },
    renderRecords: renderRecords, renderTrack: renderTrack, renderBehavior: renderBehavior,
    renderSound: renderSound, renderDiary: renderDiary,
    renderFence: renderFence, renderLost: renderLost, renderChat: renderChat, renderFriends: renderFriends
  };
})(window);

