import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] [${req.method} ${req.path}] ${message}`, err.stack || '');

  res.status(status).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
