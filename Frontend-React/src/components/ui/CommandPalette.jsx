import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, TextField, List, ListItem, ListItemIcon, ListItemText, Typography, Divider, 
  Paper, InputAdornment
} from '@mui/material';
import { Search, KeyboardArrowRight, FlashOn, MedicalServices, LocalHospital, LocalPharmacy, Science, AttachMoney, Assessment, Settings, PersonAdd } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn, staggerContainer, staggerItem, slideInRight } from '../motion/MotionWrapper';

const COMMANDS = [
  { id: 'dashboard', label: 'Dashboard', description: 'Ringkasan operasional harian', icon: <FlashOn fontSize="small" />, shortcut: 'G D', path: '/dashboard', roles: ['all'] },
  { id: 'pendaftaran', label: 'Pendaftaran Pasien Baru', description: 'Daftarkan pasien baru', icon: <PersonAdd fontSize="small" />, shortcut: 'G P', path: '/pendaftaran', roles: ['admin', 'petugas_pendaftaran', 'dokter'] },
  { id: 'antrean', label: 'Kelola Antrean', description: 'Panggil, skip, selesaikan antrean', icon: <LocalHospital fontSize="small" />, shortcut: 'G A', path: '/antrean', roles: ['admin', 'petugas_pendaftaran'] },
  { id: 'pemeriksaan', label: 'Input Pemeriksaan', description: 'Catat anamnesis, diagnosis, tindakan', icon: <MedicalServices fontSize="small" />, shortcut: 'G E', path: '/pemeriksaan', roles: ['admin', 'dokter'] },
  { id: 'laboratorium', label: 'Order Laboratorium', description: 'Pesan dan verifikasi lab', icon: <Science fontSize="small" />, shortcut: 'G L', path: '/laboratorium', roles: ['admin', 'dokter', 'petugas_laboratorium'] },
  { id: 'farmasi', label: 'Kelola Resep', description: 'Dispense dan kelola obat', icon: <LocalPharmacy fontSize="small" />, shortcut: 'G F', path: '/farmasi', roles: ['admin', 'petugas_farmasi', 'dokter'] },
  { id: 'billing', label: 'Generate Billing', description: 'Buat tagihan dan pembayaran', icon: <AttachMoney fontSize="small" />, shortcut: 'G B', path: '/billing', roles: ['admin', 'kasir'] },
  { id: 'laporan', label: 'Laporan', description: 'Kunjungan, pendapatan, stok, dll', icon: <Assessment fontSize="small" />, shortcut: 'G R', path: '/laporan', roles: ['admin', 'dokter', 'petugas_pendaftaran', 'petugas_farmasi', 'petugas_laboratorium', 'kasir'] },
  { id: 'pengaturan', label: 'Pengaturan', description: 'User, role, integrasi', icon: <Settings fontSize="small" />, shortcut: 'G S', path: '/pengaturan', roles: ['admin'] },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  const filteredCommands = COMMANDS.filter(cmd => {
    const hasRole = cmd.roles.includes('all') || cmd.roles.some(r => userRoles.includes(r));
    const matchesQuery = cmd.label.toLowerCase().includes(query.toLowerCase()) ||
                        cmd.description.toLowerCase().includes(query.toLowerCase()) ||
                        cmd.shortcut.toLowerCase().includes(query.toLowerCase());
    return hasRole && matchesQuery;
  });

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        closePalette();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      default:
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
      if (isOpen) handleKeyDown(e);
    };

    const handleOpenPalette = () => openPalette();
    const handleCloseModals = () => closePalette();

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('open-command-palette', handleOpenPalette);
    window.addEventListener('close-all-modals', handleCloseModals);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('open-command-palette', handleOpenPalette);
      window.removeEventListener('close-all-modals', handleCloseModals);
    };
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const openPalette = () => setIsOpen(true);
  const closePalette = () => { setIsOpen(false); setQuery(''); setSelectedIndex(0); };

  const executeCommand = (cmd) => {
    navigate(cmd.path);
    closePalette();
  };

  const scrollToSelected = () => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      listRef.current.children[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  };

  useEffect(() => {
    scrollToSelected();
  }, [selectedIndex, filteredCommands.length]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={fadeIn.transition}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '15vh',
          pointerEvents: 'none',
          backdropFilter: 'blur(2px)',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <motion.div
          style={{
            pointerEvents: 'auto',
            width: 'min(720px, 90vw)',
            maxHeight: '60vh',
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}
        >
          <Paper elevation={8} sx={{ borderRadius: 2, overflow: 'hidden', backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ position: 'relative', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary', mr: 1 }} />
              </InputAdornment>
              <TextField
                ref={inputRef}
                fullWidth
                variant="standard"
                placeholder="Cari perintah atau tekan Ctrl+K..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={(e) => { if (e.key === 'Escape') closePalette(); }}
                InputProps={{ disableUnderline: true }}
                sx={{ '& input': { fontSize: '1rem', padding: '8px 0' } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                ⌘K / Ctrl+K
              </Typography>
            </Box>

            <List ref={listRef} dense sx={{ maxHeight: '50vh', overflow: 'auto' }}>
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, index) => (
                  <ListItem
                    key={cmd.id}
                    button
                    selected={index === selectedIndex}
                    onClick={() => executeCommand(cmd)}
                    sx={{
                      px: 2, py: 1.5,
                      borderRadius: 0,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        '&:hover': { backgroundColor: 'primary.light' },
                        '& .MuiListItemIcon-root': { color: 'primary.main' },
                      },
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon 
                      sx={{ minWidth: 40, color: index === selectedIndex ? 'primary.main' : 'inherit' }}
                    >
                      {cmd.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={cmd.label}
                      secondary={cmd.description}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: index === selectedIndex ? 600 : 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', px: 1, py: 0.5, borderRadius: 4, backgroundColor: 'grey.100' }}>
                        {cmd.shortcut}
                      </Typography>
                      <KeyboardArrowRight fontSize="small" color={index === selectedIndex ? 'primary.main' : 'text.secondary'} />
                    </Box>
                  </ListItem>
                ))
              ) : (
                <ListItem disableGutters sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">Tidak ada perintah cocok</Typography>
                </ListItem>
              )}
            </List>

            <Divider />
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {filteredCommands.length} perintah tersedia
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ↑↓ Navigasi · Enter Pilih · Esc Tutup
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}