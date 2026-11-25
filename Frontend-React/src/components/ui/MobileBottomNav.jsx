import React from 'react';
import { useState, useEffect } from 'react';
import { Box, BottomNavigation, BottomNavigationAction, useMediaQuery, useTheme } from '@mui/material';
import { Dashboard, PersonAdd, LocalHospital, MedicalServices, LocalPharmacy, Science, AttachMoney, Assessment } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <Dashboard />, roles: ['all'] },
  { path: '/pendaftaran', label: 'Daftar', icon: <PersonAdd />, roles: ['admin', 'petugas_pendaftaran', 'dokter'] },
  { path: '/antrean', label: 'Antrean', icon: <LocalHospital />, roles: ['admin', 'petugas_pendaftaran'] },
  { path: '/pemeriksaan', label: 'Periksa', icon: <MedicalServices />, roles: ['admin', 'dokter'] },
  { path: '/laboratorium', label: 'Lab', icon: <Science />, roles: ['admin', 'dokter', 'petugas_laboratorium'] },
  { path: '/farmasi', label: 'Farmasi', icon: <LocalPharmacy />, roles: ['admin', 'petugas_farmasi', 'dokter'] },
  { path: '/billing', label: 'Billing', icon: <AttachMoney />, roles: ['admin', 'kasir'] },
  { path: '/laporan', label: 'Laporan', icon: <Assessment />, roles: ['admin', 'dokter', 'petugas_pendaftaran', 'petugas_farmasi', 'petugas_laboratorium', 'kasir'] },
];

function BottomNavContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  const filteredItems = NAV_ITEMS.filter(item => 
    item.roles.includes('all') || item.roles.some(r => userRoles.includes(r))
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (path) => {
    setSelectedIndex(NAV_ITEMS.findIndex(item => item.path === path));
    navigate(path);
    setIsOpen(false);
  };

  if (!isMobile) return null;

  return (
    <BottomNavigation
      value={isOpen ? selectedIndex : 0}
      onChange={(_, index) => handleNavigation(filteredItems[index]?.path)}
      showLabels
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '0 12px',
        transition: 'all 0.2s ease',
      }}
    >
      {filteredItems.map((item, index) => (
        <BottomNavigationAction
          key={item.path}
          label={item.label}
          icon={item.icon}
          selected={selectedIndex === index}
          onClick={() => handleNavigation(item.path)}
          sx={{
            minWidth: 0,
            padding: '6px 0',
            '&.Mui-selected': {
              color: 'primary.main',
              '& .MuiIcon-button-label': {
                fontWeight: 600,
              },
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'rgba(13, 110, 253, 0.1)',
            },
          }}
        />
      ))}
    </BottomNavigation>
  );
}

export default function MobileBottomNav() {
  return <BottomNavContent />;
}