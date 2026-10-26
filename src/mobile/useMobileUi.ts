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
    }),
    { name: 'petlink-mobile-ui' },
  ),
)
