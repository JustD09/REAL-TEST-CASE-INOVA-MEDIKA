// Error Handler & Custom Error Class

export class AppError extends Error {
  constructor(code, message, statusCode = 500, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Mapping kode error PostgreSQL ke pesan Indonesia
 */
const PG_ERROR_MAP = {
  23505: { code: 'DATA_DUPLIKAT', message: 'Data sudah ada', statusCode: 409 },
  23503: { code: 'FK_VIOLATION', message: 'Data referensi tidak ditemukan', statusCode: 400 },
  23514: { code: 'CONSTRAINT_VIOLATION', message: 'Data melanggar aturan validasi', statusCode: 400 },
  '23P01': { code: 'EXCLUSION_VIOLATION', message: 'Konflik eksklusif', statusCode: 409 },
  40001: { code: 'SERIALIZATION_FAILURE', message: 'Transaksi gagal, coba lagi', statusCode: 409 },
  '40P01': { code: 'DEADLOCK_DETECTED', message: 'Deadlock terdeteksi, coba lagi', statusCode: 409 },
  '55P03': { code: 'LOCK_NOT_AVAILABLE', message: 'Kunci baris tidak tersedia, coba lagi', statusCode: 409 },
  57014: { code: 'QUERY_CANCELED', message: 'Query dibatalkan', statusCode: 504 },
  53300: { code: 'TOO_MANY_CONNECTIONS', message: 'Terlalu banyak koneksi database', statusCode: 503 },
  '08006': { code: 'CONNECTION_FAILURE', message: 'Gagal koneksi ke database', statusCode: 503 },
  '08001': { code: 'CONNECTION_REJECTED', message: 'Koneksi ditolak database', statusCode: 503 },
};

// Mapping error aplikasi ke response standar
export function handleError(error, req, res, _next) {
  console.error('[ERROR]', {
    code: error.code || 'INTERNAL_ERROR',
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // AppError (known operational errors)
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // PostgreSQL errors
  if (error.code && PG_ERROR_MAP[error.code]) {
    const mapped = PG_ERROR_MAP[error.code];
    return res.status(mapped.statusCode).json({
      success: false,
      error: {
        code: mapped.code,
        message: mapped.message,
        details: { pgCode: error.code, constraint: error.constraint, detail: error.detail },
      },
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_TIDAK_VALID', message: 'Token tidak valid' },
    });
  }
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_KADALUARSA', message: 'Token kadaluarsa' },
    });
  }

  // Redis connection errors
  if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
    return res.status(503).json({
      success: false,
      error: { code: 'REDIS_TIDAK_TERSEDIA', message: 'Layanan cache tidak tersedia' },
    });
  }

  // Default internal error
  return res.status(500).json({
    success: false,
    error: {
      code: 'KESALAHAN_SERVER',
      message: 'Terjadi kesalahan internal server',
      details: process.env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : {},
    },
  });
}

// Wrapper async untuk route handler (auto-catch errors)
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validasi request body
export function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
      throw new AppError('VALIDASI_GAGAL', 'Data tidak valid', 400, details);
    }
    next();
  };
}

export default {
  AppError, handleError, asyncHandler, validate,
};
