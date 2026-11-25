import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Chip,
    Button,
    Snackbar,
    useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
    People,
    LocalHospital,
    MedicalServices,
    Science,
    AttachMoney,
    LocalPharmacy,
    NotificationsActive,
    ArrowUpward,
    ArrowDownward,
    Schedule,
    Analytics,
    Speed,
    PersonAdd,
    CheckCircle,
    DateRange,
    Wifi,
    WifiOff,
    ShowChart,
    PieChartOutline,
    InsertChartOutlined,
    BarChart as BarChartIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { nodeApi } from "../../api/axios";
import { formatCurrency, formatNumber } from "../../utils/format";
import { SEOHead } from "../../components/seo/SEOHead";
import {
    useQueueWebSocket,
    useLabWebSocket,
    useBillingWebSocket,
    useNotificationWebSocket,
} from "../../hooks/useWebSocket";
import {
    MotionItem,
    fadeInUp,
    staggerContainer,
} from "../../components/motion/MotionWrapper";
import { motion } from "framer-motion";
import {
    DUMMY_DASHBOARD_STATS,
    DUMMY_DASHBOARD_CHARTS,
    DUMMY_DASHBOARD_ACTIVITIES,
} from "../../data/dummyData";

// Palet Warna Baru
const BRAND_COLOR = "#0d9488";
const SOFT_BG = "#fafaf9";
const CARD_BORDER = "#f5f5f4";

const STAT_CARDS = [
    {
        title: "Pasien Baru Hari Ini",
        key: "pasienBaru",
        icon: <People />,
        color: "#0ea5e9",
        trendKey: "pasienBaruTrend",
    },
    {
        title: "Kunjungan Hari Ini",
        key: "kunjunganHariIni",
        icon: <LocalHospital />,
        color: "#8b5cf6",
        trendKey: "kunjunganTrend",
    },
    {
        title: "Antrean Aktif",
        key: "antreanAktif",
        icon: <Schedule />,
        color: "#f59e0b",
        trendKey: "antreanTrend",
    },
    {
        title: "Pemeriksaan Selesai",
        key: "pemeriksaanSelesai",
        icon: <MedicalServices />,
        color: "#10b981",
        trendKey: "pemeriksaanTrend",
    },
    {
        title: "Lab Selesai",
        key: "labSelesai",
        icon: <Science />,
        color: "#06b6d4",
        trendKey: "labTrend",
    },
    {
        title: "Pendapatan Hari Ini",
        key: "pendapatanHariIni",
        icon: <AttachMoney />,
        color: "#ec4899",
        trendKey: "pendapatanTrend",
        isCurrency: true,
    },
];

const QUICK_ACTIONS = [
    {
        id: "pendaftaran",
        label: "Pendaftaran Baru",
        icon: <PersonAdd />,
        path: "/pendaftaran",
        color: "#0d9488",
        roles: ["admin", "petugas_pendaftaran", "dokter"],
    },
    {
        id: "antrean",
        label: "Kelola Antrean",
        icon: <LocalHospital />,
        path: "/antrean",
        color: "#8b5cf6",
        roles: ["admin", "petugas_pendaftaran"],
    },
    {
        id: "pemeriksaan",
        label: "Input Pemeriksaan",
        icon: <MedicalServices />,
        path: "/pemeriksaan",
        color: "#10b981",
        roles: ["admin", "dokter"],
    },
    {
        id: "laboratorium",
        label: "Order Lab",
        icon: <Science />,
        path: "/laboratorium",
        color: "#0ea5e9",
        roles: ["admin", "dokter", "petugas_laboratorium"],
    },
    {
        id: "farmasi",
        label: "Kelola Resep",
        icon: <LocalPharmacy />,
        path: "/farmasi",
        color: "#f59e0b",
        roles: ["admin", "petugas_farmasi", "dokter"],
    },
    {
        id: "billing",
        label: "Generate Billing",
        icon: <AttachMoney />,
        path: "/billing",
        color: "#ef4444",
        roles: ["admin", "kasir"],
    },
];

