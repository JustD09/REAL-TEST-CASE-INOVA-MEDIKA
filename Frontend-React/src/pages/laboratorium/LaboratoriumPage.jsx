import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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
    FormHelperText,
    Tooltip,
    Avatar,
    Stack,
    Alert,
} from "@mui/material";
import {
    Search,
    Add,
    Edit,
    Visibility,
    Science,
    CheckCircle,
    Cancel,
    Print,
    AssignmentTurnedIn,
    LocalHospital,
    Person,
    PlayArrow,
    Inbox,
    DoneAll,
} from "@mui/icons-material";
import { useNodeQuery, useNodeMutation, useYiiQuery } from "../../hooks/useApi";
import { nodeApi } from "../../api/axios";
import { formatDate, formatDateTime } from "../../utils/format";
import StatusChip from "../../components/ui/StatusChip";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { useNotification } from "../../contexts/NotificationContext";
import {
    DUMMY_KUNJUNGAN,
    DUMMY_LAB_JENIS,
    DUMMY_LAB,
    withDummy,
} from "../../data/dummyData";

// Palet Warna UI
const BRAND_COLOR = "#0d9488";
const SOFT_BG = "#fafaf9";
const CARD_BORDER = "#f5f5f4";

const orderSchema = yup.object().shape({
    kunjungan_id: yup.string().required("Kunjungan wajib dipilih"),
    jenis_pemeriksaan_id: yup
        .string()
        .required("Jenis pemeriksaan wajib dipilih"),
    dokter_id: yup.string().optional(),
    clinical_info: yup.string().optional(),
});

const resultSchema = yup.object().shape({
    result: yup.string().required("Hasil pemeriksaan wajib diisi"),
    interpretation: yup.string().optional(),
});

const STATUSES = [
    "ordered",
    "collected",
    "in_progress",
    "completed",
    "verified",
    "cancelled",
];
const TRANSITIONS = {
    ordered: ["collected", "cancelled"],
    collected: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: ["verified", "cancelled"],
    verified: [],
    cancelled: [],
};

const STATUS_COLORS = {
    ordered: "#0ea5e9",
    collected: "#8b5cf6",
    in_progress: "#f59e0b",
    completed: "#10b981",
    verified: "#059669",
    cancelled: "#ef4444",
};

