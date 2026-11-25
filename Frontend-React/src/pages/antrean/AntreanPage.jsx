import React, { useState, useEffect } from "react";
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
    IconButton,
    Chip,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment,
    Tooltip,
    Switch,
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
    Refresh,
    Call,
    SkipNext,
    CheckCircle,
    Cancel,
    VolumeUp,
    AccessTime,
    Person,
    FilterAlt,
    PlayArrow,
    Pause,
    NotificationsActive,
} from "@mui/icons-material";
import { useYiiQuery, useYiiMutation } from "../../hooks/useApi";
import { formatDate, formatTime } from "../../utils/format";
import StatusChip from "../../components/ui/StatusChip";
import EmptyState from "../../components/ui/EmptyState";
import { useNotification } from "../../contexts/NotificationContext";
import { DUMMY_POLI, DUMMY_ANTREAN, withDummy } from "../../data/dummyData";

// Palet Warna UI (Selaras dengan Dashboard)
const BRAND_COLOR = "#0d9488";
const SOFT_BG = "#fafaf9";
const CARD_BORDER = "#f5f5f4";

const STATUS_CONFIG = {
    waiting: {
        label: "Menunggu",
        color: "#f59e0b",
        bg: "#fffbeb",
        icon: <AccessTime fontSize="small" />,
    },
    called: {
        label: "Dipanggil",
        color: "#0ea5e9",
        bg: "#e0f2fe",
        icon: <NotificationsActive fontSize="small" />,
    },
    in_progress: {
        label: "Diperiksa",
        color: "#8b5cf6",
        bg: "#f3e8ff",
        icon: <PlayArrow fontSize="small" />,
    },
    completed: {
        label: "Selesai",
        color: "#10b981",
        bg: "#ecfdf5",
        icon: <CheckCircle fontSize="small" />,
    },
    cancelled: {
        label: "Batal",
        color: "#ef4444",
        bg: "#fef2f2",
        icon: <Cancel fontSize="small" />,
    },
};

const STATUS_ORDER = [
    "waiting",
    "called",
    "in_progress",
    "completed",
    "cancelled",
];

