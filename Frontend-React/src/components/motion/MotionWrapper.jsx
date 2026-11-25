'use client';

import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useMediaQuery, useTheme } from '@mui/material';
import { forwardRef } from 'react';

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
};

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

export const slideUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export const MotionCard = forwardRef(function MotionCard({ children, delay = 0, hover = true, className, ...props }, ref) {
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (reducedMotion) {
    return <motion.div ref={ref} className={className} {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      {...props}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      whileHover={hover && !isMobile ? { y: -4, boxShadow: '0 12px 32px rgba(13, 110, 253, 0.15), 0 4px 16px rgba(0,0,0,0.04)' } : undefined}
      style={{ willChange: 'transform, box-shadow', ...props.style }}
    >
      {children}
    </motion.div>
  );
});

export const MotionGrid = forwardRef(function MotionGrid({ children, className, ...props }, ref) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <motion.div ref={ref} className={className} {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      {...props}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
});

export const MotionItem = forwardRef(function MotionItem({ children, className, ...props }, ref) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <motion.div ref={ref} className={className} {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      {...props}
      variants={staggerItem}
    >
      {children}
    </motion.div>
  );
});

export const MotionTableRow = forwardRef(function MotionTableRow({ children, className, ...props }, ref) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <motion.tr ref={ref} className={className} {...props}>{children}</motion.tr>;
  }

  return (
    <motion.tr
      ref={ref}
      className={className}
      {...props}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.tr>
  );
});

export const AnimatePresenceWrapper = ({ children, mode = 'popLayout', initial = false }) => (
  <AnimatePresence mode={mode} initial={initial}>{children}</AnimatePresence>
);

const MUI_BUTTON_PROPS = ['fullWidth', 'startIcon', 'endIcon', 'variant', 'color', 'size', 'disabled', 'disableElevation', 'disableFocusRipple', 'disableRipple', 'endIcon', 'href', 'component'];

export const MotionButton = forwardRef(function MotionButton({ children, whileTap = { scale: 0.97 }, className, ...props }, ref) {
  const reducedMotion = useReducedMotion();
  
  // Filter out MUI-specific props that shouldn't be passed to DOM
  const { innerRef, ...muiProps } = props;
  const filteredProps = Object.fromEntries(
    Object.entries(muiProps).filter(([key]) => !MUI_BUTTON_PROPS.includes(key))
  );

  const finalRef = innerRef || ref;

  if (reducedMotion) {
    return <motion.button ref={finalRef} className={className} {...filteredProps}>{children}</motion.button>;
  }

  return (
    <motion.button
      ref={finalRef}
      className={className}
      {...filteredProps}
      whileHover={{ scale: 1.02 }}
      whileTap={whileTap}
      style={{ willChange: 'transform', ...filteredProps.style }}
    >
      {children}
    </motion.button>
  );
});

export const MotionIconButton = forwardRef(function MotionIconButton({ children, whileTap = { scale: 0.9 }, className, ...props }, ref) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <motion.div ref={ref} className={className} {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      {...props}
      whileHover={{ scale: 1.1, rotate: 3 }}
      whileTap={whileTap}
      style={{ willChange: 'transform', ...props.style }}
    >
      {children}
    </motion.div>
  );
});

export function ParallaxCard({ children, strength = 15, className, ...props }) {
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (reducedMotion || isMobile) {
    return <div className={className} {...props}>{children}</div>;
  }

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-strength, strength], [strength, -strength]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-strength, strength], [-strength, strength]), { stiffness: 300, damping: 30 });

  return (
    <motion.div
      {...props}
      className={className}
      style={{
        ...props.style,
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) / (rect.width / 2) * strength);
        y.set((e.clientY - rect.top - rect.height / 2) / (rect.height / 2) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) / (rect.width / 2) * strength);
        y.set((e.clientY - rect.top - rect.height / 2) / (rect.height / 2) * strength);
      }}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({ children, className, ...props }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={props.key || 'page'}
        className={className}
        {...props}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function LoadingDots({ color = '#0d6efd', size = 8 }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, opacity: 0.4 }} />
        ))}
      </div>
    );
  }

  return (
    <motion.div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </motion.div>
  );
}

export function SkeletonPulse({ className, ...props }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className} {...props} style={{ background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', backgroundSize: '200% 100%', ...props.style }} />;
  }

  return (
    <motion.div
      className={className}
      {...props}
      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      style={{
        background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
        backgroundSize: '200% 100%',
        ...props.style,
      }}
    />
  );
}