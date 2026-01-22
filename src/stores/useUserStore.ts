import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
    token: string
    userInfo: any
    setToken: (token: string) => void
    setUserInfo: (userInfo: any) => void
    logout: () => void
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            token: '',
            userInfo: null,
            setToken: (token) => set({ token }),
            setUserInfo: (userInfo) => set({ userInfo }),
            logout: () => set({ token: '', userInfo: null }),
        }),
        {
            name: 'user-storage',
        }
    )
)
