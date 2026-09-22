import { Request, Response, NextFunction } from 'express';

/**
 * Redacts database connection strings, passwords, and sensitive system tokens
 */
function sanitizeErrorDetail(input: string): string {
  if (!input) return '';
  return input
    .replace(/postgres(ql)?:\/\/[^@\s]+@/gi, 'postgres://[REDACTED_CREDENTIALS]@')
    .replace(/(password|secret|token|apikey|api_key|bearer)\s*[:=]\s*['"]?[^'",\s]+['"]?/gi, '$1=[REDACTED]')
    .replace(/[A-Za-z0-9+/=]{32,}/g, '[REDACTED_HASH]');
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const isDev = process.env.NODE_ENV === 'development';
  const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;

  // Server-side logging: sanitize sensitive tokens and credentials
  const safeLogMessage = sanitizeErrorDetail(err.message || 'Unknown internal error');
  console.error(`[ERROR] [${req.method} ${req.path}] Status ${status}: ${safeLogMessage}`);

  // Client response: never expose internal stack traces, DB credentials or SQL errors in non-dev
  let clientMessage = err.message || 'Internal Server Error';

  if (status >= 500) {
    if (!isDev) {
      clientMessage = 'An internal server error occurred. Please contact the administrator.';
    } else {
      clientMessage = sanitizeErrorDetail(clientMessage);
    }
  }

  res.status(status).json({
    error: status === 400 ? 'BadRequest' : status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : status === 404 ? 'NotFound' : 'InternalServerError',
    message: clientMessage,
    ...(isDev && err.stack ? { stack: sanitizeErrorDetail(err.stack) } : {})
  });
}
