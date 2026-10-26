import { useState } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { HomeIso } from '@/components/map/HomeIso'
import { Pencil, Thermometer, Shield, ChevronRight } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card, SectionHeader } from '@/mobile/MobileShell'
import { useNav } from '@/mobile/nav'

export function Location() {
  const home = useStore((s) => s.homeMap)
  const pet = useStore((s) => s.pet)
  const room = useStore(currentRoom)
  const moveToRoom = useStore((s) => s.moveToRoom)
  const openModal = useStore((s) => s.openModal)
  const toggleDrawer = useStore((s) => s.toggleDrawer)
  const turnOnAC = useStore((s) => s.turnOnAC)
  const setLost = useStore((s) => s.setLost)
  const events = useStore((s) => s.events)
  const { openSub } = useNav()
  const [away, setAway] = useState(false)

  const rooms = home.rooms
  const hot = room && room.environment.temperature >= 28.5
  const trail = [...events].filter((e) => (e.petId ?? pet.id) === pet.id).sort((a, b) => b.timestamp - a.timestamp).slice(0, 6)

  return (
    <div className="flex flex-col gap-3">
      {/* 头部 */}
      <div className="flex items-center justify-between px-1 pt-1">
        <h1 className="text-[22px] font-extrabold" style={{ color: C.ink }}>{pet.name}定位</h1>
        <button className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: C.primary }} onClick={() => openModal('mapBuilder')}>
          <Pencil size={14} /> 户型图修改
        </button>
      </div>

      {/* 在家 / 外出 */}
      <div className="flex rounded-full bg-white p-1 shadow-sm">
        <button onClick={() => { setAway(false); setLost(false) }} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={away ? { color: C.sub } : { background: G.primary, color: '#fff' }}>在家</button>
        <button onClick={() => { setAway(true); setLost(true) }} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={away ? { background: G.primary, color: '#fff' } : { color: C.sub }}>外出</button>
      </div>
      <p className="px-1 text-[13px]" style={{ color: C.sub }}>{pet.name}当前{away ? '外出中 · 已开启共享定位与走失互寻' : `在家 · ${room?.name ?? '客厅'}窗边晒太阳，查看室内位置`}</p>

      {/* 温度告警 */}
      {hot && !away && (
        <Card className="!p-3.5" style={{ background: G.warm }}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70"><Thermometer size={20} color={C.orange} /></span>
            <div className="min-w-0 flex-1">
              <b className="block text-[13px]" style={{ color: '#8a5a2b' }}>{room?.name}温度偏高 · {room?.environment.temperature}℃</b>
              <p className="text-[11px]" style={{ color: '#a9793f' }}>{pet.name}正在{room?.name}，建议开启空调降温，避免中暑。</p>
            </div>
            <button className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold text-white" style={{ background: G.primary }} onClick={() => turnOnAC()}>开空调</button>
          </div>
        </Card>
      )}

      {/* 2.5D 整屋等距户型图（复用桌面端 HomeIso） */}
      <div className="rounded-[26px] bg-white p-2 shadow-[0_6px_20px_rgba(31,60,120,.07)]">
        <HomeIso />
        {/* 房间快捷：点一下让宠物过去（对应原型“拖动豆豆更新位置”） */}
        <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
          {rooms.map((r) => {
            const active = r.id === pet.roomId
            return (
              <button key={r.id} onClick={() => moveToRoom(r.id)} className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold" style={active ? { background: G.primary, color: '#fff' } : { background: C.primarySoft, color: C.primary }}>{r.name}</button>
            )
          })}
        </div>
        <div className="flex items-center justify-between px-2 pb-1 pt-1 text-[11px]" style={{ color: C.sub }}>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: C.primary }} />{pet.name}当前位置</span>
          <span>点房间让{pet.name}过去 · 点设备看控制</span>
        </div>
      </div>

      {/* 家庭围栏 */}
      <Card onClick={() => openSub('fence')} className="!p-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><Shield size={20} color={C.primary} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>家庭围栏</b><span className="text-[11px]" style={{ color: C.sub }}>{pet.name}的家 · {away ? '已离开范围' : '在家范围内'}</span></div>
          <span className="text-[12px] font-semibold" style={{ color: C.primary }}>设置</span>
          <ChevronRight size={16} color={C.faint} />
        </div>
      </Card>

      {/* 宠物踪迹 */}
      <SectionHeader title="宠物踪迹" extra="全天 ›" onExtra={() => toggleDrawer(true)} />
      <Card>
        <div className="flex flex-col gap-3">
          {trail.map((e, i) => (
            <div key={e.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: i === 0 ? C.primary : '#d4ddea' }} />
                {i < trail.length - 1 && <span className="my-0.5 w-px flex-1 bg-[#e8ecf3]" />}
              </div>
              <div className="pb-1">
                <span className="text-[12px] font-semibold" style={{ color: C.sub }}>{new Date(e.timestamp).toTimeString().slice(0, 5)}</span>
                <div className="text-[13px]" style={{ color: C.ink }}>{e.title}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
