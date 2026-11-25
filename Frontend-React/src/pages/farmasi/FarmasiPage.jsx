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
    Alert,
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
} from "@mui/material";
import {
    Search,
    Add,
    Visibility,
    LocalPharmacy,
    CheckCircle,
    Cancel,
    Refresh,
    Remove,
    Medication,
    Assignment,
    LocalHospital,
    Person,
    Warning,
} from "@mui/icons-material";
import { useYiiQuery, useYiiMutation } from "../../hooks/useApi";
import { formatDate, formatDateTime, formatCurrency } from "../../utils/format";
import StatusChip from "../../components/ui/StatusChip";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { useNotification } from "../../contexts/NotificationContext";
import {
    DUMMY_KUNJUNGAN,
    DUMMY_OBAT,
    DUMMY_RESEP,
    withDummy,
} from "../../data/dummyData";

// Palet Warna UI
const BRAND_COLOR = "#0d9488";
const SOFT_BG = "#fafaf9";
const CARD_BORDER = "#f5f5f4";

const resepSchema = yup.object().shape({
    kunjungan_id: yup.string().required("Kunjungan wajib dipilih"),
    dokter_id: yup.string().optional(),
    catatan: yup.string().optional(),
});

const dispenseSchema = yup.object().shape({
    quantity: yup
        .number()
        .required("Jumlah wajib diisi")
        .positive("Harus > 0")
        .integer("Harus bilangan bulat"),
    batch_number: yup.string().optional(),
    expired_date: yup.string().optional(),
});

const STATUS_CONFIG = {
    prescribed: { label: "Diresepkan", color: "#f59e0b", bg: "#fffbeb" },
    submitted: { label: "Di Farmasi", color: "#0ea5e9", bg: "#e0f2fe" },
    dispensed: { label: "Selesai", color: "#10b981", bg: "#ecfdf5" },
    returned: { label: "Dikembalikan", color: "#ef4444", bg: "#fef2f2" },
    cancelled: { label: "Dibatalkan", color: "#78716c", bg: "#f5f5f4" },
};

