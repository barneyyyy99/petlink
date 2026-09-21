/* 全局状态与模拟数据层 —— 所有页面从这里读取并渲染 */
(function (global) {
  'use strict';

  // 房间定义（相对坐标 0-100，用于 SVG 平面图布局）
  const ROOMS = {
    living:  { id: 'living',  name: '客厅', x: 8,  y: 40, w: 44, h: 38, temp: 30, humidity: 62 },
    bedroom: { id: 'bedroom', name: '主卧', x: 56, y: 8,  w: 36, h: 34, temp: 25, humidity: 50 },
    second:  { id: 'second',  name: '次卧', x: 56, y: 46, w: 36, h: 32, temp: 26, humidity: 52 },
    study:   { id: 'study',   name: '书房', x: 8,  y: 8,  w: 44, h: 28, temp: 24, humidity: 48 },
    balcony: { id: 'balcony', name: '阳台', x: 8,  y: 82, w: 84, h: 12, temp: 28, humidity: 40 }
  };

  // 行为状态定义：图标 + 文案 + 动效类
  const BEHAVIORS = {
    idle:    { key: 'idle',    label: '静止',   emoji: '🐕', anim: 'breathe' },
    run:     { key: 'run',     label: '奔跑',   emoji: '🐕‍🦺', anim: 'run' },
    look:    { key: 'look',    label: '张望',   emoji: '🐶', anim: 'shake' },
    sleep:   { key: 'sleep',   label: '睡觉',   emoji: '😴', anim: 'sleep' },
    eat:     { key: 'eat',     label: '进食',   emoji: '🍖', anim: 'nod' },
    drink:   { key: 'drink',   label: '喝水',   emoji: '💧', anim: 'nod' },
    play:    { key: 'play',    label: '玩耍',   emoji: '🎾', anim: 'bounce' },
    stay:    { key: 'stay',    label: '停留',   emoji: '🐾', anim: 'breathe' }
  };

  // 设备定义
  const DEVICES = [
    { id: 'cam-living',  name: '客厅摄像头', type: 'camera',  room: 'living',  bound: true,  online: true },
    { id: 'cam-bedroom', name: '主卧摄像头', type: 'camera',  room: 'bedroom', bound: true,  online: true },
    { id: 'cam-second',  name: '次卧摄像头', type: 'camera',  room: 'second',  bound: false, online: false },
    { id: 'spk-living',  name: '小度音箱',   type: 'speaker', room: 'living',  bound: true,  online: true },
    { id: 'screen-bed',  name: '小度智能屏', type: 'screen',  room: 'bedroom', bound: true,  online: true },
    { id: 'feeder',      name: '智能喂食器', type: 'feeder',  room: 'living',  bound: true,  online: true },
    { id: 'water',       name: '智能饮水器', type: 'water',   room: 'living',  bound: true,  online: true },
    { id: 'ac-living',   name: '客厅空调',   type: 'ac',      room: 'living',  bound: true,  online: true, on: false, target: 26 },
    { id: 'ac-bedroom',  name: '主卧空调',   type: 'ac',      room: 'bedroom', bound: true,  online: true, on: false, target: 26 },
    { id: 'toy',         name: '逗宠器',     type: 'toy',     room: 'living',  bound: true,  online: true }
  ];

  // 宠物运行时状态
  const pet = {
    name: '毛球',
    breed: '柯基 · 2 岁',
    room: 'living',
    behavior: 'play',
    updatedAt: Date ? '刚刚' : '刚刚',
    battery: 82
  };

  // 轨迹时间线
  const timeline = [
    { time: '10:32', type: 'move',    text: '客厅 → 书房', room: 'study' },
    { time: '11:06', type: 'drink',   text: '喝水', room: 'living' },
    { time: '12:18', type: 'eat',     text: '进食', room: 'living' },
    { time: '13:40', type: 'sleep',   text: '午睡', room: 'bedroom' },
    { time: '14:03', type: 'company', text: '主人远程陪伴', room: 'bedroom' },
    { time: '15:26', type: 'play',    text: '玩耍', room: 'living' },
    { time: '16:40', type: 'move',    text: '卧室 → 客厅', room: 'living' }
  ];

  const alerts = [
    { level: 'warn', text: '毛球已在客厅停留 12 分钟，客厅温度偏高 (30℃)' }
  ];

  const behaviorStats = [
    { key: 'sleep', label: '睡觉', value: '4.2h' },
    { key: 'play',  label: '玩耍', value: '1.8h' },
    { key: 'eat',   label: '进食', value: '2 次' },
    { key: 'drink', label: '喝水', value: '5 次' },
    { key: 'run',   label: '活动', value: '3.1km' }
  ];

  const diary = {
    date: '9月21日 星期日 · 晴',
    mood: '开心',
    text: '今天主人不在家，我自己玩了一会儿球，中午在客厅吃了饭还喝了好几次水～下午有点热，主人远程帮我开了空调，凉快多了。傍晚我在窗边等着主人回来，尾巴一直在摇。今天也是想主人的一天！'
  };

  // 订阅/重渲染机制
  const listeners = [];
  function subscribe(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(function (fn) { fn(); }); }

  function getRoom(id) { return ROOMS[id]; }
  function getDevice(id) { return DEVICES.find(function (d) { return d.id === id; }); }
  function devicesInRoom(id) { return DEVICES.filter(function (d) { return d.room === id; }); }
  function cameraInRoom(id) { return DEVICES.find(function (d) { return d.room === id && d.type === 'camera' && d.bound; }); }

  function setPet(patch) {
    Object.assign(pet, patch);
    pet.updatedAt = '刚刚';
    notify();
  }

  function pushTimeline(entry) {
    timeline.push(entry);
    notify();
  }

  global.PetState = {
    ROOMS: ROOMS, BEHAVIORS: BEHAVIORS, DEVICES: DEVICES,
    pet: pet, timeline: timeline, alerts: alerts,
    behaviorStats: behaviorStats, diary: diary,
    subscribe: subscribe, notify: notify,
    getRoom: getRoom, getDevice: getDevice,
    devicesInRoom: devicesInRoom, cameraInRoom: cameraInRoom,
    setPet: setPet, pushTimeline: pushTimeline
  };
})(window);
