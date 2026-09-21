import { useRef, useState } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { Modal } from '@/components/Modal'
import { timeHM } from '@/lib/time'

export function ChatModal() {
  const open = useStore((s) => s.modal === 'chat')
  const close = useStore((s) => s.closeModal)
  const chat = useStore((s) => s.chat)
  const sendChat = useStore((s) => s.sendChat)
  const triggerBell = useStore((s) => s.triggerBell)
  const openCamera = useStore((s) => s.openCamera)
  const sendCommand = useStore((s) => s.sendCommand)
  const pet = useStore((s) => s.pet)
  const room = useStore(currentRoom)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const lastOwnerPlayed = [...chat].reverse().find((m) => m.role === 'owner')?.played

  return (
    <Modal open={open} onClose={close} eyebrow="PET DIALOG" title="毛球 🐱" desc="消息经当前房间最近的小度音箱 / 屏幕播放；发完可立即查看摄像头确认反应。" testId="chat-modal">
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button className="btn" onClick={() => openCamera()}>◉ 实时摄像头</button>
        <button className="btn" onClick={() => sendCommand(pet.id, '播放主人声音')}>🔊 播放主人声音</button>
        <button data-testid="bell-btn" className="btn" onClick={triggerBell}>🔔 模拟毛球拨铃</button>
      </div>

      <div className="flex h-[400px] flex-col overflow-hidden rounded-[22px] border border-line bg-[#f5f8f5]">
        <div className="flex flex-1 flex-col gap-2.5 overflow-auto p-4">
          {chat.map((m) => {
            if (m.role === 'pet_event' && m.kind === 'bell') {
              return (
                <div key={m.id} data-testid="bell-event" className="max-w-[92%] self-center rounded-2xl border border-[#eedbbd] bg-[#fff7e9] px-3.5 py-3 text-xs text-[#735b3d]">
                  <b className="mb-1 block">🔔 {timeHM(m.timestamp)} {m.text}</b>
                  <div className="mt-2 flex gap-1.5">
                    <button className="btn btn-primary" onClick={() => openCamera()}>立即看一眼</button>
                    <button className="btn" onClick={() => sendCommand(pet.id, `通过${room?.name ?? '当前房间'}小度回应毛球`)}>语音回应</button>
                  </div>
                </div>
              )
            }
            if (m.role === 'system') {
              return <div key={m.id} className="max-w-[80%] self-center rounded-2xl bg-[#eaf4f0] px-3 py-2 text-[11px] text-[#55716a]">{m.text}</div>
            }
            return <div key={m.id} className="max-w-[76%] self-end rounded-2xl bg-teal px-3 py-2.5 text-[13px] leading-relaxed text-white">{m.text}</div>
          })}
          <div ref={endRef} />
        </div>

        {lastOwnerPlayed && (
          <div data-testid="observe-after-send" className="mx-3 mb-1 flex items-center justify-between gap-2.5 rounded-xl border border-[#d7e7e1] bg-[#eaf4f0] px-3 py-2.5 text-[11px] text-[#55716a]">
            <span>消息已播放。想确认毛球是否有响应？</span>
            <button className="btn btn-primary" onClick={() => openCamera()}>◉ 立即看实时画面</button>
          </div>
        )}

        <div className="flex gap-2 border-t border-line bg-white p-3">
          <input
            className="field flex-1"
            data-testid="chat-input"
            placeholder="给毛球发一句话…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) { sendChat(text); setText('') } }}
          />
          <button className="btn" onClick={() => sendCommand(pet.id, '语音消息已发送到最近小度设备')}>🎙</button>
          <button className="btn btn-primary" data-testid="chat-send" onClick={() => { if (text.trim()) { sendChat(text); setText('') } }}>发送</button>
        </div>
      </div>
    </Modal>
  )
}
