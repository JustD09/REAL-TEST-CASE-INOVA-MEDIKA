import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
    Box,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Typography,
    InputAdornment,
    IconButton,
    Grid,
    Paper,
    Divider,
    Stack,
    Avatar,
} from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    MedicalServices,
    Security,
    VerifiedUser,
    Shield,
    Sync,
    Speed,
    PersonOutline,
    LockOutlined,
    FavoriteBorder,
    Groups,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { motion } from "framer-motion";
import { MotionButton } from "../../components/motion/MotionWrapper";

const loginSchema = yup.object().shape({
    username: yup.string().required("Username wajib diisi"),
    password: yup
        .string()
        .required("Password wajib diisi")
        .min(6, "Password minimal 6 karakter"),
});

const highlights = [
    {
        icon: <Speed />,
        title: "Serba cepat",
        desc: "Antrean, lab, dan farmasi tersinkron otomatis.",
    },
    {
        icon: <Shield />,
        title: "Aman & terpercaya",
        desc: "Enkripsi AES-256 dengan audit trail lengkap.",
    },
    {
        icon: <Sync />,
        title: "Terhubung",
        desc: "SatuSehat, BPJS, dan rekam medis elektronik.",
    },
];

const demoAccounts = [
    {
        role: "Administrator",
        user: "admin",
        pass: "admin123",
        color: "#0f766e",
    },
    { role: "Dokter", user: "dr_umum", pass: "dokter123", color: "#0d9488" },
    {
        role: "Pendaftaran",
        user: "pendaftaran1",
        pass: "staff123",
        color: "#14b8a6",
    },
    { role: "Farmasi", user: "farmasi1", pass: "staff123", color: "#2dd4bf" },
    { role: "Laboratorium", user: "lab1", pass: "staff123", color: "#5eead4" },
    { role: "Kasir", user: "kasir1", pass: "staff123", color: "#99f6e4" },
];

