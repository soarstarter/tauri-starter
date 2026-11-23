import { create } from 'zustand'

interface CommandPaletteState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

/** Tiny global store so the header button and the `CmdOrCtrl+K` shortcut can
 * both drive the single mounted palette without prop-drilling. */
export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
}))