export default function AntreanPage() {
    const { showSuccess, showError } = useNotification();
    const [selectedPoli, setSelectedPoli] = useState("");
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0],
    );
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Data queries
    const { data: poliData, isLoading: loadingPoli } = useYiiQuery(
        ["poli", "list"],
        "/poli",
        { is_active: true, perPage: 100 },
    );
    const {
        data: antreanData,
        isLoading: loadingAntrean,
        refetch: refetchAntrean,
    } = useYiiQuery(
        ["antrean", "queue", selectedPoli, selectedDate],
        "/antrean/queue",
        { poli_id: selectedPoli, date: selectedDate, perPage: 100 },
        { enabled: !!selectedPoli },
    );
    const poliRows = withDummy(poliData?.data, DUMMY_POLI);
    const antreanRows = withDummy(antreanData?.data, DUMMY_ANTREAN);

    // Mutations
    const callAntrean = useYiiMutation("/antrean", "post", {
        invalidateKeys: [["antrean", "queue", selectedPoli, selectedDate]],
        onSuccess: (_, variables) =>
            showSuccess(`Antrean ${variables.no_antrean} berhasil dipanggil`),
        onError: (err) => showError(err.message),
    });

    const recallAntrean = useYiiMutation("/antrean", "post", {
        invalidateKeys: [["antrean", "queue", selectedPoli, selectedDate]],
        onSuccess: (_, variables) =>
            showSuccess(`Antrean ${variables.no_antrean} dipanggil ulang`),
        onError: (err) => showError(err.message),
    });

    const skipAntrean = useYiiMutation("/antrean", "post", {
        invalidateKeys: [["antrean", "queue", selectedPoli, selectedDate]],
        onSuccess: (_, variables) =>
            showSuccess(`Antrean ${variables.no_antrean} dilewati`),
        onError: (err) => showError(err.message),
    });

    const completeAntrean = useYiiMutation("/antrean", "post", {
        invalidateKeys: [["antrean", "queue", selectedPoli, selectedDate]],
        onSuccess: (_, variables) =>
            showSuccess(`Antrean ${variables.no_antrean} selesai`),
        onError: (err) => showError(err.message),
    });

    const cancelAntrean = useYiiMutation("/antrean", "post", {
        invalidateKeys: [["antrean", "queue", selectedPoli, selectedDate]],
        onSuccess: (_, variables) =>
            showSuccess(`Antrean ${variables.no_antrean} dibatalkan`),
        onError: (err) => showError(err.message),
    });

    const playCallSound = () => {
        if (!soundEnabled) return;
        try {
            const audio = new Audio(
                "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAA==",
            );
            audio.play().catch(() => {});
        } catch {
            return;
        }
    };

    const handleCall = async (antrean) => {
        await callAntrean.mutateAsync({
            id: antrean.id,
            action: "call",
            no_antrean: antrean.no_antrean,
        });
        playCallSound();
    };

    const handleRecall = async (antrean) => {
        await recallAntrean.mutateAsync({
            id: antrean.id,
            action: "recall",
            no_antrean: antrean.no_antrean,
        });
        playCallSound();
    };

    const handleSkip = async (antrean) => {
        await skipAntrean.mutateAsync({
            id: antrean.id,
            action: "skip",
            no_antrean: antrean.no_antrean,
        });
    };

    const handleComplete = async (antrean) => {
        await completeAntrean.mutateAsync({
            id: antrean.id,
            action: "complete",
            no_antrean: antrean.no_antrean,
        });
    };

    const handleCancel = async (antrean) => {
        if (!window.confirm(`Batalkan antrean ${antrean.no_antrean}?`)) return;
        await cancelAntrean.mutateAsync({
            id: antrean.id,
            action: "cancel",
            no_antrean: antrean.no_antrean,
        });
    };

    // Auto refresh
    useEffect(() => {
        if (!autoRefresh || !selectedPoli) return;
        const interval = setInterval(() => refetchAntrean(), 10000);
        return () => clearInterval(interval);
    }, [autoRefresh, selectedPoli, selectedDate, refetchAntrean]);

    const canCall = (status) => status === "waiting";
    const canRecall = (status) => status === "called";
    const canSkip = (status) => ["waiting", "called"].includes(status);
    const canComplete = (status) => status === "in_progress";
    const canCancel = (status) =>
        ["waiting", "called", "in_progress"].includes(status);

    // Filter data berdasarkan pencarian
    const filteredAntrean =
        antreanRows?.filter(
            (a) =>
                !searchText ||
                a.pasien_nama
                    ?.toLowerCase()
                    .includes(searchText.toLowerCase()) ||
                a.no_rm?.toLowerCase().includes(searchText.toLowerCase()) ||
                a.no_antrean?.toString().includes(searchText),
        ) || [];

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
                        Manajemen Antrean
                    </Typography>
                    <Typography variant="body1" color="#78716c">
                        Panggil dan kelola status antrean pasien per poliklinik
                        secara real-time.
                    </Typography>
                </Box>

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
                            <Grid item xs={12} sm={4} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Pilih Poliklinik</InputLabel>
                                    <Select
                                        value={selectedPoli}
                                        label="Pilih Poliklinik"
                                        onChange={(e) => {
                                            setSelectedPoli(e.target.value);
                                            setPage(0);
                                        }}
                                        sx={{
                                            borderRadius: 2,
                                            backgroundColor: SOFT_BG,
                                        }}
                                    >
                                        {poliRows.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.nama}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4} md={3}>
                                <DatePicker
                                    label="Tanggal Kunjungan"
                                    value={dayjs(selectedDate)}
                                    onChange={(v) => {
                                        setSelectedDate(v.format("YYYY-MM-DD"));
                                        setPage(0);
                                    }}
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            fullWidth: true,
                                            sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: 2,
                                                    backgroundColor: SOFT_BG,
                                                },
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Cari nama, No. RM, atau No. Antrean..."
                                    value={searchText}
                                    onChange={(e) =>
                                        setSearchText(e.target.value)
                                    }
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search
                                                    sx={{ color: "#a8a29e" }}
                                                />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2,
                                            backgroundColor: SOFT_BG,
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 1,
                                    }}
                                >
                                    <Tooltip title="Auto-Refresh setiap 10 detik">
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                            }}
                                        >
                                            {autoRefresh ? (
                                                <PlayArrow
                                                    sx={{
                                                        fontSize: 16,
                                                        color: BRAND_COLOR,
                                                    }}
                                                />
                                            ) : (
                                                <Pause
                                                    sx={{
                                                        fontSize: 16,
                                                        color: "#a8a29e",
                                                    }}
                                                />
                                            )}
                                            <Switch
                                                size="small"
                                                checked={autoRefresh}
                                                onChange={(e) =>
                                                    setAutoRefresh(
                                                        e.target.checked,
                                                    )
                                                }
                                                color="success"
                                            />
                                        </Box>
                                    </Tooltip>
                                    <Tooltip title="Suara Panggilan">
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                            }}
                                        >
                                            <VolumeUp
                                                sx={{
                                                    fontSize: 18,
                                                    color: soundEnabled
                                                        ? BRAND_COLOR
                                                        : "#a8a29e",
                                                }}
                                            />
                                            <Switch
                                                size="small"
                                                checked={soundEnabled}
                                                onChange={(e) =>
                                                    setSoundEnabled(
                                                        e.target.checked,
                                                    )
                                                }
                                                color="success"
                                            />
                                        </Box>
                                    </Tooltip>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* --- SUMMARY CARDS --- */}
                {selectedPoli && antreanRows && (
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {STATUS_ORDER.map((status) => {
                            const count = antreanRows.filter(
                                (a) => a.status === status,
                            ).length;
                            const config = STATUS_CONFIG[status];
                            return (
                                <Grid item xs={6} sm={4} lg={2.4} key={status}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            border: `1px solid ${CARD_BORDER}`,
                                            boxShadow: "none",
                                            backgroundColor: config.bg,
                                            transition: "transform 0.2s",
                                            "&:hover": {
                                                transform: "translateY(-2px)",
                                            },
                                        }}
                                    >
                                        <CardContent
                                            sx={{
                                                p: 2,
                                                "&:last-child": { pb: 2 },
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={600}
                                                    color={config.color}
                                                    sx={{
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing: "0.05em",
                                                    }}
                                                >
                                                    {config.label}
                                                </Typography>
                                                <Typography
                                                    variant="h4"
                                                    fontWeight={800}
                                                    color="#1c1917"
                                                    sx={{
                                                        lineHeight: 1.1,
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    {count}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#fff",
                                                    color: config.color,
                                                    display: "flex",
                                                    boxShadow:
                                                        "0 4px 10px rgba(0,0,0,0.04)",
                                                }}
                                            >
                                                {config.icon}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* --- QUEUE TABLE --- */}
                <Card
                    sx={{
                        borderRadius: 4,
                        border: `1px solid ${CARD_BORDER}`,
                        boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)",
                        backgroundColor: "#fff",
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        {loadingAntrean ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 8,
                                }}
                            >
                                <CircularProgress sx={{ color: BRAND_COLOR }} />
                            </Box>
                        ) : !selectedPoli ? (
                            <EmptyState
                                type="queue"
                                title="Silakan Pilih Poliklinik"
                                description="Pilih poli dan tanggal pada filter di atas untuk mulai memanggil antrean pasien."
                                size="lg"
                            />
                        ) : (
                            <>
                                <TableContainer
                                    sx={{
                                        maxHeight: 600,
                                        borderRadius: 2,
                                        border: `1px solid ${CARD_BORDER}`,
                                    }}
                                >
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                {[
                                                    "Antrean",
                                                    "Informasi Pasien",
                                                    "Poli & Dokter",
                                                    "Waktu Daftar",
                                                    "Status",
                                                    "Aksi",
                                                ].map((head) => (
                                                    <TableCell
                                                        key={head}
                                                        sx={{
                                                            fontWeight: 600,
                                                            backgroundColor:
                                                                SOFT_BG,
                                                            color: "#44403c",
                                                            borderBottom: `1px solid ${CARD_BORDER}`,
                                                            py: 1.5,
                                                        }}
                                                    >
                                                        {head}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredAntrean
                                                .slice(
                                                    page * rowsPerPage,
                                                    page * rowsPerPage +
                                                        rowsPerPage,
                                                )
                                                .map((antrean) => (
                                                    <TableRow
                                                        key={antrean.id}
                                                        hover
                                                        sx={{
                                                            "&:last-child td": {
                                                                borderBottom:
                                                                    "none",
                                                            },
                                                        }}
                                                    >
                                                        {/* No Antrean */}
                                                        <TableCell>
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                    width: 48,
                                                                    height: 48,
                                                                    borderRadius: 2,
                                                                    backgroundColor: `${STATUS_CONFIG[antrean.status]?.color || "#9e9e9e"}15`,
                                                                    border: `1px solid ${STATUS_CONFIG[antrean.status]?.color || "#9e9e9e"}30`,
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="h6"
                                                                    fontWeight={
                                                                        800
                                                                    }
                                                                    sx={{
                                                                        color:
                                                                            STATUS_CONFIG[
                                                                                antrean
                                                                                    .status
                                                                            ]
                                                                                ?.color ||
                                                                            "#57534e",
                                                                        m: 0,
                                                                        letterSpacing:
                                                                            "-0.05em",
                                                                    }}
                                                                >
                                                                    {
                                                                        antrean.no_antrean
                                                                    }
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>

                                                        {/* Info Pasien */}
                                                        <TableCell>
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 1.5,
                                                                }}
                                                            >
                                                                <Avatar
                                                                    sx={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        bgcolor:
                                                                            SOFT_BG,
                                                                        color: "#78716c",
                                                                        fontSize:
                                                                            "0.85rem",
                                                                    }}
                                                                >
                                                                    {antrean.pasien_nama?.charAt(
                                                                        0,
                                                                    ) || "P"}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography
                                                                        variant="body2"
                                                                        fontWeight={
                                                                            600
                                                                        }
                                                                        color="#1c1917"
                                                                    >
                                                                        {
                                                                            antrean.pasien_nama
                                                                        }
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="#78716c"
                                                                    >
                                                                        RM:{" "}
                                                                        {
                                                                            antrean.no_rm
                                                                        }
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>

                                                        {/* Poli & Dokter */}
                                                        <TableCell>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={500}
                                                                color="#44403c"
                                                            >
                                                                {
                                                                    antrean.poli_nama
                                                                }
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                color="#78716c"
                                                            >
                                                                {antrean.dokter_nama ||
                                                                    "Dokter Umum"}
                                                            </Typography>
                                                        </TableCell>

                                                        {/* Waktu Daftar */}
                                                        <TableCell>
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 0.5,
                                                                    color: "#57534e",
                                                                }}
                                                            >
                                                                <AccessTime
                                                                    sx={{
                                                                        fontSize: 14,
                                                                        color: "#a8a29e",
                                                                    }}
                                                                />
                                                                <Typography variant="body2">
                                                                    {formatTime(
                                                                        antrean.created_at,
                                                                    )}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>

                                                        {/* Status */}
                                                        <TableCell>
                                                            <StatusChip
                                                                status={
                                                                    antrean.status
                                                                }
                                                                variant="filled"
                                                                size="small"
                                                            />
                                                        </TableCell>

                                                        {/* Aksi */}
                                                        <TableCell align="right">
                                                            <Stack
                                                                direction="row"
                                                                spacing={0.5}
                                                                justifyContent="flex-end"
                                                            >
                                                                <Tooltip title="Panggil Pasien">
                                                                    <span>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() =>
                                                                                handleCall(
                                                                                    antrean,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !canCall(
                                                                                    antrean.status,
                                                                                )
                                                                            }
                                                                            sx={{
                                                                                backgroundColor:
                                                                                    canCall(
                                                                                        antrean.status,
                                                                                    )
                                                                                        ? "#f0fdfa"
                                                                                        : "transparent",
                                                                                color: canCall(
                                                                                    antrean.status,
                                                                                )
                                                                                    ? BRAND_COLOR
                                                                                    : "#d6d3d1",
                                                                                "&:hover":
                                                                                    {
                                                                                        backgroundColor:
                                                                                            "#ccfbf1",
                                                                                    },
                                                                            }}
                                                                        >
                                                                            <Call fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>

                                                                <Tooltip title="Panggil Ulang">
                                                                    <span>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() =>
                                                                                handleRecall(
                                                                                    antrean,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !canRecall(
                                                                                    antrean.status,
                                                                                )
                                                                            }
                                                                            sx={{
                                                                                color: canRecall(
                                                                                    antrean.status,
                                                                                )
                                                                                    ? "#0ea5e9"
                                                                                    : "#d6d3d1",
                                                                            }}
                                                                        >
                                                                            <VolumeUp fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>

                                                                <Tooltip title="Lewati Antrean">
                                                                    <span>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() =>
                                                                                handleSkip(
                                                                                    antrean,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !canSkip(
                                                                                    antrean.status,
                                                                                )
                                                                            }
                                                                            sx={{
                                                                                color: canSkip(
                                                                                    antrean.status,
                                                                                )
                                                                                    ? "#f59e0b"
                                                                                    : "#d6d3d1",
                                                                            }}
                                                                        >
                                                                            <SkipNext fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>

                                                                <Tooltip title="Tandai Selesai">
                                                                    <span>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() =>
                                                                                handleComplete(
                                                                                    antrean,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !canComplete(
                                                                                    antrean.status,
                                                                                )
                                                                            }
                                                                            sx={{
                                                                                color: canComplete(
                                                                                    antrean.status,
                                                                                )
                                                                                    ? "#10b981"
                                                                                    : "#d6d3d1",
                                                                            }}
                                                                        >
                                                                            <CheckCircle fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>

                                                                <Tooltip title="Batalkan">
                                                                    <span>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() =>
                                                                                handleCancel(
                                                                                    antrean,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !canCancel(
                                                                                    antrean.status,
                                                                                )
                                                                            }
                                                                            sx={{
                                                                                color: canCancel(
                                                                                    antrean.status,
                                                                                )
                                                                                    ? "#ef4444"
                                                                                    : "#d6d3d1",
                                                                            }}
                                                                        >
                                                                            <Cancel fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}

                                            {filteredAntrean.length === 0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={6}
                                                        align="center"
                                                        sx={{ py: 6 }}
                                                    >
                                                        <EmptyState
                                                            type="queue"
                                                            title={
                                                                searchText
                                                                    ? "Pasien Tidak Ditemukan"
                                                                    : "Antrean Masih Kosong"
                                                            }
                                                            description={
                                                                searchText
                                                                    ? `Tidak ada antrean yang cocok dengan pencarian "${searchText}".`
                                                                    : "Belum ada pasien yang mendaftar di poli ini hari ini."
                                                            }
                                                            size="sm"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <TablePagination
                                    component="div"
                                    count={filteredAntrean.length}
                                    page={page}
                                    onPageChange={(_, p) => setPage(p)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(e.target.value);
                                        setPage(0);
                                    }}
                                    rowsPerPageOptions={[10, 15, 25, 50]}
                                    sx={{
                                        borderTop: "none",
                                        ".MuiTablePagination-toolbar": {
                                            minHeight: 48,
                                        },
                                    }}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </LocalizationProvider>
    );
}
