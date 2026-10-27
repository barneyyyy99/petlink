import { useState } from 'react'
import { Crown, Check, Stethoscope, Brain, Database } from 'lucide-react'
import { C } from '@/mobile/theme'
import { SubScreen } from '@/mobile/nav'
import { useStore } from '@/store/useStore'

const PLANS = [
  { k: 'month', name: '连续包月', price: '￥18', unit: '/月', tag: '' },
  { k: 'quarter', name: '连续包季', price: '￥48', unit: '/季', tag: '省 12%' },
  { k: 'year', name: '连续包年', price: '￥158', unit: '/年', tag: '最划算' },
]
const RIGHTS = [
  { icon: Stethoscope, t: 'AI 问诊无限次', s: '随时问诊、结合项圈数据初判' },
  { icon: Brain, t: '专属行为模型', s: '为爱宠单独训练，识别更准' },
  { icon: Database, t: '无限记忆存储', s: '日记 / 相册 / 成长档案云端永久保存' },
  { icon: Crown, t: '尊贵会员身份', s: '专属头像挂件与客服通道' },
]

export function CareScreen() {
  const toast = useStore((s) => s.toast)
  const [plan, setPlan] = useState('quarter')

  return (
    <SubScreen title="小度 Care" dark>
      {/* 头部 */}
      <div className="overflow-hidden rounded-[22px] p-5 text-white" style={{ background: 'linear-gradient(135deg,#2E3850,#141A2A)' }}>
        <div className="flex items-center gap-2"><Crown size={22} color="#FFD56A" /><b className="text-[18px]">小度 Care 会员</b></div>
        <p className="mt-1 text-[12px] text-white/70">为爱宠的健康付费 · AI 问诊 / 专属行为模型 / 无限记忆存储</p>
      </div>

      {/* 套餐 */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {PLANS.map((p) => (
          <button key={p.k} onClick={() => setPlan(p.k)} className="relative rounded-2xl bg-white p-3 text-center shadow-sm" style={plan === p.k ? { outline: `2px solid ${C.primary}` } : {}}>
            {p.tag && <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ background: '#F59E3C' }}>{p.tag}</span>}
            <div className="text-[12px]" style={{ color: C.sub }}>{p.name}</div>
            <b className="text-[18px]" style={{ color: C.primary }}>{p.price}</b>
            <span className="text-[11px]" style={{ color: C.sub }}>{p.unit}</span>
          </button>
        ))}
      </div>

      {/* 权益 */}
      <div className="mt-4 overflow-hidden rounded-[18px] bg-white shadow-sm">
        {RIGHTS.map((r, i) => (
          <div key={r.t} className={`flex items-center gap-3 p-3.5 ${i < RIGHTS.length - 1 ? 'border-b border-[#f0f2f7]' : ''}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><r.icon size={19} color={C.primary} /></span>
            <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>{r.t}</b><span className="text-[11px]" style={{ color: C.sub }}>{r.s}</span></div>
            <Check size={16} color={C.green} />
          </div>
        ))}
      </div>

      <button onClick={() => toast('success', `已选择「${PLANS.find((p) => p.k === plan)?.name}」，支付功能开发中`)} className="mt-4 w-full rounded-full py-3.5 text-[15px] font-bold" style={{ background: 'linear-gradient(90deg,#FFD56A,#F5B93C)', color: '#5a4410' }}>
        立即开通
      </button>
      <p className="mt-2 text-center text-[11px]" style={{ color: C.faint }}>到期自动续费，可随时取消</p>
    </SubScreen>
  )
}
