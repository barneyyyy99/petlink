import { useState } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { PetFace } from '@/components/PetFace'
import { Search, Bell, ChevronDown, ChevronRight, Eye, Volume2, Video, Utensils, Users, BookHeart, PawPrint, ClipboardList, Radio } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { useNav } from '@/mobile/nav'
import { useMobileUi } from '@/mobile/useMobileUi'
import type { MTab } from '@/mobile/MobileApp'

type Range = '日' | '周' | '月'
const LOG_BY: Record<Range, { t: string; s: string }[]> = {
  日: [
    { t: '09:20', s: '窗边晒太阳 30 分钟 ☀️' },
    { t: '12:40', s: '自动喂食 15g，吃光光 🍚' },
    { t: '15:10', s: '追逗猫棒跑了 8 圈 🏃' },
    { t: '20:30', s: '呼噜入睡，心情很好 😴' },
  ],
  周: [
    { t: '周一', s: '活动量最高的一天，跑了 12 圈' },
    { t: '周三', s: '午后小睡偏多，睡眠 14.2h' },
    { t: '周五', s: '进食规律，食量平稳' },
    { t: '周日', s: '窗边晒太阳时间最长' },
  ],
  月: [
    { t: '第1周', s: '整体活力稳定，均分 90' },
    { t: '第2周', s: '运动量上升，日均 4800 步' },
    { t: '第3周', s: '睡眠略增，日均 13.4h' },
    { t: '第4周', s: '状态良好，无异常行为' },
  ],
}
const STAT_BY: Record<Range, { steps: string; stepsLabel: string; sleep: string; sleepLabel: string; vigor: string }> = {
  日: { steps: '4126', stepsLabel: '步 · 今日', sleep: '13.5', sleepLabel: '睡眠时长', vigor: '92' },
  周: { steps: '2.8万', stepsLabel: '步 · 本周', sleep: '13.1', sleepLabel: '日均睡眠', vigor: '90' },
  月: { steps: '11.6万', stepsLabel: '步 · 本月', sleep: '12.8', sleepLabel: '日均睡眠', vigor: '88' },
}

