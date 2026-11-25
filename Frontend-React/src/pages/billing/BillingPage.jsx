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
    Stack,
} from "@mui/material";
import {
    Search,
    AttachMoney,
    Visibility,
    MoneyOff,
    Receipt,
    CheckCircle,
    Cancel,
    Payments,
} from "@mui/icons-material";
import { useNodeQuery, useNodeMutation, useYiiQuery } from "../../hooks/useApi";
import { formatDate, formatDateTime, formatCurrency } from "../../utils/format";
import StatusChip from "../../components/ui/StatusChip";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { useNotification } from "../../contexts/NotificationContext";
import {
    DUMMY_KUNJUNGAN,
    DUMMY_BILLING,
    withDummy,
} from "../../data/dummyData";

// Palet Warna UI
const BRAND_COLOR = "#0d9488";
const SOFT_BG = "#fafaf9";
const CARD_BORDER = "#f5f5f4";

// --- HELPER FORMAT RUPIAH ---
const formatRupiah = (value) => {
    if (!value) return "";
    const numberString = value.toString().replace(/[^,\d]/g, "");
    if (!numberString) return "";
    return new Intl.NumberFormat("id-ID").format(numberString);
};

const parseRupiah = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/\./g, ""), 10) || 0;
};

const paymentSchema = yup.object().shape({
    billing_id: yup.string().required("Billing wajib dipilih"),
    amount: yup.number().required("Jumlah wajib diisi").positive("Harus > 0"),
    method: yup
        .string()
        .required("Metode pembayaran wajib dipilih")
        .oneOf(["cash", "card", "transfer", "bpjs", "e-wallet"]),
    reference: yup.string().optional(),
    idempotency_key: yup.string().optional(),
});

const refundSchema = yup.object().shape({
    payment_id: yup.string().required("Pembayaran wajib dipilih"),
    amount: yup.number().required("Jumlah wajib diisi").positive("Harus > 0"),
    reason: yup.string().required("Alasan wajib diisi"),
    idempotency_key: yup.string().optional(),
});

const PAYMENT_METHODS = [
    { value: "cash", label: "Tunai (Cash)" },
    { value: "card", label: "Kartu Debit/Kredit" },
    { value: "transfer", label: "Transfer Bank" },
    { value: "bpjs", label: "BPJS Kesehatan" },
    { value: "e-wallet", label: "E-Wallet (OVO/Gopay)" },
];

