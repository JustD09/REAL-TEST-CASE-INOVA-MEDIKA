import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const shortcuts = [
  // Global shortcuts
  { key: 'k', meta: true, action: 'command-palette', description: 'Buka Command Palette' },
  { key: '/', meta: true, action: 'command-palette', description: 'Buka Command Palette' },
  { key: 'n', meta: true, action: 'new', description: 'Buat baru (konteks halaman)' },
  { key: 'g', meta: false, sequence: ['d'], action: 'goto-dashboard', description: 'Go to Dashboard' },
  { key: 'g', meta: false, sequence: ['p'], action: 'goto-pendaftaran', description: 'Go to Pendaftaran' },
  { key: 'g', meta: false, sequence: ['a'], action: 'goto-antrean', description: 'Go to Antrean' },
  { key: 'g', meta: false, sequence: ['e'], action: 'goto-pemeriksaan', description: 'Go to Pemeriksaan' },
  { key: 'g', meta: false, sequence: ['l'], action: 'goto-laboratorium', description: 'Go to Laboratorium' },
  { key: 'g', meta: false, sequence: ['f'], action: 'goto-farmasi', description: 'Go to Farmasi' },
  { key: 'g', meta: false, sequence: ['b'], action: 'goto-billing', description: 'Go to Billing' },
  { key: 'g', meta: false, sequence: ['r'], action: 'goto-laporan', description: 'Go to Laporan' },
  { key: 'g', meta: false, sequence: ['s'], action: 'goto-pengaturan', description: 'Go to Pengaturan' },
  { key: 'Escape', meta: false, action: 'close-modals', description: 'Tutup modal/dropdown' },
  { key: 'r', meta: false, action: 'refresh', description: 'Refresh halaman saat ini' },
];

const routeMap = {
  'goto-dashboard': '/dashboard',
  'goto-pendaftaran': '/pendaftaran',
  'goto-antrean': '/antrean',
  'goto-pemeriksaan': '/pemeriksaan',
  'goto-laboratorium': '/laboratorium',
  'goto-farmasi': '/farmasi',
  'goto-billing': '/billing',
  'goto-laporan': '/laporan',
  'goto-pengaturan': '/pengaturan',
};

const pageActions = {
  '/pendaftaran': { new: 'openCreatePasien' },
  '/antrean': { new: 'openCreateKunjungan' },
  '/pemeriksaan': { new: 'openCreate' },
  '/laboratorium': { new: 'openCreate' },
  '/farmasi': { new: 'openCreateResep' },
  '/billing': { new: 'openGenerate' },
  '/laporan': { new: 'handleExport' },
};

let keyBuffer = [];
let bufferTimeout = null;

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const hasAccess = useCallback((path) => {
    const userRoles = user?.roles || [];
    const requiredRoles = {
      '/pendaftaran': ['admin', 'petugas_pendaftaran', 'dokter'],
      '/antrean': ['admin', 'petugas_pendaftaran'],
      '/pemeriksaan': ['admin', 'dokter'],
      '/laboratorium': ['admin', 'dokter', 'petugas_laboratorium'],
      '/farmasi': ['admin', 'petugas_farmasi', 'dokter'],
      '/billing': ['admin', 'kasir'],
      '/pengaturan': ['admin'],
    };
    const roles = requiredRoles[path] || ['all'];
    return roles.includes('all') || roles.some(r => userRoles.includes(r));
  }, [user]);

  const executeAction = useCallback((action) => {
    switch (action) {
      case 'command-palette':
        window.dispatchEvent(new CustomEvent('open-command-palette'));
        break;
      case 'close-modals':
        window.dispatchEvent(new CustomEvent('close-all-modals'));
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'new': {
        const pageAction = pageActions[location.pathname];
        if (pageAction?.new) {
          window.dispatchEvent(new CustomEvent(`page-action-${pageAction.new}`));
        }
        break;
      }
      default:
        if (routeMap[action] && hasAccess(routeMap[action])) {
          navigate(routeMap[action]);
        }
        break;
    }
  }, [location.pathname, navigate, hasAccess]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        // Except for Escape and Cmd+K
        if (!(e.key === 'Escape' || (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === '/'))) {
          return;
        }
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Handle sequence keys (g + d, g + p, etc.)
      if (!modifier && keyBuffer.length > 0) {
        keyBuffer.push(e.key.toLowerCase());
        const sequence = keyBuffer.join('+');
        
        const matchingShortcut = shortcuts.find(s => 
          !s.meta && s.sequence && s.sequence.join('+') === sequence
        );
        
        if (matchingShortcut) {
          e.preventDefault();
          executeAction(matchingShortcut.action);
          keyBuffer = [];
          clearTimeout(bufferTimeout);
          return;
        }

        // Check if any shortcut starts with this sequence
        const hasMatchingPrefix = shortcuts.some(s => 
          !s.meta && s.sequence && s.sequence.slice(0, keyBuffer.length).join('+') === sequence
        );

        if (!hasMatchingPrefix) {
          keyBuffer = [];
        } else {
          clearTimeout(bufferTimeout);
          bufferTimeout = setTimeout(() => { keyBuffer = []; }, 1000);
        }
        return;
      }

      // Single key shortcuts
      const matchingShortcut = shortcuts.find(s => {
        if (s.sequence) return false; // Handled above
        if (s.meta !== modifier) return false;
        return s.key.toLowerCase() === e.key.toLowerCase();
      });

      if (matchingShortcut) {
        // Special case: 'g' key starts a sequence
        if (matchingShortcut.key === 'g' && !modifier) {
          keyBuffer = ['g'];
          bufferTimeout = setTimeout(() => { keyBuffer = []; }, 1000);
          return;
        }
        e.preventDefault();
        executeAction(matchingShortcut.action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(bufferTimeout);
    };
  }, [executeAction]);

  // Return helpers for components to register their own actions
  return {
    registerAction: (actionName, handler) => {
      window.addEventListener(`page-action-${actionName}`, handler);
      return () => window.removeEventListener(`page-action-${actionName}`, handler);
    },
  };
}

export { shortcuts, routeMap };