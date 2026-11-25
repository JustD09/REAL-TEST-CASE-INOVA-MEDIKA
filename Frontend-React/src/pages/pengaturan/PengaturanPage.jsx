import React, { useState, useEffect } from "react";
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
    Alert,
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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Snackbar,
    Tabs,
    Tab,
    InputAdornment,
    FormHelperText,
    Tooltip,
    Switch,
    FormControlLabel,
    CircularProgress,
    Avatar,
    Stack,
} from "@mui/material";
import {
    Search,
    Add,
    Edit,
    Delete,
    Person,
    AdminPanelSettings,
    LocalHospital,
    MedicalServices,
    LocalPharmacy,
    Science,
    Security,
    Settings,
    CloudSync,
    Lock,
    LockOpen,
    Description,
    ListAlt,
    MedicalInformation,
    Cancel,
    Save,
} from "@mui/icons-material";
import { useYiiQuery, useYiiMutation } from "../../hooks/useApi";
import {
    DUMMY_PASIEN,
    DUMMY_POLI,
    DUMMY_DOKTER,
    DUMMY_DIAGNOSA,
    DUMMY_OBAT,
    DUMMY_LAB_JENIS,
    withDummy,
} from "../../data/dummyData";
import {
    formatDate,
    formatDateTime,
    formatTime,
    formatCurrency,
} from "../../utils/format";
import StatusChip from "../../components/ui/StatusChip";
import Modal from "../../components/ui/Modal";

// Palet Warna UI
const BRAND_COLOR = "#0d9488";
const SOFT_BG = "#fafaf9";
const CARD_BORDER = "#f5f5f4";

// Skema Validasi
const userSchema = yup.object().shape({
    username: yup
        .string()
        .required("Username wajib diisi")
        .min(3, "Min 3 karakter"),
    email: yup
        .string()
        .email("Format email tidak valid")
        .required("Email wajib diisi"),
    password: yup.string().min(6, "Min 6 karakter").optional(),
    full_name: yup.string().required("Nama lengkap wajib diisi"),
    phone: yup.string().optional(),
    role: yup.string().required("Role wajib dipilih"),
    is_active: yup.boolean().optional(),
});

const poliSchema = yup.object().shape({
    nama: yup.string().required("Nama poli wajib diisi"),
    kode: yup.string().required("Kode poli wajib diisi").max(10),
    deskripsi: yup.string().optional(),
    is_active: yup.boolean().optional(),
});

const dokterSchema = yup.object().shape({
    nip: yup.string().required("NIP wajib diisi"),
    full_name: yup.string().required("Nama lengkap wajib diisi"),
    specialist_id: yup.string().required("Spesialis wajib dipilih"),
    poli_id: yup.string().required("Poli wajib dipilih"),
    jadwal_praktik: yup.array().optional(),
    is_active: yup.boolean().optional(),
});

const obatSchema = yup.object().shape({
    nama: yup.string().required("Nama obat wajib diisi"),
    kode: yup.string().required("Kode obat wajib diisi"),
    kategori_id: yup.string().required("Kategori wajib dipilih"),
    satuan: yup.string().required("Satuan wajib diisi"),
    harga_beli: yup
        .number()
        .typeError("Harus angka")
        .required("Harga beli wajib diisi")
        .positive(),
    harga_jual: yup
        .number()
        .typeError("Harus angka")
        .required("Harga jual wajib diisi")
        .positive(),
    stok_minimum: yup
        .number()
        .typeError("Harus angka")
        .required("Stok minimum wajib diisi")
        .integer(),
    is_active: yup.boolean().optional(),
    is_generik: yup.boolean().optional(),
});

function getSchema(activeTable) {
    switch (activeTable) {
        case "users":
            return userSchema;
        case "poli":
            return poliSchema;
        case "dokter":
            return dokterSchema;
        case "obat":
            return obatSchema;
        default:
            return userSchema;
    }
}

const ROLE_OPTIONS = [
    { value: "admin", label: "Administrator" },
    { value: "dokter", label: "Dokter" },
    { value: "perawat", label: "Perawat" },
    { value: "farmasi", label: "Farmasi" },
    { value: "laboratorium", label: "Laboratorium" },
    { value: "kasir", label: "Kasir/Billing" },
    { value: "pendaftaran", label: "Pendaftaran" },
    { value: "manajemen", label: "Manajemen" },
];

