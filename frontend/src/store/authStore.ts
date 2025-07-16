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
        // Check for admin URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
          return true;
        }
        
        const user = get().user;
        if (!user || !user.email) return false;
        
        // Check against admin emails from environment
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