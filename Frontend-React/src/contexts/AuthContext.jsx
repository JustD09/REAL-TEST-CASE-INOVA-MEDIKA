import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { nodeApi } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    setAuth,
    setTokens,
    logout,
    setLoading,
  } = useAuthStore();

  const fetchUser = useCallback(async () => {
    if (!accessToken || !refreshToken) return;

    try {
      setLoading(true);
      const { data } = await nodeApi.get('/api/auth/me');
      const userData = data.data;
      setAuth({
        ...userData,
        fullName: userData.full_name,
        roles: userData.roles || [],
        permissions: userData.permissions || [],
      }, accessToken, refreshToken);
    } catch (error) {
      console.error('[AUTH] Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [accessToken, refreshToken, setAuth, logout, setLoading]);

  useEffect(() => {
    if (isAuthenticated && accessToken && !user) {
      fetchUser();
    }
  }, [isAuthenticated, accessToken, user, fetchUser]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await nodeApi.post('/api/auth/login', { username, password });
      const { user: userData, accessToken, refreshToken } = data.data;
      setAuth({
        ...userData,
        fullName: userData.full_name,
        roles: userData.roles || [],
        permissions: userData.permissions || [],
      }, accessToken, refreshToken);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || error.response?.data?.message || 'Login gagal' };
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!refreshToken) return false;
    try {
      const { data } = await nodeApi.post('/api/auth/refresh', { refreshToken });
      setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      if (accessToken) {
        await nodeApi.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
    } finally {
      logout();
    }
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    logout: handleLogout,
    refresh,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;