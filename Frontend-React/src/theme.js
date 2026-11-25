import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d6efd',
      light: '#4d9cff',
      dark: '#0049b3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#14b8a6',
      light: '#5eead4',
      dark: '#0d9488',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#06b6d4',
      light: '#22d3ee',
      dark: '#0891b2',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      disabled: '#94a3b8',
    },
    divider: '#e2e8f0',
    action: {
      hover: 'rgba(13, 110, 253, 0.04)',
      selected: 'rgba(13, 110, 253, 0.08)',
      disabled: 'rgba(15, 23, 42, 0.26)',
      disabledBackground: 'rgba(15, 23, 42, 0.12)',
    },
    tonalOffset: 0.2,
    contrastThreshold: 3,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "IBM Plex Sans", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontSize: 'clamp(2rem, 4vw, 3rem)',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h4: {
      fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'none',
      letterSpacing: '0.02857em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      textTransform: 'uppercase',
      letterSpacing: '0.08333em',
    },
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 1px rgba(0, 0, 0, 0.02)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 2px 4px 2px rgba(0, 0, 0, 0.02)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
    '0 1px 3px rgba(13, 110, 253, 0.1), 0 4px 6px rgba(13, 110, 253, 0.06)',
    '0 1px 3px rgba(20, 184, 166, 0.1), 0 4px 6px rgba(20, 184, 166, 0.06)',
    '0 1px 3px rgba(16, 185, 129, 0.1), 0 4px 6px rgba(16, 185, 129, 0.06)',
    '0 1px 3px rgba(245, 158, 11, 0.1), 0 4px 6px rgba(245, 158, 11, 0.06)',
    '0 1px 3px rgba(239, 68, 68, 0.1), 0 4px 6px rgba(239, 68, 68, 0.06)',
    '0 1px 3px rgba(6, 182, 212, 0.1), 0 4px 6px rgba(6, 182, 212, 0.06)',
    '0 0 0 1px rgba(13, 110, 253, 0.2)',
    '0 0 0 1px rgba(20, 184, 166, 0.2)',
    '0 0 0 1px rgba(16, 185, 129, 0.2)',
    '0 0 0 1px rgba(245, 158, 11, 0.2)',
    '0 0 0 1px rgba(239, 68, 68, 0.2)',
    '0 0 0 1px rgba(6, 182, 212, 0.2)',
    '0 0 0 1px rgba(148, 163, 184, 0.2)',
    '0 0 0 1px rgba(148, 163, 184, 0.3)',
    '0 0 0 1px rgba(148, 163, 184, 0.4)',
    '0 0 0 1px rgba(148, 163, 184, 0.5)',
    '0 0 0 1px rgba(148, 163, 184, 0.6)',
    '0 0 0 1px rgba(148, 163, 184, 0.7)',
    '0 0 0 1px rgba(148, 163, 184, 0.8)',
  ],
  spacing: 8,
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
    commandPalette: 1600,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 1024,
      lg: 1280,
      xl: 1536,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          scrollBehavior: 'smooth',
        },
        body: {
          backgroundColor: '#f8fafc',
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#cbd5e1',
            borderRadius: 4,
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#94a3b8',
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
        },
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        '@keyframes pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        '@keyframes slide-up': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes slide-down': {
          from: { opacity: 0, transform: 'translateY(-10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes scale-in': {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        '.loading-skeleton': {
          animation: 'shimmer 1.5s infinite linear',
          background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
          backgroundSize: '200% 100%',
        },
        '.focus-visible': {
          outline: '2px solid #0d6efd',
          outlineOffset: 2,
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, #0d6efd 0%, #14b8a6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          color: '#0f172a',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.02)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontWeight: 500,
          fontSize: '0.875rem',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(13, 110, 253, 0.25)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(13, 110, 253, 0.04)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(13, 110, 253, 0.04)',
          },
        },
        sizeSmall: {
          padding: '6px 14px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '0.9375rem',
        },
        startIcon: {
          marginRight: 8,
        },
        endIcon: {
          marginLeft: 8,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(13, 110, 253, 0.08)',
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#ffffff',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#94a3b8',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0d6efd',
              borderWidth: 2,
            },
            '&.Mui-error .MuiOutlinedInput-notchedOutline': {
              borderColor: '#ef4444',
              borderWidth: 2,
            },
            '& input': {
              padding: '12px 14px',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#64748b',
            transform: 'translate(14px, 12px) scale(1)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -6px) scale(0.75)',
              color: '#0d6efd',
              fontWeight: 500,
            },
          },
          '& .MuiInputAdornment-root': {
            color: '#94a3b8',
          },
        },
      },
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-label': {
            padding: '0 10px',
          },
        },
        outlined: {
          borderWidth: '1.5px',
        },
        filled: {
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          color: '#0d6efd',
        },
        sizeSmall: {
          height: 20,
          fontSize: '0.7rem',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafc',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
            padding: '14px 16px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: 'background-color 0.1s ease',
            '&:last-child .MuiTableCell-root': {
              borderBottom: 'none',
            },
            '&:hover': {
              backgroundColor: 'rgba(13, 110, 253, 0.02)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(13, 110, 253, 0.06)',
              '&:hover': {
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
              },
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '14px 16px',
          borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
          fontSize: '0.875rem',
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          padding: '12px 16px',
        },
        select: {
          paddingRight: 32,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          padding: 8,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '20px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '0 24px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 20px',
          gap: 12,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          backgroundColor: '#0d6efd',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          minHeight: 48,
          padding: '0 20px',
          color: '#64748b',
          '&.Mui-selected': {
            color: '#0d6efd',
            fontWeight: 600,
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          '&:first-of-type': { borderRadius: 12 },
          '&:last-of-type': { borderRadius: 12 },
          '&.Mui-expanded': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
            marginBottom: 0,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '14px 20px',
          borderRadius: 12,
          '&.Mui-expanded': {
            minHeight: 48,
            borderRadius: '12px 12px 0 0',
          },
        },
        content: {
          margin: 0,
        },
        expandIcon: {
          color: '#64748b',
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '16px 20px 20px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1e293b',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        },
        arrow: {
          color: '#1e293b',
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          borderRadius: 12,
          padding: '14px 20px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        },
        message: {
          fontSize: '0.875rem',
          lineHeight: 1.5,
        },
        action: {
          color: '#5eead4',
          fontWeight: 600,
          textTransform: 'none',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '14px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        },
        standardInfo: {
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          color: '#0891b2',
          border: '1px solid rgba(6, 182, 212, 0.2)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        colorDefault: {
          backgroundColor: '#e2e8f0',
          color: '#475569',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          padding: '8px 12px',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(13, 110, 253, 0.06)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            color: '#0d6efd',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(13, 110, 253, 0.15)',
            },
            '& .MuiListItemIcon-root': {
              color: '#0d6efd',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: '#64748b',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          marginTop: 8,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          padding: '10px 16px',
          borderRadius: 8,
          margin: '4px 8px',
          transition: 'all 0.1s ease',
          '&:hover': {
            backgroundColor: 'rgba(13, 110, 253, 0.08)',
          },
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            borderRadius: 10,
            margin: 0,
            fontWeight: 500,
            '&.Mui-selected': {
              backgroundColor: '#0d6efd',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)',
            },
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          fontFamily: '"Inter", "IBM Plex Sans", sans-serif',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
          },
          '& .MuiDataGrid-columnHeader': {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            padding: '14px 16px',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
            padding: '14px 16px',
            fontSize: '0.875rem',
          },
          '& .MuiDataGrid-row': {
            transition: 'background-color 0.1s ease',
            '&:hover': {
              backgroundColor: 'rgba(13, 110, 253, 0.02)',
            },
            '&.MuiDataGrid-row--selected': {
              backgroundColor: 'rgba(13, 110, 253, 0.06)',
              '&:hover': {
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
              },
            },
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: '#fff',
          },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiStep: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.875rem',
          fontWeight: 500,
          '&.Mui-active': {
            color: '#0d6efd',
          },
          '&.Mui-completed': {
            color: '#10b981',
          },
        },
        iconContainer: {
          '& .MuiStepIcon-root': {
            color: '#cbd5e1',
            '&.Mui-active': {
              color: '#0d6efd',
            },
            '&.Mui-completed': {
              color: '#10b981',
            },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: '#e2e8f0',
        },
        colorPrimary: {
          backgroundColor: 'rgba(13, 110, 253, 0.2)',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#0d6efd',
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
        },
        li: {
          '&:last-child': {
            color: '#0f172a',
            fontWeight: 500,
          },
        },
        separator: {
          color: '#94a3b8',
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '0 2px',
          minWidth: 36,
          height: 36,
          fontWeight: 500,
          '&.Mui-selected': {
            backgroundColor: '#0d6efd',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)',
            '&:hover': {
              backgroundColor: '#0049b3',
            },
          },
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;