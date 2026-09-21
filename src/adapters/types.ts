import type { Device, HomeMap, PetEvent, PetState } from '@/domain/types'

// ============================================================================
// Adapter 接口层：UI / Store 只依赖接口，未来接入真实小度 IoT API 时只替换实现。
// ============================================================================

export type CommandResult = {
  accepted: boolean
  requestId: string
  message: string
}

export interface HardwareAdapter {
  /** 发送硬件指令。当前为 mock：返回“已受理”，不代表设备真的执行成功。 */
  sendCommand(deviceId: string, command: string, payload?: unknown): Promise<CommandResult>
}

export interface TrackingAdapter {
  getPetState(): Promise<PetState>
}

export interface CameraAdapter {
  /** 摄像头列表严格来自 HomeMap + Device 绑定，禁止硬编码房间。 */
  getCameras(homeMap: HomeMap, devices: Device[]): Promise<Device[]>
  getLiveStream(deviceId: string): Promise<string>
}

export interface RecognitionAdapter {
  getRecentEvents(): Promise<PetEvent[]>
}

export interface EmotionCompanionAdapter {
  getCompanionSignal(): Promise<{
    enabled: boolean
    level: 'none' | 'gentle'
    reasons: string[]
  }>
}

export interface VoiceCloneAdapter {
  /** 真实声线克隆的抽象点。当前 mock 不做克隆，仅保存原始录音。 */
  createPreset(blobKey: string, durationSec: number): Promise<{ cloned: boolean; presetId: string }>
}
