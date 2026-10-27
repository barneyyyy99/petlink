import { useState } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { HomeIso } from '@/components/map/HomeIso'
import { Pencil, Thermometer, Shield, ChevronRight, Bell, Navigation, Route, PawPrint } from 'lucide-react'
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
  const triggerBell = useStore((s) => s.triggerBell)
  const events = useStore((s) => s.events)
  const toast = useStore((s) => s.toast)
  const { openSub } = useNav()
  const [away, setAway] = useState(false)
  const [fenceAlert, setFenceAlert] = useState(true)
  const [seeking, setSeeking] = useState(false)

  const rooms = home.rooms
  const hot = room && room.environment.temperature >= 28.5
  const trail = [...events].filter((e) => (e.petId ?? pet.id) === pet.id).sort((a, b) => b.timestamp - a.timestamp).slice(0, 6)

  return (
    <div className="flex flex-col gap-3">
      {/* 头部 */}
      <div className="flex items-center justify-between px-1 pt-1">
        <h1 className="text-[22px] font-extrabold" style={{ color: C.ink }}>{pet.name}定位</h1>
        {away ? (
          <div className="flex items-center gap-3 text-[13px] font-semibold" style={{ color: C.primary }}>
            <button className="flex items-center gap-1" onClick={() => toast('info', '遛宠模式：记录本次外出轨迹')}><PawPrint size={14} /> 遛宠</button>
            <button className="flex items-center gap-1" onClick={() => toggleDrawer(true)}><Route size={14} /> 历史轨迹</button>
          </div>
        ) : (
          <button className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: C.primary }} onClick={() => openModal('mapBuilder')}>
            <Pencil size={14} /> 户型图修改
          </button>
        )}
      </div>

      {/* 在家 / 外出 */}
      <div className="flex rounded-full bg-white p-1 shadow-sm">
        <button onClick={() => { setAway(false); setLost(false) }} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={away ? { color: C.sub } : { background: G.primary, color: '#fff' }}>⌂ 在家</button>
        <button onClick={() => { setAway(true); setLost(true) }} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={away ? { background: G.primary, color: '#fff' } : { color: C.sub }}>⊙ 外出</button>
      </div>

      {away ? <Outdoor pet={pet} seeking={seeking} setSeeking={setSeeking} fenceAlert={fenceAlert} setFenceAlert={setFenceAlert} openSub={openSub} toggleDrawer={toggleDrawer} triggerBell={triggerBell} toast={toast} />
        : (
          <>
            <p className="px-1 text-[13px]" style={{ color: C.sub }}>{pet.name}当前在家 · {room?.name ?? '客厅'}窗边晒太阳，查看室内位置</p>

            {hot && (
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

            <div className="rounded-[26px] bg-white p-2 shadow-[0_6px_20px_rgba(31,60,120,.07)]">
              <HomeIso draggable />
              <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                {rooms.map((r) => {
                  const active = r.id === pet.roomId
                  return <button key={r.id} onClick={() => moveToRoom(r.id)} className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold" style={active ? { background: G.primary, color: '#fff' } : { background: C.primarySoft, color: C.primary }}>{r.name}</button>
                })}
              </div>
              <div className="flex items-center justify-between px-2 pb-1 pt-1 text-[11px]" style={{ color: C.sub }}>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: C.primary }} />{pet.name}当前位置</span>
                <span>拖动{pet.name}或点房间更新位置</span>
              </div>
            </div>

            <Card onClick={() => openSub('fence')} className="!p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><Shield size={20} color={C.primary} /></span>
                <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>家庭围栏</b><span className="text-[11px]" style={{ color: C.sub }}>{pet.name}的家 · 在家范围内</span></div>
                <span className="text-[12px] font-semibold" style={{ color: C.primary }}>设置</span>
                <ChevronRight size={16} color={C.faint} />
              </div>
            </Card>

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
          </>
        )}
    </div>
  )
}
{/* ANCHOR_OUTDOOR */}
function Outdoor({ pet, seeking, setSeeking, fenceAlert, setFenceAlert, openSub, toggleDrawer, triggerBell, toast }: any) {
  const actions = [
    { icon: Route, label: '轨迹', on: () => toggleDrawer(true), hi: false },
    { icon: Bell, label: '响铃', on: () => { triggerBell(); toast('info', `已向${pet.name}的项圈发送响铃`) }, hi: false },
    { icon: Navigation, label: '去寻宠', on: () => { setSeeking(true); toast('success', '已开启去寻宠：定位每 5~10 秒刷新一次') }, hi: true },
  ]
  return (
    <>
      {/* 外出提示条 */}
      <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[12px] font-semibold" style={{ background: '#fff3e6', color: '#9a6a28' }}>
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#f0a33c]" />
        {pet.name}已外出 · 正在小区活动，GPS {seeking ? '高频' : '实时'}追踪中
      </div>

      {/* 室外 GPS 地图 */}
      <div className="relative overflow-hidden rounded-[22px] bg-[#eaf0f8] p-2 shadow-[0_6px_20px_rgba(31,60,120,.07)]">
        <svg viewBox="0 0 320 210" className="h-auto w-full" style={{ aspectRatio: '320 / 210' }}>
          <rect x="0" y="88" width="320" height="30" fill="#dde6f4" />
          <rect x="150" y="0" width="30" height="210" fill="#dde6f4" />
          <line x1="0" y1="40" x2="320" y2="40" stroke="#cfdaec" strokeWidth="1.2" strokeDasharray="7 7" />
          <line x1="70" y1="0" x2="70" y2="210" stroke="#cfdaec" strokeWidth="1.2" strokeDasharray="7 7" />
          {/* 围栏圈 */}
          <circle cx="178" cy="120" r="62" fill={C.primary} fillOpacity="0.08" stroke={C.primary} strokeWidth="2" strokeDasharray="6 6" />
          {/* 行走轨迹 */}
          <polyline points="130,185 150,150 140,130 175,120" fill="none" stroke="#3D7FFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* 宠物 */}
          <circle cx="178" cy="120" r="13" fill="#fff" stroke={C.primary} strokeWidth="2.5" />
          <text x="178" y="125" textAnchor="middle" fontSize="14">🐱</text>
        </svg>
        {/* 状态徽标 */}
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl bg-white px-3 py-1.5 text-center shadow">
          <b className="text-[13px]" style={{ color: C.ink }}>{pet.name}在 <span style={{ color: C.primary }}>奔跑</span></b>
          <div className="text-[10px]" style={{ color: C.sub }}>已拉取 GPS 定位，误差 3~6m</div>
        </div>
        {/* GPS 说明 */}
        <div className="mx-1 -mt-1 mb-1 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
          <Navigation size={15} color={C.primary} />
          <div><b className="text-[12px]" style={{ color: C.ink }}>正在拉取 GPS 定位</b><span className="ml-1 text-[11px]" style={{ color: C.sub }}>室内影响信号，室外更易获取</span></div>
        </div>
      </div>

      {/* 三操作 */}
      <div className="grid grid-cols-3 gap-3">
        {actions.map((a: any) => (
          <button key={a.label} onClick={a.on} className="flex flex-col items-center gap-1.5 rounded-[18px] bg-white py-3 shadow-sm active:scale-95">
            <span className="grid h-11 w-11 place-items-center rounded-full" style={a.hi ? { background: G.primary, color: '#fff' } : { border: `1.5px solid ${C.primary}`, color: C.primary }}>
              <a.icon size={19} color={a.hi ? '#fff' : C.primary} />
            </span>
            <span className="text-[12px] font-semibold" style={{ color: a.hi ? C.primary : C.ink }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* 电子围栏 */}
      <Card onClick={() => openSub('fence')} className="!p-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><Shield size={20} color={C.primary} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>电子围栏</b><span className="text-[11px]" style={{ color: C.sub }}>小区范围 · {pet.name}在区域内</span></div>
          <span className="text-[12px] font-semibold" style={{ color: C.primary }}>设置</span>
          <ChevronRight size={16} color={C.faint} />
        </div>
      </Card>

      {/* 离栏提醒 */}
      <Card className="!p-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: '#e6f7ee' }}><Bell size={19} color={C.green} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>离栏提醒</b><span className="text-[11px]" style={{ color: C.sub }}>{pet.name}离开围栏立即通知你</span></div>
          <button className={`toggle ${fenceAlert ? 'on' : ''}`} aria-label="离栏提醒" onClick={() => { setFenceAlert(!fenceAlert); toast(fenceAlert ? 'info' : 'success', `离栏提醒已${fenceAlert ? '关闭' : '开启'}`) }} />
        </div>
      </Card>

      {/* 提示 */}
      <div className="rounded-2xl bg-[#eef2f8] p-3.5">
        <span className="mb-1.5 inline-block rounded-md bg-white px-2 py-0.5 text-[11px] font-bold" style={{ color: C.sub }}>提示</span>
        <p className="text-[12px] leading-relaxed" style={{ color: '#5a6b86' }}>
          {seeking
            ? `已开启"去寻宠"：定位每 5~10 秒刷新一次，正在实时追踪${pet.name}的位置。`
            : <>项圈常规模式下每 <b>5 分钟</b>更新一次定位，当前显示为上一次的位置状态。如需实时追踪，请开启 <b style={{ color: C.primary }}>去寻宠</b>（定位每 5~10 秒刷新一次）。</>}
        </p>
      </div>
    </>
  )
}