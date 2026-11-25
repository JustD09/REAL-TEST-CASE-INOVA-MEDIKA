import dayjs from 'dayjs';
import 'dayjs/locale/id';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('id');
dayjs.extend(relativeTime);

export const formatCurrency = (value, options = {}) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
};

export const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
};

export const formatDate = (date, format = 'DD MMMM YYYY') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return dayjs(date).format('DD MMMM YYYY HH:mm');
};

export const formatTime = (date) => {
  if (!date) return '-';
  return dayjs(date).format('HH:mm');
};

export const formatRelative = (date) => {
  if (!date) return '-';
  return dayjs(date).fromNow();
};

export const formatPhone = (phone) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
  }
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
};

export const truncate = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

export const getStatusColor = (status) => {
  const colors = {
    waiting: 'warning',
    called: 'info',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'error',
    paid: 'success',
    partial: 'warning',
    open: 'info',
    draft: 'default',
    verified: 'success',
    ordered: 'info',
    collected: 'warning',
  };
  return colors[status] || 'default';
};

export const getStatusLabel = (status) => {
  const labels = {
    waiting: 'Menunggu',
    called: 'Dipanggil',
    in_progress: 'Dalam Proses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    paid: 'Lunas',
    partial: 'Sebagian',
    open: 'Terbuka',
    draft: 'Draft',
    verified: 'Terverifikasi',
    ordered: 'Dipesan',
    collected: 'Diambil',
  };
  return labels[status] || status;
};