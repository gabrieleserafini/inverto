// --- helper client: base64url(JSON) ---
export function toBase64Url(json: unknown) {
  const s = JSON.stringify(json);
  // supporto UTF-8
  const b64 = typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}