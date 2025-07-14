import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  token: string;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  isAdmin: () => boolean;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      isAdmin: () => {
        const user = get().user;
        if (!user || !user.email) return false;
        
        // For now, we'll check against a hardcoded list
        // In production, this should come from environment variables or API
        const adminEmails = process.env.REACT_APP_ADMIN_EMAILS?.split(',') || [];
        return adminEmails.includes(user.email.toLowerCase().trim());
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;