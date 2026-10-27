import { useStore } from '@/store/useStore'
import { C } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { SubScreen } from '@/mobile/nav'
import { useMobileUi } from '@/mobile/useMobileUi'

const DATA = {
  behavior: {
    title: '行为详情', total: '52 分 19 秒', unit: '今日行为总时长',
    bars: [{ l: '嗅闻', v: 15, u: 'm' }, { l: '进食', v: 19, u: 'm' }, { l: '舔毛', v: 14, u: 'm' }, { l: '逗猫', v: 3, u: 'm' }, { l: '打滚', v: 0.3, u: 'm' }],
    note: '行为分布正常。舔毛时间略高多因换季，可增加梳毛频次减少毛球。',
  },
  motion: {
    title: '运动详情', total: '55 分 12 秒', unit: '今日运动总时长',
    bars: [{ l: '步行', v: 38, u: 'm' }, { l: '奔跑', v: 6.1, u: 'm' }, { l: '跳跃', v: 1.9, u: 'm' }, { l: '攀爬', v: 4, u: 'm' }, { l: '玩耍', v: 5, u: 'm' }],
    note: '奔跑时长较昨日偏高（标记异常），注意是否受惊或追逐；持续偏高建议观察。',
  },
  rest: {
    title: '休息详情', total: '20 时 41 分', unit: '今日休息总时长',
    bars: [{ l: '深睡', v: 8.1, u: 'h' }, { l: '浅睡', v: 5.0, u: 'h' }, { l: '休息', v: 7.6, u: 'h' }],
    note: '睡眠结构良好，深睡占比健康。保持安静舒适的休息区有助于睡眠质量。',
  },
} as const

export function HealthDetailScreen() {
  const topic = useMobileUi((s) => s.healthTopic)
  const pet = useStore((s) => s.pet)
  const d = DATA[topic]
  const max = Math.max(...d.bars.map((b) => b.v))

  return (
    <SubScreen title={d.title}>
      <Card className="!p-4">
        <div className="text-[12px]" style={{ color: C.sub }}>{pet.name} · {d.unit}</div>
        <b className="text-[26px]" style={{ color: C.primary }}>{d.total}</b>
      </Card>

      <Card className="mt-3">
        <div className="mb-3 text-[13px] font-bold" style={{ color: C.ink }}>分项时长</div>
        <div className="flex flex-col gap-2.5">
          {d.bars.map((b) => (
            <div key={b.l} className="grid grid-cols-[52px_1fr_52px] items-center gap-2 text-[12px]">
              <span style={{ color: C.ink }}>{b.l}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-[#eef2f8]"><i className="block h-full rounded-full" style={{ width: `${(b.v / max) * 100}%`, background: 'linear-gradient(90deg,#7FB4FF,#3D7FFF)' }} /></span>
              <b className="text-right" style={{ color: C.ink }}>{b.v}{b.u}</b>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-3 rounded-2xl bg-[#eef4ff] p-3.5 text-[12px] leading-relaxed" style={{ color: '#5a6b86' }}>
        <b style={{ color: C.primary }}>AI 解读：</b>{d.note}
      </div>
    </SubScreen>
  )
}