export default function BillingPage() {
    const { showSuccess, showError } = useNotification();
    const [searchText, setSearchText] = useState("");
    const [selectedKunjungan, setSelectedKunjungan] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const [billingDetailOpen, setBillingDetailOpen] = useState(false);
    const [selectedBilling, setSelectedBilling] = useState(null);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [refundOpen, setRefundOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [generateOpen, setGenerateOpen] = useState(false);

    // Queries
    const { data: kunjunganData } = useYiiQuery(
        ["kunjungan", "list"],
        "/kunjungan",
        { perPage: 100, status: "waiting,in_progress" },
    );
    const { data: billingData, isLoading: loadingBilling } = useNodeQuery(
        ["billing", "list", selectedKunjungan?.id],
        "/api/billing",
        { kunjungan_id: selectedKunjungan?.id, limit: 100 },
        { enabled: !!selectedKunjungan },
    );
    const kunjunganRows = withDummy(kunjunganData?.data, DUMMY_KUNJUNGAN);
    const billingRows = withDummy(billingData?.data, DUMMY_BILLING);

    // Mutations
    const generateBilling = useNodeMutation("/api/billing", "post", {
        invalidateKeys: [["billing", "list", selectedKunjungan?.id]],
        onSuccess: () => showSuccess("Billing berhasil dibuat"),
        onError: (err) => showError(err.message),
    });

    const processPayment = useNodeMutation("/api/billing/payment", "post", {
        invalidateKeys: [["billing", "list", selectedKunjungan?.id]],
        onSuccess: () => showSuccess("Pembayaran berhasil diproses"),
        onError: (err) => showError(err.message),
    });

    const processRefund = useNodeMutation("/api/billing/refund", "post", {
        invalidateKeys: [["billing", "list", selectedKunjungan?.id]],
        onSuccess: () => showSuccess("Refund berhasil diproses"),
        onError: (err) => showError(err.message),
    });

    // Forms
    const paymentForm = useForm({
        resolver: yupResolver(paymentSchema),
        mode: "onChange",
    });
    const {
        handleSubmit,
        control: paymentControl,
        setValue,
        formState: { errors, isSubmitting },
        reset,
    } = paymentForm;

    const refundForm = useForm({
        resolver: yupResolver(refundSchema),
        mode: "onChange",
    });
    const {
        handleSubmit: handleRefundSubmit,
        control: refundControl,
        formState: { errors: errorsR, isSubmitting: isSubmittingR },
        reset: resetR,
    } = refundForm;

    const handleGenerateBilling = async () => {
        if (!selectedKunjungan) {
            showError("Pilih kunjungan terlebih dahulu");
            return;
        }
        await generateBilling.mutateAsync({
            kunjunganId: selectedKunjungan.id,
        });
        setGenerateOpen(false);
    };

    const onSubmitPayment = async (data) => {
        const payload = {
            ...data,
            idempotency_key:
                data.idempotency_key ||
                `pay-${data.billing_id}-${data.amount}-${Date.now()}`,
        };
        await processPayment.mutateAsync(payload);
        setPaymentOpen(false);
        reset();
    };

    const onSubmitRefund = async (data) => {
        const payload = {
            ...data,
            idempotency_key:
                data.idempotency_key ||
                `refund-${data.payment_id}-${data.amount}-${Date.now()}`,
        };
        await processRefund.mutateAsync(payload);
        setRefundOpen(false);
        resetR();
    };

    const openGenerate = () => {
        if (!selectedKunjungan) {
            showError("Pilih kunjungan terlebih dahulu");
            return;
        }
        setGenerateOpen(true);
    };

    const openPayment = (billing) => {
        setSelectedBilling(billing);
        const due = parseFloat(billing.total) - parseFloat(billing.paid_amount);
        reset({ billing_id: billing.id, amount: due, method: "cash" });
        setPaymentOpen(true);
    };

    const openRefund = (payment) => {
        if (!payment) return showError("Data pembayaran tidak ditemukan");
        setSelectedPayment(payment);
        resetR({
            payment_id: payment.id,
            amount: parseFloat(payment.amount),
            reason: "Refund atas permintaan pasien",
        });
        setRefundOpen(true);
    };

    const openDetail = (billing) => {
        setSelectedBilling(billing);
        setBillingDetailOpen(true);
    };

    const filteredBillingRows =
        billingRows?.filter(
            (b) =>
                !searchText ||
                b.no_billing?.toLowerCase().includes(searchText.toLowerCase()),
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
                    Billing & Pembayaran
                </Typography>
                <Typography variant="body1" color="#78716c">
                    Kelola tagihan pasien, proses pembayaran, dan refund.
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
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Cari No. Billing..."
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
                        <Grid item xs={12} md={4}>
                            <Button
                                variant="contained"
                                startIcon={<Receipt />}
                                onClick={openGenerate}
                                disabled={!selectedKunjungan || loadingBilling}
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
                                Generate Tagihan Baru
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* --- TABEL BILLING --- */}
            {loadingBilling ? (
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
                        type="billing"
                        title="Belum Ada Pasien Terpilih"
                        description="Silakan pilih kunjungan pasien pada menu dropdown di atas untuk mulai mengelola tagihan."
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
                                            "No. Billing",
                                            "Info Pasien",
                                            "Total Tagihan",
                                            "Sisa Tagihan",
                                            "Status",
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
                                    {filteredBillingRows
                                        .slice(
                                            page * rowsPerPage,
                                            page * rowsPerPage + rowsPerPage,
                                        )
                                        .map((billing) => {
                                            const total = parseFloat(
                                                billing.total,
                                            );
                                            const paid = parseFloat(
                                                billing.paid_amount,
                                            );
                                            const due = total - paid;
                                            const isPaid = due <= 0;

                                            return (
                                                <TableRow
                                                    key={billing.id}
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
                                                            fontFamily:
                                                                "monospace",
                                                            fontWeight: 600,
                                                            color: "#57534e",
                                                        }}
                                                    >
                                                        {billing.no_billing}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            color="#1c1917"
                                                        >
                                                            {billing.pasien_nama ||
                                                                billing.no_rm}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="#78716c"
                                                        >
                                                            ID:{" "}
                                                            {
                                                                billing.kunjungan_id
                                                            }
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: "#1c1917",
                                                        }}
                                                    >
                                                        {formatCurrency(total)}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={700}
                                                            color={
                                                                isPaid
                                                                    ? "#10b981"
                                                                    : "#ef4444"
                                                            }
                                                        >
                                                            {formatCurrency(
                                                                due,
                                                            )}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <StatusChip
                                                            status={
                                                                billing.status
                                                            }
                                                            variant="filled"
                                                            size="small"
                                                        />
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            justifyContent="flex-end"
                                                        >
                                                            <Tooltip title="Lihat Rincian Tagihan">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        openDetail(
                                                                            billing,
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

                                                            {!isPaid &&
                                                                billing.status !==
                                                                    "cancelled" && (
                                                                    <Tooltip title="Proses Pembayaran">
                                                                        <Button
                                                                            variant="contained"
                                                                            size="small"
                                                                            startIcon={
                                                                                <Payments />
                                                                            }
                                                                            onClick={() =>
                                                                                openPayment(
                                                                                    billing,
                                                                                )
                                                                            }
                                                                            sx={{
                                                                                borderRadius: 2,
                                                                                textTransform:
                                                                                    "none",
                                                                                backgroundColor:
                                                                                    "#10b981",
                                                                                "&:hover":
                                                                                    {
                                                                                        backgroundColor:
                                                                                            "#059669",
                                                                                    },
                                                                                px: 2,
                                                                            }}
                                                                        >
                                                                            Bayar
                                                                        </Button>
                                                                    </Tooltip>
                                                                )}

                                                            {isPaid && (
                                                                <Tooltip title="Proses Refund">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() =>
                                                                            openRefund(
                                                                                billing
                                                                                    .payments?.[0],
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !billing
                                                                                .payments
                                                                                ?.length
                                                                        }
                                                                        sx={{
                                                                            color: "#f59e0b",
                                                                            backgroundColor:
                                                                                "#fffbeb",
                                                                        }}
                                                                    >
                                                                        <MoneyOff fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    {filteredBillingRows.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                align="center"
                                                sx={{ py: 6 }}
                                            >
                                                <EmptyState
                                                    type="billing"
                                                    title="Belum Ada Tagihan"
                                                    description="Belum ada tagihan yang dibuat untuk kunjungan ini."
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
                            count={filteredBillingRows.length}
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

            {/* --- MODAL GENERATE BILLING --- */}
            <Modal
                open={generateOpen}
                onClose={() => setGenerateOpen(false)}
                title="Generate Tagihan Baru"
                size="sm"
            >
                <Box sx={{ textAlign: "center", py: 2 }}>
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: "50%",
                            backgroundColor: "#f0fdfa",
                            color: BRAND_COLOR,
                            mx: "auto",
                            mb: 2,
                            width: 64,
                            height: 64,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Receipt sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                        Buat tagihan untuk kunjungan ini?
                    </Typography>
                    <Typography variant="body2" color="#78716c" sx={{ mb: 3 }}>
                        Sistem akan menghitung otomatis biaya pendaftaran,
                        tindakan medis, laboratorium, dan obat-obatan.
                    </Typography>
                    <Box
                        sx={{
                            p: 2,
                            backgroundColor: SOFT_BG,
                            borderRadius: 2,
                            mb: 4,
                            textAlign: "left",
                        }}
                    >
                        <Typography variant="caption" color="#78716c">
                            Pasien:
                        </Typography>
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            color="#1c1917"
                        >
                            {selectedKunjungan?.pasien_nama}
                        </Typography>
                        <Typography variant="caption" color="#78716c">
                            No. Kunjungan: {selectedKunjungan?.no_kunjungan}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            onClick={() => setGenerateOpen(false)}
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
                            onClick={handleGenerateBilling}
                            variant="contained"
                            startIcon={<AttachMoney />}
                            sx={{
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 600,
                                backgroundColor: BRAND_COLOR,
                                "&:hover": { backgroundColor: "#0f766e" },
                            }}
                        >
                            Ya, Generate
                        </Button>
                    </Stack>
                </Box>
            </Modal>

            {/* --- MODAL DETAIL BILLING (INVOICE STYLE) --- */}
            <Modal
                open={billingDetailOpen}
                onClose={() => setBillingDetailOpen(false)}
                title={`Invoice: ${selectedBilling?.no_billing}`}
                size="md"
            >
                <Box>
                    {/* Header Info */}
                    <Box
                        sx={{
                            mb: 3,
                            p: 2.5,
                            backgroundColor: "#f0fdfa",
                            borderRadius: 3,
                            border: "1px solid #ccfbf1",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Box>
                            <Typography
                                variant="caption"
                                color="#0f766e"
                                fontWeight={600}
                            >
                                PASIEN
                            </Typography>
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="#134e4a"
                            >
                                {selectedBilling?.pasien_nama}
                            </Typography>
                            <Typography variant="body2" color="#0f766e">
                                RM: {selectedBilling?.no_rm || "-"}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography
                                variant="caption"
                                color="#0f766e"
                                fontWeight={600}
                            >
                                STATUS
                            </Typography>
                            <Box>
                                <StatusChip
                                    status={selectedBilling?.status}
                                    variant="filled"
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Rincian Tagihan */}
                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="#44403c"
                        sx={{ mb: 1 }}
                    >
                        Rincian Tagihan
                    </Typography>
                    <Box
                        sx={{
                            borderRadius: 2,
                            border: `1px solid ${CARD_BORDER}`,
                            overflow: "hidden",
                            mb: 3,
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
                                        Item
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
                                {selectedBilling?.details?.map((detail) => (
                                    <TableRow key={detail.id}>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                            >
                                                {detail.description}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="#78716c"
                                            >
                                                {detail.quantity} x{" "}
                                                {formatCurrency(
                                                    parseFloat(
                                                        detail.unit_price,
                                                    ),
                                                )}
                                            </Typography>
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{ fontWeight: 600 }}
                                        >
                                            {formatCurrency(
                                                parseFloat(detail.amount),
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!selectedBilling?.details ||
                                    selectedBilling.details.length === 0) && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={2}
                                            align="center"
                                            sx={{ py: 2, color: "#a8a29e" }}
                                        >
                                            Tidak ada rincian
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* Riwayat Pembayaran */}
                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="#44403c"
                        sx={{ mb: 1 }}
                    >
                        Riwayat Pembayaran
                    </Typography>
                    <Box
                        sx={{
                            borderRadius: 2,
                            border: `1px solid ${CARD_BORDER}`,
                            overflow: "hidden",
                            mb: 3,
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
                                        Waktu
                                    </TableCell>
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {selectedBilling?.payments?.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell sx={{ color: "#57534e" }}>
                                            {formatDateTime(payment.paid_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={payment.method.toUpperCase()}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "0.65rem",
                                                    backgroundColor: SOFT_BG,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 600,
                                                color: "#10b981",
                                            }}
                                        >
                                            +{" "}
                                            {formatCurrency(
                                                parseFloat(payment.amount),
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!selectedBilling?.payments ||
                                    selectedBilling.payments.length === 0) && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            align="center"
                                            sx={{ py: 2, color: "#a8a29e" }}
                                        >
                                            Belum ada pembayaran
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* Invoice Summary */}
                    <Box
                        sx={{
                            p: 2.5,
                            backgroundColor: SOFT_BG,
                            borderRadius: 3,
                            border: `1px solid ${CARD_BORDER}`,
                        }}
                    >
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            sx={{ mb: 1 }}
                        >
                            <Typography variant="body2" color="#78716c">
                                Total Tagihan
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight={600}
                                color="#1c1917"
                            >
                                {formatCurrency(
                                    parseFloat(selectedBilling?.total || 0),
                                )}
                            </Typography>
                        </Stack>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            sx={{ mb: 1 }}
                        >
                            <Typography variant="body2" color="#78716c">
                                Total Terbayar
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight={600}
                                color="#10b981"
                            >
                                {formatCurrency(
                                    parseFloat(
                                        selectedBilling?.paid_amount || 0,
                                    ),
                                )}
                            </Typography>
                        </Stack>
                        <Divider sx={{ my: 1.5, borderColor: "#e7e5e4" }} />
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="#1c1917"
                            >
                                Sisa Tagihan
                            </Typography>
                            <Typography
                                variant="h5"
                                fontWeight={800}
                                color={
                                    parseFloat(selectedBilling?.total || 0) -
                                        parseFloat(
                                            selectedBilling?.paid_amount || 0,
                                        ) >
                                    0
                                        ? "#ef4444"
                                        : "#10b981"
                                }
                            >
                                {formatCurrency(
                                    parseFloat(selectedBilling?.total || 0) -
                                        parseFloat(
                                            selectedBilling?.paid_amount || 0,
                                        ),
                                )}
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
            </Modal>

            {/* --- MODAL PEMBAYARAN --- */}
            <Modal
                open={paymentOpen}
                onClose={() => setPaymentOpen(false)}
                title="Proses Pembayaran"
                size="sm"
            >
                <form onSubmit={handleSubmit(onSubmitPayment)}>
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: "#fef2f2",
                            borderRadius: 2,
                            border: "1px solid #fecaca",
                            textAlign: "center",
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="#b91c1c"
                            fontWeight={600}
                        >
                            SISA TAGIHAN
                        </Typography>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            color="#ef4444"
                        >
                            {formatCurrency(
                                parseFloat(selectedBilling?.total || 0) -
                                    parseFloat(
                                        selectedBilling?.paid_amount || 0,
                                    ),
                            )}
                        </Typography>
                    </Box>

                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <Controller
                                name="amount"
                                control={paymentControl}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Jumlah Uang Diterima"
                                        value={formatRupiah(field.value)}
                                        onChange={(e) => {
                                            const rawValue = parseRupiah(
                                                e.target.value,
                                            );
                                            field.onChange(rawValue);
                                        }}
                                        error={!!errors.amount}
                                        helperText={errors.amount?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    Rp
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: 2,
                                                fontSize: "1.25rem",
                                                fontWeight: 700,
                                            },
                                            "& input": { color: BRAND_COLOR },
                                        }}
                                    />
                                )}
                            />
                            {/* Shortcut Nominal */}
                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                <Chip
                                    label="Uang Pas"
                                    size="small"
                                    onClick={() => {
                                        const due =
                                            parseFloat(
                                                selectedBilling?.total || 0,
                                            ) -
                                            parseFloat(
                                                selectedBilling?.paid_amount ||
                                                    0,
                                            );
                                        setValue("amount", due);
                                    }}
                                    sx={{
                                        cursor: "pointer",
                                        backgroundColor: "#f0fdfa",
                                        color: BRAND_COLOR,
                                        fontWeight: 600,
                                    }}
                                />
                                <Chip
                                    label="50.000"
                                    size="small"
                                    onClick={() => setValue("amount", 50000)}
                                    sx={{
                                        cursor: "pointer",
                                        backgroundColor: SOFT_BG,
                                    }}
                                />
                                <Chip
                                    label="100.000"
                                    size="small"
                                    onClick={() => setValue("amount", 100000)}
                                    sx={{
                                        cursor: "pointer",
                                        backgroundColor: SOFT_BG,
                                    }}
                                />
                                <Chip
                                    label="200.000"
                                    size="small"
                                    onClick={() => setValue("amount", 200000)}
                                    sx={{
                                        cursor: "pointer",
                                        backgroundColor: SOFT_BG,
                                    }}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="method"
                                control={paymentControl}
                                render={({ field }) => (
                                    <FormControl
                                        fullWidth
                                        error={!!errors.method}
                                    >
                                        <InputLabel>
                                            Metode Pembayaran
                                        </InputLabel>
                                        <Select
                                            {...field}
                                            label="Metode Pembayaran"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {PAYMENT_METHODS.map((m) => (
                                                <MenuItem
                                                    key={m.value}
                                                    value={m.value}
                                                >
                                                    {m.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.method && (
                                            <FormHelperText>
                                                {errors.method.message}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="reference"
                                control={paymentControl}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="No. Referensi / Keterangan (Opsional)"
                                        placeholder="Contoh: No. Approval Kartu"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: 2,
                                            },
                                        }}
                                    />
                                )}
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
                            onClick={() => setPaymentOpen(false)}
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
                                    <CheckCircle />
                                )
                            }
                            sx={{
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 600,
                                backgroundColor: "#10b981",
                                "&:hover": { backgroundColor: "#059669" },
                            }}
                        >
                            {isSubmitting
                                ? "Memproses..."
                                : "Proses Pembayaran"}
                        </Button>
                    </Box>
                </form>
            </Modal>

            {/* --- MODAL REFUND --- */}
            <Modal
                open={refundOpen}
                onClose={() => setRefundOpen(false)}
                title="Proses Refund"
                size="sm"
            >
                <form onSubmit={handleRefundSubmit(onSubmitRefund)}>
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: "#fffbeb",
                            borderRadius: 2,
                            border: "1px solid #fde68a",
                            textAlign: "center",
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="#b45309"
                            fontWeight={600}
                        >
                            NOMINAL PEMBAYARAN AWAL
                        </Typography>
                        <Typography
                            variant="h5"
                            fontWeight={800}
                            color="#f59e0b"
                        >
                            {formatCurrency(
                                parseFloat(selectedPayment?.amount || 0),
                            )}
                        </Typography>
                    </Box>

                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <Controller
                                name="amount"
                                control={refundControl}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Jumlah Refund"
                                        value={formatRupiah(field.value)}
                                        onChange={(e) => {
                                            const rawValue = parseRupiah(
                                                e.target.value,
                                            );
                                            field.onChange(rawValue);
                                        }}
                                        error={!!errorsR.amount}
                                        helperText={errorsR.amount?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    Rp
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: 2,
                                                fontSize: "1.25rem",
                                                fontWeight: 700,
                                            },
                                            "& input": { color: "#f59e0b" },
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="reason"
                                control={refundControl}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Alasan Refund"
                                        multiline
                                        rows={2}
                                        error={!!errorsR.reason}
                                        helperText={errorsR.reason?.message}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: 2,
                                            },
                                        }}
                                    />
                                )}
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
                            onClick={() => setRefundOpen(false)}
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
                                    <MoneyOff />
                                )
                            }
                            sx={{
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 600,
                                backgroundColor: "#f59e0b",
                                "&:hover": { backgroundColor: "#d97706" },
                            }}
                        >
                            {isSubmittingR ? "Memproses..." : "Proses Refund"}
                        </Button>
                    </Box>
                </form>
            </Modal>
        </Box>
    );
}
