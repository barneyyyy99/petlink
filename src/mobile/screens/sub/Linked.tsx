import { useStore } from '@/store/useStore'
import { deviceIconOf } from '@/components/map/furniture'
import { Plus, Zap, ChevronRight } from 'lucide-react'
import { C } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { SubScreen } from '@/mobile/nav'

export function LinkedScreen() {
  const devices = useStore((s) => s.devices)
  const rooms = useStore((s) => s.homeMap.rooms)
  const rules = useStore((s) => s.rules)
  const setDeviceControlTarget = useStore((s) => s.setDeviceControlTarget)
  const toggleRule = useStore((s) => s.toggleRule)
  const toast = useStore((s) => s.toast)
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? '未分配'

  return (
    <SubScreen title="联动设备" right="添加" onRight={() => toast('info', '扫码添加新设备开发中')}>
      {/* 设备列表 */}
      <div className="mb-2 px-1 text-[14px] font-bold" style={{ color: C.ink }}>全屋设备 · {devices.length}</div>
      <div className="flex flex-col gap-2">
        {devices.map((d) => (
          <Card key={d.id} className="!p-3" onClick={() => setDeviceControlTarget({ deviceId: d.id })}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] text-lg" style={{ background: C.primarySoft }}>{deviceIconOf(d.type)}</span>
              <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>{d.name}</b><span className="text-[11px]" style={{ color: C.sub }}>{roomName(d.roomId)}</span></div>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold" style={d.online ? { background: '#e6f7ee', color: C.green } : { background: '#f1f2f5', color: C.faint }}>{d.online ? '在线' : '离线'}</span>
              <ChevronRight size={16} color={C.faint} />
            </div>
          </Card>
        ))}
      </div>

      {/* 全屋自动联动规则 */}
      <div className="mb-2 mt-5 flex items-center justify-between px-1">
        <b className="text-[14px]" style={{ color: C.ink }}>全屋自动联动 · {rules.length} 条</b>
        <button className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: C.primary }} onClick={() => toast('info', '新建联动规则开发中')}><Plus size={14} /> 新建</button>
      </div>
      <div className="flex flex-col gap-2">
        {rules.map((r) => (
          <Card key={r.id} className="!p-3.5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: C.primarySoft }}><Zap size={17} color={C.primary} /></span>
              <div className="min-w-0 flex-1"><b className="block text-[13px]" style={{ color: C.ink }}>{r.name}</b><span className="text-[11px]" style={{ color: C.sub }}>{r.action}</span></div>
              <button className={`toggle ${r.enabled ? 'on' : ''}`} onClick={() => toggleRule(r.id)} aria-label={r.name} />
            </div>
          </Card>
        ))}
      </div>
    </SubScreen>
  )
}
