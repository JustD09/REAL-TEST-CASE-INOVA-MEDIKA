import React, { createContext, useContext, useCallback } from 'react';
import { useSnackbar } from 'notistack';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showSuccess = useCallback((message, options = {}) => {
    enqueueSnackbar(message, { variant: 'success', autoHideDuration: 4000, ...options });
  }, [enqueueSnackbar]);

  const showError = useCallback((message, options = {}) => {
    enqueueSnackbar(message, { variant: 'error', autoHideDuration: 6000, ...options });
  }, [enqueueSnackbar]);

  const showWarning = useCallback((message, options = {}) => {
    enqueueSnackbar(message, { variant: 'warning', autoHideDuration: 5000, ...options });
  }, [enqueueSnackbar]);

  const showInfo = useCallback((message, options = {}) => {
    enqueueSnackbar(message, { variant: 'info', autoHideDuration: 4000, ...options });
  }, [enqueueSnackbar]);

  const showApiError = useCallback((error, defaultMessage = 'Terjadi kesalahan') => {
    const message = error?.response?.data?.error?.message || error?.message || defaultMessage;
    enqueueSnackbar(message, { variant: 'error', autoHideDuration: 6000 });
  }, [enqueueSnackbar]);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showApiError,
    closeSnackbar,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;