export default function DashboardPage() {
    const theme = useTheme();
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(7, "day"),
        dayjs(),
    ]);
    const [stats, setStats] = useState(DUMMY_DASHBOARD_STATS);
    const [chartsData, setChartsData] = useState(DUMMY_DASHBOARD_CHARTS);
    const [recentActivities, setRecentActivities] = useState(
        DUMMY_DASHBOARD_ACTIVITIES,
    );
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const [connectionStatus, setConnectionStatus] = useState({
        queue: false,
        lab: false,
        billing: false,
        notification: false,
    });
    const [wsConnected, setWsConnected] = useState(false);

    const queueWs = useQueueWebSocket((data) =>
        handleRealtimeUpdate("queue", data),
    );
    const labWs = useLabWebSocket((data) => handleRealtimeUpdate("lab", data));
    const billingWs = useBillingWebSocket((data) =>
        handleRealtimeUpdate("billing", data),
    );
    const notifWs = useNotificationWebSocket((data) =>
        handleNotification(data),
    );

    const handleRealtimeUpdate = useCallback((type, data) => {
        setConnectionStatus((prev) => ({ ...prev, [type]: true }));
        setTimeout(
            () => setConnectionStatus((prev) => ({ ...prev, [type]: false })),
            2000,
        );

        if (type === "queue")
            setStats((prev) => ({
                ...prev,
                antreanAktif: data.total_waiting || prev.antreanAktif,
            }));
        else if (type === "lab")
            setStats((prev) => ({
                ...prev,
                labSelesai: data.completed_today || prev.labSelesai,
            }));
        else if (type === "billing")
            setStats((prev) => ({
                ...prev,
                pendapatanHariIni: data.today_revenue || prev.pendapatanHariIni,
            }));

        refetchStats();
    }, []);

    const handleNotification = useCallback((data) => {
        setConnectionStatus((prev) => ({ ...prev, notification: true }));
        setTimeout(
            () =>
                setConnectionStatus((prev) => ({
                    ...prev,
                    notification: false,
                })),
            2000,
        );
        if (data.type === "alert") {
            setAlerts((prev) => [data, ...prev.slice(0, 9)]);
            showSnackbar(data.message, data.severity || "info");
        }
    }, []);

    const showSnackbar = (message, severity = "success") =>
        setSnackbar({ open: true, message, severity });

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                date_from: dateRange[0]?.format("YYYY-MM-DD"),
                date_to: dateRange[1]?.format("YYYY-MM-DD"),
            };
            const [statsRes, chartsRes, activityRes] = await Promise.allSettled(
                [
                    nodeApi.get("/api/dashboard/stats", { params }),
                    nodeApi.get("/api/dashboard/charts", { params }),
                    nodeApi.get("/api/dashboard/recent-activity", {
                        params: { ...params, limit: 10 },
                    }),
                ],
            );

            if (statsRes.status === "fulfilled")
                setStats(
                    statsRes.value.data?.data || statsRes.value.data || {},
                );
            if (chartsRes.status === "fulfilled")
                setChartsData(
                    chartsRes.value.data?.data || chartsRes.value.data || {},
                );
            if (activityRes.status === "fulfilled") {
                const payload =
                    activityRes.value.data?.data ||
                    activityRes.value.data ||
                    [];
                setRecentActivities(Array.isArray(payload) ? payload : []);
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    const refetchStats = useCallback(async () => {
        try {
            const res = await nodeApi.get("/api/dashboard/stats");
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    useEffect(() => {
        const checkConnections = () => {
            setWsConnected(
                queueWs.connected ||
                    labWs.connected ||
                    billingWs.connected ||
                    notifWs.connected,
            );
        };
        const interval = setInterval(checkConnections, 5000);
        checkConnections();
        return () => clearInterval(interval);
    }, [queueWs, labWs, billingWs, notifWs]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

    const userName = user?.fullName || user?.username || "Staf";
    const filteredActions = useMemo(
        () =>
            QUICK_ACTIONS.filter(
                (action) =>
                    action.roles.includes("all") ||
                    action.roles.some((r) => user?.roles?.includes(r)),
            ),
        [user?.roles],
    );

    if (loading && Object.keys(stats).length === 0) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                }}
            >
                <CircularProgress
                    size={48}
                    sx={{ color: BRAND_COLOR, mb: 2 }}
                />
                <Typography variant="body1" color="text.secondary">
                    Menyiapkan ringkasan hari ini...
                </Typography>
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} locale="id">
            <SEOHead
                title="Dashboard"
                description="Ringkasan operasional harian SIMRS"
                path="/dashboard"
            />

            <Box
                sx={{ display: "flex", flexDirection: "column", gap: 4, pb: 4 }}
            >
                {/* --- HEADER: Sapaan & Filter Tanggal --- */}
                <motion.div
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h4"
                                fontWeight={800}
                                color="#1c1917"
                                sx={{ mb: 0.5, letterSpacing: "-0.02em" }}
                            >
                                {getGreeting()}, {userName.split(" ")[0]} 👋
                            </Typography>
                            <Typography variant="body1" color="#78716c">
                                Semoga harimu menyenangkan. Berikut ringkasan
                                operasional rumah sakit.
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                backgroundColor: "#fff",
                                p: 1,
                                pr: 2,
                                borderRadius: 3,
                                border: `1px solid ${CARD_BORDER}`,
                            }}
                        >
                            <Box
                                sx={{
                                    p: 1,
                                    borderRadius: 2,
                                    backgroundColor: SOFT_BG,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <DateRange
                                    sx={{ fontSize: 18, color: BRAND_COLOR }}
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
                                        InputProps: { disableUnderline: true },
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
                                        InputProps: { disableUnderline: true },
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </motion.div>

                {/* --- STAT CARDS --- */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                >
                    <Grid container spacing={3}>
                        {STAT_CARDS.map((stat, index) => (
                            <Grid
                                item
                                xs={12}
                                sm={6}
                                lg={4}
                                xl={2}
                                key={stat.key}
                            >
                                <MotionItem>
                                    <Card
                                        sx={{
                                            borderRadius: 4,
                                            boxShadow:
                                                "0 4px 20px -10px rgba(0,0,0,0.05)",
                                            border: `1px solid ${CARD_BORDER}`,
                                            backgroundColor: "#fff",
                                        }}
                                    >
                                        <CardContent
                                            sx={{
                                                p: 3,
                                                "&:last-child": { pb: 3 },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    mb: 2,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 3,
                                                        backgroundColor: `${stat.color}15`,
                                                        color: stat.color,
                                                        display: "flex",
                                                    }}
                                                >
                                                    {React.cloneElement(
                                                        stat.icon,
                                                        { fontSize: "medium" },
                                                    )}
                                                </Box>
                                                {stats[stat.trendKey] !==
                                                    undefined && (
                                                    <Chip
                                                        size="small"
                                                        icon={
                                                            stats[
                                                                stat.trendKey
                                                            ] >= 0 ? (
                                                                <ArrowUpward fontSize="small" />
                                                            ) : (
                                                                <ArrowDownward fontSize="small" />
                                                            )
                                                        }
                                                        label={`${Math.abs(stats[stat.trendKey])}%`}
                                                        sx={{
                                                            fontWeight: 600,
                                                            fontSize: "0.7rem",
                                                            height: 24,
                                                            backgroundColor:
                                                                stats[
                                                                    stat
                                                                        .trendKey
                                                                ] >= 0
                                                                    ? "#ecfdf5"
                                                                    : "#fef2f2",
                                                            color:
                                                                stats[
                                                                    stat
                                                                        .trendKey
                                                                ] >= 0
                                                                    ? "#10b981"
                                                                    : "#ef4444",
                                                            "& .MuiChip-icon": {
                                                                color: "inherit",
                                                                ml: 0.5,
                                                            },
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography
                                                variant="h5"
                                                fontWeight={800}
                                                color="#1c1917"
                                                sx={{
                                                    mb: 0.5,
                                                    letterSpacing: "-0.02em",
                                                }}
                                            >
                                                {stat.isCurrency
                                                    ? formatCurrency(
                                                          stats[stat.key],
                                                      )
                                                    : formatNumber(
                                                          stats[stat.key],
                                                      )}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="#78716c"
                                                fontWeight={500}
                                            >
                                                {stat.title}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </MotionItem>
                            </Grid>
                        ))}
                    </Grid>
                </motion.div>

                {/* --- AKSI CEPAT & STATUS KONEKSI --- */}
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={8}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card
                                sx={{
                                    height: "100%",
                                    borderRadius: 4,
                                    border: `1px solid ${CARD_BORDER}`,
                                    boxShadow:
                                        "0 4px 20px -10px rgba(0,0,0,0.05)",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <Box sx={{ p: 3 }}>
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        color="#1c1917"
                                        sx={{ mb: 0.5 }}
                                    >
                                        Aksi Cepat
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="#78716c"
                                        sx={{ mb: 3 }}
                                    >
                                        Akses fitur yang sering Anda gunakan.
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 1.5,
                                        }}
                                    >
                                        {filteredActions.map(
                                            (action, index) => (
                                                <motion.div
                                                    key={action.id}
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() =>
                                                            (window.location.href =
                                                                action.path)
                                                        }
                                                        startIcon={React.cloneElement(
                                                            action.icon,
                                                            {
                                                                sx: {
                                                                    color: action.color,
                                                                },
                                                            },
                                                        )}
                                                        sx={{
                                                            borderRadius: 10,
                                                            px: 2.5,
                                                            py: 1.2,
                                                            fontWeight: 600,
                                                            textTransform:
                                                                "none",
                                                            color: "#1c1917",
                                                            borderColor:
                                                                CARD_BORDER,
                                                            backgroundColor:
                                                                "#fff",
                                                            "&:hover": {
                                                                borderColor:
                                                                    action.color,
                                                                backgroundColor: `${action.color}05`,
                                                            },
                                                        }}
                                                    >
                                                        {action.label}
                                                    </Button>
                                                </motion.div>
                                            ),
                                        )}
                                    </Box>
                                </Box>
                            </Card>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <Card
                                sx={{
                                    height: "100%",
                                    borderRadius: 4,
                                    border: `1px solid ${CARD_BORDER}`,
                                    boxShadow:
                                        "0 4px 20px -10px rgba(0,0,0,0.05)",
                                    background: SOFT_BG,
                                }}
                            >
                                <Box sx={{ p: 3 }}>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                        color="#1c1917"
                                        sx={{
                                            mb: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        {wsConnected ? (
                                            <Wifi
                                                sx={{
                                                    fontSize: 18,
                                                    color: "#10b981",
                                                }}
                                            />
                                        ) : (
                                            <WifiOff
                                                sx={{
                                                    fontSize: 18,
                                                    color: "#ef4444",
                                                }}
                                            />
                                        )}
                                        Status Real-time
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 2,
                                        }}
                                    >
                                        {[
                                            {
                                                key: "queue",
                                                label: "Antrean Poli",
                                                icon: (
                                                    <LocalHospital fontSize="small" />
                                                ),
                                            },
                                            {
                                                key: "lab",
                                                label: "Laboratorium",
                                                icon: (
                                                    <Science fontSize="small" />
                                                ),
                                            },
                                            {
                                                key: "billing",
                                                label: "Billing & Kasir",
                                                icon: (
                                                    <AttachMoney fontSize="small" />
                                                ),
                                            },
                                            {
                                                key: "notification",
                                                label: "Notifikasi Sistem",
                                                icon: (
                                                    <NotificationsActive fontSize="small" />
                                                ),
                                            },
                                        ].map(({ key, label, icon }) => (
                                            <Box
                                                key={key}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                        "space-between",
                                                    py: 0.5,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.5,
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            color: "#a8a29e",
                                                        }}
                                                    >
                                                        {icon}
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        color="#44403c"
                                                        fontWeight={500}
                                                    >
                                                        {label}
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 0.75,
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                connectionStatus[
                                                                    key
                                                                ]
                                                                    ? "#10b981"
                                                                    : wsConnected
                                                                      ? "#34d399"
                                                                      : "#d6d3d1",
                                                            transition:
                                                                "all 0.3s",
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="caption"
                                                        color={
                                                            connectionStatus[
                                                                key
                                                            ]
                                                                ? "#10b981"
                                                                : "#78716c"
                                                        }
                                                        fontWeight={600}
                                                    >
                                                        {connectionStatus[key]
                                                            ? "Aktif"
                                                            : "Idle"}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>

                {/* --- CHARTS SECTION (Murni menggunakan MUI Card agar Shadow & Putihnya Muncul) --- */}
                <Grid container spacing={3}>
                    {/* 1. Kunjungan Pasien */}
                    <Grid item xs={12} lg={8}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ height: "100%" }}
                        >
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    border: `1px solid ${CARD_BORDER}`,
                                    boxShadow:
                                        "0 8px 30px -12px rgba(0,0,0,0.08)",
                                    p: 3,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        color="#1c1917"
                                        sx={{ mb: 0.5 }}
                                    >
                                        Kunjungan Pasien
                                    </Typography>
                                    <Typography variant="body2" color="#78716c">
                                        Pergerakan kunjungan harian & pasien
                                        baru
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        flex: 1,
                                        minHeight: 320,
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "#fafaf9",
                                            borderRadius: 3,
                                            border: "1px dashed #e7e5e4",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                p: 2,
                                                borderRadius: "50%",
                                                backgroundColor: "#fff",
                                                boxShadow:
                                                    "0 4px 12px rgba(0,0,0,0.03)",
                                                mb: 2,
                                            }}
                                        >
                                            <ShowChart
                                                sx={{
                                                    fontSize: 40,
                                                    color: "#a8a29e",
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            color="#44403c"
                                        >
                                            Data tren kunjungan belum tersedia
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="#78716c"
                                        >
                                            Grafik tren akan muncul saat pasien
                                            mulai berkunjung.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </motion.div>
                    </Grid>

                    {/* 2. Distribusi Pasien (Pie) */}
                    <Grid item xs={12} lg={4}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            style={{ height: "100%" }}
                        >
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    border: `1px solid ${CARD_BORDER}`,
                                    boxShadow:
                                        "0 8px 30px -12px rgba(0,0,0,0.08)",
                                    p: 3,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        color="#1c1917"
                                        sx={{ mb: 0.5 }}
                                    >
                                        Distribusi Pasien
                                    </Typography>
                                    <Typography variant="body2" color="#78716c">
                                        Sebaran per poliklinik hari ini
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        flex: 1,
                                        minHeight: 320,
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "#fafaf9",
                                            borderRadius: 3,
                                            border: "1px dashed #e7e5e4",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                p: 2,
                                                borderRadius: "50%",
                                                backgroundColor: "#fff",
                                                boxShadow:
                                                    "0 4px 12px rgba(0,0,0,0.03)",
                                                mb: 2,
                                            }}
                                        >
                                            <PieChartOutline
                                                sx={{
                                                    fontSize: 40,
                                                    color: "#a8a29e",
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            color="#44403c"
                                        >
                                            Data sebaran kosong
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="#78716c"
                                        >
                                            Distribusi poli akan tampil di sini.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </motion.div>
                    </Grid>

                    {/* 3. Pendapatan (Area) */}
                    <Grid item xs={12} md={6}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{ height: "100%" }}
                        >
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    border: `1px solid ${CARD_BORDER}`,
                                    boxShadow:
                                        "0 8px 30px -12px rgba(0,0,0,0.08)",
                                    p: 3,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        color="#1c1917"
                                        sx={{ mb: 0.5 }}
                                    >
                                        Pendapatan
                                    </Typography>
                                    <Typography variant="body2" color="#78716c">
                                        Tren 30 hari terakhir
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        flex: 1,
                                        minHeight: 280,
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "#fafaf9",
                                            borderRadius: 3,
                                            border: "1px dashed #e7e5e4",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                p: 2,
                                                borderRadius: "50%",
                                                backgroundColor: "#fff",
                                                boxShadow:
                                                    "0 4px 12px rgba(0,0,0,0.03)",
                                                mb: 2,
                                            }}
                                        >
                                            <InsertChartOutlined
                                                sx={{
                                                    fontSize: 40,
                                                    color: "#a8a29e",
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            color="#44403c"
                                        >
                                            Belum ada pendapatan
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="#78716c"
                                        >
                                            Data pendapatan harian akan direkap
                                            di sini.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </motion.div>
                    </Grid>

                    {/* 4. Antrean per Poli (Bar) */}
                    <Grid item xs={12} md={6}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            style={{ height: "100%" }}
                        >
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    border: `1px solid ${CARD_BORDER}`,
                                    boxShadow:
                                        "0 8px 30px -12px rgba(0,0,0,0.08)",
                                    p: 3,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        color="#1c1917"
                                        sx={{ mb: 0.5 }}
                                    >
                                        Antrean per Poli
                                    </Typography>
                                    <Typography variant="body2" color="#78716c">
                                        Status antrean saat ini
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        flex: 1,
                                        minHeight: 280,
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "#fafaf9",
                                            borderRadius: 3,
                                            border: "1px dashed #e7e5e4",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                p: 2,
                                                borderRadius: "50%",
                                                backgroundColor: "#fff",
                                                boxShadow:
                                                    "0 4px 12px rgba(0,0,0,0.03)",
                                                mb: 2,
                                            }}
                                        >
                                            <BarChartIcon
                                                sx={{
                                                    fontSize: 40,
                                                    color: "#a8a29e",
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            color="#44403c"
                                        >
                                            Antrean masih lengang
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="#78716c"
                                        >
                                            Belum ada pasien dalam antrean saat
                                            ini.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>

                {/* --- AKTIVITAS & PERINGATAN --- */}
                {(recentActivities.length > 0 || alerts.length > 0) && (
                    <Grid container spacing={3}>
                        {recentActivities.length > 0 && (
                            <Grid item xs={12} md={alerts.length > 0 ? 6 : 12}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Card
                                        sx={{
                                            borderRadius: 4,
                                            border: `1px solid ${CARD_BORDER}`,
                                            boxShadow:
                                                "0 4px 20px -10px rgba(0,0,0,0.05)",
                                            backgroundColor: "#fff",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                p: 3,
                                                borderBottom: `1px solid ${CARD_BORDER}`,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <Analytics
                                                sx={{ color: BRAND_COLOR }}
                                            />
                                            <Typography
                                                variant="h6"
                                                fontWeight={700}
                                                color="#1c1917"
                                            >
                                                Aktivitas Terbaru
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                maxHeight: 400,
                                                overflowY: "auto",
                                            }}
                                        >
                                            {recentActivities.map(
                                                (activity, i) => (
                                                    <Box
                                                        key={i}
                                                        sx={{
                                                            display: "flex",
                                                            gap: 2,
                                                            p: 2.5,
                                                            borderBottom: `1px solid ${SOFT_BG}`,
                                                            "&:hover": {
                                                                backgroundColor:
                                                                    SOFT_BG,
                                                            },
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                p: 1,
                                                                borderRadius: 2,
                                                                backgroundColor:
                                                                    "#f0fdfa",
                                                                color: BRAND_COLOR,
                                                                height: "fit-content",
                                                            }}
                                                        >
                                                            {activity.type ===
                                                            "registration" ? (
                                                                <PersonAdd fontSize="small" />
                                                            ) : activity.type ===
                                                              "lab" ? (
                                                                <Science fontSize="small" />
                                                            ) : (
                                                                <MedicalServices fontSize="small" />
                                                            )}
                                                        </Box>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={600}
                                                                color="#1c1917"
                                                                sx={{ mb: 0.5 }}
                                                            >
                                                                {
                                                                    activity.description
                                                                }
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                color="#78716c"
                                                            >
                                                                {activity.patient_name ||
                                                                    "Sistem"}{" "}
                                                                •{" "}
                                                                {new Date(
                                                                    activity.created_at,
                                                                ).toLocaleTimeString(
                                                                    "id-ID",
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    },
                                                                )}
                                                            </Typography>
                                                        </Box>
                                                        {activity.status && (
                                                            <Chip
                                                                label={
                                                                    activity.status
                                                                }
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize:
                                                                        "0.65rem",
                                                                    fontWeight: 600,
                                                                    backgroundColor:
                                                                        activity.status ===
                                                                        "completed"
                                                                            ? "#ecfdf5"
                                                                            : "#fffbeb",
                                                                    color:
                                                                        activity.status ===
                                                                        "completed"
                                                                            ? "#10b981"
                                                                            : "#f59e0b",
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                ),
                                            )}
                                        </Box>
                                    </Card>
                                </motion.div>
                            </Grid>
                        )}

                        {alerts.length > 0 && (
                            <Grid
                                item
                                xs={12}
                                md={recentActivities.length > 0 ? 6 : 12}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                >
                                    <Card
                                        sx={{
                                            borderRadius: 4,
                                            border: `1px solid ${CARD_BORDER}`,
                                            boxShadow:
                                                "0 4px 20px -10px rgba(0,0,0,0.05)",
                                            backgroundColor: "#fff",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                p: 3,
                                                borderBottom: `1px solid ${CARD_BORDER}`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                <NotificationsActive
                                                    sx={{ color: "#f59e0b" }}
                                                />
                                                <Typography
                                                    variant="h6"
                                                    fontWeight={700}
                                                    color="#1c1917"
                                                >
                                                    Peringatan Sistem
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={`${alerts.length} Baru`}
                                                size="small"
                                                color="warning"
                                                sx={{
                                                    fontWeight: 600,
                                                    height: 24,
                                                }}
                                            />
                                        </Box>
                                        <Box
                                            sx={{
                                                maxHeight: 400,
                                                overflowY: "auto",
                                            }}
                                        >
                                            {alerts.map((alert, i) => (
                                                <Box
                                                    key={i}
                                                    sx={{
                                                        display: "flex",
                                                        gap: 2,
                                                        p: 2.5,
                                                        borderBottom: `1px solid ${SOFT_BG}`,
                                                        "&:hover": {
                                                            backgroundColor:
                                                                SOFT_BG,
                                                        },
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            p: 1,
                                                            borderRadius: 2,
                                                            backgroundColor:
                                                                alert.severity ===
                                                                "error"
                                                                    ? "#fef2f2"
                                                                    : "#fffbeb",
                                                            color:
                                                                alert.severity ===
                                                                "error"
                                                                    ? "#ef4444"
                                                                    : "#f59e0b",
                                                            height: "fit-content",
                                                        }}
                                                    >
                                                        <NotificationsActive fontSize="small" />
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={500}
                                                            color="#1c1917"
                                                            sx={{ mb: 0.5 }}
                                                        >
                                                            {alert.message}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="#78716c"
                                                        >
                                                            {new Date(
                                                                alert.timestamp,
                                                            ).toLocaleTimeString(
                                                                "id-ID",
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}{" "}
                                                            WIB
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Card>
                                </motion.div>
                            </Grid>
                        )}
                    </Grid>
                )}
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        borderRadius: 3,
                        fontWeight: 500,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </LocalizationProvider>
    );
}
