import React, { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    Button,
    Divider,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    InputAdornment,
    Avatar,
    Stack,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
    Search,
    Download,
    Refresh,
    Assessment,
    LocalHospital,
    AttachMoney,
    Science,
    LocalPharmacy,
    MedicalServices,
    TrendingUp,
    People,
    CalendarMonth,
} from "@mui/icons-material";
import { useYiiQuery, useYiiMutation } from "../../hooks/useApi";
import { formatDate, formatCurrency, formatNumber } from "../../utils/format";
import EmptyState from "../../components/ui/EmptyState";
import { useNotification } from "../../contexts/NotificationContext";
import {
    DUMMY_POLI,
    DUMMY_DOKTER,
    DUMMY_LAPORAN_KUNJUNGAN,
    DUMMY_PENDAPATAN,
    withDummy,
} from "../../data/dummyData";

// Palet Warna UI
const BRAND_COLOR = "#0d9488";
const SOFT_BG = "#fafaf9";
const CARD_BORDER = "#f5f5f4";

const REPORT_TYPES = [
    {
        id: "kunjungan",
        label: "Kunjungan",
        icon: <LocalHospital fontSize="small" />,
    },
    {
        id: "pendapatan",
        label: "Pendapatan",
        icon: <AttachMoney fontSize="small" />,
    },
    {
        id: "tindakan",
        label: "Tindakan Medis",
        icon: <MedicalServices fontSize="small" />,
    },
    {
        id: "laboratorium",
        label: "Laboratorium",
        icon: <Science fontSize="small" />,
    },
    {
        id: "stok",
        label: "Stok Obat",
        icon: <LocalPharmacy fontSize="small" />,
    },
];

const EMPTY_STATES = {
    kunjungan: {
        type: "default",
        title: "Tidak ada data kunjungan",
        description: "Coba ubah filter tanggal atau pilih poli/dokter lain",
    },
    pendapatan: {
        type: "billing",
        title: "Tidak ada data pendapatan",
        description: "Coba ubah filter tanggal atau pilih poli/dokter lain",
    },
    tindakan: {
        type: "examination",
        title: "Tidak ada data tindakan",
        description: "Coba ubah filter tanggal atau pilih poli/dokter lain",
    },
    laboratorium: {
        type: "laboratory",
        title: "Tidak ada data laboratorium",
        description: "Coba ubah filter tanggal atau pilih poli/dokter lain",
    },
    stok: {
        type: "pharmacy",
        title: "Tidak ada data stok",
        description: "Coba ubah filter tanggal atau pilih poli/dokter lain",
    },
};

