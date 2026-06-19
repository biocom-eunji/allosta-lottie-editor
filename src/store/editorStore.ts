import { create } from 'zustand'
import type { Params } from '../lottie/controls'

interface EditorState {
  params: Params
  setParam: (key: string, value: Params[string]) => void
  setParams: (params: Params) => void
  resetParams: (defaults: Params) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  params: {},
  setParam: (key, value) => set((s) => ({ params: { ...s.params, [key]: value } })),
  setParams: (params) => set({ params }),
  resetParams: (defaults) => set({ params: structuredClone(defaults) }),
}))