export default function LaboratoriumPage() {
    const { showSuccess, showError } = useNotification();
    const [searchText, setSearchText] = useState("");
    const [selectedKunjungan, setSelectedKunjungan] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [formOpen, setFormOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [resultOpen, setResultOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Queries
    const { data: kunjunganData } = useYiiQuery(
        ["kunjungan", "list"],
        "/kunjungan",
        { perPage: 100, status: "waiting,in_progress" },
    );
    const { data: jenisData } = useNodeQuery(["lab", "jenis"], "/api/lab", {
        perPage: 500,
    });
    const {
        data: labData,
        isLoading: loadingLab,
        refetch: refetchLab,
    } = useNodeQuery(
        ["lab", "orders", selectedKunjungan?.id, statusFilter],
        "/api/lab",
        {
            kunjunganId: selectedKunjungan?.id,
            status: statusFilter,
            limit: 100,
        },
        { enabled: !!selectedKunjungan },
    );

    const kunjunganRows = withDummy(kunjunganData?.data, DUMMY_KUNJUNGAN);
    const jenisRows = withDummy(jenisData?.data, DUMMY_LAB_JENIS);
    const labRows = withDummy(labData?.data, DUMMY_LAB);

    // Mutations
    const createOrder = useNodeMutation("/api/lab/order", "post", {
        invalidateKeys: [["lab", "orders", selectedKunjungan?.id]],
        onSuccess: () => showSuccess("Order laboratorium berhasil dibuat"),
        onError: (err) => showError(err.message),
    });

    const verifyOrder = useNodeMutation("", "post", {
        invalidateKeys: [["lab", "orders", selectedKunjungan?.id]],
        onSuccess: (_, variables) =>
            showSuccess(
                `Order ${variables.no_order || variables.id} berhasil diverifikasi`,
            ),
        onError: (err) => showError(err.message),
    });

    const orderForm = useForm({
        resolver: yupResolver(orderSchema),
        mode: "onChange",
    });
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        reset,
    } = orderForm;

    const resultForm = useForm({
        resolver: yupResolver(resultSchema),
        mode: "onChange",
    });
    const {
        register: regR,
        handleSubmit: hSubmitR,
        formState: { errors: errorsR, isSubmitting: isSubmittingR },
        reset: resetR,
    } = resultForm;

    const handleOrderSubmit = async (data) => {
        await createOrder.mutateAsync(data);
        setFormOpen(false);
        reset();
    };

    const handleResultSubmit = async (data) => {
        await verifyOrder.mutateAsync({
            id: selectedOrder.id,
            action: "verify",
            ...data,
        });
        setResultOpen(false);
        resetR();
    };

    const canTransition = (current, next) =>
        TRANSITIONS[current]?.includes(next) ?? false;

    const handleAction = async (order, action) => {
        let url;
        let payload = {};
        switch (action) {
            case "collect":
                url = `/api/lab/${order.id}/collect`;
                break;
            case "start":
                url = `/api/lab/${order.id}/status`;
                payload = { status: "in_progress" };
                break;
            case "complete":
                url = `/api/lab/${order.id}/status`;
                payload = { status: "completed" };
                break;
            case "cancel":
                url = `/api/lab/${order.id}/cancel`;
                break;
            default:
                return;
        }
        try {
            await nodeApi.post(url, payload);
            showSuccess(`Aksi berhasil untuk order ${order.no_order}`);
            refetchLab();
        } catch (err) {
            showError(err.message);
        }
    };

    const openCreate = () => {
        if (!selectedKunjungan) {
            showError("Pilih kunjungan terlebih dahulu");
            return;
        }
        setFormData({ kunjungan_id: selectedKunjungan.id });
        reset({ kunjungan_id: selectedKunjungan.id });
        setFormOpen(true);
    };

    const openResult = (order) => {
        setSelectedOrder(order);
        resetR({
            result: order.result || "",
            interpretation: order.interpretation || "",
        });
        setResultOpen(true);
    };

    const filteredLabRows =
        labRows?.filter(
            (o) =>
                !searchText ||
                o.no_order?.toLowerCase().includes(searchText.toLowerCase()) ||
                o.jenis_nama?.toLowerCase().includes(searchText.toLowerCase()),
        ) || [];

    return (
        <Box sx={{ pb: 4 }}>
            {/* --- HEADER --- */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    fontWeight={800}
                    color="#1c1917"
                    sx={{ mb: 0.5, letterSpacing: "-0.02em" }}
                >
                    Laboratorium
                </Typography>
                <Typography variant="body1" color="#78716c">
                    Kelola order pemeriksaan lab, ambil sampel, hingga
                    verifikasi hasil.
                </Typography>
            </Box>

            {/* --- SELECTOR KUNJUNGAN & FILTER --- */}
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
                            <FormControl fullWidth size="small">
                                <InputLabel>Pilih Kunjungan Pasien</InputLabel>
                                <Select
                                    value={selectedKunjungan?.id || ""}
                                    label="Pilih Kunjungan Pasien"
                                    onChange={(e) => {
                                        const k = kunjunganRows?.find(
                                            (x) => x.id === e.target.value,
                                        );
                                        setSelectedKunjungan(k);
                                        setPage(0);
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        backgroundColor: SOFT_BG,
                                    }}
                                >
                                    {kunjunganRows?.map((k) => (
                                        <MenuItem key={k.id} value={k.id}>
                                            {k.no_kunjungan} - {k.pasien_nama} (
                                            {k.poli_nama})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Filter Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Filter Status"
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(0);
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        backgroundColor: SOFT_BG,
                                    }}
                                >
                                    <MenuItem value="">Semua Status</MenuItem>
                                    {STATUSES.map((s) => (
                                        <MenuItem key={s} value={s}>
                                            {s.charAt(0).toUpperCase() +
                                                s.slice(1).replace("_", " ")}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Cari No. Order / Jenis..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ color: "#a8a29e" }} />
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
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={openCreate}
                                disabled={!selectedKunjungan || loadingLab}
                                fullWidth
                                sx={{
                                    borderRadius: 2.5,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    backgroundColor: BRAND_COLOR,
                                    "&:hover": { backgroundColor: "#0f766e" },
                                    py: 1,
                                }}
                            >
                                Order Baru
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* --- STATUS SUMMARY --- */}
            {selectedKunjungan && labRows && (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {STATUSES.filter((s) => s !== "cancelled").map((status) => {
                        const count = labRows.filter(
                            (o) => o.status === status,
                        ).length;
                        const color = STATUS_COLORS[status] || "#a8a29e";
                        return (
                            <Grid item xs={6} sm={4} lg={2.4} key={status}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        border: `1px solid ${CARD_BORDER}`,
                                        boxShadow: "none",
                                        backgroundColor: `${color}08`,
                                    }}
                                >
                                    <CardContent
                                        sx={{
                                            p: 2,
                                            "&:last-child": { pb: 2 },
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            fontWeight={700}
                                            sx={{
                                                color,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            {status.replace("_", " ")}
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            fontWeight={800}
                                            color="#1c1917"
                                            sx={{ lineHeight: 1.1, mt: 0.5 }}
                                        >
                                            {count}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* --- TABEL DATA --- */}
            {loadingLab ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress sx={{ color: BRAND_COLOR }} />
                </Box>
            ) : !selectedKunjungan ? (
                <Card
                    sx={{
                        borderRadius: 4,
                        border: `1px solid ${CARD_BORDER}`,
                        boxShadow: "none",
                        p: 4,
                    }}
                >
                    <EmptyState
                        type="laboratory"
                        title="Belum Ada Pasien Terpilih"
                        description="Pilih kunjungan pasien pada menu dropdown di atas untuk melihat daftar order laboratorium."
                        size="lg"
                    />
                </Card>
            ) : (
                <Card
                    sx={{
                        borderRadius: 4,
                        border: `1px solid ${CARD_BORDER}`,
                        boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)",
                        backgroundColor: "#fff",
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        {/* Info Pasien */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                mb: 3,
                                p: 2,
                                backgroundColor: "#f0fdfa",
                                borderRadius: 3,
                                border: "1px solid #ccfbf1",
                            }}
                        >
                            <Avatar
                                sx={{
                                    bgcolor: BRAND_COLOR,
                                    width: 40,
                                    height: 40,
                                    fontWeight: 700,
                                }}
                            >
                                {selectedKunjungan.pasien_nama?.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    color="#134e4a"
                                >
                                    {selectedKunjungan.pasien_nama}
                                </Typography>
                                <Typography variant="caption" color="#0f766e">
                                    No. Kunjungan:{" "}
                                    <b>{selectedKunjungan.no_kunjungan}</b> |
                                    Poli: {selectedKunjungan.poli_nama}
                                </Typography>
                            </Box>
                        </Box>

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
                                        {[
                                            "No. Order",
                                            "Pemeriksaan",
                                            "Dokter",
                                            "Waktu Order",
                                            "Status",
                                            "Hasil",
                                            "Aksi",
                                        ].map((head) => (
                                            <TableCell
                                                key={head}
                                                sx={{
                                                    fontWeight: 600,
                                                    backgroundColor: SOFT_BG,
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
                                    {filteredLabRows
                                        .slice(
                                            page * rowsPerPage,
                                            page * rowsPerPage + rowsPerPage,
                                        )
                                        .map((order) => (
                                            <TableRow
                                                key={order.id}
                                                hover
                                                sx={{
                                                    "&:last-child td": {
                                                        borderBottom: "none",
                                                    },
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        fontFamily: "monospace",
                                                        fontWeight: 600,
                                                        color: "#57534e",
                                                    }}
                                                >
                                                    {order.no_order}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        color="#1c1917"
                                                    >
                                                        {order.jenis_nama}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="#78716c"
                                                    >
                                                        {order.sample_type}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell
                                                    sx={{ color: "#57534e" }}
                                                >
                                                    {order.dokter_nama || "-"}
                                                </TableCell>
                                                <TableCell
                                                    sx={{ color: "#57534e" }}
                                                >
                                                    {formatDateTime(
                                                        order.ordered_at,
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <StatusChip
                                                        status={order.status}
                                                        variant="filled"
                                                        size="small"
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    {order.result ? (
                                                        <Box
                                                            sx={{
                                                                p: 1,
                                                                borderRadius: 1,
                                                                backgroundColor:
                                                                    SOFT_BG,
                                                                border: "1px dashed #e7e5e4",
                                                                maxWidth: 200,
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={600}
                                                                color="#1c1917"
                                                                noWrap
                                                            >
                                                                {order.result}
                                                            </Typography>
                                                            {order.interpretation && (
                                                                <Typography
                                                                    variant="caption"
                                                                    color="#78716c"
                                                                    noWrap
                                                                    display="block"
                                                                >
                                                                    Ket:{" "}
                                                                    {
                                                                        order.interpretation
                                                                    }
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    ) : (
                                                        <Typography
                                                            variant="caption"
                                                            color="#a8a29e"
                                                        >
                                                            Menunggu hasil...
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Stack
                                                        direction="row"
                                                        spacing={0.5}
                                                        justifyContent="flex-end"
                                                    >
                                                        <Tooltip title="Lihat Detail / Input Hasil">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    openResult(
                                                                        order,
                                                                    )
                                                                }
                                                                sx={{
                                                                    color: BRAND_COLOR,
                                                                    backgroundColor:
                                                                        "#f0fdfa",
                                                                }}
                                                            >
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {canTransition(
                                                            order.status,
                                                            "collected",
                                                        ) && (
                                                            <Tooltip title="Ambil Sampel">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleAction(
                                                                            order,
                                                                            "collect",
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        color: "#8b5cf6",
                                                                        backgroundColor:
                                                                            "#f5f3ff",
                                                                    }}
                                                                >
                                                                    <Inbox fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}

                                                        {canTransition(
                                                            order.status,
                                                            "in_progress",
                                                        ) && (
                                                            <Tooltip title="Mulai Proses">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleAction(
                                                                            order,
                                                                            "start",
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        color: "#f59e0b",
                                                                        backgroundColor:
                                                                            "#fffbeb",
                                                                    }}
                                                                >
                                                                    <PlayArrow fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}

                                                        {canTransition(
                                                            order.status,
                                                            "completed",
                                                        ) && (
                                                            <Tooltip title="Selesaikan & Verifikasi">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        openResult(
                                                                            order,
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        color: "#10b981",
                                                                        backgroundColor:
                                                                            "#ecfdf5",
                                                                    }}
                                                                >
                                                                    <CheckCircle fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}

                                                        {canTransition(
                                                            order.status,
                                                            "cancelled",
                                                        ) && (
                                                            <Tooltip title="Batalkan Order">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => {
                                                                        if (
                                                                            window.confirm(
                                                                                "Batalkan order ini?",
                                                                            )
                                                                        )
                                                                            handleAction(
                                                                                order,
                                                                                "cancel",
                                                                            );
                                                                    }}
                                                                >
                                                                    <Cancel fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {filteredLabRows.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                align="center"
                                                sx={{ py: 6 }}
                                            >
                                                <EmptyState
                                                    type="laboratory"
                                                    title="Belum Ada Order"
                                                    description="Belum ada order laboratorium untuk kunjungan ini."
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
                            count={filteredLabRows.length}
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
                    </CardContent>
                </Card>
            )}

            {/* --- MODAL ORDER BARU --- */}
            <Modal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                title="Buat Order Laboratorium"
                size="md"
            >
                <form onSubmit={handleSubmit(handleOrderSubmit)}>
                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <Alert
                                severity="info"
                                icon={<Person />}
                                sx={{
                                    borderRadius: 2,
                                    backgroundColor: "#f0fdfa",
                                    color: "#0f766e",
                                    "& .MuiAlert-icon": { color: BRAND_COLOR },
                                }}
                            >
                                Pasien: <b>{selectedKunjungan?.pasien_nama}</b>{" "}
                                ({selectedKunjungan?.no_kunjungan})
                            </Alert>
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name="jenis_pemeriksaan_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl
                                        fullWidth
                                        error={!!errors.jenis_pemeriksaan_id}
                                    >
                                        <InputLabel>
                                            Pilih Jenis Pemeriksaan
                                        </InputLabel>
                                        <Select
                                            {...field}
                                            label="Pilih Jenis Pemeriksaan"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {jenisRows?.map((j) => (
                                                <MenuItem
                                                    key={j.id}
                                                    value={j.id}
                                                >
                                                    {j.nama} ({j.type}) -{" "}
                                                    {j.sample_type}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.jenis_pemeriksaan_id && (
                                            <FormHelperText>
                                                {
                                                    errors.jenis_pemeriksaan_id
                                                        .message
                                                }
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name="dokter_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>
                                            Dokter Pengirim (Opsional)
                                        </InputLabel>
                                        <Select
                                            {...field}
                                            label="Dokter Pengirim (Opsional)"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="">
                                                -- Pilih Dokter --
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Informasi Klinis / Catatan"
                                multiline
                                rows={3}
                                {...register("clinical_info")}
                                placeholder="Tuliskan diagnosa awal atau instruksi khusus untuk petugas lab..."
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1.5,
                            mt: 4,
                            pt: 3,
                            borderTop: `1px solid ${CARD_BORDER}`,
                        }}
                    >
                        <Button
                            onClick={() => setFormOpen(false)}
                            variant="outlined"
                            startIcon={<Cancel />}
                            sx={{
                                borderRadius: 2.5,
                                textTransform: "none",
                                color: "#57534e",
                                borderColor: CARD_BORDER,
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            startIcon={
                                isSubmitting ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <AssignmentTurnedIn />
                                )
                            }
                            sx={{
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 600,
                                backgroundColor: BRAND_COLOR,
                                "&:hover": { backgroundColor: "#0f766e" },
                            }}
                        >
                            {isSubmitting ? "Menyimpan..." : "Buat Order"}
                        </Button>
                    </Box>
                </form>
            </Modal>

            {/* --- MODAL HASIL & VERIFIKASI --- */}
            <Modal
                open={resultOpen}
                onClose={() => setResultOpen(false)}
                title={`Hasil: ${selectedOrder?.no_order}`}
                size="md"
            >
                <form onSubmit={hSubmitR(handleResultSubmit)}>
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: SOFT_BG,
                            borderRadius: 2,
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="#1c1917"
                        >
                            {selectedOrder?.jenis_nama}
                        </Typography>
                        <Typography variant="caption" color="#78716c">
                            Sampel: {selectedOrder?.sample_type} | Status saat
                            ini: <b>{selectedOrder?.status}</b>
                        </Typography>
                    </Box>

                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nilai / Hasil Pemeriksaan"
                                multiline
                                rows={5}
                                {...regR("result")}
                                error={!!errorsR.result}
                                helperText={errorsR.result?.message}
                                placeholder="Masukkan nilai hasil lab, contoh: Hemoglobin: 14.5 g/dL..."
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Interpretasi / Catatan (Opsional)"
                                multiline
                                rows={3}
                                {...regR("interpretation")}
                                error={!!errorsR.interpretation}
                                helperText={errorsR.interpretation?.message}
                                placeholder="Kesan normal/abnormal, rekomendasi..."
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1.5,
                            mt: 4,
                            pt: 3,
                            borderTop: `1px solid ${CARD_BORDER}`,
                        }}
                    >
                        <Button
                            onClick={() => setResultOpen(false)}
                            variant="outlined"
                            startIcon={<Cancel />}
                            sx={{
                                borderRadius: 2.5,
                                textTransform: "none",
                                color: "#57534e",
                                borderColor: CARD_BORDER,
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmittingR}
                            startIcon={
                                isSubmittingR ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <DoneAll />
                                )
                            }
                            sx={{
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 600,
                                backgroundColor: BRAND_COLOR,
                                "&:hover": { backgroundColor: "#0f766e" },
                            }}
                        >
                            {isSubmittingR
                                ? "Menyimpan..."
                                : "Simpan & Verifikasi"}
                        </Button>
                    </Box>
                </form>
            </Modal>
        </Box>
    );
}
