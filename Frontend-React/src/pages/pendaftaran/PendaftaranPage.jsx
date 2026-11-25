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
    Tabs,
    Tab,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Checkbox,
    FormControlLabel,
    Avatar,
    Tooltip,
    Stack,
    Alert,
} from "@mui/material";
import {
    Search,
    Add,
    Edit,
    Delete,
    Print,
    Refresh,
    Person,
    AssignmentTurnedIn,
    CalendarToday,
    Phone,
    Email,
    LocationOn,
    Badge as BadgeIcon,
    LocalHospital,
    PersonAdd,
    Close,
    Save,
    Cancel,
} from "@mui/icons-material";
import { useYiiQuery, useYiiMutation } from "../../hooks/useApi";
import { formatDate } from "../../utils/format";
import StatusChip from "../../components/ui/StatusChip";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { useNotification } from "../../contexts/NotificationContext";
import {
    DUMMY_PASIEN,
    DUMMY_POLI,
    DUMMY_DOKTER,
    DUMMY_KUNJUNGAN,
    withDummy,
} from "../../data/dummyData";

// --- SKEMA VALIDASI ---
const pasienSchema = yup.object().shape({
    nik: yup
        .string()
        .required("NIK wajib diisi")
        .length(16, "NIK harus 16 digit"),
    full_name: yup.string().required("Nama lengkap wajib diisi"),
    gender: yup
        .string()
        .required("Jenis kelamin wajib diisi")
        .oneOf(["L", "P"]),
    birth_date: yup.string().required("Tanggal lahir wajib diisi"),
    phone: yup.string().required("No. telepon wajib diisi"),
    email: yup.string().email("Format email tidak valid").optional(),
    address: yup.string().required("Alamat wajib diisi"),
    bpjs_number: yup.string().optional(),
    bpjs_class: yup.string().oneOf(["1", "2", "3"]).optional(),
});

const kunjunganSchema = yup.object().shape({
    pasien_id: yup.string().required("Pasien wajib dipilih"),
    poli_id: yup.string().required("Poli wajib dipilih"),
    dokter_id: yup.string().optional(),
    tanggal: yup.string().required("Tanggal kunjungan wajib diisi"),
    keluhan: yup.string().optional(),
    is_bpjs: yup.boolean().optional(),
});

const GENDER_OPTIONS = [
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
];

const BPJS_CLASS_OPTIONS = [
    { value: "1", label: "Kelas 1" },
    { value: "2", label: "Kelas 2" },
    { value: "3", label: "Kelas 3" },
];

// Palet Warna UI
const BRAND_COLOR = "#0d9488";
const SOFT_BG = "#fafaf9";
const CARD_BORDER = "#f5f5f4";

