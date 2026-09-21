// ============================================================================
// PetLink 统一领域数据模型 —— 所有模块共享的唯一数据源
// ============================================================================

export type Point = { x: number; y: number }

export type DeviceType =
  | 'camera'
  | 'speaker'
  | 'smart_screen'
  | 'feeder'
  | 'water'
  | 'ac'
  | 'temp_humidity'
  | 'toy'

export type DeviceStatus = Record<string, string | number | boolean>

export type Device = {
  id: string
  name: string
  type: DeviceType
  roomId: string
  online: boolean
  status: DeviceStatus
}

export type RoomEnvironment = {
  temperature: number
  humidity: number
  updatedAt: number
}

/** 房间语义类型，仅影响默认家具示意与图标，绝不写死房间名逻辑 */
export type RoomKind = 'living' | 'bedroom' | 'study' | 'balcony' | 'dining' | 'custom'

export type Room = {
  id: string
  name: string
  kind: RoomKind
  polygon: Point[]
  /** 绑定到该房间的 deviceId 列表（Device 亦持有 roomId，双向一致） */
  devices: string[]
  environment: RoomEnvironment
}

export type HomeMap = {
  id: string
  name: string
  version: number
  backgroundImageId?: string
  /** 户型底图（降采样后的 dataURL），随快照云端同步，供跨设备编辑时作为描摹底图 */
  backgroundImage?: string
  rooms: Room[]
}

export type PetBehavior =
  | 'idle'
  | 'looking'
  | 'running'
  | 'sleeping'
  | 'eating'
  | 'drinking'
  | 'playing'
  | 'litter'

export type TrackingSource = 'camera' | 'ble' | 'imu' | 'device_event'

export type PetState = {
  id: string
  name: string
  roomId: string
  behavior: PetBehavior
  /** 定位置信度 0-1 */
  confidence: number
  lastUpdatedAt: number
  trackingSources: TrackingSource[]
  collarBattery: number
}

export type PetEventType =
  | 'room_change'
  | 'eat'
  | 'drink'
  | 'play'
  | 'sleep'
  | 'litter'
  | 'run'
  | 'owner_interaction'
  | 'bell'
  | 'sound'
  | 'fence_alert'
  | 'device_command'
  | 'companion'

export type PetEvent = {
  id: string
  timestamp: number
  type: PetEventType
  title: string
  detail?: string
  petId?: string
  roomId?: string
  fromRoomId?: string
  toRoomId?: string
  deviceId?: string
  source?: TrackingSource[]
  media?: { type: 'image' | 'video'; url?: string }
}

// ---- 摄像头接力状态机 ----
export type HandoffPhase =
  | 'idle'
  | 'lost' // A 摄像头失去目标
  | 'transit' // BLE/IMU 连续定位
  | 'searching' // 正在寻找 B 房间摄像头
  | 'detected' // B 摄像头已识别
  | 'completed' // 接力完成
  | 'no_camera' // B 房间无摄像头，BLE/IMU 继续

export type HandoffState = {
  phase: HandoffPhase
  fromRoomId?: string
  toRoomId?: string
  activeCameraDeviceId?: string
  message: string
  startedAt?: number
}

// ---- 过渡动画路径 ----
export type TransitionRoute = {
  from: Point
  to: Point
  fromRoomId: string
  toRoomId: string
} | null

// ---- 虚拟围栏 ----
export type Fence = {
  points: Point[]
  mapVersion: number
  enabled: boolean
}

// ---- 自动化规则 ----
export type RuleTrigger =
  | 'enter_room'
  | 'leave_room'
  | 'temp_above'
  | 'humidity_above'
  | 'stay_over'
  | 'bell'
  | 'feeder_event'
  | 'water_event'

export type RuleExecMode = 'suggest' | 'auto' | 'notify'

export type AutomationRule = {
  id: string
  name: string
  trigger: RuleTrigger
  /** 触发阈值：温度/湿度/停留分钟数 */
  threshold?: number
  targetRoomId: string | 'current'
  targetDeviceType: DeviceType
  action: string
  mode: RuleExecMode
  enabled: boolean
}

// ---- 主人语音预设 ----
export type VoicePreset = {
  id: string
  createdAt: number
  durationSec: number
  /** ObjectURL / dataURL，真实声线克隆由 voiceCloneAdapter 处理 */
  blobKey?: string
  cloned: boolean
}

// ---- 对话消息 ----
export type ChatRole = 'owner' | 'pet_event' | 'system'
export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  timestamp: number
  kind?: 'text' | 'voice' | 'bell'
  played?: boolean
}

// ---- 走失模式 ----
export type LostMode = {
  active: boolean
  lastRoomId?: string
  lastUpdatedAt?: number
}

export type ToastKind = 'success' | 'info' | 'warn' | 'error'