export default function LoginPage() {
    const { login, isLoading: authLoading } = useAuth();
    const { showError } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    const fillDemo = (user, pass) => {
        setValue("username", user, { shouldValidate: true });
        setValue("password", pass, { shouldValidate: true });
    };

    const onSubmit = async (data, event) => {
        event?.preventDefault();
        setSubmitError("");
        const result = await login(data.username, data.password);
        if (!result.success) {
            setSubmitError(result.error);
            showError(result.error);
        } else {
            const from = location.state?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                backgroundColor: "#fafaf7",
            }}
        >
            {/* ---------- Brand panel ---------- */}
            <Box
                sx={{
                    display: { xs: "none", md: "flex" },
                    width: { md: "46%", lg: "48%" },
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: { md: 5, lg: 7 },
                    background:
                        "linear-gradient(155deg, #ecfdf5 0%, #ccfbf1 45%, #99f6e4 100%)",
                    color: "#134e4a",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* organic blobs */}
                <Box
                    sx={{
                        position: "absolute",
                        top: -140,
                        right: -140,
                        width: 380,
                        height: 380,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(45,212,191,0.35) 0%, transparent 70%)",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: -120,
                        left: -120,
                        width: 340,
                        height: 340,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        top: "45%",
                        left: "60%",
                        width: 180,
                        height: 180,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)",
                    }}
                />

                {/* Logo */}
                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ position: "relative", zIndex: 1 }}
                >
                    <Box
                        sx={{
                            p: 1.25,
                            borderRadius: 3,
                            background:
                                "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
                            display: "flex",
                            boxShadow: "0 12px 28px rgba(13,148,136,0.35)",
                        }}
                    >
                        <MedicalServices
                            sx={{ fontSize: 28, color: "white" }}
                        />
                    </Box>
                    <Box>
                        <Typography
                            variant="h5"
                            fontWeight={800}
                            sx={{
                                lineHeight: 1.1,
                                letterSpacing: "-0.02em",
                                color: "#134e4a",
                            }}
                        >
                            SIMRS
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: "#0f766e",
                                textTransform: "uppercase",
                                letterSpacing: "0.14em",
                                fontWeight: 600,
                                fontSize: "0.62rem",
                            }}
                        >
                            Sistem Informasi Rumah Sakit
                        </Typography>
                    </Box>
                </Stack>

                {/* Hero copy */}
                <Box
                    sx={{ position: "relative", zIndex: 1, my: "auto", py: 4 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.1,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <Typography
                            variant="h3"
                            fontWeight={700}
                            sx={{
                                mb: 1.5,
                                letterSpacing: "-0.02em",
                                lineHeight: 1.2,
                                color: "#134e4a",
                                maxWidth: 460,
                            }}
                        >
                            Melayani dengan{" "}
                            <Box
                                component="span"
                                sx={{ color: "#0d9488", fontStyle: "italic" }}
                            >
                                lebih hangat
                            </Box>
                            ,
                            <br /> bekerja dengan lebih mudah.
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: "#115e59",
                                mb: 4,
                                maxWidth: 440,
                                lineHeight: 1.7,
                                opacity: 0.85,
                            }}
                        >
                            Satu platform yang menyatukan seluruh tim rumah
                            sakit — dari pendaftaran hingga farmasi — agar
                            setiap pasien terlayani dengan cepat dan penuh
                            perhatian.
                        </Typography>
                    </motion.div>

                    <Stack spacing={2.25}>
                        {highlights.map((h, i) => (
                            <motion.div
                                key={h.title}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: 0.2 + i * 0.08,
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="flex-start"
                                >
                                    <Box
                                        sx={{
                                            p: 1.1,
                                            borderRadius: 2.5,
                                            bgcolor: "rgba(255,255,255,0.7)",
                                            border: "1px solid rgba(13,148,136,0.15)",
                                            display: "flex",
                                            color: "#0f766e",
                                            boxShadow:
                                                "0 4px 12px rgba(13,148,136,0.08)",
                                        }}
                                    >
                                        {h.icon}
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={700}
                                            sx={{ color: "#134e4a" }}
                                        >
                                            {h.title}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#115e59",
                                                opacity: 0.75,
                                            }}
                                        >
                                            {h.desc}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </motion.div>
                        ))}
                    </Stack>
                </Box>

                {/* Footer trust */}
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                        position: "relative",
                        zIndex: 1,
                        pt: 3,
                        borderTop: "1px solid rgba(13,148,136,0.2)",
                    }}
                >
                    <FavoriteBorder sx={{ fontSize: 16, color: "#0d9488" }} />
                    <Typography
                        variant="caption"
                        sx={{ color: "#115e59", opacity: 0.7 }}
                    >
                        Dibuat dengan perhatian untuk tenaga kesehatan Indonesia
                        · © {new Date().getFullYear()}
                    </Typography>
                </Stack>
            </Box>

            {/* ---------- Form panel ---------- */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: { xs: 2, sm: 4 },
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ width: "100%", maxWidth: 440 }}
                >
                    {/* Mobile brand */}
                    <Stack
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ display: { md: "none" }, mb: 3 }}
                    >
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: 2.5,
                                background:
                                    "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
                                display: "flex",
                                boxShadow: "0 6px 16px rgba(13,148,136,0.3)",
                            }}
                        >
                            <MedicalServices
                                sx={{ fontSize: 22, color: "white" }}
                            />
                        </Box>
                        <Typography
                            variant="h6"
                            fontWeight={800}
                            sx={{ color: "#134e4a", letterSpacing: "-0.02em" }}
                        >
                            SIMRS
                        </Typography>
                    </Stack>

                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, sm: 4.5 },
                            borderRadius: 4,
                            border: "1px solid #e7e5e4",
                            backgroundColor: "#ffffff",
                            boxShadow:
                                "0 20px 60px -20px rgba(15,118,110,0.12)",
                        }}
                    >
                        {/* Greeting */}
                        <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            sx={{ mb: 3 }}
                        >
                            <Avatar
                                sx={{
                                    width: 48,
                                    height: 48,
                                    background:
                                        "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                                    boxShadow:
                                        "0 8px 20px rgba(13,148,136,0.3)",
                                }}
                            >
                                <Groups />
                            </Avatar>
                            <Box>
                                <Typography
                                    variant="h5"
                                    fontWeight={700}
                                    sx={{
                                        color: "#1c1917",
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    Selamat datang 👋
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Masuk untuk melanjutkan kerja hari ini.
                                </Typography>
                            </Box>
                        </Stack>

                        {submitError && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 2.5,
                                    borderRadius: 2.5,
                                    "& .MuiAlert-message": {
                                        fontSize: "0.875rem",
                                    },
                                }}
                                onClose={() => setSubmitError("")}
                            >
                                {submitError}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    placeholder="Masukkan username Anda"
                                    {...register("username")}
                                    error={!!errors.username}
                                    helperText={errors.username?.message}
                                    autoComplete="username"
                                    autoFocus
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutline
                                                    fontSize="small"
                                                    sx={{
                                                        color: "text.secondary",
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2.5,
                                        },
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    label="Password"
                                    placeholder="Masukkan password"
                                    type={showPassword ? "text" : "password"}
                                    {...register("password")}
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    autoComplete="current-password"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlined
                                                    fontSize="small"
                                                    sx={{
                                                        color: "text.secondary",
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword,
                                                        )
                                                    }
                                                    edge="end"
                                                    size="small"
                                                    aria-label={
                                                        showPassword
                                                            ? "Sembunyikan password"
                                                            : "Tampilkan password"
                                                    }
                                                >
                                                    {showPassword ? (
                                                        <VisibilityOff fontSize="small" />
                                                    ) : (
                                                        <Visibility fontSize="small" />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2.5,
                                        },
                                    }}
                                />
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        disabled={authLoading}
                                        startIcon={
                                            authLoading ? (
                                                <CircularProgress
                                                    size={18}
                                                    color="inherit"
                                                />
                                            ) : null
                                        }
                                        disableElevation
                                        sx={{
                                            py: 1.3,
                                            borderRadius: 2.5,
                                            fontWeight: 600,
                                            fontSize: "0.95rem",
                                            textTransform: "none",
                                            color: "#fff",
                                            background:
                                                "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
                                            boxShadow:
                                                "0 10px 24px -8px rgba(13,148,136,0.5)",
                                            "&:hover": {
                                                background:
                                                    "linear-gradient(135deg, #115e59 0%, #0d9488 100%)",
                                                boxShadow:
                                                    "0 14px 28px -8px rgba(13,148,136,0.6)",
                                            },
                                            "&.Mui-disabled": {
                                                background:
                                                    "linear-gradient(135deg, #99f6e4 0%, #5eead4 100%)",
                                                color: "rgba(255,255,255,0.85)",
                                            },
                                        }}
                                    >
                                        {authLoading
                                            ? "Sebentar ya..."
                                            : "Masuk"}
                                    </Button>
                                </motion.div>
                            </Stack>
                        </form>

                        <Divider
                            sx={{
                                my: 3,
                                "&::before, &::after": {
                                    borderColor: "#f5f5f4",
                                },
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "text.disabled",
                                    px: 1,
                                    fontSize: "0.7rem",
                                    fontWeight: 500,
                                }}
                            >
                                atau coba akun demo
                            </Typography>
                        </Divider>

                        <Grid container spacing={1}>
                            {demoAccounts.map((account, i) => (
                                <Grid item xs={6} sm={4} key={account.user}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: 0.3 + i * 0.04,
                                        }}
                                    >
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                fillDemo(
                                                    account.user,
                                                    account.pass,
                                                )
                                            }
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            sx={{
                                                py: 1,
                                                borderRadius: 2.5,
                                                textTransform: "none",
                                                flexDirection: "column",
                                                alignItems: "flex-start",
                                                gap: 0,
                                                borderColor: "#e7e5e4",
                                                color: "#1c1917",
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    borderColor: account.color,
                                                    backgroundColor: `${account.color}0d`,
                                                    transform:
                                                        "translateY(-1px)",
                                                },
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                                alignItems="center"
                                                sx={{ width: "100%" }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: "50%",
                                                        bgcolor: account.color,
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={600}
                                                    sx={{ lineHeight: 1.2 }}
                                                >
                                                    {account.role}
                                                </Typography>
                                            </Stack>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    fontSize: "0.65rem",
                                                    fontFamily: "monospace",
                                                    ml: 1.5,
                                                }}
                                            >
                                                {account.user}
                                            </Typography>
                                        </Button>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>

                        <Stack
                            direction="row"
                            spacing={1.5}
                            justifyContent="center"
                            flexWrap="wrap"
                            sx={{ mt: 3, rowGap: 1 }}
                        >
                            {[
                                {
                                    icon: <Security sx={{ fontSize: 14 }} />,
                                    text: "AES-256",
                                },
                                {
                                    icon: (
                                        <VerifiedUser sx={{ fontSize: 14 }} />
                                    ),
                                    text: "Kemenkes RI",
                                },
                                {
                                    icon: <Sync sx={{ fontSize: 14 }} />,
                                    text: "Real-time",
                                },
                                {
                                    icon: <Shield sx={{ fontSize: 14 }} />,
                                    text: "Audit Log",
                                },
                            ].map((badge) => (
                                <Stack
                                    key={badge.text}
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    sx={{
                                        fontSize: "0.7rem",
                                        color: "text.secondary",
                                        fontWeight: 500,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            color: "#0d9488",
                                            display: "flex",
                                        }}
                                    >
                                        {badge.icon}
                                    </Box>
                                    {badge.text}
                                </Stack>
                            ))}
                        </Stack>
                    </Paper>

                    <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ display: "block", textAlign: "center", mt: 2.5 }}
                    >
                        SIMRS v1.0 · Dibuat dengan ❤️ untuk layanan kesehatan
                        Indonesia
                    </Typography>
                </motion.div>
            </Box>
        </Box>
    );
}
