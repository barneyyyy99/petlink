import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 手机端专属的轻量 UI 状态（与桌面版隔离，不污染主 store）
type MobileUi = {
  /** 手机桌宠悬浮窗开关 */
  bubble: boolean
  setBubble: (v: boolean) => void
  /** 百度账号显示名（接入真实 UUAP/OAuth 前的占位） */
  baiduName: string | null
  setBaiduName: (v: string | null) => void
  /** 首页"叫它"呼唤弹窗 */
  callSheet: boolean
  setCallSheet: (v: boolean) => void
  /** 预录呼唤短语（叫它弹窗 / 声音库共享） */
  phrases: string[]
  addPhrase: (p: string) => void
  removePhrase: (p: string) => void
  /** 健康下钻详情主题 */
  healthTopic: 'behavior' | 'motion' | 'rest'
  setHealthTopic: (v: 'behavior' | 'motion' | 'rest') => void
}

export const useMobileUi = create<MobileUi>()(
  persist(
    (set) => ({
      bubble: false,
      setBubble: (v) => set({ bubble: v }),
      baiduName: null,
      setBaiduName: (v) => set({ baiduName: v }),
      callSheet: false,
      setCallSheet: (v) => set({ callSheet: v }),
      phrases: ['豆豆～', '过来', '好棒'],
      addPhrase: (p) => set((s) => (p.trim() && !s.phrases.includes(p.trim()) ? { phrases: [...s.phrases, p.trim()] } : {})),
      removePhrase: (p) => set((s) => ({ phrases: s.phrases.filter((x) => x !== p) })),
      healthTopic: 'behavior',
      setHealthTopic: (v) => set({ healthTopic: v }),
    }),
    { name: 'petlink-mobile-ui' },
  ),
)
