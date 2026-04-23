/**
 * Removes fields with undefined values before sending to Firestore.
 * Firestore rejects undefined — only null, strings, numbers, etc. are valid.
 * Applied recursively to nested objects.
 */
export function sanitizeForFirestore<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data } as Record<string, unknown>
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      delete sanitized[key]
    } else if (
      sanitized[key] !== null &&
      typeof sanitized[key] === "object" &&
      !Array.isArray(sanitized[key]) &&
      !(sanitized[key] instanceof Date) &&
      !((sanitized[key] as any)?.constructor?.name === "Timestamp") &&
      !((sanitized[key] as any)?.constructor?.name === "FieldValue")
    ) {
      sanitized[key] = sanitizeForFirestore(sanitized[key] as Record<string, unknown>)
    }
  })
  return sanitized as T
}
