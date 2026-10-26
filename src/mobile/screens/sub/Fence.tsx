import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Bell, Phone, MapPin } from 'lucide-react'
import { C } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { SubScreen } from '@/mobile/nav'

export function FenceScreen() {
  const pet = useStore((s) => s.pet)
  const toast = useStore((s) => s.toast)
  const [radius, setRadius] = useState(300)
  const [push, setPush] = useState(true)
  const [sms, setSms] = useState(true)
  const [autoFind, setAutoFind] = useState(true)

  // 半径 → 圆显示比例（100~1000m 映射到 36~92 的半径像素）
  const rPx = 36 + ((radius - 100) / 900) * 56

  const toggles = [
    { icon: Bell, bg: '#e6f7ee', color: C.green, title: 'APP 推送提醒', sub: `${pet.name}离开 / 进入围栏时推送`, on: push, set: setPush },
    { icon: Phone, bg: '#e9efff', color: C.primary, title: '短信提醒', sub: '离栏双重保障，断网也能通知', on: sms, set: setSms },
    { icon: MapPin, bg: '#fff1e6', color: C.orange, title: '离栏自动寻宠', sub: '越界立即切换至高频定位（5~10s）', on: autoFind, set: setAutoFind },
  ]

  return (
    <SubScreen title="电子围栏" right="+ 新建" onRight={() => toast('info', '新建围栏区域开发中')}>
      {/* 围栏地图 */}
      <div className="overflow-hidden rounded-[18px] bg-[#eef3fb]" style={{ height: 210 }}>
        <svg viewBox="0 0 300 210" className="h-full w-full">
          {/* 街道十字 */}
          <rect x="0" y="92" width="300" height="26" fill="#dde6f4" />
          <rect x="132" y="0" width="26" height="210" fill="#dde6f4" />
          <line x1="0" y1="105" x2="300" y2="105" stroke="#c7d3e8" strokeWidth="1.5" strokeDasharray="8 8" />
          <line x1="145" y1="0" x2="145" y2="210" stroke="#c7d3e8" strokeWidth="1.5" strokeDasharray="8 8" />
          {/* 围栏圆 */}
          <circle cx="150" cy="105" r={rPx} fill={C.primary} fillOpacity="0.1" stroke={C.primary} strokeWidth="2.5" strokeDasharray="6 6" />
          {/* 宠物 */}
          <circle cx="150" cy="105" r="15" fill="#fff" stroke={C.primary} strokeWidth="2.5" />
          <text x="150" y="111" textAnchor="middle" fontSize="16">🐱</text>
        </svg>
      </div>

      {/* 半径 */}
      <Card className="mt-3 !p-4">
        <div className="flex items-center justify-between">
          <b className="text-[15px]" style={{ color: C.ink }}>围栏半径</b>
          <b className="text-[18px]" style={{ color: C.primary }}>{radius} m</b>
        </div>
        <input type="range" min={100} max={1000} step={50} value={radius} onChange={(e) => setRadius(+e.target.value)} className="mt-2 w-full accent-[#3D7FFF]" />
        <div className="mt-1 flex justify-between text-[11px]" style={{ color: C.faint }}>
          <span>100m</span><span>500m</span><span>1000m</span>
        </div>
      </Card>

      {/* 提醒开关 */}
      <div className="mt-3 flex flex-col gap-2.5">
        {toggles.map((t) => (
          <Card key={t.title} className="!p-3.5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: t.bg }}><t.icon size={19} color={t.color} /></span>
              <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>{t.title}</b><span className="text-[11px]" style={{ color: C.sub }}>{t.sub}</span></div>
              <button className={`toggle ${t.on ? 'on' : ''}`} aria-label={t.title} onClick={() => { t.set(!t.on); toast(t.on ? 'info' : 'success', `${t.title}已${t.on ? '关闭' : '开启'}`) }} />
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-3 rounded-xl bg-[#eef4ff] px-3 py-2.5 text-[11px] leading-relaxed" style={{ color: '#5a6b86' }}>
        已开启离栏提醒：{pet.name}越过围栏范围会第一时间推送，并自动切到高频定位帮助寻回。
      </p>
    </SubScreen>
  )
}
