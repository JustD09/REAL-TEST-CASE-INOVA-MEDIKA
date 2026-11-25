import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';

const illustrations = {
  default: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <path d="M70 100 L95 125 L130 80" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="100" cy="70" r="18" fill="#e2e8f0"/>
      <ellipse cx="100" cy="135" rx="35" ry="8" fill="#e2e8f0"/>
    </svg>
  ),
  patients: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <path d="M100 50 C120 50 130 65 130 85 C130 105 110 125 100 140 C90 125 70 105 70 85 C70 65 80 50 100 50 Z" fill="#e2e8f0"/>
      <circle cx="100" cy="75" r="12" fill="#f8fafc"/>
      <ellipse cx="100" cy="125" rx="25" ry="12" fill="#e2e8f0"/>
    </svg>
  ),
  queue: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <rect x="50" y="45" width="100" height="110" rx="8" fill="#e2e8f0"/>
      <rect x="60" y="55" width="80" height="12" rx="3" fill="#f8fafc"/>
      <rect x="60" y="75" width="50" height="8" rx="2" fill="#94a3b8"/>
      <rect x="60" y="90" width="70" height="8" rx="2" fill="#94a3b8"/>
      <rect x="60" y="105" width="40" height="8" rx="2" fill="#94a3b8"/>
      <rect x="60" y="120" width="60" height="8" rx="2" fill="#94a3b8"/>
      <rect x="60" y="135" width="30" height="8" rx="2" fill="#94a3b8"/>
    </svg>
  ),
  examination: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <path d="M50 130 L50 80 C50 60 65 50 85 50 L115 50 C135 50 150 60 150 80 L150 130 Z" fill="#e2e8f0"/>
      <path d="M70 85 L95 110 L130 75" stroke="#0d6efd" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="100" cy="70" r="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2"/>
    </svg>
  ),
  laboratory: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <path d="M100 50 L100 85" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round"/>
      <path d="M85 85 L115 85" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="100" cy="85" rx="25" ry="15" fill="#14b8a6" opacity="0.15" stroke="#14b8a6" strokeWidth="2"/>
      <ellipse cx="100" cy="70" rx="22" ry="10" fill="#14b8a6" opacity="0.15" stroke="#14b8a6" strokeWidth="2"/>
      <ellipse cx="100" cy="55" rx="18" ry="8" fill="#14b8a6" opacity="0.15" stroke="#14b8a6" strokeWidth="2"/>
      <path d="M75 85 L75 115" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round"/>
      <path d="M125 85 L125 115" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  pharmacy: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <path d="M100 50 L100 130" stroke="#0d6efd" strokeWidth="4" strokeLinecap="round"/>
      <path d="M70 80 L130 80" stroke="#0d6efd" strokeWidth="4" strokeLinecap="round"/>
      <rect x="80" y="95" width="40" height="50" rx="4" fill="#e2e8f0" stroke="#0d6efd" strokeWidth="2"/>
      <rect x="85" y="105" width="30" height="8" rx="2" fill="#94a3b8"/>
      <rect x="85" y="120" width="30" height="8" rx="2" fill="#94a3b8"/>
    </svg>
  ),
  billing: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <rect x="45" y="70" width="110" height="60" rx="8" fill="#e2e8f0"/>
      <rect x="55" y="80" width="90" height="12" rx="3" fill="#f8fafc"/>
      <path d="M55 102 L145 102" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2"/>
      <path d="M55 115 L120 115" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="100" cy="50" r="18" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2"/>
      <path d="M93 50 L100 57 L107 43" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <rect x="50" y="50" width="100" height="100" rx="8" fill="#e2e8f0"/>
      <rect x="65" y="65" width="70" height="10" rx="2" fill="#f8fafc"/>
      <rect x="65" y="85" width="50" height="8" rx="2" fill="#94a3b8"/>
      <rect x="65" y="100" width="60" height="8" rx="2" fill="#94a3b8"/>
      <path d="M80 130 L100 110 L120 130" stroke="#0d6efd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <circle cx="100" cy="100" r="35" stroke="#94a3b8" strokeWidth="3"/>
      <path d="M135 135 L160 160" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  offline: (
    <svg viewBox="0 0 200 200" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 4"/>
      <circle cx="100" cy="100" r="60" fill="#f8fafc"/>
      <path d="M130 50 L70 130" stroke="#ef4444" strokeWidth="4" strokeLinecap="round"/>
      <path d="M70 50 L130 130" stroke="#ef4444" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="100" cy="100" r="30" fill="#fef2f2" stroke="#ef4444" strokeWidth="2"/>
    </svg>
  ),
};

export default function EmptyState({
  type = 'default',
  title = 'Tidak ada data',
  description = 'Belum ada data yang tersedia',
  actionLabel,
  onAction,
  actionIcon,
  size = 'md',
}) {
  const sizeStyles = {
    sm: { illustration: { width: 80, height: 80 }, title: 'h6', description: 'body2', padding: 3 },
    md: { illustration: { width: 120, height: 120 }, title: 'h5', description: 'body1', padding: 5 },
    lg: { illustration: { width: 160, height: 160 }, title: 'h4', description: 'body1', padding: 8 },
  };

  const style = sizeStyles[size];
  const Illustration = illustrations[type] || illustrations.default;

  return (
    <Card
      sx={{
        textAlign: 'center',
        py: style.padding,
        px: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ py: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 3,
        }}>
          <Box
            sx={{
              width: style.illustration.width,
              height: style.illustration.height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
            }}
          >
            {Illustration}
          </Box>

          <Box>
            <Typography variant={style.title} fontWeight={600} color="text.primary" gutterBottom>
              {title}
            </Typography>
            <Typography variant={style.description} color="text.secondary" paragraph>
              {description}
            </Typography>
          </Box>

          {actionLabel && onAction && (
            <Button
              variant="contained"
              startIcon={actionIcon}
              size="large"
              onClick={onAction}
              sx={{
                mt: 1,
                borderRadius: 12,
                fontWeight: 600,
                px: 4,
                py: 1.5,
                boxShadow: '0 4px 16px rgba(13, 110, 253, 0.3)',
              }}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}