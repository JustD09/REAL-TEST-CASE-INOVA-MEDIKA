import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Drawer,
    List,
    ListItemIcon,
    ListItemText,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    useMediaQuery,
    useTheme,
    Tooltip,
    Badge,
    Button,
    Chip,
} from "@mui/material";
import {
    Menu as MenuIcon,
    Dashboard,
    PersonAdd,
    LocalHospital,
    MedicalServices,
    LocalPharmacy,
    Science,
    AttachMoney,
    Assessment,
    Settings,
    Logout,
    ChevronLeft,
    ChevronRight,
    Notifications,
    Person,
    Help,
    CheckCircle,
    Shield,
    Search,
    WbSunny,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import CommandPalette from "../components/ui/CommandPalette";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../contexts/NotificationContext";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useSwipeDrawer } from "../hooks/useTouchGestures";

const menuItems = [
    {
        path: "/dashboard",
        label: "Dashboard",
        icon: <Dashboard />,
        roles: ["all"],
    },
    {
        path: "/pendaftaran",
        label: "Pendaftaran",
        icon: <PersonAdd />,
        roles: ["admin", "petugas_pendaftaran", "dokter"],
    },
    {
        path: "/antrean",
        label: "Antrean",
        icon: <LocalHospital />,
        roles: ["admin", "petugas_pendaftaran"],
    },
    {
        path: "/pemeriksaan",
        label: "Pemeriksaan",
        icon: <MedicalServices />,
        roles: ["admin", "dokter"],
    },
    {
        path: "/laboratorium",
        label: "Laboratorium",
        icon: <Science />,
        roles: ["admin", "dokter", "petugas_laboratorium"],
    },
    {
        path: "/farmasi",
        label: "Farmasi",
        icon: <LocalPharmacy />,
        roles: ["admin", "petugas_farmasi", "dokter"],
    },
    {
        path: "/billing",
        label: "Billing",
        icon: <AttachMoney />,
        roles: ["admin", "kasir"],
    },
    {
        path: "/laporan",
        label: "Laporan",
        icon: <Assessment />,
        roles: [
            "admin",
            "dokter",
            "petugas_pendaftaran",
            "petugas_farmasi",
            "petugas_laboratorium",
            "kasir",
        ],
    },
    {
        path: "/pengaturan",
        label: "Pengaturan",
        icon: <Settings />,
        roles: ["admin"],
    },
];

const userMenuItems = [
    //   { label: "Profil Saya", icon: <Person />, path: "/profil", roles: ["all"] },
    {
        label: "Pengaturan",
        icon: <Settings />,
        path: "/pengaturan",
        roles: ["all"],
    },
    //   { label: "Pusat Bantuan", icon: <Help />, path: "/bantuan", roles: ["all"] },
    { divider: true },
    { label: "Keluar", icon: <Logout />, action: "logout", roles: ["all"] },
];

// Warna utama tema baru kita (Emerald/Teal)
const BRAND_GRADIENT = "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)";
const BRAND_COLOR = "#0d9488";
const BG_ACTIVE = "rgba(13, 148, 136, 0.08)";

export default function MainLayout() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Perbaikan Bug: anchorEl dipisah agar notifikasi & user menu tidak bentrok
    const [notifAnchorEl, setNotifAnchorEl] = useState(null);
    const [userAnchorEl, setUserAnchorEl] = useState(null);

    const [notifications, setNotifications] = useState([]);

    const { user, logout } = useAuth();
    const { notifications: notifContext } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    useKeyboardShortcuts();

    const { ref: swipeRef } = useSwipeDrawer({
        onOpen: () => setMobileOpen(true),
        onClose: () => setMobileOpen(false),
        isOpen: mobileOpen,
        threshold: 80,
        edgeWidth: 30,
    });

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleSidebarToggle = () => setSidebarCollapsed(!sidebarCollapsed);

    const handleNotifOpen = (event) => setNotifAnchorEl(event.currentTarget);
    const handleNotifClose = () => setNotifAnchorEl(null);

    const handleUserMenuOpen = (event) => setUserAnchorEl(event.currentTarget);
    const handleUserMenuClose = () => setUserAnchorEl(null);

    const handleMenuClick = (item) => {
        handleUserMenuClose();
        if (item.action === "logout") {
            logout();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const handleNotifClick = (notif) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        if (notif.path) navigate(notif.path);
    };

    const userRoles = user?.roles || [];

    const filteredMenuItems = menuItems.filter(
        (item) =>
            item.roles.includes("all") ||
            item.roles.some((r) => userRoles.includes(r)),
    );

    const filteredUserMenuItems = userMenuItems.filter(
        (item) =>
            item.roles &&
            (item.roles.includes("all") ||
                item.roles.some((r) => userRoles.includes(r))),
    );

    const currentDrawerWidth = sidebarCollapsed ? 80 : 260;

    useEffect(() => {
        if (notifContext?.length > 0) {
            setNotifications(notifContext.slice(0, 10));
        }
    }, [notifContext]);

    useEffect(() => {
        if (isMobile && mobileOpen) {
            setMobileOpen(false);
        }
    }, [location.pathname, isMobile]);

    const drawerContent = (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                backgroundColor: "#ffffff",
            }}
        >
            {/* Brand Header */}
            <Box
                sx={{
                    p: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: sidebarCollapsed
                        ? "center"
                        : "space-between",
                    minHeight: 80,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        minWidth: 0,
                    }}
                >
                    <Box
                        sx={{
                            p: 1,
                            borderRadius: 3,
                            background: BRAND_GRADIENT,
                            boxShadow:
                                "0 8px 16px -4px rgba(13, 148, 136, 0.4)",
                            flexShrink: 0,
                        }}
                    >
                        <MedicalServices
                            sx={{ fontSize: 24, color: "white" }}
                        />
                    </Box>
                    {!sidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Typography
                                variant="h6"
                                fontWeight={800}
                                color="text.primary"
                                sx={{
                                    lineHeight: 1.1,
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                SIMRS
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 500, fontSize: "0.7rem" }}
                            >
                                Rumah Sakit Sehat
                            </Typography>
                        </motion.div>
                    )}
                </Box>
                {!isMobile && !sidebarCollapsed && (
                    <IconButton
                        onClick={handleSidebarToggle}
                        size="small"
                        sx={{
                            color: "text.secondary",
                            backgroundColor: "#f5f5f4",
                            "&:hover": { backgroundColor: "#e7e5e4" },
                        }}
                    >
                        <ChevronLeft fontSize="small" />
                    </IconButton>
                )}
            </Box>

            {/* Navigation */}
            <Box
                component="nav"
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    px: 2,
                    pb: 2,
                }}
            >
                <List
                    disablePadding
                    sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                    {filteredMenuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <motion.div
                                key={item.path}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    delay: index * 0.03,
                                    duration: 0.2,
                                }}
                            >
                                <NavLink
                                    to={item.path}
                                    style={({ isActive: active }) => ({
                                        borderRadius: 12,
                                        padding: "10px 16px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: sidebarCollapsed ? 0 : 16,
                                        justifyContent: sidebarCollapsed
                                            ? "center"
                                            : "flex-start",
                                        color: active ? BRAND_COLOR : "#57534e",
                                        backgroundColor: active
                                            ? BG_ACTIVE
                                            : "transparent",
                                        fontWeight: active ? 600 : 500,
                                        textDecoration: "none",
                                        transition: "all 0.2s ease",
                                    })}
                                    className="nav-item"
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: sidebarCollapsed ? 0 : 24,
                                            color: isActive
                                                ? BRAND_COLOR
                                                : "#a8a29e",
                                            display: "flex",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    {!sidebarCollapsed && (
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                variant: "body2",
                                                fontWeight: isActive
                                                    ? 700
                                                    : 500,
                                                fontSize: "0.9rem",
                                            }}
                                        />
                                    )}
                                    {isActive && !sidebarCollapsed && (
                                        <Box
                                            sx={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                backgroundColor: BRAND_COLOR,
                                                ml: "auto",
                                            }}
                                        />
                                    )}
                                </NavLink>
                            </motion.div>
                        );
                    })}
                </List>
            </Box>

            {/* Expand Button (Collapsed state) */}
            {!isMobile && sidebarCollapsed && (
                <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                    <IconButton
                        onClick={handleSidebarToggle}
                        size="small"
                        sx={{
                            color: "text.secondary",
                            backgroundColor: "#f5f5f4",
                            "&:hover": { backgroundColor: "#e7e5e4" },
                        }}
                    >
                        <ChevronRight fontSize="small" />
                    </IconButton>
                </Box>
            )}

            {/* User Info at bottom */}
            {!sidebarCollapsed && (
                <Box
                    sx={{
                        p: 2,
                        m: 2,
                        borderRadius: 3,
                        backgroundColor: "#fafaf9",
                        border: "1px solid #f5f5f4",
                    }}
                >
                    <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                        <Avatar
                            sx={{
                                width: 40,
                                height: 40,
                                background: BRAND_GRADIENT,
                                fontWeight: 600,
                                fontSize: "1rem",
                            }}
                        >
                            {user?.fullName?.charAt(0) ||
                                user?.username?.charAt(0) ||
                                "U"}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#1c1917"
                                noWrap
                            >
                                {user?.fullName || user?.username}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: "capitalize",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        bgcolor: "#10b981",
                                        display: "inline-block",
                                    }}
                                />
                                {user?.roles?.[0]?.replace("_", " ") || "Staf"}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );

    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                backgroundColor: "#fafaf9",
            }}
            ref={swipeRef}
        >
            {/* CSS Global untuk Hover State Navigasi */}
            <style>
                {`
          .nav-item:hover {
            background-color: #f5f5f4 !important;
            color: ${BRAND_COLOR} !important;
          }
          .nav-item:hover .MuiListItemIcon-root {
            color: ${BRAND_COLOR} !important;
          }
        `}
            </style>

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: "block", md: "none" },
                    "& .MuiDrawer-paper": {
                        width: 280,
                        border: "none",
                        borderRadius: "0 24px 24px 0",
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Sidebar */}
            <Box
                component="nav"
                sx={{
                    width: { md: currentDrawerWidth },
                    flexShrink: { md: 0 },
                    display: { xs: "none", md: "block" },
                    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    borderRight: "1px solid #f5f5f4",
                    backgroundColor: "#ffffff",
                    position: "fixed",
                    height: "100vh",
                    zIndex: 1200,
                }}
            >
                {drawerContent}
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    width: {
                        md: `calc(100% - ${currentDrawerWidth}px)`,
                        xs: "100%",
                    },
                    ml: { md: `${currentDrawerWidth}px`, xs: 0 },
                    transition:
                        "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    minHeight: "100vh",
                }}
            >
                {/* Top App Bar - Gaya Melayang (Floating) */}
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        top: 0,
                        zIndex: 1100,
                        backgroundColor: "rgba(250, 250, 249, 0.85)",
                        backdropFilter: "blur(16px)",
                        borderBottom: "1px solid transparent",
                        boxShadow: "none",
                    }}
                >
                    <Toolbar
                        sx={{
                            px: { xs: 2, md: 4 },
                            minHeight: "72px !important",
                        }}
                    >
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{
                                mr: 2,
                                display: { xs: "flex", md: "none" },
                                borderRadius: 2,
                                backgroundColor: "#fff",
                                border: "1px solid #e7e5e4",
                            }}
                        >
                            <MenuIcon fontSize="small" />
                        </IconButton>

                        {/* Sapaan Hangat / Page Title */}
                        <Box
                            sx={{
                                flexGrow: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                color="#1c1917"
                                sx={{
                                    display: { xs: "none", sm: "block" },
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                {location.pathname === "/dashboard"
                                    ? `Halo, ${user?.fullName?.split(" ")[0] || "Staf"} 👋`
                                    : location.pathname
                                          .split("/")[1]
                                          .replace("-", " ")}
                            </Typography>
                        </Box>

                        {/* Right Side Actions */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: { xs: 1, sm: 2 },
                            }}
                        >
                            {/* Search Bar Palsu (Memancing Command Palette) */}
                            <Box
                                onClick={() =>
                                    document.dispatchEvent(
                                        new KeyboardEvent("keydown", {
                                            key: "k",
                                            ctrlKey: true,
                                        }),
                                    )
                                }
                                sx={{
                                    display: { xs: "none", lg: "flex" },
                                    alignItems: "center",
                                    gap: 1,
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: 10,
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e7e5e4",
                                    cursor: "pointer",
                                    width: 240,
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        borderColor: "#d6d3d1",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                                    },
                                }}
                            >
                                <Search
                                    sx={{ fontSize: 18, color: "#a8a29e" }}
                                />
                                <Typography
                                    variant="body2"
                                    color="#a8a29e"
                                    sx={{ flex: 1 }}
                                >
                                    Cari sesuatu...
                                </Typography>
                                <Chip
                                    label="⌘K"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: "0.65rem",
                                        fontWeight: 600,
                                        backgroundColor: "#f5f5f4",
                                        color: "#78716c",
                                    }}
                                />
                            </Box>

                            {/* Notifikasi */}
                            <Tooltip title="Notifikasi">
                                <IconButton
                                    onClick={handleNotifOpen}
                                    sx={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e7e5e4",
                                        borderRadius: 2.5,
                                        "&:hover": {
                                            backgroundColor: "#fafaf9",
                                        },
                                    }}
                                >
                                    <Notifications
                                        sx={{ fontSize: 20, color: "#57534e" }}
                                    />
                                    {notifications.length > 0 && (
                                        <Badge
                                            badgeContent={notifications.length}
                                            color="error"
                                            sx={{
                                                "& .MuiBadge-badge": {
                                                    minWidth: 16,
                                                    height: 16,
                                                    fontSize: "0.65rem",
                                                    border: "2px solid #fff",
                                                },
                                            }}
                                        />
                                    )}
                                </IconButton>
                            </Tooltip>

                            {/* User Menu Trigger */}
                            <Tooltip title="Profil Anda">
                                <IconButton
                                    onClick={handleUserMenuOpen}
                                    sx={{
                                        p: 0.5,
                                        border: "2px solid transparent",
                                        "&:hover": { borderColor: "#14b8a6" },
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            background: BRAND_GRADIENT,
                                            fontWeight: 600,
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        {user?.fullName?.charAt(0) ||
                                            user?.username?.charAt(0) ||
                                            "U"}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* --- DROPDOWN NOTIFIKASI --- */}
                <Menu
                    anchorEl={notifAnchorEl}
                    open={Boolean(notifAnchorEl)}
                    onClose={handleNotifClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                        sx: {
                            mt: 1.5,
                            minWidth: 360,
                            maxWidth: 400,
                            borderRadius: 4,
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                            border: "1px solid #f5f5f4",
                        },
                    }}
                >
                    <Box
                        sx={{
                            px: 2.5,
                            py: 2,
                            borderBottom: "1px solid #f5f5f4",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            color="#1c1917"
                        >
                            Notifikasi
                        </Typography>
                        {notifications.length > 0 && (
                            <Typography
                                variant="caption"
                                color={BRAND_COLOR}
                                sx={{ cursor: "pointer", fontWeight: 600 }}
                                onClick={() => setNotifications([])}
                            >
                                Tandai dibaca
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                        {notifications.length > 0 ? (
                            notifications.map((notif, i) => (
                                <MenuItem
                                    key={notif.id}
                                    onClick={() => {
                                        handleNotifClick(notif);
                                        handleNotifClose();
                                    }}
                                    sx={{
                                        py: 2,
                                        px: 2.5,
                                        whiteSpace: "normal",
                                        borderBottom:
                                            i < notifications.length - 1
                                                ? "1px solid #f5f5f4"
                                                : "none",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 2,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                flexShrink: 0,
                                                p: 1,
                                                borderRadius: 3,
                                                backgroundColor:
                                                    notif.severity === "error"
                                                        ? "#fef2f2"
                                                        : notif.severity ===
                                                            "warning"
                                                          ? "#fffbeb"
                                                          : "#f0fdfa",
                                                color:
                                                    notif.severity === "error"
                                                        ? "#ef4444"
                                                        : notif.severity ===
                                                            "warning"
                                                          ? "#f59e0b"
                                                          : BRAND_COLOR,
                                            }}
                                        >
                                            {notif.type === "queue" ? (
                                                <LocalHospital fontSize="small" />
                                            ) : notif.type === "lab" ? (
                                                <Science fontSize="small" />
                                            ) : (
                                                <AttachMoney fontSize="small" />
                                            )}
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                color="#1c1917"
                                                sx={{
                                                    mb: 0.5,
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {notif.message}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {new Date(
                                                    notif.timestamp,
                                                ).toLocaleTimeString("id-ID", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}{" "}
                                                WIB
                                            </Typography>
                                        </Box>
                                    </Box>
                                </MenuItem>
                            ))
                        ) : (
                            <Box sx={{ px: 2, py: 5, textAlign: "center" }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: "50%",
                                        backgroundColor: "#f0fdfa",
                                        color: BRAND_COLOR,
                                        mx: "auto",
                                        mb: 2,
                                        width: 56,
                                        height: 56,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CheckCircle fontSize="large" />
                                </Box>
                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    color="#1c1917"
                                    sx={{ mb: 0.5 }}
                                >
                                    Semua beres!
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Tidak ada notifikasi baru untuk saat ini.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Menu>

                {/* --- DROPDOWN USER MENU --- */}
                <Menu
                    anchorEl={userAnchorEl}
                    open={Boolean(userAnchorEl)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                        sx: {
                            mt: 1.5,
                            minWidth: 220,
                            borderRadius: 3,
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                            border: "1px solid #f5f5f4",
                        },
                    }}
                >
                    <Box
                        sx={{
                            px: 2.5,
                            py: 2,
                            borderBottom: "1px solid #f5f5f4",
                        }}
                    >
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            color="#1c1917"
                        >
                            {user?.fullName || user?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user?.email || "staf@rumahsakit.id"}
                        </Typography>
                    </Box>
                    <Box sx={{ p: 1 }}>
                        {filteredUserMenuItems.map((item, i) => (
                            <React.Fragment key={item.label}>
                                {item.divider ? (
                                    <Divider
                                        sx={{ my: 1, borderColor: "#f5f5f4" }}
                                    />
                                ) : (
                                    <MenuItem
                                        onClick={() => handleMenuClick(item)}
                                        sx={{
                                            py: 1,
                                            px: 1.5,
                                            borderRadius: 2,
                                            mb: 0.5,
                                            "&:hover": {
                                                backgroundColor:
                                                    item.action === "logout"
                                                        ? "#fef2f2"
                                                        : "#f5f5f4",
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 32,
                                                color:
                                                    item.action === "logout"
                                                        ? "#ef4444"
                                                        : "#78716c",
                                            }}
                                        >
                                            {React.cloneElement(item.icon, {
                                                fontSize: "small",
                                            })}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                variant: "body2",
                                                fontWeight: 500,
                                                color:
                                                    item.action === "logout"
                                                        ? "#ef4444"
                                                        : "#44403c",
                                            }}
                                        />
                                    </MenuItem>
                                )}
                            </React.Fragment>
                        ))}
                    </Box>
                </Menu>

                {/* Page Content */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: { xs: 2, sm: 3, md: 4 },
                        width: "100%",
                        maxWidth: 1600,
                        mx: "auto",
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{
                                duration: 0.3,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </Box>
            </Box>
            <CommandPalette />
        </Box>
    );
}
