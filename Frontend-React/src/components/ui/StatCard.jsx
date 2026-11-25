import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { useMediaQuery, useTheme } from '@mui/material';

const formatValue = (val) => {
  if (typeof val === 'number' && val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (typeof val === 'number' && val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val;
};

const getColorStyle = (color, theme) => {
  const colors = {
    primary: { bg: 'rgba(13, 110, 253, 0.1)', icon: '#0d6efd', border: 'rgba(13, 110, 253, 0.2)' },
    secondary: { bg: 'rgba(20, 184, 166, 0.1)', icon: '#14b8a6', border: 'rgba(20, 184, 166, 0.2)' },
    success: { bg: 'rgba(16, 185, 129, 0.1)', icon: '#10b981', border: 'rgba(16, 185, 129, 0.2)' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', icon: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
    error: { bg: 'rgba(239, 68, 68, 0.1)', icon: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },
    info: { bg: 'rgba(6, 182, 212, 0.1)', icon: '#06b6d4', border: 'rgba(6, 182, 212, 0.2)' },
  };
  return colors[color] || colors.primary;
};

const trendColor = (trend) => trend >= 0 ? 'success' : 'error';

export default function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  trend, 
  trendLabel, 
  loading = false,
  delay = 0,
}) {
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const colorStyle = getColorStyle(color, theme);

  const cardProps = {
    sx: {
      height: '100%',
      borderRadius: 16,
      border: `1px solid ${colorStyle.border}`,
      background: `linear-gradient(135deg, ${colorStyle.bg} 0%, rgba(255,255,255,0.9) 100%)`,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${colorStyle.icon} 0%, ${color === 'primary' ? '#14b8a6' : colorStyle.icon} 100%)`,
        opacity: loading ? 0 : 1,
        transition: 'opacity 0.2s ease',
      },
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 24px ${colorStyle.icon}20, 0 2px 8px rgba(0,0,0,0.04)`,
        borderColor: colorStyle.icon,
      },
    },
  };

  const Content = reducedMotion ? 'div' : motion.div;

  return (
    <Content
      {...(reducedMotion ? cardProps : {
        ...cardProps,
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
        whileHover: isMobile ? undefined : { y: -4, boxShadow: `0 12px 32px ${colorStyle.icon}25, 0 4px 16px rgba(0,0,0,0.06)` },
        style: { willChange: 'transform, box-shadow' },
      })}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              gutterBottom 
              sx={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                fontWeight: 500,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
              }}
            >
              {title}
            </Typography>
            {loading ? (
              <Box sx={{ height: 36, width: '65%' }}>
                <span className="loading-skeleton" style={{ 
                  display: 'block', 
                  height: '100%', 
                  borderRadius: 8, 
                  background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', 
                  backgroundSize: '200% 100%', 
                  animation: 'shimmer 1.5s infinite linear' 
                }} />
              </Box>
            ) : (
              <Typography 
                variant="h3" 
                component="div" 
                fontWeight={700} 
                sx={{ 
                  lineHeight: 1.1, 
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatValue(value)}
              </Typography>
            )}
            {trend !== undefined && (
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1, 
                  color: trend >= 0 ? 'success.main' : 'error.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  fontWeight: 500,
                }}
              >
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% {trendLabel || 'vs kemarin'}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: 14, 
              backgroundColor: colorStyle.bg,
              border: `1px solid ${colorStyle.border}`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {React.isValidElement(icon) 
              ? React.cloneElement(icon, { 
                  color: colorStyle.icon, 
                  fontSize: 'large',
                  sx: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }
                }) 
              : icon
            }
          </Box>
        </Box>
      </CardContent>
    </Content>
  );
}