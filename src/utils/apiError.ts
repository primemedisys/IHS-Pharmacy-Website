/**
 * The backend error envelope is `{ error: { message, code, details } }`
 * (backend/src/middlewares/errorHandler.js). Reading `response.data.message`
 * always missed it, so every failure showed a generic "Failed to …" toast.
 * Falls back to the first field-level validation message, then `fallback`.
 */
interface ApiErrorBody {
  message?: string;
  error?: { message?: string; code?: string; details?: Record<string, string[]> };
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: ApiErrorBody } })?.response?.data;
  const error = data?.error;
  const firstDetail = error?.details ? Object.values(error.details)[0]?.[0] : undefined;
  if (error?.message && error.message !== "Validation failed") return error.message;
  return firstDetail || error?.message || data?.message || fallback;
}
