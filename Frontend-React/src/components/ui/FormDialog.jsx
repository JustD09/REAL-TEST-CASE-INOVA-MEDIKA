import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Typography, Alert } from '@mui/material';
import Modal from './Modal';

export default function FormDialog({
  open,
  onClose,
  title,
  schema,
  defaultValues = {},
  onSubmit,
  submitLabel = 'Simpan',
  submitLoading = false,
  children,
  size = 'md',
  footer,
  sx,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setValue,
    watch,
    reset,
    trigger,
    control,
  } = useForm({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
    mode: 'onChange',
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handled by caller
      throw error;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      disableBackdropClick={isSubmitting || submitLoading}
      disableEscapeKeyDown={isSubmitting || submitLoading}
      footer={
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting || submitLoading} variant="outlined">
            Batal
          </Button>
          {footer || (
            <Button
              type="submit"
              form="form-dialog"
              variant="contained"
              disabled={submitLoading || isSubmitting || !isValid}
              startIcon={submitLoading || isSubmitting ? <span className="loading-spinner-small" /> : null}
            >
              {submitLoading ? 'Memproses...' : submitLabel}
            </Button>
          )}
        </Box>
      }
      sx={sx}
    >
      <form id="form-dialog" onSubmit={handleSubmit(handleFormSubmit)}>
        {children({ register, errors, setValue, watch, trigger, control, reset, isSubmitting, isValid })}
      </form>
    </Modal>
  );
}