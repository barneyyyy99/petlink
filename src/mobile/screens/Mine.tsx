import { useStore } from '@/store/useStore'
import { useAuth } from '@/store/useAuth'
import { ensureNotificationPermission, notificationPermission, notificationsSupported } from '@/lib/notify'
import {
  MonitorSmartphone, Home, Cpu, Cloud, Zap, PawPrint, Radio, ChevronRight, Crown,
  Flag, Mic, Bell, RotateCcw, Images, FileText, HelpCircle, Info,
} from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { useNav } from '@/mobile/nav'

type Row = { icon: any; title: string; sub: string; tag?: string; on: () => void }

export function Mine() {
  const openModal = useStore((s) => s.openModal)
  const resetDemo = useStore((s) => s.resetDemo)
  const toast = useStore((s) => s.toast)
  const authUser = useAuth((s) => s.user)
  const { openSub } = useNav()

  const enableNotify = async () => {
    if (!notificationsSupported()) return toast('warn', '当前浏览器不支持通知')
    const ok = await ensureNotificationPermission()
    toast(ok ? 'success' : 'warn', ok ? '已开启通知' : '通知未授权')
  }

  const email = authUser?.email ?? ''
  const main: Row[] = [
    { icon: MonitorSmartphone, title: '桌宠小窗', sub: '在电脑/桌面显示毛孩子数字分身', on: () => openSub('widget') },
    { icon: Home, title: '我的家庭', sub: '家庭成员、设备与宠物管理', tag: '1 个', on: () => openSub('family') },
    { icon: Cpu, title: '我的设备', sub: '项圈、喂食器等智能设备管理', on: () => openSub('linked') },
    { icon: Cloud, title: '账号与云端同步', sub: '家庭 ID、多端数据同步与备份', tag: authUser ? '已同步' : '未登录', on: () => openSub('account') },
    { icon: Zap, title: '全屋自动联动', sub: '温控、投喂、回家欢迎等场景规则', tag: '4 条', on: () => openSub('linked') },
    { icon: PawPrint, title: '毛茸茸好友', sub: '发现附近萌宠，结识同好一起遛弯', on: () => openModal('friends') },
    { icon: Radio, title: '项圈设置', sub: '定位、行为识别、围栏与联动设备', on: () => openSub('collar') },
  ]

  // 完整版独有能力，补充到手机端
  const extra: Row[] = [
    { icon: Flag, title: '走失互寻', sub: '共享定位、发布寻宠并提醒附近会员', on: () => openModal('lost') },
    { icon: Mic, title: '主人声音', sub: '录制声线并在音箱 / 智能屏远程播放', on: () => openSub('voice') },
    { icon: Bell, title: '消息通知', sub: '走失 / 铃铛 / 陪伴提醒推送到通知栏', tag: notificationPermission() === 'granted' ? '已开启' : '去开启', on: enableNotify },
    { icon: RotateCcw, title: '恢复演示数据', sub: '重置所有本地编辑（户型/设备/规则等）', on: () => { if (confirm('确定恢复演示数据？当前所有本地编辑将被重置。')) resetDemo() } },
  ]

  const more = [
    { icon: FileText, title: '隐私政策', on: () => toast('info', '隐私政策（示例页）') },
    { icon: HelpCircle, title: '常见问题 · 图标说明', on: () => toast('info', '常见问题（示例页）') },
    { icon: Info, title: '关于我们', on: () => toast('info', '关于我们（示例页）') },
    { icon: Images, title: '我的相册', on: () => openSub('album') },
  ]

  return (
    <div className="flex flex-col gap-3.5">
      {/* 用户资料 */}
      <Card onClick={() => openSub('account')} className="!p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl text-white" style={{ background: G.primary }}>{(email[0] ?? 'T').toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <b className="text-[17px]" style={{ color: C.ink }}>{authUser ? (email.split('@')[0] || '我') : 'twinkle'}</b>
            <p className="truncate text-[12px]" style={{ color: C.sub }}>{authUser ? email : 'eihaozaijian · 点此登录云同步'}</p>
          </div>
          <ChevronRight size={18} color={C.faint} />
        </div>
      </Card>

      {/* 小度 Care 付费 */}
      <Card className="!p-4" style={{ background: 'linear-gradient(135deg,#2E3850,#1C2436)' }}>
        <div className="flex items-center gap-3 text-white">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12"><Crown size={20} color="#FFD56A" /></span>
          <div className="min-w-0 flex-1">
            <b className="text-[14px]">小度 Care · 为爱宠的健康付费</b>
            <p className="text-[11px] text-white/60">AI 问诊 / 专属行为模型 / 无限记忆存储</p>
          </div>
          <button className="shrink-0 rounded-full bg-[#FFD56A] px-3 py-1.5 text-[12px] font-bold" style={{ color: '#5a4410' }} onClick={() => openSub('care')}>去开通</button>
        </div>
      </Card>
      {/* 主功能列表 */}
      <RowList rows={main} />

      <div className="px-1 text-[12px] font-bold" style={{ color: C.sub }}>更多能力</div>
      <RowList rows={extra} />

      {/* 更多 */}
      <div className="px-1 text-[12px] font-bold" style={{ color: C.sub }}>更多</div>
      <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_20px_rgba(31,60,120,.07)]">
        {more.map((m, i) => (
          <button key={m.title} onClick={m.on} className={`flex w-full items-center gap-3 p-3.5 text-left active:bg-[#f4f7fc] ${i < more.length - 1 ? 'border-b border-[#f0f2f7]' : ''}`}>
            <m.icon size={18} color={C.sub} />
            <span className="flex-1 text-[14px]" style={{ color: C.ink }}>{m.title}</span>
            <ChevronRight size={16} color={C.faint} />
          </button>
        ))}
      </div>

      <p className="pb-2 pt-1 text-center text-[11px]" style={{ color: C.faint }}>小度 · 智能项圈 · 全屋宠物陪伴</p>
    </div>
  )
}

function RowList({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_20px_rgba(31,60,120,.07)]">
      {rows.map((r, i) => (
        <button key={r.title} onClick={r.on} className={`flex w-full items-center gap-3 p-3.5 text-left active:bg-[#f4f7fc] ${i < rows.length - 1 ? 'border-b border-[#f0f2f7]' : ''}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><r.icon size={19} color={C.primary} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>{r.title}</b><span className="text-[11px]" style={{ color: C.sub }}>{r.sub}</span></div>
          {r.tag && <span className="shrink-0 text-[12px] font-semibold" style={{ color: C.sub }}>{r.tag}</span>}
          <ChevronRight size={16} color={C.faint} />
        </button>
      ))}
    </div>
  )
}