export default function PendaftaranPage() {
    const { showSuccess, showError } = useNotification();
    const [activeTab, setActiveTab] = useState(0);
    const [searchPasien, setSearchPasien] = useState("");
    const [selectedPasien, setSelectedPasien] = useState(null);
    const [pagePasien, setPagePasien] = useState(0);
    const [pageKunjungan, setPageKunjungan] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // --- QUERIES ---
    const {
        data: pasienData,
        isLoading: loadingPasien,
        refetch: refetchPasien,
    } = useYiiQuery(
        ["pasien", "list"],
        "/pasien",
        { search: searchPasien, page: pagePasien + 1, perPage: rowsPerPage },
        { enabled: activeTab === 0 },
    );
    const pasienRows = withDummy(pasienData?.data, DUMMY_PASIEN);

    const { data: poliData } = useYiiQuery(["poli", "list"], "/poli", {
        is_active: true,
        perPage: 100,
    });
    const { data: dokterData } = useYiiQuery(["dokter", "list"], "/dokter", {
        is_active: true,
        perPage: 100,
    });
    const poliRows = withDummy(poliData?.data, DUMMY_POLI);
    const dokterRows = withDummy(dokterData?.data, DUMMY_DOKTER);

    const kunjunganUrl = selectedPasien
        ? `/pasien/${selectedPasien.id}/kunjungan`
        : "/pasien/dummy/kunjungan";
    const {
        data: kunjunganPasienData,
        isLoading: loadingKunjunganPasien,
        refetch: refetchKunjunganPasien,
    } = useYiiQuery(
        [
            "kunjungan",
            "by-pasien",
            selectedPasien?.id,
            pageKunjungan + 1,
            rowsPerPage,
        ],
        kunjunganUrl,
        { page: pageKunjungan + 1, perPage: rowsPerPage },
        { enabled: !!selectedPasien && activeTab === 1 },
    );
    const kunjunganRows = withDummy(kunjunganPasienData?.data, DUMMY_KUNJUNGAN);

    // --- MUTATIONS ---
    const createPasien = useYiiMutation("/pasien", "post", {
        invalidateKeys: [["pasien", "list"]],
        onSuccess: () => showSuccess("Pasien berhasil ditambahkan"),
        onError: (err) => showError(err.message),
    });

    const updatePasien = useYiiMutation("/pasien", "put", {
        invalidateKeys: [["pasien", "list"]],
        onSuccess: () => showSuccess("Pasien berhasil diperbarui"),
        onError: (err) => showError(err.message),
    });

    const deletePasien = useYiiMutation("/pasien", "delete", {
        invalidateKeys: [["pasien", "list"]],
        onSuccess: () => showSuccess("Pasien dihapus"),
        onError: (err) => showError(err.message),
    });

    const createKunjungan = useYiiMutation("/kunjungan", "post", {
        invalidateKeys: [["kunjungan", "list"]],
        onSuccess: () => showSuccess("Kunjungan berhasil didaftarkan"),
        onError: (err) => showError(err.message),
    });

    const callKunjungan = useYiiMutation("/kunjungan", "post", {
        invalidateKeys: [["kunjungan", "list"]],
        onSuccess: () => showSuccess("Antrean berhasil dipanggil"),
        onError: (err) => showError(err.message),
    });

    // ---- FORM PASIEN ----
    const [pasienFormOpen, setPasienFormOpen] = useState(false);
    const [pasienFormMode, setPasienFormMode] = useState("create");
    const [pasienFormData, setPasienFormData] = useState({});
    const pasienForm = useForm({
        resolver: yupResolver(pasienSchema),
        mode: "onChange",
    });
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        reset,
    } = pasienForm;

    const handlePasienSubmit = async (data) => {
        if (pasienFormMode === "create") {
            await createPasien.mutateAsync(data);
        } else {
            await updatePasien.mutateAsync({ id: pasienFormData.id, ...data });
        }
        setPasienFormOpen(false);
        reset();
    };

    const openCreatePasien = () => {
        setPasienFormMode("create");
        setPasienFormData({});
        reset({ gender: "L", bpjs_class: "3" });
        setPasienFormOpen(true);
    };

    const openEditPasien = (pasien) => {
        setPasienFormMode("edit");
        setPasienFormData(pasien);
        reset(pasien);
        setPasienFormOpen(true);
    };

    const handleDeletePasien = (pasien) => {
        if (window.confirm(`Hapus data pasien ${pasien.full_name}?`)) {
            deletePasien.mutate({ id: pasien.id });
        }
    };

    // ---- FORM KUNJUNGAN ----
    const [kunjunganFormOpen, setKunjunganFormOpen] = useState(false);
    const kunjunganForm = useForm({
        resolver: yupResolver(kunjunganSchema),
        mode: "onChange",
    });
    const {
        register: regK,
        handleSubmit: hSubmitK,
        control: ctrlK,
        watch: watchK,
        formState: { errors: errorsK, isSubmitting: isSubmittingK },
        reset: resetK,
    } = kunjunganForm;

    const handleKunjunganSubmit = async (data) => {
        const payload = {
            ...data,
            tanggal:
                data.tanggal instanceof Date
                    ? data.tanggal.toISOString().split("T")[0]
                    : data.tanggal,
        };
        await createKunjungan.mutateAsync(payload);
        setKunjunganFormOpen(false);
        resetK();
        setActiveTab(1); // Pindah ke tab kunjungan setelah daftar
    };

    const openCreateKunjungan = (pasien) => {
        if (!pasien) return showError("Silakan pilih pasien terlebih dahulu");
        setSelectedPasien(pasien);
        resetK({
            pasien_id: pasien.id,
            tanggal: new Date().toISOString().split("T")[0],
            is_bpjs: !!pasien.bpjs_number,
            poli_id: "",
            dokter_id: "",
            keluhan: "",
        });
        setKunjunganFormOpen(true);
    };

    const getDokterByPoli = (poliId) =>
        dokterRows.filter((d) => d.poli_id === poliId) || [];

    return (
        <Box sx={{ pb: 4 }}>
            {/* Header Halaman */}
            <Box
                sx={{
                    mb: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
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
                        Pendaftaran Pasien
                    </Typography>
                    <Typography variant="body1" color="#78716c">
                        Kelola data master pasien dan pendaftaran kunjungan
                        poliklinik.
                    </Typography>
                </Box>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{
                        minHeight: 44,
                        backgroundColor: "#fff",
                        borderRadius: 3,
                        border: `1px solid ${CARD_BORDER}`,
                        "& .MuiTabs-indicator": { display: "none" },
                        "& .MuiTab-root": {
                            borderRadius: 3,
                            m: 0.5,
                            minHeight: 36,
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
                    <Tab
                        label="Data Pasien"
                        icon={<Person fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Daftar Kunjungan"
                        icon={<LocalHospital fontSize="small" />}
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            {/* TAB 1: DATA PASIEN */}
            {activeTab === 0 && (
                <Card
                    sx={{
                        borderRadius: 4,
                        border: `1px solid ${CARD_BORDER}`,
                        boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)",
                        backgroundColor: "#fff",
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 3,
                                flexWrap: "wrap",
                                gap: 2,
                            }}
                        >
                            <TextField
                                placeholder="Cari NIK, nama, atau No. RM..."
                                value={searchPasien}
                                onChange={(e) => {
                                    setSearchPasien(e.target.value);
                                    setPagePasien(0);
                                }}
                                size="small"
                                sx={{
                                    minWidth: { xs: "100%", sm: 320 },
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 3,
                                        backgroundColor: SOFT_BG,
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ color: "#a8a29e" }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={openCreatePasien}
                                sx={{
                                    borderRadius: 2.5,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    backgroundColor: BRAND_COLOR,
                                    "&:hover": { backgroundColor: "#0f766e" },
                                }}
                            >
                                Tambah Pasien
                            </Button>
                        </Box>

                        {loadingPasien ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 8,
                                }}
                            >
                                <CircularProgress sx={{ color: BRAND_COLOR }} />
                            </Box>
                        ) : pasienRows.length === 0 ? (
                            <EmptyState
                                type="patients"
                                title="Data Pasien Kosong"
                                description="Belum ada pasien yang terdaftar. Mulai dengan menambahkan pasien baru."
                                actionLabel="Tambah Pasien Baru"
                                onAction={openCreatePasien}
                                actionIcon={<Add />}
                            />
                        ) : (
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
                                                {[
                                                    "No. RM",
                                                    "Identitas Pasien",
                                                    "JK",
                                                    "Tgl Lahir",
                                                    "Kontak",
                                                    "BPJS",
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
                                            {pasienRows.map((pasien) => (
                                                <TableRow
                                                    key={pasien.id}
                                                    hover
                                                    sx={{
                                                        "&:last-child td, &:last-child th":
                                                            { border: 0 },
                                                    }}
                                                >
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: BRAND_COLOR,
                                                        }}
                                                    >
                                                        {pasien.no_rm}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            color="#1c1917"
                                                        >
                                                            {pasien.full_name}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="#78716c"
                                                        >
                                                            NIK: {pasien.nik}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={
                                                                pasien.gender
                                                            }
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize:
                                                                    "0.7rem",
                                                                fontWeight: 600,
                                                                backgroundColor:
                                                                    pasien.gender ===
                                                                    "L"
                                                                        ? "#e0f2fe"
                                                                        : "#fce7f3",
                                                                color:
                                                                    pasien.gender ===
                                                                    "L"
                                                                        ? "#0284c7"
                                                                        : "#db2777",
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            color: "#57534e",
                                                        }}
                                                    >
                                                        {formatDate(
                                                            pasien.birth_date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            color="#57534e"
                                                        >
                                                            {pasien.phone}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {pasien.bpjs_number ? (
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 0.5,
                                                                }}
                                                            >
                                                                <Typography variant="body2">
                                                                    {
                                                                        pasien.bpjs_number
                                                                    }
                                                                </Typography>
                                                                <Chip
                                                                    label={`Kls ${pasien.bpjs_class}`}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 18,
                                                                        fontSize:
                                                                            "0.65rem",
                                                                        backgroundColor:
                                                                            "#ecfdf5",
                                                                        color: "#10b981",
                                                                    }}
                                                                />
                                                            </Box>
                                                        ) : (
                                                            <Typography
                                                                variant="caption"
                                                                color="#a8a29e"
                                                            >
                                                                -
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Daftarkan Kunjungan">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    openCreateKunjungan(
                                                                        pasien,
                                                                    )
                                                                }
                                                                sx={{
                                                                    color: BRAND_COLOR,
                                                                    backgroundColor:
                                                                        "#f0fdfa",
                                                                    mr: 1,
                                                                    "&:hover": {
                                                                        backgroundColor:
                                                                            "#ccfbf1",
                                                                    },
                                                                }}
                                                            >
                                                                <LocalHospital fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit Data">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    openEditPasien(
                                                                        pasien,
                                                                    )
                                                                }
                                                                sx={{
                                                                    color: "#57534e",
                                                                    mr: 0.5,
                                                                }}
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Hapus">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() =>
                                                                    handleDeletePasien(
                                                                        pasien,
                                                                    )
                                                                }
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={
                                        pasienData?.meta?.total ||
                                        pasienRows.length
                                    }
                                    page={pagePasien}
                                    onPageChange={(_, p) => setPagePasien(p)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(e.target.value);
                                        setPagePasien(0);
                                    }}
                                    rowsPerPageOptions={[10, 20, 50]}
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
            )}

            {/* TAB 2: KUNJUNGAN */}
            {activeTab === 1 && (
                <Card
                    sx={{
                        borderRadius: 4,
                        border: `1px solid ${CARD_BORDER}`,
                        boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)",
                        backgroundColor: "#fff",
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 3,
                                flexWrap: "wrap",
                                gap: 2,
                            }}
                        >
                            <Box>
                                {selectedPasien ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: BRAND_COLOR,
                                                width: 40,
                                                height: 40,
                                                fontSize: "1rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {selectedPasien.full_name.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={700}
                                                color="#1c1917"
                                            >
                                                {selectedPasien.full_name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="#78716c"
                                            >
                                                No. RM: {selectedPasien.no_rm}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Alert
                                        severity="info"
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Pilih pasien dari tab (Data Pasien)
                                        untuk melihat kunjungan.
                                    </Alert>
                                )}
                            </Box>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Refresh />}
                                    onClick={() => refetchKunjunganPasien()}
                                    disabled={
                                        loadingKunjunganPasien ||
                                        !selectedPasien
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
                                    startIcon={<Add />}
                                    onClick={() =>
                                        openCreateKunjungan(selectedPasien)
                                    }
                                    disabled={!selectedPasien}
                                    sx={{
                                        borderRadius: 2.5,
                                        textTransform: "none",
                                        fontWeight: 600,
                                        backgroundColor: BRAND_COLOR,
                                        "&:hover": {
                                            backgroundColor: "#0f766e",
                                        },
                                    }}
                                >
                                    Daftar Kunjungan
                                </Button>
                            </Box>
                        </Box>

                        {loadingKunjunganPasien ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 8,
                                }}
                            >
                                <CircularProgress sx={{ color: BRAND_COLOR }} />
                            </Box>
                        ) : !selectedPasien ? (
                            <EmptyState
                                type="default"
                                title="Belum ada pasien terpilih"
                                description="Silakan pilih pasien terlebih dahulu di tab Data Pasien."
                                actionLabel="Ke Data Pasien"
                                onAction={() => setActiveTab(0)}
                                actionIcon={<Person />}
                            />
                        ) : kunjunganRows.length === 0 ? (
                            <EmptyState
                                type="queue"
                                title="Belum ada riwayat kunjungan"
                                description={`${selectedPasien.full_name} belum pernah berkunjung.`}
                                actionLabel="Buat Kunjungan Baru"
                                onAction={() =>
                                    openCreateKunjungan(selectedPasien)
                                }
                                actionIcon={<Add />}
                            />
                        ) : (
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
                                                {[
                                                    "No. Kunjungan",
                                                    "Poli & Dokter",
                                                    "Tanggal",
                                                    "Status",
                                                    "Antrean",
                                                    "BPJS",
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
                                            {kunjunganRows.map((kunjungan) => (
                                                <TableRow
                                                    key={kunjungan.id}
                                                    hover
                                                    sx={{
                                                        "&:last-child td, &:last-child th":
                                                            { border: 0 },
                                                    }}
                                                >
                                                    <TableCell
                                                        sx={{
                                                            fontFamily:
                                                                "monospace",
                                                            fontWeight: 600,
                                                            color: "#57534e",
                                                        }}
                                                    >
                                                        #
                                                        {kunjungan.id
                                                            ?.slice(-6)
                                                            .toUpperCase()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            color="#1c1917"
                                                        >
                                                            {
                                                                kunjungan.poli
                                                                    ?.nama
                                                            }
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="#78716c"
                                                        >
                                                            {kunjungan.dokter
                                                                ?.full_name ||
                                                                "Belum ditentukan"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            color: "#57534e",
                                                        }}
                                                    >
                                                        {formatDate(
                                                            kunjungan.tanggal,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusChip
                                                            status={
                                                                kunjungan.status
                                                            }
                                                            type="kunjungan"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={700}
                                                            color="#1c1917"
                                                        >
                                                            {kunjungan.no_antrean ||
                                                                "-"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {kunjungan.is_bpjs ? (
                                                            <Chip
                                                                label="BPJS"
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize:
                                                                        "0.7rem",
                                                                    fontWeight: 600,
                                                                    backgroundColor:
                                                                        "#ecfdf5",
                                                                    color: "#10b981",
                                                                }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label="Umum"
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize:
                                                                        "0.7rem",
                                                                    fontWeight: 600,
                                                                    backgroundColor:
                                                                        "#f5f5f4",
                                                                    color: "#78716c",
                                                                }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {kunjungan.status ===
                                                            "waiting" && (
                                                            <Tooltip title="Panggil Antrean">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() =>
                                                                        callKunjungan.mutate(
                                                                            {
                                                                                id: kunjungan.id,
                                                                                action: "call",
                                                                            },
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        mr: 1,
                                                                        backgroundColor:
                                                                            "#eff6ff",
                                                                    }}
                                                                >
                                                                    <Print fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                size="small"
                                                                sx={{
                                                                    color: "#57534e",
                                                                }}
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={
                                        kunjunganPasienData?.pagination
                                            ?.totalCount || kunjunganRows.length
                                    }
                                    page={pageKunjungan}
                                    onPageChange={(_, p) => setPageKunjungan(p)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(e.target.value);
                                        setPageKunjungan(0);
                                    }}
                                    rowsPerPageOptions={[10, 20, 50]}
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
            )}

            {/* --- MODAL PASIEN BARU / EDIT --- */}
            <Modal
                open={pasienFormOpen}
                onClose={() => setPasienFormOpen(false)}
                title={
                    pasienFormMode === "create"
                        ? "Pendaftaran Pasien Baru"
                        : "Edit Data Pasien"
                }
                size="md"
            >
                <form onSubmit={handleSubmit(handlePasienSubmit)}>
                    <Grid container spacing={2.5}>
                        {/* Info Dasar */}
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
                                <BadgeIcon
                                    sx={{ fontSize: 18, color: BRAND_COLOR }}
                                />{" "}
                                Identitas Pasien
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="NIK"
                                {...register("nik")}
                                error={!!errors.nik}
                                helperText={errors.nik?.message}
                                inputProps={{ maxLength: 16 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nama Lengkap"
                                {...register("full_name")}
                                error={!!errors.full_name}
                                helperText={errors.full_name?.message}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="gender"
                                control={control}
                                render={({ field }) => (
                                    <FormControl
                                        fullWidth
                                        error={!!errors.gender}
                                    >
                                        <InputLabel>Jenis Kelamin</InputLabel>
                                        <Select
                                            {...field}
                                            label="Jenis Kelamin"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {GENDER_OPTIONS.map((o) => (
                                                <MenuItem
                                                    key={o.value}
                                                    value={o.value}
                                                >
                                                    {o.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.gender && (
                                            <FormHelperText>
                                                {errors.gender.message}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Tanggal Lahir"
                                type="date"
                                {...register("birth_date")}
                                error={!!errors.birth_date}
                                helperText={errors.birth_date?.message}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="No. Telepon / WhatsApp"
                                {...register("phone")}
                                error={!!errors.phone}
                                helperText={errors.phone?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone
                                                sx={{
                                                    fontSize: 18,
                                                    color: "#a8a29e",
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email (Opsional)"
                                type="email"
                                {...register("email")}
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email
                                                sx={{
                                                    fontSize: 18,
                                                    color: "#a8a29e",
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
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
                                label="Alamat Lengkap"
                                multiline
                                rows={2}
                                {...register("address")}
                                error={!!errors.address}
                                helperText={errors.address?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment
                                            position="start"
                                            sx={{
                                                mt: 1.5,
                                                alignSelf: "flex-start",
                                            }}
                                        >
                                            <LocationOn
                                                sx={{
                                                    fontSize: 18,
                                                    color: "#a8a29e",
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>

                        {/* Info BPJS */}
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
                                <AssignmentTurnedIn
                                    sx={{ fontSize: 18, color: BRAND_COLOR }}
                                />{" "}
                                Jaminan Kesehatan (Opsional)
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="No. Kartu BPJS"
                                {...register("bpjs_number")}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="bpjs_class"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Kelas BPJS</InputLabel>
                                        <Select
                                            {...field}
                                            label="Kelas BPJS"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {BPJS_CLASS_OPTIONS.map((o) => (
                                                <MenuItem
                                                    key={o.value}
                                                    value={o.value}
                                                >
                                                    {o.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                    </Grid>

                    {/* Tombol Aksi Form Pasien */}
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
                            onClick={() => setPasienFormOpen(false)}
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
                                : "Simpan Data Pasien"}
                        </Button>
                    </Box>
                </form>
            </Modal>

            {/* --- MODAL KUNJUNGAN BARU --- */}
            <Modal
                open={kunjunganFormOpen}
                onClose={() => setKunjunganFormOpen(false)}
                title="Pendaftaran Kunjungan Poli"
                size="md"
            >
                <form onSubmit={hSubmitK(handleKunjunganSubmit)}>
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: SOFT_BG,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >
                        <Avatar
                            sx={{
                                bgcolor: "#fff",
                                color: BRAND_COLOR,
                                fontWeight: 700,
                            }}
                        >
                            {selectedPasien?.full_name?.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#1c1917"
                            >
                                {selectedPasien?.full_name}
                            </Typography>
                            <Typography variant="caption" color="#78716c">
                                No. RM: {selectedPasien?.no_rm} | NIK:{" "}
                                {selectedPasien?.nik}
                            </Typography>
                        </Box>
                    </Box>

                    <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="poli_id"
                                control={ctrlK}
                                render={({ field }) => (
                                    <FormControl
                                        fullWidth
                                        error={!!errorsK.poli_id}
                                    >
                                        <InputLabel>
                                            Tujuan Poliklinik
                                        </InputLabel>
                                        <Select
                                            {...field}
                                            label="Tujuan Poliklinik"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {poliRows.map((p) => (
                                                <MenuItem
                                                    key={p.id}
                                                    value={p.id}
                                                >
                                                    {p.nama}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errorsK.poli_id && (
                                            <FormHelperText>
                                                {errorsK.poli_id.message}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="dokter_id"
                                control={ctrlK}
                                render={({ field }) => {
                                    const poliId = watchK("poli_id");
                                    const dokterList = getDokterByPoli(poliId);
                                    return (
                                        <FormControl
                                            fullWidth
                                            disabled={!poliId}
                                        >
                                            <InputLabel>
                                                Pilih Dokter (Opsional)
                                            </InputLabel>
                                            <Select
                                                {...field}
                                                label="Pilih Dokter (Opsional)"
                                                sx={{ borderRadius: 2 }}
                                            >
                                                <MenuItem value="">
                                                    -- Dokter Umum --
                                                </MenuItem>
                                                {dokterList.map((d) => (
                                                    <MenuItem
                                                        key={d.id}
                                                        value={d.id}
                                                    >
                                                        {d.full_name} (
                                                        {d.specialist?.nama})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    );
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Tanggal Kunjungan"
                                type="date"
                                {...regK("tanggal")}
                                error={!!errorsK.tanggal}
                                helperText={errorsK.tanggal?.message}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarToday
                                                sx={{
                                                    fontSize: 18,
                                                    color: "#a8a29e",
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    height: "100%",
                                    mt: 1,
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            {...regK("is_bpjs")}
                                            sx={{
                                                color: BRAND_COLOR,
                                                "&.Mui-checked": {
                                                    color: BRAND_COLOR,
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography
                                            variant="body2"
                                            fontWeight={500}
                                        >
                                            Gunakan Jaminan BPJS
                                        </Typography>
                                    }
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Keluhan Utama / Catatan"
                                multiline
                                rows={3}
                                placeholder="Contoh: Demam sejak 2 hari yang lalu, pusing, mual..."
                                {...regK("keluhan")}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Tombol Aksi Form Kunjungan */}
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
                            onClick={() => setKunjunganFormOpen(false)}
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
                            disabled={isSubmittingK}
                            startIcon={
                                isSubmittingK ? (
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
                            {isSubmittingK
                                ? "Memproses..."
                                : "Daftarkan Kunjungan"}
                        </Button>
                    </Box>
                </form>
            </Modal>
        </Box>
    );
}