export default function LaporanPage() {
    const { showSuccess, showError } = useNotification();
    const [selectedReport, setSelectedReport] = useState("kunjungan");
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(30, "day"),
        dayjs(),
    ]);
    const [poliFilter, setPoliFilter] = useState("");
    const [dokterFilter, setDokterFilter] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [exportLoading, setExportLoading] = useState(false);

    // Master data
    const { data: poliData } = useYiiQuery(["poli", "list"], "/poli", {
        is_active: true,
        perPage: 100,
    });
    const { data: dokterData } = useYiiQuery(["dokter", "list"], "/dokter", {
        is_active: true,
        perPage: 100,
    });

    // Report queries
    const {
        data: reportData,
        isLoading: loadingReport,
        refetch: refetchReport,
    } = useYiiQuery(
        ["laporan", selectedReport, dateRange, poliFilter, dokterFilter],
        `/laporan/${selectedReport}`,
        {
            date_from: dateRange[0]?.format("YYYY-MM-DD"),
            date_to: dateRange[1]?.format("YYYY-MM-DD"),
            poli_id: poliFilter,
            dokter_id: dokterFilter,
            page: page + 1,
            perPage: rowsPerPage,
        },
        { enabled: !!selectedReport && selectedReport !== "pendapatan" },
    );

    // Pendapatan specific query
    const {
        data: pendapatanData,
        isLoading: loadingPendapatan,
        refetch: refetchPendapatan,
    } = useYiiQuery(
        ["laporan", "pendapatan", dateRange, poliFilter, dokterFilter],
        "/laporan/pendapatan",
        {
            date_from: dateRange[0]?.format("YYYY-MM-DD"),
            date_to: dateRange[1]?.format("YYYY-MM-DD"),
            poli_id: poliFilter,
            dokter_id: dokterFilter,
        },
        { enabled: selectedReport === "pendapatan" },
    );

    const poliRows = withDummy(poliData?.data, DUMMY_POLI);
    const dokterRows = withDummy(dokterData?.data, DUMMY_DOKTER);
    const reportRows = withDummy(reportData?.data, DUMMY_LAPORAN_KUNJUNGAN);
    const reportPayload = reportData?.data
        ? reportData
        : {
              data: DUMMY_LAPORAN_KUNJUNGAN,
              summary: null,
              meta: { total: DUMMY_LAPORAN_KUNJUNGAN.length },
          };
    const pendapatanRows = pendapatanData?.data || DUMMY_PENDAPATAN;

    const exportReport = useYiiMutation("/laporan", "post", {
        onSuccess: () => showSuccess("Laporan berhasil diekspor ke Excel"),
        onError: (err) => showError(err.message || "Gagal ekspor laporan"),
    });

    const handleExport = async () => {
        setExportLoading(true);
        try {
            await exportReport.mutateAsync({
                type: selectedReport,
                date_from: dateRange[0]?.format("YYYY-MM-DD"),
                date_to: dateRange[1]?.format("YYYY-MM-DD"),
                poli_id: poliFilter,
                dokter_id: dokterFilter,
                format: "excel",
            });
        } finally {
            setExportLoading(false);
        }
    };

    // --- EKSTRAK SUMMARY UNTUK BIG NUMBERS ---
    const getSummaryNumbers = () => {
        if (selectedReport === "pendapatan" && pendapatanRows?.summary) {
            return [
                {
                    label: "Total Tagihan",
                    value: formatCurrency(pendapatanRows.summary.total_billing),
                    color: "#0ea5e9",
                },
                {
                    label: "Total Terbayar",
                    value: formatCurrency(pendapatanRows.summary.total_paid),
                    color: "#10b981",
                },
                {
                    label: "Piutang (Outstanding)",
                    value: formatCurrency(pendapatanRows.summary.outstanding),
                    color: "#ef4444",
                },
                {
                    label: "Jumlah Billing",
                    value: formatNumber(pendapatanRows.summary.total_bills),
                    color: "#8b5cf6",
                },
            ];
        }

        // Untuk laporan lain, kita hitung dari jumlah baris yang ada
        if (reportRows && reportRows.length > 0) {
            let totalKunjungan = 0;
            let totalNominal = 0;
            let totalKuantitas = 0;

            reportRows.forEach((row) => {
                if (row.jumlah) totalKunjungan += parseFloat(row.jumlah);
                if (row.total) totalNominal += parseFloat(row.total);
                if (row.total_tarif)
                    totalNominal += parseFloat(row.total_tarif);
                if (row.total_harga)
                    totalNominal += parseFloat(row.total_harga);
                if (row.stok) totalKuantitas += parseFloat(row.stok);
            });

            if (selectedReport === "kunjungan") {
                return [
                    {
                        label: "Total Kunjungan",
                        value: formatNumber(totalKunjungan),
                        color: BRAND_COLOR,
                    },
                    {
                        label: "Total Baris Data",
                        value: formatNumber(reportRows.length),
                        color: "#0ea5e9",
                    },
                ];
            }
            if (selectedReport === "tindakan") {
                return [
                    {
                        label: "Total Volume Tindakan",
                        value: formatNumber(totalKunjungan),
                        color: "#8b5cf6",
                    },
                    {
                        label: "Total Pendapatan Tindakan",
                        value: formatCurrency(totalNominal),
                        color: "#10b981",
                    },
                ];
            }
            if (selectedReport === "stok") {
                return [
                    {
                        label: "Total Item Obat",
                        value: formatNumber(reportRows.length),
                        color: "#f59e0b",
                    },
                    {
                        label: "Total Stok Tersedia",
                        value: formatNumber(totalKuantitas),
                        color: BRAND_COLOR,
                    },
                ];
            }
        }
        return [];
    };

    const summaryNumbers = getSummaryNumbers();

    // --- RENDER TABEL LAPORAN ---
    const renderReportContent = () => {
        if (selectedReport === "pendapatan") {
            if (!pendapatanRows) {
                const empty = EMPTY_STATES[selectedReport];
                return <EmptyState {...empty} size="md" />;
            }
            const { by_poli, by_payment_method, daily } = pendapatanRows;

            return (
                <Grid container spacing={4}>
                    {/* Tabel Per Poli */}
                    {by_poli?.length > 0 && (
                        <Grid item xs={12} md={6}>
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="#1c1917"
                                sx={{ mb: 2 }}
                            >
                                Pendapatan per Poli
                            </Typography>
                            <Box
                                sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${CARD_BORDER}`,
                                    overflow: "hidden",
                                }}
                            >
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    backgroundColor: SOFT_BG,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Poli
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    backgroundColor: SOFT_BG,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Total
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    backgroundColor: SOFT_BG,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Terbayar
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {by_poli.map((row, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell
                                                    sx={{ fontWeight: 500 }}
                                                >
                                                    {row.nama}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {formatCurrency(row.total)}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        color: "#10b981",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {formatCurrency(row.paid)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Grid>
                    )}

                    {/* Tabel Metode Bayar */}
                    {by_payment_method?.length > 0 && (
                        <Grid item xs={12} md={6}>
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="#1c1917"
                                sx={{ mb: 2 }}
                            >
                                Metode Pembayaran
                            </Typography>
                            <Box
                                sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${CARD_BORDER}`,
                                    overflow: "hidden",
                                }}
                            >
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    backgroundColor: SOFT_BG,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Metode
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    backgroundColor: SOFT_BG,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Jumlah
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    backgroundColor: SOFT_BG,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Total
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {by_payment_method.map((row, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell
                                                    sx={{
                                                        textTransform:
                                                            "capitalize",
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {row.method}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {formatNumber(row.count)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {formatCurrency(row.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Grid>
                    )}

                    {/* Tabel Tren Harian */}
                    {daily?.length > 0 && (
                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="#1c1917"
                                sx={{ mb: 2 }}
                            >
                                Tren Harian
                            </Typography>
                            <Box
                                sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${CARD_BORDER}`,
                                    overflow: "hidden",
                                }}
                            >
                                <TableContainer sx={{ maxHeight: 400 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    sx={{
                                                        backgroundColor:
                                                            SOFT_BG,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Tanggal
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        backgroundColor:
                                                            SOFT_BG,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Total Billing
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        backgroundColor:
                                                            SOFT_BG,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Terbayar
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {daily.map((row, idx) => (
                                                <TableRow key={idx} hover>
                                                    <TableCell
                                                        sx={{ fontWeight: 500 }}
                                                    >
                                                        {formatDate(
                                                            row.tanggal,
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {formatCurrency(
                                                            row.billing,
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            color: "#10b981",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            row.paid,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            );
        }

        // Laporan Umum (Kunjungan, Tindakan, Lab, Stok)
        if (!reportRows?.length) {
            const empty = EMPTY_STATES[selectedReport] || {
                type: "default",
                title: "Tidak ada data",
                description: "Coba ubah filter",
            };
            return <EmptyState {...empty} size="md" />;
        }

        const columns = getColumnsForReport(selectedReport);
        return (
            <>
                <TableContainer
                    sx={{
                        maxHeight: 550,
                        borderRadius: 2,
                        border: `1px solid ${CARD_BORDER}`,
                    }}
                >
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.field}
                                        align={col.align || "left"}
                                        sx={{
                                            fontWeight: 600,
                                            backgroundColor: SOFT_BG,
                                            color: "#44403c",
                                            borderBottom: `1px solid ${CARD_BORDER}`,
                                            py: 1.5,
                                        }}
                                    >
                                        {col.header}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportPayload.data.map((row, idx) => (
                                <TableRow
                                    key={row.id || idx}
                                    hover
                                    sx={{
                                        "&:last-child td": {
                                            borderBottom: "none",
                                        },
                                    }}
                                >
                                    {columns.map((col) => (
                                        <TableCell
                                            key={col.field}
                                            align={col.align || "left"}
                                            sx={{ color: "#1c1917" }}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : row[col.field]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={reportPayload.meta?.total || reportRows.length}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(e.target.value);
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    sx={{
                        borderTop: "none",
                        ".MuiTablePagination-toolbar": { minHeight: 48 },
                    }}
                />
            </>
        );
    };

    const getColumnsForReport = (type) => {
        const base = [
            {
                field: "tanggal",
                header: "Tanggal",
                render: (r) => formatDate(r.tanggal),
            },
        ];
        switch (type) {
            case "kunjungan":
                return [
                    ...base,
                    { field: "poli_nama", header: "Poliklinik" },
                    { field: "dokter_nama", header: "Dokter" },
                    {
                        field: "jumlah",
                        header: "Jumlah Pasien",
                        align: "right",
                        render: (r) => <b>{formatNumber(r.jumlah)}</b>,
                    },
                ];
            case "tindakan":
                return [
                    ...base,
                    { field: "tindakan_nama", header: "Tindakan" },
                    { field: "poli_nama", header: "Poli" },
                    { field: "dokter_nama", header: "Dokter" },
                    {
                        field: "jumlah",
                        header: "Volume",
                        align: "right",
                        render: (r) => formatNumber(r.jumlah),
                    },
                    {
                        field: "total_tarif",
                        header: "Total Tarif",
                        align: "right",
                        render: (r) => (
                            <span style={{ color: "#10b981", fontWeight: 600 }}>
                                {formatCurrency(r.total_tarif)}
                            </span>
                        ),
                    },
                ];
            case "laboratorium":
                return [
                    ...base,
                    { field: "jenis_nama", header: "Pemeriksaan" },
                    { field: "poli_nama", header: "Poli Pengirim" },
                    {
                        field: "status",
                        header: "Status",
                        render: (r) => (
                            <span style={{ textTransform: "capitalize" }}>
                                {r.status}
                            </span>
                        ),
                    },
                    {
                        field: "turnaround_hours",
                        header: "Waktu Tunggu (Jam)",
                        align: "right",
                        render: (r) => r.turnaround_hours?.toFixed(1),
                    },
                ];
            case "stok":
                return [
                    { field: "obat_nama", header: "Nama Obat" },
                    { field: "kategori", header: "Kategori" },
                    {
                        field: "stok",
                        header: "Sisa Stok",
                        align: "right",
                        render: (r) => <b>{formatNumber(r.stok)}</b>,
                    },
                    {
                        field: "harga_jual",
                        header: "Harga Jual",
                        align: "right",
                        render: (r) => formatCurrency(r.harga_jual),
                    },
                    {
                        field: "expired_date",
                        header: "Kadaluarsa",
                        render: (r) =>
                            r.expired_date ? formatDate(r.expired_date) : "-",
                    },
                    {
                        field: "status_stok",
                        header: "Status",
                        render: (r) => (
                            <span
                                style={{
                                    padding: "2px 8px",
                                    borderRadius: 12,
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    backgroundColor:
                                        r.status_stok === "Aman"
                                            ? "#ecfdf5"
                                            : "#fef2f2",
                                    color:
                                        r.status_stok === "Aman"
                                            ? "#10b981"
                                            : "#ef4444",
                                }}
                            >
                                {r.status_stok}
                            </span>
                        ),
                    },
                ];
            default:
                return base;
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} locale="id">
            <Box sx={{ pb: 4 }}>
                {/* --- HEADER --- */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        color="#1c1917"
                        sx={{ mb: 0.5, letterSpacing: "-0.02em" }}
                    >
                        Laporan & Analitik
                    </Typography>
                    <Typography variant="body1" color="#78716c">
                        Pantau performa rumah sakit, keuangan, dan operasional
                        secara mendalam.
                    </Typography>
                </Box>

                {/* --- TABS LAPORAN --- */}
                <Card
                    sx={{
                        mb: 3,
                        borderRadius: 4,
                        border: `1px solid ${CARD_BORDER}`,
                        boxShadow: "none",
                        backgroundColor: "#fff",
                    }}
                >
                    <CardContent sx={{ p: 1 }}>
                        <Tabs
                            value={selectedReport}
                            onChange={(_, v) => {
                                setSelectedReport(v);
                                setPage(0);
                            }}
                            variant="scrollable"
                            sx={{
                                minHeight: 48,
                                "& .MuiTabs-indicator": { display: "none" },
                                "& .MuiTab-root": {
                                    borderRadius: 3,
                                    m: 0.5,
                                    minHeight: 40,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    color: "#78716c",
                                    "&.Mui-selected": {
                                        backgroundColor: SOFT_BG,
                                        color: BRAND_COLOR,
                                    },
                                },
                            }}
                        >
                            {REPORT_TYPES.map((r) => (
                                <Tab
                                    key={r.id}
                                    value={r.id}
                                    icon={r.icon}
                                    iconPosition="start"
                                    label={r.label}
                                />
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                {/* --- FILTER BAR --- */}
                <Card
                    sx={{
                        mb: 4,
                        borderRadius: 4,
                        border: `1px solid ${CARD_BORDER}`,
                        boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)",
                        backgroundColor: "#fff",
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        backgroundColor: SOFT_BG,
                                        p: 1,
                                        borderRadius: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 1,
                                            backgroundColor: "#fff",
                                            borderRadius: 2,
                                            display: "flex",
                                        }}
                                    >
                                        <CalendarMonth
                                            sx={{ color: BRAND_COLOR }}
                                        />
                                    </Box>
                                    <DatePicker
                                        value={dateRange[0]}
                                        onChange={(v) =>
                                            setDateRange([v, dateRange[1]])
                                        }
                                        format="DD MMM YY"
                                        slotProps={{
                                            textField: {
                                                size: "small",
                                                variant: "standard",
                                                InputProps: {
                                                    disableUnderline: true,
                                                },
                                            },
                                        }}
                                    />
                                    <Typography variant="body2" color="#a8a29e">
                                        s/d
                                    </Typography>
                                    <DatePicker
                                        value={dateRange[1]}
                                        onChange={(v) =>
                                            setDateRange([dateRange[0], v])
                                        }
                                        format="DD MMM YY"
                                        slotProps={{
                                            textField: {
                                                size: "small",
                                                variant: "standard",
                                                InputProps: {
                                                    disableUnderline: true,
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2.5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Poli</InputLabel>
                                    <Select
                                        value={poliFilter}
                                        label="Poli"
                                        onChange={(e) => {
                                            setPoliFilter(e.target.value);
                                            setPage(0);
                                        }}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="">Semua Poli</MenuItem>
                                        {poliRows?.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.nama}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2.5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Dokter</InputLabel>
                                    <Select
                                        value={dokterFilter}
                                        label="Dokter"
                                        onChange={(e) => {
                                            setDokterFilter(e.target.value);
                                            setPage(0);
                                        }}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="">
                                            Semua Dokter
                                        </MenuItem>
                                        {dokterRows?.map((d) => (
                                            <MenuItem key={d.id} value={d.id}>
                                                {d.full_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Refresh />}
                                        onClick={() =>
                                            selectedReport === "pendapatan"
                                                ? refetchPendapatan()
                                                : refetchReport()
                                        }
                                        disabled={
                                            selectedReport === "pendapatan"
                                                ? loadingPendapatan
                                                : loadingReport
                                        }
                                        sx={{
                                            borderRadius: 2.5,
                                            textTransform: "none",
                                            borderColor: CARD_BORDER,
                                            color: "#57534e",
                                        }}
                                    >
                                        Refresh
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<Download />}
                                        onClick={handleExport}
                                        disabled={exportLoading}
                                        sx={{
                                            borderRadius: 2.5,
                                            textTransform: "none",
                                            fontWeight: 600,
                                            backgroundColor: BRAND_COLOR,
                                            "&:hover": {
                                                backgroundColor: "#0f766e",
                                            },
                                            flex: 1,
                                        }}
                                    >
                                        {exportLoading
                                            ? "Mengekspor..."
                                            : "Ekspor Excel"}
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* --- BIG NUMBERS (SUMMARY CARDS) --- */}
                {summaryNumbers.length > 0 && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {summaryNumbers.map((item, idx) => (
                            <Grid item xs={12} sm={6} md={3} key={idx}>
                                <Card
                                    sx={{
                                        borderRadius: 4,
                                        border: `1px solid ${CARD_BORDER}`,
                                        boxShadow: "none",
                                        backgroundColor: "#fff",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            width: 4,
                                            backgroundColor: item.color,
                                        }}
                                    />
                                    <CardContent
                                        sx={{ p: 3, "&:last-child": { pb: 3 } }}
                                    >
                                        <Typography
                                            variant="caption"
                                            fontWeight={600}
                                            color="#78716c"
                                            sx={{
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            {item.label}
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            fontWeight={800}
                                            color="#1c1917"
                                            sx={{
                                                mt: 1,
                                                letterSpacing: "-0.02em",
                                            }}
                                        >
                                            {item.value}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* --- KONTEN TABEL LAPORAN --- */}
                <Card
                    sx={{
                        borderRadius: 4,
                        border: `1px solid ${CARD_BORDER}`,
                        boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)",
                        backgroundColor: "#fff",
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        {(
                            selectedReport === "pendapatan"
                                ? loadingPendapatan
                                : loadingReport
                        ) ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minHeight: "40vh",
                                }}
                            >
                                <CircularProgress
                                    sx={{ color: BRAND_COLOR, mb: 2 }}
                                />
                                <Typography variant="body2" color="#78716c">
                                    Menarik data laporan...
                                </Typography>
                            </Box>
                        ) : (
                            renderReportContent()
                        )}
                    </CardContent>
                </Card>
            </Box>
        </LocalizationProvider>
    );
}
