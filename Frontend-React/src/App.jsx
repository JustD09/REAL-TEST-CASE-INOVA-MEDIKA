import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SEOHead } from './components/seo/SEOHead';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PendaftaranPage from './pages/pendaftaran/PendaftaranPage';
import AntreanPage from './pages/antrean/AntreanPage';
import PemeriksaanPage from './pages/pemeriksaan/PemeriksaanPage';
import LaboratoriumPage from './pages/laboratorium/LaboratoriumPage';
import FarmasiPage from './pages/farmasi/FarmasiPage';
import BillingPage from './pages/billing/BillingPage';
import LaporanPage from './pages/laporan/LaporanPage';
import PengaturanPage from './pages/pengaturan/PengaturanPage';

export default function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
          {/* Public routes with AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
          </Route>
          
          {/* Protected routes with MainLayout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <SEOHead
                  title="Dashboard"
                  description="Ringkasan operasional harian SIMRS"
                  path="/dashboard"
                  structuredData={{
                    '@type': 'WebPage',
                    name: 'Dashboard',
                    description: 'Ringkasan operasional harian SIMRS',
                  }}
                >
                  <DashboardPage />
                </SEOHead>
              }
            />
            <Route
              path="/pendaftaran"
              element={
                <SEOHead
                  title="Pendaftaran Pasien"
                  description="Manajemen pendaftaran pasien baru dan lama"
                  path="/pendaftaran"
                  structuredData={{
                    '@type': 'WebPage',
                    name: 'Pendaftaran Pasien',
                    description: 'Manajemen pendaftaran pasien baru dan lama',
                  }}
                >
                  <PendaftaranPage />
                </SEOHead>
              }
            />
            <Route
              path="/antrean"
              element={
                <SEOHead
                  title="Manajemen Antrean"
                  description="Kelola antrean pasien rawat jalan dan rawat inap"
                  path="/antrean"
                  structuredData={{
                    '@type': 'WebPage',
                    name: 'Manajemen Antrean',
                    description: 'Kelola antrean pasien rawat jalan dan rawat inap',
                  }}
                >
                  <AntreanPage />
                </SEOHead>
              }
            />
            <Route
              path="/pemeriksaan"
              element={
                <SEOHead
                  title="Pemeriksaan Pasien"
                  description="Catatan pemeriksaan medis dan anamnesis"
                  path="/pemeriksaan"
                  structuredData={{
                    '@type': 'WebPage',
                    name: 'Pemeriksaan Pasien',
                    description: 'Catatan pemeriksaan medis dan anamnesis',
                  }}
                >
                  <PemeriksaanPage />
                </SEOHead>
              }
            />
            <Route
              path="/laboratorium"
              element={
                <SEOHead
                  title="Laboratorium"
                  description="Manajemen pemeriksaan laboratorium dan hasil"
                  path="/laboratorium"
                  structuredData={{
                    '@type': 'WebPage',
                    name: 'Laboratorium',
                    description: 'Manajemen pemeriksaan laboratorium dan hasil',
                  }}
                >
                  <LaboratoriumPage />
                </SEOHead>
              }
            />
            <Route
              path="/farmasi"
              element={
                <SEOHead
                  title="Farmasi"
                  description="Manajemen resep, obat, dan inventaris farmasi"
                  path="/farmasi"
                  structuredData={{
                    '@type': 'WebPage',
                    name: 'Farmasi',
                    description: 'Manajemen resep, obat, dan inventaris farmasi',
                  }}
                >
                  <FarmasiPage />
                </SEOHead>
              }
            />
            <Route
              path="/billing"
              element={
                <SEOHead
                  title="Billing & Tagihan"
                  description="Manajemen tagihan, pembayaran, dan klaim BPJS"
                  path="/billing"
                  structuredData={{
                    '@type': 'WebPage',
                    name: 'Billing & Tagihan',
                    description: 'Manajemen tagihan, pembayaran, dan klaim BPJS',
                  }}
                >
                  <BillingPage />
                </SEOHead>
              }
            />
            <Route
              path="/laporan"
              element={
                <SEOHead
                  title="Laporan & Analitik"
                  description="Laporan operasional, keuangan, dan klinis"
                  path="/laporan"
                  structuredData={{
                    '@type': 'WebPage',
                    name: 'Laporan & Analitik',
                    description: 'Laporan operasional, keuangan, dan klinis',
                  }}
                >
                  <LaporanPage />
                </SEOHead>
              }
            />
            <Route
              path="/pengaturan"
              element={
                <SEOHead
                  title="Pengaturan Sistem"
                  description="Konfigurasi sistem, pengguna, dan parameter rumah sakit"
                  path="/pengaturan"
                  structuredData={{
                    '@type': 'WebPage',
                    name: 'Pengaturan Sistem',
                    description: 'Konfigurasi sistem, pengguna, dan parameter rumah sakit',
                  }}
                >
                  <PengaturanPage />
                </SEOHead>
              }
            />
          </Route>
          
          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </>
  );
}