import { HttpInterceptorFn } from '@angular/common/http';

// With cookie-based auth the browser sends the session cookie automatically.
// We just need withCredentials: true on each request (set per-call or here globally).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api')) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};
