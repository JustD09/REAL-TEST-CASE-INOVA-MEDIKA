import React, { useState, useCallback } from "react";
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
    Autocomplete,
    Avatar,
    Tooltip,
    Stack,
    Alert,
} from "@mui/material";
import {
    Search,
    Add,
    Edit,
    MedicalServices,
    Save,
    CheckCircle,
    MonitorHeart,
    Person,
    LocalHospital,
    Assignment,
    Cancel,
} from "@mui/icons-material";
import { useYiiQuery, useYiiMutation } from "../../hooks/useApi";
import { formatDate, formatDateTime } from "../../utils/format";
import StatusChip from "../../components/ui/StatusChip";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { useNotification } from "../../contexts/NotificationContext";
import {
    DUMMY_KUNJUNGAN,
    DUMMY_DIAGNOSA,
    DUMMY_PEREKSAAN,
    withDummy,
} from "../../data/dummyData";

// Palet Warna UI
const BRAND_COLOR = "#0d9488";
const SOFT_BG = "#fafaf9";
const CARD_BORDER = "#f5f5f4";

const pemeriksaanSchema = yup.object().shape({
    kunjungan_id: yup.string().required("Kunjungan wajib dipilih"),
    anamnesis: yup.string().optional(),
    pemeriksaan_fisik: yup.string().optional(),
    diagnosis_utama_id: yup.string().optional(),
    diagnosis_sekunder_ids: yup.array().optional(),
    catatan: yup.string().optional(),
});

const vitalSignsSchema = yup.object().shape({
    tinggi_badan: yup
        .number()
        .typeError("Harus berupa angka")
        .optional()
        .positive("Harus positif"),
    berat_badan: yup
        .number()
        .typeError("Harus berupa angka")
        .optional()
        .positive("Harus positif"),
    tekanan_darah_sistol: yup
        .number()
        .typeError("Harus berupa angka")
        .optional()
        .positive("Harus positif"),
    tekanan_darah_diastol: yup
        .number()
        .typeError("Harus berupa angka")
        .optional()
        .positive("Harus positif"),
    nadi: yup
        .number()
        .typeError("Harus berupa angka")
        .optional()
        .positive("Harus positif"),
    suhu: yup
        .number()
        .typeError("Harus berupa angka")
        .optional()
        .positive("Harus positif"),
    respirasi: yup
        .number()
        .typeError("Harus berupa angka")
        .optional()
        .positive("Harus positif"),
    saturasi: yup
        .number()
        .typeError("Harus berupa angka")
        .optional()
        .min(0)
        .max(100),
    gcs: yup.number().typeError("Harus berupa angka").optional().min(3).max(15),
});

