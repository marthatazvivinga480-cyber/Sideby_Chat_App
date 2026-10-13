import { RequestError } from "./authorization";
export function isSameOrigin(origin: string | null, url: string) {
  return origin !== null && origin === new URL(url).origin;
}
export async function readJson(request: Request, maxBytes = 20000) {
  if (!request.body) throw new RequestError("Request body is required.");
  const reader = request.body.getReader();
  let total = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RequestError("Request is too large.", 413);
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new RequestError("Invalid JSON.");
  }
}
