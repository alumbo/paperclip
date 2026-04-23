/**
 * Build a Content-Disposition header value that safely represents a
 * filename containing arbitrary (including non-ASCII) characters.
 *
 * Node's `res.setHeader` rejects strings with characters outside ISO-8859-1
 * via `ERR_INVALID_CHAR`, which aborts the response before any body is sent
 * (surfacing as a 502 behind a proxy). Per RFC 6266 / RFC 5987 the correct
 * form is an ASCII-safe `filename="..."` with a `filename*=UTF-8''<encoded>`
 * companion carrying the full UTF-8 filename.
 */
export function formatContentDisposition(
  disposition: "inline" | "attachment",
  filename: string | null | undefined,
): string {
  const raw = (filename ?? "").replace(/[\r\n"\\]/g, "");
  const ascii = raw.replace(/[^\x20-\x7e]+/g, "_").trim() || "file";
  const utf8 = encodeURIComponent(raw || "file");
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}