export default function PemeriksaanPage() {
    const { showSuccess, showError } = useNotification();
    const [searchText, setSearchText] = useState("");
    const [selectedKunjungan, setSelectedKunjungan] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create");
    const [formData, setFormData] = useState({});
    const [vitalSignsOpen, setVitalSignsOpen] = useState(false);
    const [selectedPemeriksaan, setSelectedPemeriksaan] = useState(null);

    // Queries
    const { kunjunganData } = useYiiQuery(["kunjungan", "list"], "/kunjungan", {
        perPage: 100,
        status: "waiting,in_progress",
    });
    const { diagnosaData } = useYiiQuery(["diagnosa", "list"], "/diagnosa", {
        perPage: 500,
    });
    const { pemeriksaanData, isLoading: loadingPemeriksaan } = useYiiQuery(
        ["pemeriksaan", "list", selectedKunjungan?.id],
        "/pemeriksaan",
        { kunjungan_id: selectedKunjungan?.id, perPage: 50 },
        { enabled: !!selectedKunjungan },
    );
    const kunjunganRows = withDummy(kunjunganData?.data, DUMMY_KUNJUNGAN);
    const diagnosaRows = withDummy(diagnosaData?.data, DUMMY_DIAGNOSA);
    const pemeriksaanRows = withDummy(pemeriksaanData?.data, DUMMY_PEREKSAAN);

    // Mutations
    const createPemeriksaan = useYiiMutation("/pemeriksaan", "post", {
        invalidateKeys: [["pemeriksaan", "list", selectedKunjungan?.id]],
        onSuccess: () => showSuccess("Pemeriksaan berhasil disimpan"),
        onError: (err) => showError(err.message),
    });

    const updatePemeriksaan = useYiiMutation("/pemeriksaan", "put", {
        invalidateKeys: [["pemeriksaan", "list", selectedKunjungan?.id]],
        onSuccess: () => showSuccess("Pemeriksaan berhasil diperbarui"),
        onError: (err) => showError(err.message),
    });

    const finalizePemeriksaan = useYiiMutation("/pemeriksaan", "post", {
        invalidateKeys: [["pemeriksaan", "list", selectedKunjungan?.id]],
        onSuccess: () =>
            showSuccess("Pemeriksaan telah difinalisasi dan dikunci"),
        onError: (err) => showError(err.message),
    });

    const saveVitalSigns = useYiiMutation("/pemeriksaan", "post", {
        invalidateKeys: [["pemeriksaan", "list", selectedKunjungan?.id]],
        onSuccess: () => showSuccess("Tanda vital berhasil disimpan"),
        onError: (err) => showError(err.message),
    });

    // Forms
    const pemeriksaanForm = useForm({
        resolver: yupResolver(pemeriksaanSchema),
        mode: "onChange",
    });
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        reset,
    } = pemeriksaanForm;

    const vitalForm = useForm({
        resolver: yupResolver(vitalSignsSchema),
        mode: "onChange",
    });
    const {
        register: regV,
        handleSubmit: hSubmitV,
        formState: { errors: errorsV, isSubmitting: isSubmittingV },
        reset: resetV,
    } = vitalForm;

    const handlePemeriksaanSubmit = async (data) => {
        if (formMode === "create") {
            await createPemeriksaan.mutateAsync(data);
        } else {
            await updatePemeriksaan.mutateAsync({ id: formData.id, ...data });
        }
        setFormOpen(false);
        reset();
    };

    const handleVitalSubmit = async (data) => {
        await saveVitalSigns.mutateAsync({
            id: selectedPemeriksaan.id,
            action: "save_vital_signs",
            ...data,
        });
        setVitalSignsOpen(false);
        resetV();
    };

    const handleFinalize = async (pemeriksaan) => {
        if (
            !window.confirm(
                "Finalisasi pemeriksaan? Data tidak bisa diubah setelah difinalisasi.",
            )
        )
            return;
        await finalizePemeriksaan.mutateAsync({
            id: pemeriksaan.id,
            action: "finalize",
            version: pemeriksaan.version,
        });
    };

    const openCreate = () => {
        if (!selectedKunjungan) {
            showError("Pilih kunjungan terlebih dahulu");
            return;
        }
        setFormMode("create");
        setFormData({ kunjungan_id: selectedKunjungan.id });
        reset({ kunjungan_id: selectedKunjungan.id });
        setFormOpen(true);
    };

    const openEdit = (pemeriksaan) => {
        if (pemeriksaan.status === "finalized") {
            showError("Pemeriksaan sudah difinalisasi, tidak dapat diubah");
            return;
        }
        setFormMode("edit");
        setFormData(pemeriksaan);
        reset({
            ...pemeriksaan,
            diagnosis_utama_id: pemeriksaan.diagnosis_utama_id || "",
            diagnosis_sekunder_ids:
                pemeriksaan.diagnosis_sekunder?.map((d) => d.id) || [],
        });
        setFormOpen(true);
    };

    const openVitalSigns = (pemeriksaan) => {
        setSelectedPemeriksaan(pemeriksaan);
        resetV(pemeriksaan);
        setVitalSignsOpen(true);
    };

    // Filter pencarian
    const filteredPemeriksaan =
        pemeriksaanRows?.filter(
            (p) =>
                !searchText ||
                p.diagnosis_utama_nama
                    ?.toLowerCase()
                    .includes(searchText.toLowerCase()) ||
                p.anamnesis?.toLowerCase().includes(searchText.toLowerCase()),
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
                    Pemeriksaan & Rekam Medis
                </Typography>
                <Typography variant="body1" color="#78716c">
                    Kelola anamnesis, diagnosis ICD-10, dan tanda vital pasien.
                </Typography>
            </Box>

            {/* --- SELECTOR KUNJUNGAN --- */}
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
                        <Grid item xs={12} md={5}>
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
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Cari diagnosis atau keluhan..."
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
                        <Grid item xs={12} md={3}>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={openCreate}
                                disabled={
                                    !selectedKunjungan || loadingPemeriksaan
                                }
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
                                Buat Pemeriksaan
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* --- DATA PASIEN TERPILIH & TABEL --- */}
            {loadingPemeriksaan ? (
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
                        type="examination"
                        title="Belum Ada Pasien Terpilih"
                        description="Silakan pilih kunjungan pasien pada menu dropdown di atas untuk mulai mengisi rekam medis."
                        size="lg"
                    />
                </Card>
            ) : (
                <>
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
                                width: 48,
                                height: 48,
                                fontWeight: 700,
                            }}
                        >
                            {selectedKunjungan.pasien_nama?.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="#134e4a"
                            >
                                {selectedKunjungan.pasien_nama}
                            </Typography>
                            <Typography variant="body2" color="#0f766e">
                                No. Kunjungan:{" "}
                                <b>{selectedKunjungan.no_kunjungan}</b> | Poli:{" "}
                                {selectedKunjungan.poli_nama}
                            </Typography>
                        </Box>
                    </Box>

                    <Card
                        sx={{
                            borderRadius: 4,
                            border: `1px solid ${CARD_BORDER}`,
                            boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)",
                            backgroundColor: "#fff",
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
                                                "Waktu",
                                                "Status",
                                                "Diagnosis Utama",
                                                "Diagnosis Sekunder",
                                                "Tanda Vital",
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
                                        {filteredPemeriksaan
                                            .slice(
                                                page * rowsPerPage,
                                                page * rowsPerPage +
                                                    rowsPerPage,
                                            )
                                            .map((pemeriksaan) => (
                                                <TableRow
                                                    key={pemeriksaan.id}
                                                    hover
                                                    sx={{
                                                        "&:last-child td": {
                                                            borderBottom:
                                                                "none",
                                                        },
                                                    }}
                                                >
                                                    <TableCell
                                                        sx={{
                                                            color: "#57534e",
                                                        }}
                                                    >
                                                        {formatDateTime(
                                                            pemeriksaan.created_at,
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        <StatusChip
                                                            status={
                                                                pemeriksaan.status
                                                            }
                                                            size="small"
                                                            variant="filled"
                                                        />
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            color="#1c1917"
                                                        >
                                                            {pemeriksaan.diagnosis_utama_nama ||
                                                                "-"}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexWrap:
                                                                    "wrap",
                                                                gap: 0.5,
                                                            }}
                                                        >
                                                            {pemeriksaan
                                                                .diagnosis_sekunder
                                                                ?.length > 0
                                                                ? pemeriksaan.diagnosis_sekunder.map(
                                                                      (d) => (
                                                                          <Chip
                                                                              key={
                                                                                  d.id
                                                                              }
                                                                              label={
                                                                                  d.nama
                                                                              }
                                                                              size="small"
                                                                              sx={{
                                                                                  height: 20,
                                                                                  fontSize:
                                                                                      "0.65rem",
                                                                                  backgroundColor:
                                                                                      SOFT_BG,
                                                                              }}
                                                                          />
                                                                      ),
                                                                  )
                                                                : "-"}
                                                        </Box>
                                                    </TableCell>

                                                    <TableCell>
                                                        {pemeriksaan.tekanan_darah_sistol ? (
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                            >
                                                                <Chip
                                                                    label={`${pemeriksaan.tekanan_darah_sistol}/${pemeriksaan.tekanan_darah_diastol} mmHg`}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor:
                                                                            "#fef2f2",
                                                                        color: "#ef4444",
                                                                        fontWeight: 600,
                                                                        fontSize:
                                                                            "0.65rem",
                                                                    }}
                                                                />
                                                                <Chip
                                                                    label={`${pemeriksaan.suhu}°C`}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor:
                                                                            "#fffbeb",
                                                                        color: "#f59e0b",
                                                                        fontWeight: 600,
                                                                        fontSize:
                                                                            "0.65rem",
                                                                    }}
                                                                />
                                                            </Stack>
                                                        ) : (
                                                            <Typography
                                                                variant="caption"
                                                                color="#a8a29e"
                                                            >
                                                                Belum diisi
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        <Stack
                                                            direction="row"
                                                            spacing={0.5}
                                                            justifyContent="flex-end"
                                                        >
                                                            <Tooltip title="Input Tanda Vital">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        openVitalSigns(
                                                                            pemeriksaan,
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        backgroundColor:
                                                                            "#f0fdfa",
                                                                        color: BRAND_COLOR,
                                                                        "&:hover":
                                                                            {
                                                                                backgroundColor:
                                                                                    "#ccfbf1",
                                                                            },
                                                                    }}
                                                                >
                                                                    <MedicalServices fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Edit Rekam Medis">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        openEdit(
                                                                            pemeriksaan,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        pemeriksaan.status ===
                                                                        "finalized"
                                                                    }
                                                                    sx={{
                                                                        color: "#57534e",
                                                                    }}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {pemeriksaan.status !==
                                                                "finalized" && (
                                                                <Tooltip title="Finalisasi & Kunci">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="success"
                                                                        onClick={() =>
                                                                            handleFinalize(
                                                                                pemeriksaan,
                                                                            )
                                                                        }
                                                                        sx={{
                                                                            backgroundColor:
                                                                                "#ecfdf5",
                                                                        }}
                                                                    >
                                                                        <CheckCircle fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        {filteredPemeriksaan.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    align="center"
                                                    sx={{ py: 6 }}
                                                >
                                                    <EmptyState
                                                        type="examination"
                                                        title="Belum ada rekam medis"
                                                        description="Klik 'Buat Pemeriksaan' untuk mulai mengisi rekam medis pasien ini."
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
                                count={filteredPemeriksaan.length}
                                page={page}
                                onPageChange={(_, p) => setPage(p)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(e.target.value);
                                    setPage(0);
                                }}
                                rowsPerPageOptions={[10, 20, 50]}
                                sx={{
                                    borderTop: "none",
                                    ".MuiTablePagination-toolbar": {
                                        minHeight: 48,
                                    },
                                }}
                            />
                        </CardContent>
                    </Card>
                </>
            )}

            {/* --- MODAL Pemeriksaan (Anamnesis & Diagnosis) --- */}
            <Modal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                title={
                    formMode === "create"
                        ? "Form Pemeriksaan Baru"
                        : "Edit Rekam Medis"
                }
                size="lg"
            >
                <form onSubmit={handleSubmit(handlePemeriksaanSubmit)}>
                    <Grid container spacing={3}>
                        {/* Info Pasien Ringkas */}
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
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#44403c"
                                sx={{
                                    mb: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Assignment
                                    sx={{ fontSize: 18, color: BRAND_COLOR }}
                                />{" "}
                                Anamnesis & Pemeriksaan Fisik
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Anamnesis (Keluhan & Riwayat)"
                                multiline
                                rows={4}
                                {...register("anamnesis")}
                                placeholder="Tuliskan keluhan utama, riwayat penyakit sekarang, riwayat penyakit dahulu, riwayat alergi..."
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        backgroundColor: SOFT_BG,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Pemeriksaan Fisik"
                                multiline
                                rows={4}
                                {...register("pemeriksaan_fisik")}
                                placeholder="Inspeksi, palpasi, perkusi, auskultasi..."
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        backgroundColor: SOFT_BG,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#44403c"
                                sx={{
                                    mb: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <LocalHospital
                                    sx={{ fontSize: 18, color: BRAND_COLOR }}
                                />{" "}
                                Diagnosis (ICD-10)
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="diagnosis_utama_id"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        options={diagnosaRows || []}
                                        getOptionLabel={(option) =>
                                            option.kode
                                                ? `${option.kode} - ${option.nama}`
                                                : ""
                                        }
                                        value={
                                            diagnosaRows?.find(
                                                (d) => d.id === field.value,
                                            ) || null
                                        }
                                        onChange={(_, newValue) =>
                                            field.onChange(
                                                newValue ? newValue.id : "",
                                            )
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Diagnosis Utama"
                                                placeholder="Ketik kode atau nama penyakit..."
                                                sx={{
                                                    "& .MuiOutlinedInput-root":
                                                        { borderRadius: 2 },
                                                }}
                                            />
                                        )}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="diagnosis_sekunder_ids"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>
                                            Diagnosis Sekunder (Bisa lebih dari
                                            1)
                                        </InputLabel>
                                        <Select
                                            {...field}
                                            label="Diagnosis Sekunder (Bisa lebih dari 1)"
                                            multiple
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {diagnosaRows?.map((d) => (
                                                <MenuItem
                                                    key={d.id}
                                                    value={d.id}
                                                >
                                                    {d.kode} - {d.nama}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Catatan Tambahan Dokter"
                                multiline
                                rows={2}
                                {...register("catatan")}
                                placeholder="Catatan internal, instruksi lanjutan, dll..."
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Tombol Aksi Form Pemeriksaan */}
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
                                    <Save />
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
                            {isSubmitting
                                ? "Menyimpan..."
                                : "Simpan Pemeriksaan"}
                        </Button>
                    </Box>
                </form>
            </Modal>

            {/* --- MODAL Tanda Vital --- */}
            <Modal
                open={vitalSignsOpen}
                onClose={() => setVitalSignsOpen(false)}
                title="Input Tanda Vital Pasien"
                size="md"
            >
                <form onSubmit={hSubmitV(handleVitalSubmit)}>
                    <Grid container spacing={2.5}>
                        {/* Antropometri */}
                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#44403c"
                                sx={{
                                    mb: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Person
                                    sx={{ fontSize: 18, color: BRAND_COLOR }}
                                />{" "}
                                Antropometri
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Tinggi Badan (cm)"
                                type="number"
                                {...regV("tinggi_badan")}
                                error={!!errorsV.tinggi_badan}
                                helperText={errorsV.tinggi_badan?.message}
                                inputProps={{ step: 0.1, min: 0 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Berat Badan (kg)"
                                type="number"
                                {...regV("berat_badan")}
                                error={!!errorsV.berat_badan}
                                helperText={errorsV.berat_badan?.message}
                                inputProps={{ step: 0.1, min: 0 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 0.5 }} />
                        </Grid>

                        {/* Tanda Vital Utama */}
                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#44403c"
                                sx={{
                                    mb: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <MonitorHeart
                                    sx={{ fontSize: 18, color: "#ef4444" }}
                                />{" "}
                                Tanda Vital (TTV)
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="TD Sistol (mmHg)"
                                type="number"
                                {...regV("tekanan_darah_sistol")}
                                error={!!errorsV.tekanan_darah_sistol}
                                helperText={
                                    errorsV.tekanan_darah_sistol?.message
                                }
                                inputProps={{ step: 1, min: 0 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="TD Diastol (mmHg)"
                                type="number"
                                {...regV("tekanan_darah_diastol")}
                                error={!!errorsV.tekanan_darah_diastol}
                                helperText={
                                    errorsV.tekanan_darah_diastol?.message
                                }
                                inputProps={{ step: 1, min: 0 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Nadi (x/menit)"
                                type="number"
                                {...regV("nadi")}
                                error={!!errorsV.nadi}
                                helperText={errorsV.nadi?.message}
                                inputProps={{ step: 1, min: 0 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Suhu (°C)"
                                type="number"
                                {...regV("suhu")}
                                error={!!errorsV.suhu}
                                helperText={errorsV.suhu?.message}
                                inputProps={{ step: 0.1, min: 0 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Respirasi (x/menit)"
                                type="number"
                                {...regV("respirasi")}
                                error={!!errorsV.respirasi}
                                helperText={errorsV.respirasi?.message}
                                inputProps={{ step: 1, min: 0 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Saturasi O2 (%)"
                                type="number"
                                {...regV("saturasi")}
                                error={!!errorsV.saturasi}
                                helperText={errorsV.saturasi?.message}
                                inputProps={{ step: 1, min: 0, max: 100 }}
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
                                label="GCS (3 - 15)"
                                type="number"
                                {...regV("gcs")}
                                error={!!errorsV.gcs}
                                helperText={errorsV.gcs?.message}
                                inputProps={{ step: 1, min: 3, max: 15 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Tombol Aksi Form Tanda Vital */}
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
                            onClick={() => setVitalSignsOpen(false)}
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
                            disabled={isSubmittingV}
                            startIcon={
                                isSubmittingV ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <Save />
                                )
                            }
                            sx={{
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 600,
                                backgroundColor: "#ef4444",
                                "&:hover": { backgroundColor: "#dc2626" },
                            }}
                        >
                            {isSubmittingV
                                ? "Menyimpan..."
                                : "Simpan Tanda Vital"}
                        </Button>
                    </Box>
                </form>
            </Modal>
        </Box>
    );
}