const TABS = [
    { id: "users", label: "User & Akses", icon: <Person fontSize="small" /> },
    {
        id: "poli",
        label: "Poli & Dokter",
        icon: <LocalHospital fontSize="small" />,
    },
    {
        id: "master-medis",
        label: "Master Medis",
        icon: <MedicalServices fontSize="small" />,
    },
    {
        id: "farmasi",
        label: "Master Farmasi",
        icon: <LocalPharmacy fontSize="small" />,
    },
    {
        id: "laboratorium",
        label: "Master Lab",
        icon: <Science fontSize="small" />,
    },
    {
        id: "integrasi",
        label: "Integrasi BPJS",
        icon: <CloudSync fontSize="small" />,
    },
    { id: "system", label: "Sistem", icon: <Settings fontSize="small" /> },
];

export default function PengaturanPage() {
    const [activeTab, setActiveTab] = useState("users");
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState("create");
    const [dialogData, setDialogData] = useState({});
    const [activeTable, setActiveTable] = useState("users");
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    // Queries
    const { data: usersData } = useYiiQuery(["pengaturan", "users"], "/user", {
        perPage: 100,
        search: searchText,
    });
    const { data: rolesData } = useYiiQuery(
        ["pengaturan", "roles"],
        "/rbac/roles",
        { perPage: 50 },
    );
    const { data: permissionsData } = useYiiQuery(
        ["pengaturan", "permissions"],
        "/rbac/permissions",
        { perPage: 200 },
    );
    const { data: poliData } = useYiiQuery(["pengaturan", "poli"], "/poli", {
        perPage: 100,
    });
    const { data: dokterData } = useYiiQuery(
        ["pengaturan", "dokter"],
        "/dokter",
        { perPage: 100 },
    );
    const { data: specialistData } = useYiiQuery(
        ["pengaturan", "specialist"],
        "/specialist",
        { perPage: 100 },
    );
    const { data: jadwalData } = useYiiQuery(
        ["pengaturan", "jadwal"],
        "/jadwal-praktik",
        { perPage: 200 },
    );
    const { data: tindakanData } = useYiiQuery(
        ["pengaturan", "tindakan"],
        "/tindakan",
        { perPage: 200 },
    );
    const { data: tindakanCatData } = useYiiQuery(
        ["pengaturan", "tindakan-cat"],
        "/tindakan-category",
        { perPage: 100 },
    );
    const { data: diagnosaData } = useYiiQuery(
        ["pengaturan", "diagnosa"],
        "/diagnosa",
        { perPage: 500 },
    );
    const { data: obatData } = useYiiQuery(["pengaturan", "obat"], "/obat", {
        perPage: 200,
    });
    const { data: obatCatData } = useYiiQuery(
        ["pengaturan", "obat-cat"],
        "/obat-category",
        { perPage: 100 },
    );
    const { data: labJenisData } = useYiiQuery(
        ["pengaturan", "lab-jenis"],
        "/jenis-pemeriksaan-lab",
        { perPage: 200 },
    );
    const { data: labCatData } = useYiiQuery(
        ["pengaturan", "lab-cat"],
        "/jenis-pemeriksaan-lab-category",
        { perPage: 100 },
    );
    const { data: integrationLogs } = useYiiQuery(
        ["pengaturan", "integration-logs"],
        "/integration/logs",
        { perPage: 100 },
    );

    // Mutations
    const createUser = useYiiMutation("/user", "post", {
        invalidateKeys: [["pengaturan", "users"]],
    });
    const updateUser = useYiiMutation("/user", "put", {
        invalidateKeys: [["pengaturan", "users"]],
    });
    const deleteUser = useYiiMutation("/user", "delete", {
        invalidateKeys: [["pengaturan", "users"]],
    });
    const toggleUserStatus = useYiiMutation("/user", "post", {
        invalidateKeys: [["pengaturan", "users"]],
    });

    const createPoli = useYiiMutation("/poli", "post", {
        invalidateKeys: [["pengaturan", "poli"]],
    });
    const updatePoli = useYiiMutation("/poli", "put", {
        invalidateKeys: [["pengaturan", "poli"]],
    });
    const deletePoli = useYiiMutation("/poli", "delete", {
        invalidateKeys: [["pengaturan", "poli"]],
    });

    const createDokter = useYiiMutation("/dokter", "post", {
        invalidateKeys: [["pengaturan", "dokter"]],
    });
    const updateDokter = useYiiMutation("/dokter", "put", {
        invalidateKeys: [["pengaturan", "dokter"]],
    });
    const deleteDokter = useYiiMutation("/dokter", "delete", {
        invalidateKeys: [["pengaturan", "dokter"]],
    });

    const createObat = useYiiMutation("/obat", "post", {
        invalidateKeys: [["pengaturan", "obat"]],
    });
    const updateObat = useYiiMutation("/obat", "put", {
        invalidateKeys: [["pengaturan", "obat"]],
    });
    const deleteObat = useYiiMutation("/obat", "delete", {
        invalidateKeys: [["pengaturan", "obat"]],
    });

    const showSuccess = (msg) =>
        setSnackbar({ open: true, message: msg, severity: "success" });
    const showError = (msg) =>
        setSnackbar({ open: true, message: msg, severity: "error" });

    const form = useForm({
        resolver: yupResolver(getSchema(activeTable)),
        mode: "onChange",
    });
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        reset,
    } = form;

    // Reset form when activeTable changes
    useEffect(() => {
        reset(getDefaults());
    }, [activeTable, reset]);

    const handleSubmitForm = async (data) => {
        try {
            let mutation;
            if (dialogMode === "create") {
                switch (activeTable) {
                    case "users":
                        mutation = createUser;
                        break;
                    case "poli":
                        mutation = createPoli;
                        break;
                    case "dokter":
                        mutation = createDokter;
                        break;
                    case "obat":
                        mutation = createObat;
                        break;
                    default:
                        throw new Error("Tabel tidak didukung");
                }
                await mutation.mutateAsync(data);
                showSuccess("Data berhasil ditambahkan");
            } else {
                switch (activeTable) {
                    case "users":
                        mutation = updateUser;
                        break;
                    case "poli":
                        mutation = updatePoli;
                        break;
                    case "dokter":
                        mutation = updateDokter;
                        break;
                    case "obat":
                        mutation = updateObat;
                        break;
                    default:
                        throw new Error("Tabel tidak didukung");
                }
                await mutation.mutateAsync({ id: dialogData.id, ...data });
                showSuccess("Data berhasil diperbarui");
            }
            setDialogOpen(false);
            reset();
        } catch (err) {
            showError(err.message);
            throw err;
        }
    };

    const openCreate = () => {
        setDialogMode("create");
        setDialogData({});
        reset(getDefaults());
        setDialogOpen(true);
    };

    const openEdit = (row) => {
        setDialogMode("edit");
        setDialogData(row);
        reset(row);
        setDialogOpen(true);
    };

    const handleDelete = (id) => {
        if (!window.confirm("Hapus data ini secara permanen?")) return;
        let mutation;
        switch (activeTable) {
            case "users":
                mutation = deleteUser;
                break;
            case "poli":
                mutation = deletePoli;
                break;
            case "dokter":
                mutation = deleteDokter;
                break;
            case "obat":
                mutation = deleteObat;
                break;
            default:
                return;
        }
        mutation.mutate(
            { id },
            { onSuccess: () => showSuccess("Data berhasil dihapus") },
        );
    };

    const handleToggleStatus = (row) => {
        if (activeTable !== "users") return;
        toggleUserStatus.mutate(
            { id: row.id, action: row.is_active ? "deactivate" : "activate" },
            {
                onSuccess: () =>
                    showSuccess(
                        row.is_active
                            ? "User dinonaktifkan"
                            : "User diaktifkan",
                    ),
            },
        );
    };

    function getDefaults() {
        switch (activeTable) {
            case "users":
                return {
                    username: "",
                    email: "",
                    full_name: "",
                    role: "pendaftaran",
                    is_active: true,
                };
            case "poli":
                return { nama: "", kode: "", deskripsi: "", is_active: true };
            case "dokter":
                return {
                    nip: "",
                    full_name: "",
                    specialist_id: "",
                    poli_id: "",
                    is_active: true,
                };
            case "obat":
                return {
                    nama: "",
                    kode: "",
                    kategori_id: "",
                    satuan: "",
                    harga_beli: 0,
                    harga_jual: 0,
                    stok_minimum: 10,
                    is_active: true,
                    is_generik: false,
                };
            default:
                return {};
        }
    }

    function getTableLabel() {
        switch (activeTable) {
            case "users":
                return "User";
            case "roles":
                return "Role";
            case "permissions":
                return "Permission";
            case "poli":
                return "Poli";
            case "dokter":
                return "Dokter";
            case "specialist":
                return "Spesialis";
            case "jadwal":
                return "Jadwal";
            case "tindakan":
                return "Tindakan";
            case "tindakan-cat":
                return "Kategori Tindakan";
            case "diagnosa":
                return "Diagnosis";
            case "obat":
                return "Obat";
            case "obat-cat":
                return "Kategori Obat";
            case "lab-jenis":
                return "Jenis Lab";
            case "lab-cat":
                return "Kategori Lab";
            case "integration-logs":
                return "Log Integrasi";
            default:
                return "Data";
        }
    }

    function getTableData() {
        switch (activeTable) {
            case "users":
                return withDummy(usersData?.data, DUMMY_PASIEN);
            case "roles":
                return withDummy(rolesData?.data, []);
            case "permissions":
                return withDummy(permissionsData?.data, []);
            case "poli":
                return withDummy(poliData?.data, DUMMY_POLI);
            case "dokter":
                return withDummy(dokterData?.data, DUMMY_DOKTER);
            case "specialist":
                return withDummy(specialistData?.data, []);
            case "jadwal":
                return withDummy(jadwalData?.data, []);
            case "tindakan":
                return withDummy(tindakanData?.data, []);
            case "tindakan-cat":
                return withDummy(tindakanCatData?.data, []);
            case "diagnosa":
                return withDummy(diagnosaData?.data, DUMMY_DIAGNOSA);
            case "obat":
                return withDummy(obatData?.data, DUMMY_OBAT);
            case "obat-cat":
                return withDummy(obatCatData?.data, []);
            case "lab-jenis":
                return withDummy(labJenisData?.data, DUMMY_LAB_JENIS);
            case "lab-cat":
                return withDummy(labCatData?.data, []);
            case "integration-logs":
                return withDummy(integrationLogs?.data, []);
            default:
                return [];
        }
    }

    function getColumns() {
        switch (activeTable) {
            case "users":
                return [
                    {
                        field: "username",
                        header: "Username",
                        render: (r) => <b>{r.username}</b>,
                    },
                    { field: "email", header: "Email" },
                    { field: "full_name", header: "Nama Lengkap" },
                    {
                        field: "role",
                        header: "Role",
                        render: (r) => (
                            <Chip
                                label={
                                    ROLE_OPTIONS.find((o) => o.value === r.role)
                                        ?.label || r.role
                                }
                                size="small"
                                sx={{ backgroundColor: SOFT_BG }}
                            />
                        ),
                    },
                    {
                        field: "is_active",
                        header: "Status",
                        render: (r) => (
                            <StatusChip
                                status={r.is_active ? "active" : "inactive"}
                                size="small"
                                variant="filled"
                            />
                        ),
                    },
                ];
            case "roles":
                return [
                    { field: "name", header: "Nama Role" },
                    { field: "description", header: "Deskripsi" },
                    {
                        field: "permissions_count",
                        header: "Jml Permission",
                        align: "right",
                        render: (r) => r.permissions?.length || 0,
                    },
                ];
            case "permissions":
                return [
                    { field: "name", header: "Permission" },
                    { field: "description", header: "Deskripsi" },
                    { field: "module", header: "Modul" },
                ];
            case "poli":
                return [
                    {
                        field: "kode",
                        header: "Kode",
                        render: (r) => (
                            <Chip
                                label={r.kode}
                                size="small"
                                sx={{
                                    backgroundColor: SOFT_BG,
                                    fontWeight: 600,
                                }}
                            />
                        ),
                    },
                    {
                        field: "nama",
                        header: "Nama Poli",
                        render: (r) => <b>{r.nama}</b>,
                    },
                    { field: "deskripsi", header: "Deskripsi" },
                    {
                        field: "is_active",
                        header: "Status",
                        render: (r) => (
                            <StatusChip
                                status={r.is_active ? "active" : "inactive"}
                                size="small"
                                variant="filled"
                            />
                        ),
                    },
                ];
            case "dokter":
                return [
                    { field: "nip", header: "NIP" },
                    {
                        field: "full_name",
                        header: "Nama Dokter",
                        render: (r) => <b>{r.full_name}</b>,
                    },
                    { field: "specialist_nama", header: "Spesialis" },
                    { field: "poli_nama", header: "Poli" },
                    {
                        field: "is_active",
                        header: "Status",
                        render: (r) => (
                            <StatusChip
                                status={r.is_active ? "active" : "inactive"}
                                size="small"
                                variant="filled"
                            />
                        ),
                    },
                ];
            case "specialist":
                return [
                    {
                        field: "kode",
                        header: "Kode",
                        render: (r) => (
                            <Chip
                                label={r.kode}
                                size="small"
                                sx={{
                                    backgroundColor: SOFT_BG,
                                    fontWeight: 600,
                                }}
                            />
                        ),
                    },
                    { field: "nama", header: "Nama Spesialis" },
                ];
            case "jadwal":
                return [
                    { field: "dokter_nama", header: "Dokter" },
                    { field: "poli_nama", header: "Poli" },
                    {
                        field: "hari",
                        header: "Hari",
                        render: (r) => <b>{r.hari}</b>,
                    },
                    {
                        field: "jam_mulai",
                        header: "Mulai",
                        render: (r) => formatTime(r.jam_mulai),
                    },
                    {
                        field: "jam_selesai",
                        header: "Selesai",
                        render: (r) => formatTime(r.jam_selesai),
                    },
                    { field: "kuota", header: "Kuota", align: "right" },
                ];
            case "tindakan":
                return [
                    {
                        field: "kode",
                        header: "Kode",
                        render: (r) => (
                            <Chip
                                label={r.kode}
                                size="small"
                                sx={{
                                    backgroundColor: SOFT_BG,
                                    fontWeight: 600,
                                }}
                            />
                        ),
                    },
                    { field: "nama", header: "Nama Tindakan" },
                    { field: "category_nama", header: "Kategori" },
                    {
                        field: "tarif",
                        header: "Tarif",
                        align: "right",
                        render: (r) => <b>{formatCurrency(r.tarif)}</b>,
                    },
                ];
            case "tindakan-cat":
                return [
                    { field: "kode", header: "Kode" },
                    { field: "nama", header: "Kategori" },
                ];
            case "diagnosa":
                return [
                    {
                        field: "kode",
                        header: "Kode ICD-10",
                        render: (r) => (
                            <Chip
                                label={r.kode}
                                size="small"
                                sx={{
                                    backgroundColor: "#e0f2fe",
                                    color: "#0284c7",
                                    fontWeight: 600,
                                }}
                            />
                        ),
                    },
                    { field: "nama", header: "Nama Diagnosis" },
                ];
            case "obat":
                return [
                    {
                        field: "kode",
                        header: "Kode",
                        render: (r) => (
                            <Chip
                                label={r.kode}
                                size="small"
                                sx={{
                                    backgroundColor: SOFT_BG,
                                    fontWeight: 600,
                                }}
                            />
                        ),
                    },
                    {
                        field: "nama",
                        header: "Nama Obat",
                        render: (r) => <b>{r.nama}</b>,
                    },
                    { field: "kategori_nama", header: "Kategori" },
                    { field: "satuan", header: "Satuan" },
                    {
                        field: "harga_jual",
                        header: "Harga Jual",
                        align: "right",
                        render: (r) => <b>{formatCurrency(r.harga_jual)}</b>,
                    },
                    {
                        field: "stok",
                        header: "Stok",
                        align: "right",
                        render: (r) => (r.stok !== undefined ? r.stok : "-"),
                    },
                    {
                        field: "is_active",
                        header: "Status",
                        render: (r) => (
                            <StatusChip
                                status={r.is_active ? "active" : "inactive"}
                                size="small"
                                variant="filled"
                            />
                        ),
                    },
                ];
            case "obat-cat":
                return [
                    { field: "kode", header: "Kode" },
                    { field: "nama", header: "Kategori" },
                ];
            case "lab-jenis":
                return [
                    {
                        field: "kode",
                        header: "Kode",
                        render: (r) => (
                            <Chip
                                label={r.kode}
                                size="small"
                                sx={{
                                    backgroundColor: SOFT_BG,
                                    fontWeight: 600,
                                }}
                            />
                        ),
                    },
                    {
                        field: "nama",
                        header: "Jenis Pemeriksaan",
                        render: (r) => <b>{r.nama}</b>,
                    },
                    { field: "category_nama", header: "Kategori" },
                    { field: "type", header: "Tipe" },
                    { field: "sample_type", header: "Specimen" },
                    {
                        field: "harga",
                        header: "Harga",
                        align: "right",
                        render: (r) => <b>{formatCurrency(r.harga)}</b>,
                    },
                ];
            case "lab-cat":
                return [
                    { field: "kode", header: "Kode" },
                    { field: "nama", header: "Kategori" },
                ];
            case "integration-logs":
                return [
                    {
                        field: "id",
                        header: "ID",
                        render: (r) => (
                            <span style={{ fontFamily: "monospace" }}>
                                {r.id.slice(0, 8)}...
                            </span>
                        ),
                    },
                    {
                        field: "service",
                        header: "Layanan",
                        render: (r) => (
                            <Chip
                                label={r.service}
                                size="small"
                                sx={{ backgroundColor: SOFT_BG }}
                            />
                        ),
                    },
                    { field: "endpoint", header: "Endpoint" },
                    {
                        field: "status",
                        header: "Status",
                        render: (r) => (
                            <StatusChip
                                status={r.status}
                                size="small"
                                variant="filled"
                            />
                        ),
                    },
                    {
                        field: "created_at",
                        header: "Waktu",
                        render: (r) => formatDateTime(r.created_at),
                    },
                ];
            default:
                return [{ field: "id", header: "ID" }];
        }
    }

    function renderTable() {
        const columns = getColumns();
        const data = getTableData();
        const filtered =
            data?.filter(
                (row) =>
                    !searchText ||
                    JSON.stringify(row)
                        .toLowerCase()
                        .includes(searchText.toLowerCase()),
            ) || [];

        return (
            <>
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
                        placeholder={`Cari ${getTableLabel()}...`}
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            setPage(0);
                        }}
                        size="small"
                        sx={{
                            minWidth: 320,
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
                        startIcon={<Add />}
                        onClick={openCreate}
                        sx={{
                            borderRadius: 2.5,
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: BRAND_COLOR,
                            "&:hover": { backgroundColor: "#0f766e" },
                        }}
                    >
                        Tambah {getTableLabel()}
                    </Button>
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
                                <TableCell
                                    align="right"
                                    sx={{
                                        fontWeight: 600,
                                        backgroundColor: SOFT_BG,
                                        color: "#44403c",
                                        borderBottom: `1px solid ${CARD_BORDER}`,
                                        py: 1.5,
                                    }}
                                >
                                    Aksi
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered
                                .slice(
                                    page * rowsPerPage,
                                    (page + 1) * rowsPerPage,
                                )
                                .map((row, idx) => (
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
                                        <TableCell align="right">
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                justifyContent="flex-end"
                                            >
                                                <Tooltip title="Edit Data">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            openEdit(row)
                                                        }
                                                        sx={{
                                                            color: "#57534e",
                                                        }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {activeTable === "users" && (
                                                    <Tooltip
                                                        title={
                                                            row.is_active
                                                                ? "Nonaktifkan Akun"
                                                                : "Aktifkan Akun"
                                                        }
                                                    >
                                                        <IconButton
                                                            size="small"
                                                            color={
                                                                row.is_active
                                                                    ? "warning"
                                                                    : "success"
                                                            }
                                                            onClick={() =>
                                                                handleToggleStatus(
                                                                    row,
                                                                )
                                                            }
                                                        >
                                                            {row.is_active ? (
                                                                <Lock fontSize="small" />
                                                            ) : (
                                                                <LockOpen fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Hapus Data">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() =>
                                                            handleDelete(row.id)
                                                        }
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length + 1}
                                        align="center"
                                        sx={{ py: 6 }}
                                    >
                                        <Typography
                                            variant="body1"
                                            color="#a8a29e"
                                        >
                                            Tidak ada data{" "}
                                            {getTableLabel().toLowerCase()}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={filtered.length}
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
                        ".MuiTablePagination-toolbar": { minHeight: 48 },
                    }}
                />
            </>
        );
    }

    function renderSubTabs() {
        const commonSx = {
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
        };

        if (activeTab === "users") {
            return (
                <Tabs
                    value={activeTable}
                    onChange={(_, v) => {
                        setActiveTable(v);
                        setPage(0);
                        setSearchText("");
                    }}
                    variant="scrollable"
                    sx={commonSx}
                >
                    <Tab
                        value="users"
                        label="User"
                        icon={<Person fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="roles"
                        label="Role"
                        icon={<AdminPanelSettings fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="permissions"
                        label="Permission"
                        icon={<Security fontSize="small" />}
                        iconPosition="start"
                    />
                </Tabs>
            );
        }
        if (activeTab === "poli") {
            return (
                <Tabs
                    value={activeTable}
                    onChange={(_, v) => {
                        setActiveTable(v);
                        setPage(0);
                        setSearchText("");
                    }}
                    variant="scrollable"
                    sx={commonSx}
                >
                    <Tab
                        value="poli"
                        label="Poli"
                        icon={<LocalHospital fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="dokter"
                        label="Dokter"
                        icon={<MedicalServices fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="specialist"
                        label="Spesialis"
                        icon={<MedicalInformation fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="jadwal"
                        label="Jadwal Praktik"
                        icon={<ListAlt fontSize="small" />}
                        iconPosition="start"
                    />
                </Tabs>
            );
        }
        if (activeTab === "master-medis") {
            return (
                <Tabs
                    value={activeTable}
                    onChange={(_, v) => {
                        setActiveTable(v);
                        setPage(0);
                        setSearchText("");
                    }}
                    variant="scrollable"
                    sx={commonSx}
                >
                    <Tab
                        value="tindakan"
                        label="Tindakan Medis"
                        icon={<MedicalServices fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="tindakan-cat"
                        label="Kategori Tindakan"
                        icon={<ListAlt fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="diagnosa"
                        label="Diagnosis ICD-10"
                        icon={<Description fontSize="small" />}
                        iconPosition="start"
                    />
                </Tabs>
            );
        }
        if (activeTab === "farmasi") {
            return (
                <Tabs
                    value={activeTable}
                    onChange={(_, v) => {
                        setActiveTable(v);
                        setPage(0);
                        setSearchText("");
                    }}
                    variant="scrollable"
                    sx={commonSx}
                >
                    <Tab
                        value="obat"
                        label="Obat"
                        icon={<LocalPharmacy fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="obat-cat"
                        label="Kategori Obat"
                        icon={<ListAlt fontSize="small" />}
                        iconPosition="start"
                    />
                </Tabs>
            );
        }
        if (activeTab === "laboratorium") {
            return (
                <Tabs
                    value={activeTable}
                    onChange={(_, v) => {
                        setActiveTable(v);
                        setPage(0);
                        setSearchText("");
                    }}
                    variant="scrollable"
                    sx={commonSx}
                >
                    <Tab
                        value="lab-jenis"
                        label="Jenis Pemeriksaan"
                        icon={<Science fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        value="lab-cat"
                        label="Kategori Lab"
                        icon={<ListAlt fontSize="small" />}
                        iconPosition="start"
                    />
                </Tabs>
            );
        }
        return null;
    }

    function renderDialogFields() {
        switch (activeTable) {
            case "users":
                return (
                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#44403c"
                                sx={{ mb: 1 }}
                            >
                                Informasi Akun
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Username"
                                {...register("username")}
                                error={!!errors.username}
                                helperText={errors.username?.message}
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
                                label="Email"
                                type="email"
                                {...register("email")}
                                error={!!errors.email}
                                helperText={errors.email?.message}
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
                                label="Password"
                                type="password"
                                {...register("password")}
                                error={!!errors.password}
                                helperText={
                                    errors.password?.message ||
                                    (dialogMode === "edit"
                                        ? "Kosongkan jika tidak diubah"
                                        : "Min 6 karakter")
                                }
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
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#44403c"
                                sx={{ mb: 1 }}
                            >
                                Hak Akses & Kontak
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="No. Telepon"
                                {...register("phone")}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <FormControl
                                        fullWidth
                                        error={!!errors.role}
                                    >
                                        <InputLabel>Role Pengguna</InputLabel>
                                        <Select
                                            {...field}
                                            label="Role Pengguna"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {ROLE_OPTIONS.map((o) => (
                                                <MenuItem
                                                    key={o.value}
                                                    value={o.value}
                                                >
                                                    {o.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.role && (
                                            <FormHelperText>
                                                {errors.role.message}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        {...register("is_active")}
                                        defaultChecked
                                    />
                                }
                                label={
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                    >
                                        Status Akun Aktif
                                    </Typography>
                                }
                            />
                        </Grid>
                    </Grid>
                );
            case "poli":
                return (
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Kode Poli"
                                {...register("kode")}
                                error={!!errors.kode}
                                helperText={errors.kode?.message}
                                inputProps={{ maxLength: 10 }}
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
                                label="Nama Poli"
                                {...register("nama")}
                                error={!!errors.nama}
                                helperText={errors.nama?.message}
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
                                label="Deskripsi Singkat"
                                multiline
                                rows={3}
                                {...register("deskripsi")}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        {...register("is_active")}
                                        defaultChecked
                                    />
                                }
                                label={
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                    >
                                        Status Aktif
                                    </Typography>
                                }
                            />
                        </Grid>
                    </Grid>
                );
            case "dokter":
                return (
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="NIP"
                                {...register("nip")}
                                error={!!errors.nip}
                                helperText={errors.nip?.message}
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
                                name="specialist_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl
                                        fullWidth
                                        error={!!errors.specialist_id}
                                    >
                                        <InputLabel>Spesialis</InputLabel>
                                        <Select
                                            {...field}
                                            label="Spesialis"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {specialistData?.data?.map((s) => (
                                                <MenuItem
                                                    key={s.id}
                                                    value={s.id}
                                                >
                                                    {s.nama}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.specialist_id && (
                                            <FormHelperText>
                                                {errors.specialist_id.message}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="poli_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl
                                        fullWidth
                                        error={!!errors.poli_id}
                                    >
                                        <InputLabel>Poli Utama</InputLabel>
                                        <Select
                                            {...field}
                                            label="Poli Utama"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {poliData?.data?.map((p) => (
                                                <MenuItem
                                                    key={p.id}
                                                    value={p.id}
                                                >
                                                    {p.nama}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.poli_id && (
                                            <FormHelperText>
                                                {errors.poli_id.message}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        {...register("is_active")}
                                        defaultChecked
                                    />
                                }
                                label={
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                    >
                                        Status Aktif
                                    </Typography>
                                }
                            />
                        </Grid>
                    </Grid>
                );
            case "obat":
                return (
                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#44403c"
                                sx={{ mb: 1 }}
                            >
                                Informasi Obat
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Kode Obat"
                                {...register("kode")}
                                error={!!errors.kode}
                                helperText={errors.kode?.message}
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
                                label="Nama Obat"
                                {...register("nama")}
                                error={!!errors.nama}
                                helperText={errors.nama?.message}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="kategori_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl
                                        fullWidth
                                        error={!!errors.kategori_id}
                                    >
                                        <InputLabel>Kategori</InputLabel>
                                        <Select
                                            {...field}
                                            label="Kategori"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {obatCatData?.data?.map((c) => (
                                                <MenuItem
                                                    key={c.id}
                                                    value={c.id}
                                                >
                                                    {c.nama}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.kategori_id && (
                                            <FormHelperText>
                                                {errors.kategori_id.message}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Satuan (Tablet, Botol, dll)"
                                {...register("satuan")}
                                error={!!errors.satuan}
                                helperText={errors.satuan?.message}
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

                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#44403c"
                                sx={{ mb: 1 }}
                            >
                                Harga & Stok
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Harga Beli (Rp)"
                                type="number"
                                {...register("harga_beli", {
                                    valueAsNumber: true,
                                })}
                                error={!!errors.harga_beli}
                                helperText={errors.harga_beli?.message}
                                inputProps={{ step: 100, min: 0 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Harga Jual (Rp)"
                                type="number"
                                {...register("harga_jual", {
                                    valueAsNumber: true,
                                })}
                                error={!!errors.harga_jual}
                                helperText={errors.harga_jual?.message}
                                inputProps={{ step: 100, min: 0 }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Stok Minimum"
                                type="number"
                                {...register("stok_minimum", {
                                    valueAsNumber: true,
                                })}
                                error={!!errors.stok_minimum}
                                helperText={errors.stok_minimum?.message}
                                inputProps={{ step: 1, min: 0 }}
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

                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        {...register("is_active")}
                                        defaultChecked
                                    />
                                }
                                label={
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                    >
                                        Status Aktif
                                    </Typography>
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={<Switch {...register("is_generik")} />}
                                label={
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                    >
                                        Obat Generik
                                    </Typography>
                                }
                            />
                        </Grid>
                    </Grid>
                );
            default:
                return (
                    <Box sx={{ textAlign: "center", py: 4, color: "#a8a29e" }}>
                        <Settings sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                        <Typography variant="body2">
                            Form pengaturan untuk tabel ini belum tersedia.
                        </Typography>
                    </Box>
                );
        }
    }

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
                    Pengaturan Sistem
                </Typography>
                <Typography variant="body1" color="#78716c">
                    Kelola master data, hak akses pengguna, dan konfigurasi
                    integrasi.
                </Typography>
            </Box>

            {/* --- TAB UTAMA --- */}
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
                        value={activeTab}
                        onChange={(_, v) => {
                            setActiveTab(v);
                            const tabConfig = TABS.find((t) => t.id === v);
                            if (tabConfig) {
                                if (v === "master-medis")
                                    setActiveTable("tindakan");
                                else if (v === "farmasi")
                                    setActiveTable("obat");
                                else if (v === "laboratorium")
                                    setActiveTable("lab-jenis");
                                else setActiveTable(v.split("-")[0]);
                            } else {
                                setActiveTable("users");
                            }
                            setPage(0);
                            setSearchText("");
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
                        {TABS.map((tab) => (
                            <Tab
                                key={tab.id}
                                value={tab.id}
                                icon={tab.icon}
                                iconPosition="start"
                                label={tab.label}
                            />
                        ))}
                    </Tabs>
                </CardContent>
            </Card>

            {/* --- TAB SUB (Jika Ada) --- */}
            {renderSubTabs() && <Box sx={{ mb: 3 }}>{renderSubTabs()}</Box>}

            {/* --- KONTEN TABEL --- */}
            <Card
                sx={{
                    borderRadius: 4,
                    border: `1px solid ${CARD_BORDER}`,
                    boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)",
                    backgroundColor: "#fff",
                }}
            >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {renderTable()}
                </CardContent>
            </Card>

            {/* --- MODAL FORM --- */}
            <Modal
                open={dialogOpen}
                onClose={() => !isSubmitting && setDialogOpen(false)}
                title={
                    dialogMode === "create"
                        ? `Tambah ${getTableLabel()} Baru`
                        : `Edit Data ${getTableLabel()}`
                }
                size="md"
                disableBackdropClick={isSubmitting}
                disableEscapeKeyDown={isSubmitting}
            >
                <form onSubmit={handleSubmit(handleSubmitForm)}>
                    {renderDialogFields()}

                    {/* Tombol Aksi Form */}
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
                            onClick={() => setDialogOpen(false)}
                            variant="outlined"
                            startIcon={<Cancel />}
                            disabled={isSubmitting}
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
                            {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                        </Button>
                    </Box>
                </form>
            </Modal>

            {/* --- NOTIFIKASI SNACKBAR --- */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
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
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