export function Devices({ go }: { go: (t: MTab) => void }) {
  const pet = useStore((s) => s.pet)
  const room = useStore(currentRoom)
  const devices = useStore((s) => s.devices)
  const openCamera = useStore((s) => s.openCamera)
  const openModal = useStore((s) => s.openModal)
  const toggleDrawer = useStore((s) => s.toggleDrawer)
  const setDeviceControlTarget = useStore((s) => s.setDeviceControlTarget)
  const toast = useStore((s) => s.toast)
  const { openSub } = useNav()
  const setCallSheet = useMobileUi((s) => s.setCallSheet)
  const [logRange, setLogRange] = useState<Range>('日')

  const feeder = devices.find((d) => d.type === 'feeder')
  const stat = STAT_BY[logRange]
  const now = new Date()
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toTimeString().slice(0, 8)}`

  const acts = [
    { icon: Eye, label: '看它', on: () => openCamera() },
    { icon: Volume2, label: '叫它', on: () => setCallSheet(true) },
    { icon: Video, label: '远程陪伴', on: () => openCamera(true) },
    { icon: Utensils, label: '投喂', on: () => setDeviceControlTarget({ deviceId: feeder?.id ?? '' }) },
  ]
  const shortcuts = [
    { icon: Users, label: '家庭成员', on: () => openSub('family') },
    { icon: BookHeart, label: '宠物日记', on: () => openSub('diary') },
    { icon: PawPrint, label: '毛茸茸好友', on: () => openModal('friends') },
    { icon: ClipboardList, label: '活动记录', on: () => toggleDrawer(true) },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* 天气 + 通知 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[15px]" style={{ color: C.ink }}>
          <MapPinDot /> 北京 · 12~19℃ 晴
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-white/70" onClick={() => toast('info', '没有新的异常通知')}>
          <Bell size={18} color={C.ink} />
        </button>
      </div>

      {/* 搜索 */}
      <div className="flex items-center gap-2 rounded-full bg-white px-4 shadow-[0_4px_14px_rgba(31,60,120,.06)]" style={{ height: 40 }}>
        <Search size={17} color={C.faint} />
        <input readOnly onClick={() => toast('info', '搜索功能开发中')} placeholder="搜索设备 / 功能，如 喂食、围栏、相册" className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#b9bec9]" />
      </div>

      {/* 我的家 + 宠物 */}
      <div className="flex items-center justify-between px-1">
        <button className="flex items-center gap-1 text-[18px] font-extrabold" style={{ color: C.ink }} onClick={() => openModal('auth')}>
          我的家 <ChevronDown size={18} color={C.sub} />
        </button>
        <button className="flex items-center gap-2 rounded-full bg-white px-1.5 py-1 pr-3 shadow-sm" onClick={() => openModal('avatar')}>
          <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-[#fff2d6]"><PetFace pet={pet} size={28} /></span>
          <b className="text-[13px]" style={{ color: C.ink }}>{pet.name}</b>
          <ChevronDown size={14} color={C.sub} />
        </button>
      </div>

      {/* 定位主卡（天空渐变） */}
      <div className="relative overflow-hidden rounded-[18px]" style={{ height: 224, background: G.sky }}>
        <div className="absolute left-4 top-4">
          <div className="text-[17px] font-extrabold" style={{ color: '#20324f' }}>{pet.name}的家 · {room?.name ?? '客厅'}</div>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-0.5 text-[12px] font-semibold" style={{ color: '#2b5a8c' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#28c76f]" /> 在家 · 实时
          </div>
          <div className="mt-1 text-[11px]" style={{ color: 'rgba(32,50,79,.7)' }}>{stamp}</div>
        </div>
        {/* 宠物站在地平线 */}
        <div className="absolute bottom-[58px] left-1/2 h-[120px] w-[120px] -translate-x-1/2 drop-shadow-[0_8px_10px_rgba(80,70,40,.25)]">
          <PetFace pet={pet} size={120} />
        </div>
        {/* 操作 pills */}
        <div className="absolute inset-x-3 bottom-3 flex justify-between gap-2">
          {acts.map((a) => (
            <button key={a.label} onClick={a.on} className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-white/92 py-2 text-[11px] font-bold shadow-sm active:scale-95" style={{ color: C.ink }}>
              <a.icon size={17} color={C.primary} /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* 快捷 */}
      <div className="grid grid-cols-4 gap-1">
        {shortcuts.map((s) => (
          <button key={s.label} onClick={s.on} className="flex flex-col items-center gap-1.5 py-1.5">
            <span className="grid h-11 w-11 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><s.icon size={20} color={C.primary} /></span>
            <span className="text-[11px]" style={{ color: C.ink }}>{s.label}</span>
          </button>
        ))}
      </div>
      {/* 今日日志（米白↔蓝 中间色卡） */}
      <div className="mb-2.5 mt-1 flex items-center justify-between px-1">
        <h3 className="text-[16px] font-bold" style={{ color: C.ink }}>{pet.name}{logRange === '日' ? '今日' : logRange === '周' ? '本周' : '本月'}日志</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-white/70 p-0.5">
            {(['日', '周', '月'] as Range[]).map((r) => (
              <button key={r} onClick={() => setLogRange(r)} className="rounded-full px-2.5 py-1 text-[12px] font-bold" style={logRange === r ? { background: C.primary, color: '#fff' } : { color: C.sub }}>{r}</button>
            ))}
          </div>
          <button className="text-[12px] font-semibold" style={{ color: C.sub }} onClick={() => go('health')}>全部 ›</button>
        </div>
      </div>
      <div className="overflow-hidden rounded-[18px] p-4" style={{ background: 'linear-gradient(135deg,#F1EDE4 0%,#DCE4F3 100%)', color: C.ink }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🐾</span>
          <b className="text-[14px]" style={{ color: C.ink }}>{logRange === '日' ? `今天${pet.name}过得还不错～` : logRange === '周' ? `这一周${pet.name}状态很稳定～` : `这个月${pet.name}整体很健康～`}</b>
          <span className="ml-auto text-[11px]" style={{ color: C.sub }}>{String(now.getMonth() + 1).padStart(2, '0')}-{String(now.getDate()).padStart(2, '0')} 推送</span>
        </div>
        <div className="my-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl py-2.5" style={{ background: 'rgba(255,255,255,.55)' }}><b className="block text-[18px]" style={{ color: C.ink }}>{stat.steps}</b><span className="text-[10px]" style={{ color: C.sub }}>{stat.stepsLabel}</span></div>
          <div className="rounded-2xl py-2.5" style={{ background: 'rgba(255,255,255,.55)' }}><b className="block text-[18px]" style={{ color: C.ink }}>{stat.sleep}<span className="text-[11px]">h</span></b><span className="text-[10px]" style={{ color: C.sub }}>{stat.sleepLabel}</span></div>
          <div className="rounded-2xl py-2.5" style={{ background: 'rgba(255,255,255,.55)' }}><b className="block text-[18px]" style={{ color: C.primary }}>{stat.vigor}</b><span className="text-[10px]" style={{ color: C.sub }}>活力分</span></div>
        </div>
        <div className="flex flex-col gap-2">
          {LOG_BY[logRange].map((l) => (
            <div key={l.t} className="flex items-center gap-3 text-[12px]">
              <span className="w-[42px] shrink-0 font-semibold" style={{ color: C.primary }}>{l.t}</span>
              <span style={{ color: '#4a5366' }}>{l.s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 项圈设置 */}
      <Card onClick={() => openSub('collar')} className="!p-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><Radio size={20} color={C.primary} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>项圈设置</b><span className="text-[11px]" style={{ color: C.sub }}>定位、模式、提醒、固件升级</span></div>
          <ChevronRight size={18} color={C.faint} />
        </div>
      </Card>
    </div>
  )
}

function MapPinDot() {
  return <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: C.primarySoft }}><span className="h-2 w-2 rounded-full" style={{ background: C.primary }} /></span>
}
