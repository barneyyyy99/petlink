import { useStore } from '@/store/useStore'
import { useAuth } from '@/store/useAuth'
import { UserPlus, Crown, Shield, Eye } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { SubScreen } from '@/mobile/nav'

const ROLE = { owner: { icon: Crown, label: '管理员', color: '#F59E3C' }, admin: { icon: Shield, label: '家人', color: '#3D7FFF' }, guest: { icon: Eye, label: '访客', color: '#8A90A0' } }

export function FamilyScreen() {
  const toast = useStore((s) => s.toast)
  const authUser = useAuth((s) => s.user)
  const me = authUser?.email?.split('@')[0] ?? 'Jin'

  const members = [
    { id: 'm1', name: me, role: 'owner' as const, sub: '创建者 · 本机' },
    { id: 'm2', name: '家人 · 妈妈', role: 'admin' as const, sub: '可操作设备与查看' },
    { id: 'm3', name: '邻居 · 小王', role: 'guest' as const, sub: '仅可查看位置' },
  ]

  return (
    <SubScreen title="我的家庭" right="邀请" onRight={() => toast('info', '已生成家庭邀请码（演示）')}>
      <Card className="!p-4" style={{ background: G.soft }}>
        <div className="flex items-center justify-between">
          <div><b className="text-[16px]" style={{ color: C.ink }}>豆豆的家</b><p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>家庭 ID 已同步 · {members.length} 位成员</p></div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: '#fff' }}>🏡</span>
        </div>
      </Card>

      <div className="mb-2 mt-4 px-1 text-[13px] font-bold" style={{ color: C.ink }}>家庭成员</div>
      <div className="overflow-hidden rounded-[18px] bg-white shadow-sm">
        {members.map((m, i) => {
          const r = ROLE[m.role]
          return (
            <div key={m.id} className={`flex items-center gap-3 p-3.5 ${i < members.length - 1 ? 'border-b border-[#f0f2f7]' : ''}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white text-[15px]" style={{ background: G.primary }}>{m.name[0]}</span>
              <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>{m.name}</b><span className="text-[11px]" style={{ color: C.sub }}>{m.sub}</span></div>
              <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: '#f4f7fc', color: r.color }}><r.icon size={12} /> {r.label}</span>
            </div>
          )
        })}
      </div>

      <button onClick={() => toast('info', '已生成家庭邀请码（演示）')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-[14px] font-bold text-white" style={{ background: G.primary }}>
        <UserPlus size={17} /> 邀请家人加入
      </button>
    </SubScreen>
  )
}
