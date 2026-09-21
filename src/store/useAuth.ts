import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase, isCloudEnabled } from '@/lib/supabase'
import { startCloudSync, stopCloudSync, pullFromCloud } from '@/lib/cloudSync'

const HOME_KEY = 'petlink-home-owner'
const storedHome = () => (typeof localStorage !== 'undefined' ? localStorage.getItem(HOME_KEY) : null)
const setStoredHome = (v: string | null) => {
  if (typeof localStorage === 'undefined') return
  if (v) localStorage.setItem(HOME_KEY, v)
  else localStorage.removeItem(HOME_KEY)
}

type AuthState = {
  ready: boolean
  user: User | null
  syncing: boolean
  error: string | null
  recovery: boolean
  /** 当前查看/同步的家庭 owner；null 表示自己的家 */
  homeOwnerId: string | null
  init: () => void
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  updatePassword: (password: string) => Promise<boolean>
  joinHome: (ownerId: string) => Promise<boolean>
  leaveHome: () => Promise<void>
  setSyncing: (v: boolean) => void
}

/** 实际同步的 app_state 行归属者 */
function effectiveHomeId(user: User | null, homeOwnerId: string | null): string | null {
  if (!user) return null
  return homeOwnerId || user.id
}

export const useAuth = create<AuthState>((set, get) => ({
  ready: !isCloudEnabled, // 未配置云端时视为已就绪（纯本地）
  user: null,
  syncing: false,
  error: null,
  recovery: false,
  homeOwnerId: storedHome(),

  init: () => {
    if (!supabase) {
      set({ ready: true })
      return
    }
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null
      set({ user, ready: true })
      const home = effectiveHomeId(user, get().homeOwnerId)
      if (user && home) {
        await pullFromCloud(home)
        startCloudSync(home)
      }
    })
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        set({ recovery: true })
        return
      }
      const user = session?.user ?? null
      const prev = get().user
      set({ user })
      const home = effectiveHomeId(user, get().homeOwnerId)
      if (user && home && user.id !== prev?.id) {
        set({ syncing: true })
        await pullFromCloud(home)
        startCloudSync(home)
        set({ syncing: false })
      } else if (!user) {
        stopCloudSync()
      }
    })
  },

  signUp: async (email, password) => {
    if (!supabase) return
    set({ error: null })
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) set({ error: error.message })
  },

  signIn: async (email, password) => {
    if (!supabase) return
    set({ error: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) set({ error: error.message })
  },

  signOut: async () => {
    if (!supabase) return
    stopCloudSync()
    await supabase.auth.signOut()
    set({ user: null })
  },

  resetPassword: async (email) => {
    if (!supabase || !email) return false
    set({ error: null })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) {
      set({ error: error.message })
      return false
    }
    return true
  },

  updatePassword: async (password) => {
    if (!supabase) return false
    set({ error: null })
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      set({ error: error.message })
      return false
    }
    set({ recovery: false })
    return true
  },

  joinHome: async (ownerId) => {
    const { user } = get()
    if (!supabase || !user) return false
    const id = ownerId.trim()
    if (!id) return false
    if (id === user.id) {
      set({ error: '这是你自己的家庭 ID' })
      return false
    }
    const { error } = await supabase.from('home_members').upsert(
      { owner_id: id, member_id: user.id },
      { onConflict: 'owner_id,member_id' },
    )
    if (error) {
      set({ error: error.message })
      return false
    }
    setStoredHome(id)
    set({ homeOwnerId: id, syncing: true })
    stopCloudSync()
    await pullFromCloud(id)
    startCloudSync(id)
    set({ syncing: false })
    return true
  },

  leaveHome: async () => {
    const { user, homeOwnerId } = get()
    if (!supabase || !user) return
    if (homeOwnerId && homeOwnerId !== user.id) {
      await supabase.from('home_members').delete().eq('owner_id', homeOwnerId).eq('member_id', user.id)
    }
    setStoredHome(null)
    set({ homeOwnerId: null, syncing: true })
    stopCloudSync()
    await pullFromCloud(user.id)
    startCloudSync(user.id)
    set({ syncing: false })
  },

  setSyncing: (v) => set({ syncing: v }),
}))
