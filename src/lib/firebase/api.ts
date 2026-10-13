export async function api<T = Record<string, unknown>>(
  resource: string,
  method = "POST",
  values?: unknown,
): Promise<T> {
  const response = await fetch("/api/" + resource, {
    method,
    credentials: "same-origin",
    headers: values ? { "Content-Type": "application/json" } : undefined,
    body: values ? JSON.stringify(values) : undefined,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "The request failed. Please try again.");
  return data as T;
}
