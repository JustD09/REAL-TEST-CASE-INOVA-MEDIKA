import React from 'react';
import { Modal as MuiModal, Box, Typography, Button, IconButton, Paper } from '@mui/material';
import { Close } from '@mui/icons-material';

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  fullWidth = false,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  showCloseButton = true,
  footer,
  sx,
}) {
  const sizeStyles = {
    xs: { maxWidth: 440 },
    sm: { maxWidth: 600 },
    md: { maxWidth: 800 },
    lg: { maxWidth: 1000 },
    xl: { maxWidth: 1200 },
    full: { maxWidth: '95vw' },
  };

  return (
    <MuiModal
      open={open}
      onClose={onClose}
      disableBackdropClick={disableBackdropClick}
      disableEscapeKeyDown={disableEscapeKeyDown}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 300 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          overflow: 'auto',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: fullWidth ? '100%' : undefined,
            ...sizeStyles[size],
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2,
            ...sx,
          }}
        >
          {(title || showCloseButton) && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1, mr: 2 }}>{title}</Typography>
              {showCloseButton && (
                <IconButton onClick={onClose} aria-label="tutup" size="small" sx={{ color: 'text.secondary' }}>
                  <Close fontSize="medium" />
                </IconButton>
              )}
            </Box>
          )}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {children}
          </Box>
          {footer && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {footer}
            </Box>
          )}
        </Paper>
      </Box>
    </MuiModal>
  );
}

function Backdrop(props) {
  return <Box {...props} sx={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />;
}