/* 建图流程（上传/手绘/扫描）与设备绑定 */
(function (global) {
  'use strict';
  var S = global.PetState, UI = global.UI;
  var flowState = { method: '', step: 0 };

  var FLOWS = {
    upload: { title: '上传户型图', steps: ['选择图片', '裁切校正', '框选房间', '房间命名', '门/通道关系', '绑定设备', '完成'] },
    draw:   { title: 'App 内手绘', steps: ['选择模板', '拖拽房间块', '调整大小/连接', '房间命名', '放置设备点位', '完成'] },
    scan:   { title: '空间扫描', steps: ['扫描引导', '模拟扫描中', '生成简图', '确认房间边界', '命名房间', '校准设备位置', '完成'] }
  };

  function renderBuildEntry() {
    var el = document.getElementById('screen-build');
    el.innerHTML =
      backHead('创建家庭地图', '选择一种方式生成你的家庭平面图') +
      card(optCard('📤', '上传户型图', '已有平面图，上传后框选房间', 'upload')) +
      card(optCard('✏️', 'App 内手绘', '无户型图？用模板快速画一个', 'draw')) +
      card(optCard('📡', '空间扫描', '推荐 · 用手机扫描自动生成简图', 'scan'));
    el.querySelectorAll('[data-method]').forEach(function (n) {
      n.onclick = function () { startFlow(n.getAttribute('data-method')); };
    });
  }

  function optCard(ico, title, sub, method) {
    return '<div class="opt-card" data-method="' + method + '">' +
      '<div class="oc-ico">' + ico + '</div>' +
      '<div style="flex:1"><div style="font-weight:700;font-size:15px">' + title + '</div>' +
      '<div class="muted" style="margin-top:3px">' + sub + '</div></div>' +
      '<span style="color:var(--ink-3)">›</span></div>';
  }

  function startFlow(method) {
    flowState = { method: method, step: 0 };
    PetApp.go('build-flow');
    renderFlow();
  }

  function renderFlow() {
    var f = FLOWS[flowState.method];
    var el = document.getElementById('screen-build-flow');
    var dots = f.steps.map(function (_, i) { return '<i class="' + (i <= flowState.step ? 'on' : '') + '"></i>'; }).join('');
    var stepName = f.steps[flowState.step];
    el.innerHTML =
      backHead(f.title, '步骤 ' + (flowState.step + 1) + '/' + f.steps.length + ' · ' + stepName) +
      '<div class="step-dots">' + dots + '</div>' +
      '<div class="card">' + stepBody(flowState.method, flowState.step, stepName) + '</div>' +
      '<button class="btn primary" id="flowNext">' + (flowState.step === f.steps.length - 1 ? '完成建图' : '下一步') + '</button>' +
      (flowState.step > 0 ? '<button class="btn ghost" style="margin-top:10px" id="flowPrev">上一步</button>' : '');
    document.getElementById('flowNext').onclick = nextStep;
    var prev = document.getElementById('flowPrev');
    if (prev) prev.onclick = function () { flowState.step--; renderFlow(); };
    if (flowState.method === 'scan' && flowState.step === 1) simulateScan();
  }

  function stepBody(method, step, name) {
    if (method === 'scan' && step === 0)
      return '<div class="scan-box"><div style="font-size:48px">📡</div><div>手持手机缓慢环绕房间移动<br>系统将自动识别墙体与门窗</div></div>';
    if (method === 'scan' && step === 1)
      return '<div class="scan-box" id="scanBox"><div class="cam-scan">📶</div><div id="scanPct">扫描中… 0%</div></div>';
    if (method === 'scan' && step === 2)
      return miniPlan('已生成简化平面图，请确认');
    if (method === 'upload' && step === 0)
      return '<div class="scan-box"><div style="font-size:48px">🖼️</div><div>点击选择户型图图片</div><button class="btn sm" style="margin-top:10px">从相册选择</button></div>';
    if (method === 'upload' && (step === 1 || step === 2))
      return miniPlan(step === 1 ? '拖动边角裁切校正图片' : '在图上框选各房间区域');
    if (method === 'draw' && step === 0)
      return '<div class="grid2">' +
        tmpl('两室一厅') + tmpl('三室一厅') + tmpl('一室一厅') + tmpl('自定义') + '</div>';
    if (method === 'draw' && (step === 1 || step === 2))
      return miniPlan(step === 1 ? '从下方拖拽房间块到画布' : '拖动边缘调整大小与连接关系');
    if (name === '房间命名' || name === '命名房间')
      return roomNameList();
    if (name === '绑定设备' || name === '放置设备点位' || name === '校准设备位置')
      return '<div class="muted" style="margin-bottom:10px">为各房间放置/绑定设备</div>' + deviceBindList();
    if (name === '门/通道关系')
      return miniPlan('连接相邻房间，标注门与通道');
    if (name === '完成')
      return '<div style="text-align:center;padding:16px 0"><div style="font-size:52px">🎉</div><div style="font-weight:700;font-size:16px;margin-top:8px">家庭地图创建完成</div><div class="muted" style="margin-top:6px">5 个房间 · 8 个设备已就绪</div></div>';
    return miniPlan(name);
  }

  function miniPlan(caption) {
    var rooms = '';
    Object.keys(S.ROOMS).forEach(function (id) {
      var r = S.ROOMS[id];
      rooms += '<div class="room" style="left:' + r.x + '%;top:' + r.y + '%;width:' + r.w + '%;height:' + r.h + '%"><span class="rname">' + r.name + '</span></div>';
    });
    return '<div style="position:relative;height:220px;background:var(--bg);border-radius:14px;overflow:hidden;margin-bottom:10px">' +
      '<div style="position:absolute;inset:12px">' + rooms + '</div></div>' +
      '<div class="muted" style="text-align:center">' + caption + '</div>';
  }
  function tmpl(name) {
    return '<div class="card" style="box-shadow:none;background:var(--bg);text-align:center;cursor:pointer;margin:0" onclick="UI.toast(\'已选择模板：' + name + '\')"><div style="font-size:30px">🏠</div><div style="font-size:13px;margin-top:6px">' + name + '</div></div>';
  }
  function roomNameList() {
    return Object.keys(S.ROOMS).map(function (id) {
      var r = S.ROOMS[id];
      return '<div class="list-item"><div class="li-ico">🚪</div><div class="li-body"><input value="' + r.name + '" style="border:none;background:var(--bg);border-radius:8px;padding:8px 10px;width:100%;font-size:14px"/></div></div>';
    }).join('');
  }
  function deviceBindList() {
    return S.DEVICES.map(function (d) {
      return '<div class="list-item"><div class="li-ico">' + devIco(d.type) + '</div>' +
        '<div class="li-body"><div class="li-title">' + d.name + '</div><div class="li-sub">' + S.ROOMS[d.room].name + '</div></div>' +
        '<button class="btn sm ' + (d.bound ? 'sent' : '') + '" onclick="this.classList.toggle(\'sent\');this.innerHTML=this.classList.contains(\'sent\')?\'✓ 已绑定\':\'绑定\'">' + (d.bound ? '✓ 已绑定' : '绑定') + '</button></div>';
    }).join('');
  }
  function devIco(t) { return { camera: '📷', speaker: '🔊', screen: '📺', feeder: '🍚', water: '🚰', ac: '❄️', toy: '🎾' }[t] || '📟'; }

  function simulateScan() {
    var pct = 0;
    var timer = setInterval(function () {
      pct += 12;
      var el = document.getElementById('scanPct');
      if (!el) { clearInterval(timer); return; }
      el.textContent = '扫描中… ' + Math.min(pct, 100) + '%';
      if (pct >= 100) { clearInterval(timer); setTimeout(function () { if (flowState.step === 1) nextStep(); }, 500); }
    }, 350);
  }

  function nextStep() {
    var f = FLOWS[flowState.method];
    if (flowState.step === f.steps.length - 1) {
      UI.toast('家庭地图已保存', 'ok');
      PetApp.go('map');
      return;
    }
    flowState.step++;
    renderFlow();
  }

  // 设备管理页
  function renderDevices() {
    var el = document.getElementById('screen-devices');
    var byRoom = {};
    S.DEVICES.forEach(function (d) { (byRoom[d.room] = byRoom[d.room] || []).push(d); });
    var body = Object.keys(byRoom).map(function (rid) {
      var items = byRoom[rid].map(function (d) {
        return '<div class="list-item"><div class="li-ico">' + devIco(d.type) + '</div>' +
          '<div class="li-body"><div class="li-title">' + d.name + '</div>' +
          '<div class="li-sub">' + (d.bound ? (d.online ? '在线' : '离线') : '未绑定') + '</div></div>' +
          '<button class="btn sm ghost" onclick="UI.toast(\'正在测试' + d.name + '…\')">测试</button></div>';
      }).join('');
      return '<div class="card"><div class="card-title">' + S.ROOMS[rid].name + '</div>' + items + '</div>';
    }).join('');
    el.innerHTML = backHead('设备管理', '共 ' + S.DEVICES.length + ' 个设备') + body;
  }

  function backHead(title, sub) {
    return '<div class="page-head"><div class="row" style="gap:10px">' +
      '<button class="icon-btn" onclick="PetApp.back()">‹</button>' +
      '<div><div class="page-title" style="font-size:19px">' + title + '</div>' +
      (sub ? '<div class="page-sub">' + sub + '</div>' : '') + '</div></div></div>';
  }
  function card(inner) { return '<div class="card">' + inner + '</div>'; }

  global.PetBuild = {
    renderEntry: renderBuildEntry, renderDevices: renderDevices, startFlow: startFlow, backHead: backHead
  };
})(window);