export default function FarmasiPage() {
    const { showSuccess, showError } = useNotification();
    const [searchText, setSearchText] = useState("");
    const [selectedKunjungan, setSelectedKunjungan] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const [resepFormOpen, setResepFormOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedResep, setSelectedResep] = useState(null);
    const [dispenseOpen, setDispenseOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

    // Queries
    const { data: kunjunganData } = useYiiQuery(
        ["kunjungan", "list"],
        "/kunjungan",
        { perPage: 100, status: "waiting,in_progress" },
    );
    const {
        resepData,
        isLoading: loadingResep,
        refetch: refetchResep,
    } = useYiiQuery(
        ["resep", "list", selectedKunjungan?.id, statusFilter],
        "/resep",
        {
            kunjungan_id: selectedKunjungan?.id,
            status: statusFilter,
            perPage: 50,
        },
        { enabled: !!selectedKunjungan },
    );
    const kunjunganRows = withDummy(kunjunganData?.data, DUMMY_KUNJUNGAN);
    const resepRows = withDummy(resepData?.data, DUMMY_RESEP);

    // Mutations
    const createResep = useYiiMutation("/resep", "post", {
        invalidateKeys: [["resep", "list", selectedKunjungan?.id]],
        onSuccess: () => showSuccess("Resep berhasil dibuat"),
        onError: (err) => showError(err.message),
    });

    const submitResep = useYiiMutation("/resep", "post", {
        invalidateKeys: [["resep", "list", selectedKunjungan?.id]],
        onSuccess: (_, variables) =>
            showSuccess(`Resep berhasil diajukan ke farmasi`),
        onError: (err) => showError(err.message),
    });

    const dispenseResep = useYiiMutation("/resep", "post", {
        invalidateKeys: [["resep", "list", selectedKunjungan?.id]],
        onSuccess: () => showSuccess(`Obat berhasil diberikan ke pasien`),
        onError: (err) => showError(err.message),
    });

    const returnResep = useYiiMutation("/resep", "post", {
        invalidateKeys: [["resep", "list", selectedKunjungan?.id]],
        onSuccess: () => showSuccess(`Resep dikembalikan`),
        onError: (err) => showError(err.message),
    });

    const resepForm = useForm({
        resolver: yupResolver(resepSchema),
        mode: "onChange",
    });
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        reset,
    } = resepForm;

    const dispenseForm = useForm({
        resolver: yupResolver(dispenseSchema),
        mode: "onChange",
    });
    const {
        register: regDis,
        handleSubmit: hSubmitDis,
        formState: { errors: errorsDis, isSubmitting: isSubmittingDis },
        reset: resetDis,
    } = dispenseForm;

    const handleResepSubmit = async (data) => {
        await createResep.mutateAsync(data);
        setResepFormOpen(false);
        reset();
    };

    const handleDispenseSubmit = async (data) => {
        await dispenseResep.mutateAsync({
            id: selectedDetail.resep_id,
            detail_id: selectedDetail.id,
            action: "dispense",
            ...data,
        });
        setDispenseOpen(false);
        resetDis();
        // Refresh detail view
        refetchResep();
    };

    const handleSubmitToPharmacy = async (resep) => {
        await submitResep.mutateAsync({ id: resep.id, action: "submit" });
    };

    const handleReturn = async (resep) => {
        if (!window.confirm("Kembalikan resep ini ke dokter?")) return;
        await returnResep.mutateAsync({ id: resep.id, action: "return" });
    };

    const openCreateResep = () => {
        if (!selectedKunjungan) {
            showError("Pilih kunjungan terlebih dahulu");
            return;
        }
        reset({ kunjungan_id: selectedKunjungan.id });
        setResepFormOpen(true);
    };

    const openDetail = (resep) => {
        setSelectedResep(resep);
        setDetailOpen(true);
    };

    const openDispense = (detail) => {
        setSelectedDetail(detail);
        resetDis({ quantity: detail.quantity - detail.dispensed_quantity });
        setDispenseOpen(true);
    };

    const filteredResepRows =
        resepRows.filter(
            (r) =>
                !searchText ||
                r.no_resep?.toLowerCase().includes(searchText.toLowerCase()),
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
                    Farmasi & Resep
                </Typography>
                <Typography variant="body1" color="#78716c">
                    Kelola resep dokter dan serahkan obat ke pasien dengan aman.
                </Typography>
            </Box>

            {/* --- SELECTOR & FILTER --- */}
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
                                    {Object.entries(STATUS_CONFIG).map(
                                        ([k, v]) => (
                                            <MenuItem key={k} value={k}>
                                                {v.label}
                                            </MenuItem>
                                        ),
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Cari No. Resep..."
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
                                onClick={openCreateResep}
                                disabled={!selectedKunjungan || loadingResep}
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
                                Resep Baru
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* --- TABEL RESEP --- */}
            {loadingResep ? (
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
                        type="pharmacy"
                        title="Belum Ada Pasien Terpilih"
                        description="Silakan pilih kunjungan pasien pada menu dropdown di atas untuk mulai mengelola resep."
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
                        {selectedKunjungan && (
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
                                    <Typography
                                        variant="caption"
                                        color="#0f766e"
                                    >
                                        No. Kunjungan:{" "}
                                        <b>{selectedKunjungan.no_kunjungan}</b>{" "}
                                        | Poli: {selectedKunjungan.poli_nama}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

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
                                            "No. Resep",
                                            "Pasien",
                                            "Dokter",
                                            "Waktu Dibuat",
                                            "Status",
                                            "Item",
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
                                    {filteredResepRows
                                        .slice(
                                            page * rowsPerPage,
                                            page * rowsPerPage + rowsPerPage,
                                        )
                                        .map((resep) => (
                                            <TableRow
                                                key={resep.id}
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
                                                    {resep.no_resep}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        color="#1c1917"
                                                    >
                                                        {resep.pasien_nama}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell
                                                    sx={{ color: "#57534e" }}
                                                >
                                                    {resep.dokter_nama || "-"}
                                                </TableCell>
                                                <TableCell
                                                    sx={{ color: "#57534e" }}
                                                >
                                                    {formatDateTime(
                                                        resep.created_at,
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <StatusChip
                                                        status={resep.status}
                                                        variant="filled"
                                                        size="small"
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        icon={
                                                            <Medication
                                                                sx={{
                                                                    fontSize:
                                                                        "16px !important",
                                                                }}
                                                            />
                                                        }
                                                        label={`${resep.total_items || resep.details?.length || 0} Obat`}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor:
                                                                SOFT_BG,
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Stack
                                                        direction="row"
                                                        spacing={0.5}
                                                        justifyContent="flex-end"
                                                    >
                                                        <Tooltip title="Lihat Detail Obat">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    openDetail(
                                                                        resep,
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

                                                        {resep.status ===
                                                            "prescribed" && (
                                                            <Tooltip title="Ajukan ke Farmasi">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleSubmitToPharmacy(
                                                                            resep,
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        color: "#0ea5e9",
                                                                        backgroundColor:
                                                                            "#e0f2fe",
                                                                    }}
                                                                >
                                                                    <LocalPharmacy fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}

                                                        {resep.status ===
                                                            "submitted" && (
                                                            <Tooltip title="Kembalikan ke Dokter">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleReturn(
                                                                            resep,
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        color: "#f59e0b",
                                                                        backgroundColor:
                                                                            "#fffbeb",
                                                                    }}
                                                                >
                                                                    <Remove fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {filteredResepRows.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                align="center"
                                                sx={{ py: 6 }}
                                            >
                                                <EmptyState
                                                    type="pharmacy"
                                                    title="Belum Ada Resep"
                                                    description="Belum ada resep untuk kunjungan ini."
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
                            count={filteredResepRows.length}
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

            {/* --- MODAL BUAT RESEP BARU --- */}
            <Modal
                open={resepFormOpen}
                onClose={() => setResepFormOpen(false)}
                title="Buat Resep Baru"
                size="md"
            >
                <form onSubmit={handleSubmit(handleResepSubmit)}>
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
                                name="dokter_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>
                                            Dokter Penulis Resep (Opsional)
                                        </InputLabel>
                                        <Select
                                            {...field}
                                            label="Dokter Penulis Resep (Opsional)"
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
                                label="Catatan untuk Farmasi"
                                multiline
                                rows={3}
                                {...register("catatan")}
                                placeholder="Contoh: Tolong berikan obat generik, atau instruksi khusus lainnya..."
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
                            onClick={() => setResepFormOpen(false)}
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
                                    <Assignment />
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
                            {isSubmitting ? "Menyimpan..." : "Simpan Resep"}
                        </Button>
                    </Box>
                </form>
            </Modal>

            {/* --- MODAL DETAIL RESEP (KARTU OBAT) --- */}
            <Modal
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                title={`Detail Resep: ${selectedResep?.no_resep}`}
                size="md"
            >
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        backgroundColor: SOFT_BG,
                        borderRadius: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Box>
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="#1c1917"
                        >
                            {selectedResep?.pasien_nama}
                        </Typography>
                        <Typography variant="caption" color="#78716c">
                            Dokter: {selectedResep?.dokter_nama || "-"} |
                            Dibuat: {formatDateTime(selectedResep?.created_at)}
                        </Typography>
                    </Box>
                    <StatusChip
                        status={selectedResep?.status}
                        variant="filled"
                    />
                </Box>

                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="#44403c"
                    sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Medication sx={{ color: BRAND_COLOR }} /> Daftar Obat
                </Typography>

                <Stack spacing={2}>
                    {selectedResep?.details?.map((detail) => {
                        const remaining =
                            detail.quantity - detail.dispensed_quantity;
                        const isComplete = remaining <= 0;

                        return (
                            <Card
                                key={detail.id}
                                variant="outlined"
                                sx={{
                                    borderRadius: 3,
                                    border: `1px solid ${isComplete ? "#10b981" : CARD_BORDER}`,
                                    backgroundColor: isComplete
                                        ? "#ecfdf5"
                                        : "#fff",
                                }}
                            >
                                <CardContent
                                    sx={{ p: 2, "&:last-child": { pb: 2 } }}
                                >
                                    <Grid
                                        container
                                        spacing={2}
                                        alignItems="center"
                                    >
                                        <Grid item xs={12} sm={5}>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={700}
                                                color="#1c1917"
                                            >
                                                {detail.obat_nama}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="#57534e"
                                            >
                                                Sisa: {remaining} dari{" "}
                                                {detail.quantity}{" "}
                                                {detail.satuan || "tablet"}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                flexWrap="wrap"
                                            >
                                                <Chip
                                                    label={`Dosis: ${detail.dose}`}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor:
                                                            SOFT_BG,
                                                    }}
                                                />
                                                <Chip
                                                    label={`Frekuensi: ${detail.frequency}`}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor:
                                                            SOFT_BG,
                                                    }}
                                                />
                                                <Chip
                                                    label={`Durasi: ${detail.duration} hari`}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor:
                                                            SOFT_BG,
                                                    }}
                                                />
                                            </Stack>
                                        </Grid>
                                        <Grid
                                            item
                                            xs={12}
                                            sm={3}
                                            sx={{ textAlign: "right" }}
                                        >
                                            {isComplete ? (
                                                <Chip
                                                    icon={<CheckCircle />}
                                                    label="Selesai"
                                                    color="success"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            ) : selectedResep?.status ===
                                              "submitted" ? (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={
                                                        <LocalPharmacy />
                                                    }
                                                    onClick={() =>
                                                        openDispense(detail)
                                                    }
                                                    sx={{
                                                        borderRadius: 2,
                                                        textTransform: "none",
                                                        backgroundColor:
                                                            BRAND_COLOR,
                                                        "&:hover": {
                                                            backgroundColor:
                                                                "#0f766e",
                                                        },
                                                    }}
                                                >
                                                    Berikan Obat
                                                </Button>
                                            ) : (
                                                <Chip
                                                    label="Menunggu Farmasi"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor:
                                                            "#fffbeb",
                                                        color: "#f59e0b",
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            )}
                                        </Grid>
                                        {detail.instructions && (
                                            <Grid item xs={12}>
                                                <Typography
                                                    variant="caption"
                                                    color="#78716c"
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    <Warning
                                                        sx={{ fontSize: 14 }}
                                                    />{" "}
                                                    {detail.instructions}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>

                {!selectedResep?.details?.length && (
                    <Box sx={{ textAlign: "center", py: 4, color: "#a8a29e" }}>
                        <Medication
                            sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                        />
                        <Typography variant="body2">
                            Belum ada obat yang ditambahkan ke resep ini.
                        </Typography>
                    </Box>
                )}
            </Modal>

            {/* --- MODAL BERIKAN OBAT (DISPENSE) --- */}
            <Modal
                open={dispenseOpen}
                onClose={() => setDispenseOpen(false)}
                title="Serahkan Obat ke Pasien"
                size="sm"
            >
                <form onSubmit={hSubmitDis(handleDispenseSubmit)}>
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: "#f0fdfa",
                            borderRadius: 2,
                            border: "1px solid #ccfbf1",
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="#134e4a"
                        >
                            {selectedDetail?.obat_nama}
                        </Typography>
                        <Typography variant="caption" color="#0f766e">
                            Sisa yang harus diberikan:{" "}
                            <b>
                                {selectedDetail
                                    ? selectedDetail.quantity -
                                      selectedDetail.dispensed_quantity
                                    : 0}
                            </b>
                        </Typography>
                    </Box>

                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Jumlah yang Diberikan"
                                type="number"
                                {...regDis("quantity")}
                                error={!!errorsDis.quantity}
                                helperText={errorsDis.quantity?.message}
                                inputProps={{
                                    min: 1,
                                    max:
                                        (selectedDetail?.quantity || 0) -
                                        (selectedDetail?.dispensed_quantity ||
                                            0),
                                }}
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
                                label="Nomor Batch Obat"
                                {...regDis("batch_number")}
                                placeholder="Contoh: BATCH-2023-01"
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
                                label="Tanggal Kadaluarsa"
                                type="date"
                                {...regDis("expired_date")}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Stok tersedia:{" "}
                                <b>
                                    {selectedDetail?.stok_tersedia ||
                                        "Tersedia"}
                                </b>
                                . Sistem akan memotong stok secara otomatis.
                            </Alert>
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
                            onClick={() => setDispenseOpen(false)}
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
                            disabled={isSubmittingDis}
                            startIcon={
                                isSubmittingDis ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <CheckCircle />
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
                            {isSubmittingDis ? "Memproses..." : "Serahkan Obat"}
                        </Button>
                    </Box>
                </form>
            </Modal>
        </Box>
    );
}
