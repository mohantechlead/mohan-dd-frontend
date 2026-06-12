/** Turn Django Ninja / API error JSON into a user-readable string. */
export function formatApiErrorMessage(
  data: unknown,
  fallback = "Please check the form and try again.",
): string {
  if (data == null) return fallback;
  if (typeof data === "string" && data.trim()) return data.trim();

  if (typeof data !== "object") return fallback;
  const err = data as Record<string, unknown>;

  const detail = err.detail ?? err.message ?? err.error;
  if (typeof detail === "string" && detail.trim()) return detail.trim();

  if (Array.isArray(detail)) {
    const parts = detail
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (typeof entry !== "object" || entry === null) return "";
        const row = entry as { msg?: unknown; loc?: unknown };
        const msg =
          typeof row.msg === "string" ? row.msg.trim() : String(row.msg ?? "");
        if (!msg) return "";
        const loc = Array.isArray(row.loc)
          ? row.loc
              .filter((p) => p !== "body" && p !== "payload")
              .map(String)
              .join(".")
          : "";
        return loc ? `${loc}: ${msg}` : msg;
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join(". ");
  }

  return fallback;
}
