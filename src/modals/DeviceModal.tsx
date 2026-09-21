import { useStore } from '@/store/useStore'
import { Modal } from '@/components/Modal'
import { deviceIconOf } from '@/components/map/furniture'

export function DeviceModal() {
  const open = useStore((s) => s.modal === 'device')
  const close = useStore((s) => s.closeModal)
  const devices = useStore((s) => s.devices)
  const rooms = useStore((s) => s.homeMap.rooms)
  const setTarget = useStore((s) => s.setDeviceControlTarget)

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? '未分配'

  return (
    <Modal open={open} onClose={close} wide title="设备管理" eyebrow="DEVICES" desc="点击任一设备进入对应控制卡。硬件操作统一使用“指令已发送”反馈。" testId="device-modal">
      <div className="grid grid-cols-2 gap-2.5 max-[640px]:grid-cols-1">
        {devices.map((d) => (
          <button
            key={d.id}
            data-testid="device-card"
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#bfd5cc] hover:shadow-softsm"
            onClick={() => setTarget({ deviceId: d.id })}
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef5f2] text-lg">{deviceIconOf(d.type)}</div>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-sm">{d.name}</b>
              <div className="text-xs text-muted">{roomName(d.roomId)} · {d.online ? '在线' : '离线'}</div>
            </div>
            <span className="badge">进入控制 ›</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
