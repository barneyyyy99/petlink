import { useStore, currentRoom } from '@/store/useStore'
import { PetFace } from '@/components/PetFace'
import { Monitor, Smartphone, Download } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { SubScreen } from '@/mobile/nav'
import { useMobileUi } from '@/mobile/useMobileUi'

export function WidgetScreen() {
  const pet = useStore((s) => s.pet)
  const room = useStore(currentRoom)
  const setWidgetMode = useStore((s) => s.setWidgetMode)
  const toast = useStore((s) => s.toast)
  const bubble = useMobileUi((s) => s.bubble)
  const setBubble = useMobileUi((s) => s.setBubble)

  return (
    <SubScreen title="桌宠小窗" dark>
      {/* 预览 */}
      <div className="overflow-hidden rounded-[22px] p-5" style={{ background: G.night }}>
        <div className="grid place-items-center">
          <div className="relative grid h-[200px] w-full place-items-center rounded-[18px] bg-white/8" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(127,180,255,.25), transparent 60%)' }}>
            <div className="grid h-[120px] w-[120px] place-items-center overflow-hidden rounded-full bg-white/10"><PetFace pet={pet} size={120} /></div>
            <span className="absolute bottom-3 rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/80">{pet.name} · {room?.name ?? '客厅'} · 实时</span>
          </div>
        </div>
        <p className="mt-3 text-center text-[12px] text-white/60">把{pet.name}的数字分身放到屏幕上，随时陪着你</p>
      </div>

      {/* 手机桌宠悬浮窗 */}
      <Card className="mt-3 !p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><Smartphone size={19} color={C.primary} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>手机桌宠悬浮窗</b><span className="text-[11px]" style={{ color: C.sub }}>在 App 内悬浮显示，可拖动</span></div>
          <button className={`toggle ${bubble ? 'on' : ''}`} onClick={() => { setBubble(!bubble); toast('success', bubble ? '已关闭桌宠悬浮窗' : '已开启桌宠悬浮窗（可拖动）') }} aria-label="桌宠悬浮窗" />
        </div>
      </Card>

      {/* 切换桌宠全屏视图 */}
      <Card className="mt-3 !p-4" onClick={() => setWidgetMode(true)}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><Monitor size={19} color={C.primary} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>进入桌宠视图</b><span className="text-[11px]" style={{ color: C.sub }}>3D 房间 + 实时移动的迷你视图</span></div>
          <span style={{ color: C.faint }}>›</span>
        </div>
      </Card>

      {/* 下载桌面客户端 */}
      <Card className="mt-3 !p-4" onClick={() => toast('info', '桌面客户端下载开发中')}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><Download size={19} color={C.primary} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>下载电脑桌面客户端</b><span className="text-[11px]" style={{ color: C.sub }}>在电脑桌面常驻显示数字分身</span></div>
          <span style={{ color: C.faint }}>›</span>
        </div>
      </Card>
    </SubScreen>
  )
}
