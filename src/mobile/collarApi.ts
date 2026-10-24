// 项圈固件数据接口（预留）。
// 现阶段返回模拟数据作默认展示；真机接入时把 USE_MOCK 置 false 并实现 fetchFirmware()。
// 真实固件上报协议对接点：替换 fetchFirmware 的实现（BLE / 云端网关），保持返回结构不变即可。

export type CollarKey = 'tracking' | 'behavior' | 'fence' | 'health' | 'mode' | 'light' | 'firmware'

export type CollarDetail = {
  key: CollarKey
  title: string
  desc: string
  value?: string
  /** 模拟/上报的指标读数（title→value） */
  metrics: { label: string; value: string; warn?: boolean }[]
  /** 可开关项 */
  toggles?: { label: string; on: boolean }[]
  /** 可选档位 */
  options?: { label: string; options: string[]; current: string }
  /** 该项是否依赖固件实时上报数据 */
  firmware?: boolean
}

const USE_MOCK = true

const MOCK: Record<CollarKey, CollarDetail> = {
  tracking: {
    key: 'tracking', title: '定位与追踪', desc: '实时定位、刷新频率、多基站接力', value: '均衡', firmware: true,
    metrics: [
      { label: '当前定位精度', value: '室内 0.8m' },
      { label: '刷新频率', value: '每 5 秒' },
      { label: '基站接力', value: '客厅 → 卧室 正常' },
      { label: '卫星/UWB 信号', value: '良好' },
    ],
    options: { label: '刷新模式', options: ['省电', '均衡', '高频'], current: '均衡' },
  },
  behavior: {
    key: 'behavior', title: '行为识别', desc: '进食、饮水、玩耍、睡眠及异常行为识别', firmware: true,
    metrics: [
      { label: '今日进食', value: '2 次' }, { label: '今日饮水', value: '3 次' },
      { label: '玩耍', value: '2 回合' }, { label: '异常行为', value: '未检测', },
    ],
    toggles: [{ label: '异常行为提醒', on: true }, { label: '进食/饮水记录', on: true }],
  },
  fence: {
    key: 'fence', title: '电子围栏', desc: '安全范围、离家提醒、走失一键找回',
    metrics: [{ label: '当前状态', value: '在家范围内' }, { label: '安全半径', value: '全屋' }, { label: '今日越界', value: '0 次' }],
    toggles: [{ label: '离家提醒', on: true }, { label: '走失一键找回', on: true }],
  },
  health: {
    key: 'health', title: '健康监测', desc: '体温、运动量、睡眠质量监测与周报', firmware: true,
    metrics: [
      { label: '体温', value: '38.6℃' }, { label: '心率', value: '128 次/分' },
      { label: '今日运动量', value: '2,480 步' }, { label: '睡眠质量', value: '优秀' },
    ],
    toggles: [{ label: '健康周报推送', on: true }],
  },
  mode: {
    key: 'mode', title: '项圈模式', desc: '日常模式、户外模式、睡眠省电模式', value: '日常',
    metrics: [{ label: '当前模式', value: '日常模式' }, { label: '预计续航', value: '约 6 天' }],
    options: { label: '模式', options: ['日常', '户外', '睡眠省电'], current: '日常' },
  },
  light: {
    key: 'light', title: '灯光与提示', desc: '夜间定位灯、找回闪灯与鸣叫',
    metrics: [{ label: '夜间定位灯', value: '自动' }, { label: '提示音量', value: '65' }],
    toggles: [{ label: '夜间定位灯', on: true }, { label: '找回闪灯', on: true }, { label: '鸣叫提示', on: false }],
  },
  firmware: {
    key: 'firmware', title: '固件升级', desc: '当前 v2.3.1，已是最新版本', value: '最新', firmware: true,
    metrics: [{ label: '当前版本', value: 'v2.3.1' }, { label: '硬件型号', value: 'XD-Collar Pro' }, { label: '最近检查', value: '今天' }],
  },
}

export async function fetchCollarDetail(key: CollarKey): Promise<CollarDetail> {
  if (USE_MOCK) return Promise.resolve(MOCK[key])
  // TODO: 真机固件对接 —— 从 BLE/云端网关拉取实时上报数据，组装成 CollarDetail 返回
  return fetchFirmware(key)
}

async function fetchFirmware(key: CollarKey): Promise<CollarDetail> {
  // 预留接口：真实实现时请求固件数据端点
  const base = import.meta.env.VITE_COLLAR_API as string | undefined
  if (!base) return MOCK[key]
  const res = await fetch(`${base}/collar/${key}`)
  return res.json()
}
