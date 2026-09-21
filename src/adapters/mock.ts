import type {
  CameraAdapter,
  CommandResult,
  EmotionCompanionAdapter,
  HardwareAdapter,
  RecognitionAdapter,
  TrackingAdapter,
  VoiceCloneAdapter,
} from './types'
import type { Device, HomeMap, PetEvent, PetState } from '@/domain/types'
import { makeId } from '@/domain/geometry'

let requestSeq = 0
function nextRequestId() {
  requestSeq += 1
  return `req_${requestSeq.toString(36)}`
}

/** 模拟硬件适配器：始终返回“已受理”，明确区别于“执行成功”。 */
export const mockHardwareAdapter: HardwareAdapter = {
  async sendCommand(deviceId, command): Promise<CommandResult> {
    await delay(120)
    // 极少数情况下模拟被拒绝，用于错误态演示（deviceId 以 __reject 结尾）
    if (deviceId.endsWith('__reject')) {
      return { accepted: false, requestId: nextRequestId(), message: '设备拒绝了指令（离线或忙碌）' }
    }
    return { accepted: true, requestId: nextRequestId(), message: `指令已发送：${command}` }
  },
}

export function makeTrackingAdapter(getState: () => PetState): TrackingAdapter {
  return {
    async getPetState() {
      await delay(60)
      return getState()
    },
  }
}

export const mockCameraAdapter: CameraAdapter = {
  async getCameras(homeMap: HomeMap, devices: Device[]) {
    await delay(40)
    const roomIds = new Set(homeMap.rooms.map((r) => r.id))
    return devices.filter((d) => d.type === 'camera' && roomIds.has(d.roomId))
  },
  async getLiveStream(deviceId: string) {
    await delay(40)
    return `mock://stream/${deviceId}`
  },
}

export function makeRecognitionAdapter(getEvents: () => PetEvent[]): RecognitionAdapter {
  return {
    async getRecentEvents() {
      await delay(50)
      return getEvents()
    },
  }
}

export const mockEmotionAdapter: EmotionCompanionAdapter = {
  async getCompanionSignal() {
    await delay(60)
    return {
      enabled: true,
      level: 'gentle',
      reasons: ['与小度的主动语音互动语气较平时偏低', '今日外出 / 活动明显减少', '与宠物互动比平时少'],
    }
  },
}

export const mockVoiceCloneAdapter: VoiceCloneAdapter = {
  async createPreset(_blobKey: string, _durationSec: number) {
    await delay(80)
    // 当前无真实声线克隆能力：仅保存原始录音，cloned=false，绝不伪造“克隆完成”。
    return { cloned: false, presetId: makeId('voice') }
  },
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
