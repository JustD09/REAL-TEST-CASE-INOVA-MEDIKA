import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      roles: [],
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) => {
        const permissions = user.permissions || [];
        const roles = user.roles || [];
        set({
          user,
          accessToken,
          refreshToken,
          permissions,
          roles,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      setUser: (user) => {
        set({ user, permissions: user.permissions || [], roles: user.roles || [] });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          permissions: [],
          roles: [],
          isAuthenticated: false,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      hasPermission: (permission) => {
        const permissions = get().permissions;
        return permissions.includes(permission);
      },

      hasRole: (role) => {
        const roles = get().roles;
        return roles.includes(role);
      },

      hasAnyPermission: (permissions) => {
        const userPermissions = get().permissions;
        return permissions.some((p) => userPermissions.includes(p));
      },

      hasAnyRole: (roles) => {
        const userRoles = get().roles;
        return roles.some((r) => userRoles.includes(r));
      },
    }),
    {
      name: 'simrs-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        permissions: state.permissions,
        roles: state.roles,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);