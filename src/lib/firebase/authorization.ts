export class RequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function requireMember(
  room: { member_ids?: string[]; deleting?: boolean } | undefined,
  uid: string,
  allowDeleting = false,
) {
  if (!room?.member_ids?.includes(uid))
    throw new RequestError("Conversation not found or access denied.", 403);
  if (room.deleting && !allowDeleting)
    throw new RequestError("This conversation is being deleted.", 409);
}
export function requireOwner(sender: string, uid: string) {
  if (sender !== uid)
    throw new RequestError("You can only change your own messages.", 403);
}
export function directIdInput(a: string, b: string) {
  return JSON.stringify([a, b].sort());
}
export function nextRateWindow(
  previous: { started: number; count: number } | undefined,
  now: number,
) {
  const window =
    !previous || now - previous.started >= 10000
      ? { started: now, count: 0 }
      : previous;
  if (window.count >= 10)
    throw new RequestError(
      "Slow down. Wait a moment before sending again.",
      429,
    );
  return { ...window, count: window.count + 1 };
}
export function ownAttachmentPath(path: string, room: string, uid: string) {
  return (
    path.startsWith(`conversations/${room}/${uid}/`) &&
    /^[a-f0-9-]{36}$/.test(path.split("/")[3] ?? "") &&
    path.split("/").length === 4
  );
}
