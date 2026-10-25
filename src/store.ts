import { create } from 'zustand'
import { ROOMS, ROOM_BY_ID, type RoomId } from './content/rooms'

export type AchievementId = 'all-rooms' | 'easter-egg' | 'parking-sim'

export const ACHIEVEMENTS: Record<AchievementId, { title: string; detail: string; xp: number }> = {
  'all-rooms': { title: 'Opened every room', detail: 'All 8 rooms commissioned.', xp: 300 },
  'easter-egg': { title: 'Found the easter egg', detail: 'The lighthouse signs its name.', xp: 200 },
  'parking-sim': { title: 'Ran the parking sim', detail: 'Event-driven beats a 1 Hz stream.', xp: 200 },
}

export type Toast =
  | { key: number; kind: 'room'; room: RoomId; xp: number }
  | { key: number; kind: 'achievement'; id: AchievementId; xp: number }

type Mode = 'game' | 'list'

type State = {
  mode: Mode
  /** Why the 2D mode was forced, if it was */
  fallback: 'webgl' | null
  started: boolean
  sceneReady: boolean
  commissioned: RoomId[]
  activeRoom: RoomId | null
  panelOpen: boolean
  xp: number
  achievements: AchievementId[]
  toasts: Toast[]
  handoverOpen: boolean
  handoverSeen: boolean
  sound: boolean
  /** Level the engineer stands on, and whether he is on the lift */
  level: number
  onLift: boolean
  /** A room the visitor asked to walk to (mini-map, panel, keyboard) */
  travel: { room: RoomId; key: number } | null
  liftRequest: { level: number; key: number } | null
  parking: { running: boolean; sent: number; stream: number; seconds: number }

  setMode: (m: Mode) => void
  forceFallback: () => void
  start: () => void
  setSceneReady: () => void
  enterRoom: (id: RoomId | null) => void
  closePanel: () => void
  openPanel: (id: RoomId) => void
  unlock: (id: AchievementId) => void
  dismissToast: (key: number) => void
  setHandover: (open: boolean) => void
  toggleSound: () => void
  setLevel: (level: number, onLift: boolean) => void
  travelTo: (room: RoomId) => void
  requestLift: (level: number) => void
  setParking: (p: Partial<State['parking']>) => void
}

let toastKey = 0

const initialMode = (): Mode => {
  if (typeof window === 'undefined') return 'game'
  const q = new URLSearchParams(window.location.search)
  if (window.location.pathname.startsWith('/list') || q.get('view') === 'list' || window.location.hash === '#list') return 'list'
  return 'game'
}

export const useStore = create<State>((set, get) => ({
  mode: initialMode(),
  fallback: null,
  started: false,
  sceneReady: false,
  commissioned: [],
  activeRoom: null,
  panelOpen: false,
  xp: 0,
  achievements: [],
  toasts: [],
  handoverOpen: false,
  handoverSeen: false,
  sound: false,
  level: 0,
  onLift: false,
  travel: null,
  liftRequest: null,
  parking: { running: false, sent: 0, stream: 0, seconds: 0 },

  setMode: (mode) => {
    set({ mode })
    const url = new URL(window.location.href)
    url.pathname = mode === 'list' ? '/list' : '/'
    url.searchParams.delete('view')
    url.hash = ''
    window.history.replaceState(null, '', url)
  },
  forceFallback: () => set({ mode: 'list', fallback: 'webgl' }),
  start: () => set({ started: true }),
  setSceneReady: () => set({ sceneReady: true }),

  enterRoom: (id) => {
    const s = get()
    if (id === s.activeRoom) return
    if (!id) {
      set({ activeRoom: null, panelOpen: false })
      return
    }
    const fresh = !s.commissioned.includes(id)
    if (!fresh) {
      set({ activeRoom: id, panelOpen: true })
      return
    }
    const xp = ROOM_BY_ID[id].xp
    const commissioned = [...s.commissioned, id]
    set({
      activeRoom: id,
      panelOpen: true,
      commissioned,
      xp: s.xp + xp,
      toasts: [...s.toasts, { key: ++toastKey, kind: 'room', room: id, xp }],
    })
    if (commissioned.length === ROOMS.length) {
      window.setTimeout(() => {
        get().unlock('all-rooms')
        set({ handoverOpen: true, handoverSeen: true })
      }, 2600)
    }
  },
  closePanel: () => set({ panelOpen: false }),
  openPanel: (id) => set({ activeRoom: id, panelOpen: true }),

  unlock: (id) => {
    const s = get()
    if (s.achievements.includes(id)) return
    const xp = ACHIEVEMENTS[id].xp
    set({
      achievements: [...s.achievements, id],
      xp: s.xp + xp,
      toasts: [...s.toasts, { key: ++toastKey, kind: 'achievement', id, xp }],
    })
  },
  dismissToast: (key) => set({ toasts: get().toasts.filter((t) => t.key !== key) }),
  setHandover: (handoverOpen) => set({ handoverOpen, handoverSeen: true }),
  toggleSound: () => set({ sound: !get().sound }),
  setLevel: (level, onLift) => {
    const s = get()
    if (s.level !== level || s.onLift !== onLift) set({ level, onLift })
  },
  travelTo: (room) => set({ travel: { room, key: ++toastKey }, started: true }),
  requestLift: (level) => set({ liftRequest: { level, key: ++toastKey } }),
  setParking: (p) => set({ parking: { ...get().parking, ...p } }),
}))

if (typeof window !== 'undefined' && (import.meta.env.DEV || location.search.includes('debug'))) (window as unknown as { __store: typeof useStore }).__store = useStore
