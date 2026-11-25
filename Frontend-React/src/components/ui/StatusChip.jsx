import React from 'react';
import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  // Kunjungan
  waiting: { label: 'Menunggu', color: 'warning' },
  called: { label: 'Dipanggil', color: 'info' },
  in_progress: { label: 'Dalam Proses', color: 'primary' },
  completed: { label: 'Selesai', color: 'success' },
  cancelled: { label: 'Dibatalkan', color: 'error' },
  done: { label: 'Selesai', color: 'success' },
  // Pemeriksaan
  draft: { label: 'Draft', color: 'default' },
  finalized: { label: 'Final', color: 'success' },
  // Lab
  ordered: { label: 'Dipesan', color: 'warning' },
  collected: { label: 'Diambil', color: 'info' },
  verified: { label: 'Terverifikasi', color: 'success' },
  // Billing
  open: { label: 'Terbuka', color: 'warning' },
  partial: { label: 'Sebagian', color: 'info' },
  paid: { label: 'Lunas', color: 'success' },
  // Payment
  success: { label: 'Berhasil', color: 'success' },
  refunded: { label: 'Dikembalikan', color: 'info' },
  // Resep
  prescribed: { label: 'Diresepkan', color: 'warning' },
  submitted: { label: 'Diajukan', color: 'info' },
  dispensed: { label: 'Diberikan', color: 'success' },
  returned: { label: 'Dikembalikan', color: 'error' },
  // User
  active: { label: 'Aktif', color: 'success' },
  inactive: { label: 'Nonaktif', color: 'error' },
  blocked: { label: 'Diblokir', color: 'error' },
};

export default function StatusChip({ status, size = 'small', variant = 'outlined', showIcon = false }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  const icon = showIcon && config.color !== 'default' ? (
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      backgroundColor: `var(--mui-palette-${config.color}-main)`,
      display: 'inline-block', marginRight: 4
    }} />
  ) : null;
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant={variant}
      icon={icon}
    />
  );
}

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
  value, label: config.label,
}));