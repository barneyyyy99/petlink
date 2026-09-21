import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Modal } from '@/components/Modal'
import { mockVoiceCloneAdapter } from '@/adapters/mock'
import { makeId } from '@/domain/geometry'
import { blobToDataUrl } from '@/lib/image'
import type { VoicePreset } from '@/domain/types'

export function VoiceModal() {
  const open = useStore((s) => s.modal === 'voice')
  const close = useStore((s) => s.closeModal)
  const voice = useStore((s) => s.voice)
  const saveVoicePreset = useStore((s) => s.saveVoicePreset)
  const sendCommand = useStore((s) => s.sendCommand)
  const pet = useStore((s) => s.pet)
  const toast = useStore((s) => s.toast)

  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)
  const startedAt = useRef(0)

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      // 无录音能力时的错误态：不伪造，直接保存一个空预设占位
      toast('warn', '当前环境不支持录音，已创建占位语音预设')
      const preset: VoicePreset = { id: makeId('voice'), createdAt: Date.now(), durationSec: 0, cloned: false }
      saveVoicePreset(preset)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => chunks.current.push(e.data)
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        // 转 dataURL：可持久化并随快照云端同步（ObjectURL 刷新即失效）
        const dataUrl = await blobToDataUrl(blob)
        setAudioUrl(dataUrl)
        const dur = Math.round((Date.now() - startedAt.current) / 1000)
        const res = await mockVoiceCloneAdapter.createPreset(dataUrl, dur)
        saveVoicePreset({ id: res.presetId, createdAt: Date.now(), durationSec: dur, blobKey: dataUrl, cloned: res.cloned })
      }
      rec.start()
      recRef.current = rec
      startedAt.current = Date.now()
      setRecording(true)
      setSeconds(0)
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
      toast('info', '已开始录制主人声音')
    } catch {
      toast('error', '无法访问麦克风，请检查浏览器权限')
    }
  }

  const stop = () => {
    recRef.current?.stop()
    if (timer.current) window.clearInterval(timer.current)
    setRecording(false)
  }

  return (
    <Modal open={open} onClose={close} eyebrow="OWNER VOICE" title="主人声音" desc="录制主人声线，用于远程呼叫与陪伴。当前版本仅保存原始录音，声线克隆为后续接入点。" testId="voice-modal">
      <div className="mx-auto my-5 grid h-32 w-32 place-items-center rounded-full bg-[radial-gradient(circle,#fdfefe_0_45%,#dcefe9_46%_60%,#eff7f4_61%)] text-3xl text-teal shadow-soft">
        ◖
      </div>
      <div className="text-center">
        <b>
          {recording
            ? `正在录音… ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
            : voice
            ? `已保存主人语音预设 · ${voice.durationSec} 秒${voice.cloned ? ' · 已克隆' : ' · 未克隆（占位）'}`
            : '还没有录音'}
        </b>
        <div className="mt-1.5 text-xs text-muted">建议录制 10–20 秒自然语音</div>
        {(audioUrl || voice?.blobKey) && <audio className="mx-auto mt-3" src={audioUrl ?? voice?.blobKey} controls />}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {recording ? (
          <button className="btn btn-primary" onClick={stop}>■ 完成录制</button>
        ) : (
          <button className="btn btn-primary" onClick={start}>● 开始录制</button>
        )}
        <button className="btn" disabled={!voice} onClick={() => sendCommand(pet.id, '发送主人语音测试到最近小度设备')}>发送测试</button>
      </div>
    </Modal>
  )
}
