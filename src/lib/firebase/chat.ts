import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  startAt,
  endAt,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import { clientAuth, clientDb, clientStorage, storageEnabled } from "./client";
import { api } from "./api";
import type { Conversation, Message, Profile } from "../types";
import { validateFile } from "../validation";
export function watchConversations(
  uid: string,
  onChange: (rooms: Conversation[]) => void,
  onError: (error: Error) => void,
) {
  let disposeRooms: () => void = () => {};
  let closed = false;
  const authStop = onAuthStateChanged(
    clientAuth(),
    (user) => {
      disposeRooms();
      if (closed) return;
      if (!user || user.uid !== uid) {
        onChange([]);
        onError(new Error("Your browser session has expired. Sign in again."));
        return;
      }
      const db = clientDb();
      const roomMap = new Map<string, Conversation>();
      const messageStops = new Map<string, () => void>();
      let generation = 0;
      const emit = () => {
        if (!closed)
          onChange(
            [...roomMap.values()].sort((a, b) =>
              (b.messages.at(-1)?.created_at ?? "").localeCompare(
                a.messages.at(-1)?.created_at ?? "",
              ),
            ),
          );
      };
      const stop = onSnapshot(
        query(
          collection(db, "conversations"),
          where("member_ids", "array-contains", uid),
        ),
        (snapshot) => {
          const version = ++generation;
          const ids = new Set(snapshot.docs.map((d) => d.id));
          for (const [id, off] of messageStops) {
            if (!ids.has(id)) {
              off();
              messageStops.delete(id);
              roomMap.delete(id);
            }
          }
          emit();
          void Promise.all(
            snapshot.docs.map(async (room) => {
              const data = room.data();
              if (data.deleting) {
                messageStops.get(room.id)?.();
                messageStops.delete(room.id);
                roomMap.delete(room.id);
                return;
              }
              const peerId = data.member_ids.find((id: string) => id !== uid);
              const peerDoc = await getDoc(doc(db, "profiles", peerId));
              if (closed || version !== generation || !peerDoc.exists()) return;
              const previous = roomMap.get(room.id);
              roomMap.set(room.id, {
                id: room.id,
                peer: { ...peerDoc.data(), id: peerDoc.id } as Profile,
                last_read_at: data.read_at?.[uid] ?? null,
                peer_read_at: data.read_at?.[peerId] ?? null,
                messages: previous?.messages ?? [],
              });
              if (!messageStops.has(room.id)) {
                messageStops.set(
                  room.id,
                  onSnapshot(
                    query(
                      collection(db, "conversations", room.id, "messages"),
                      orderBy("created_at"),
                    ),
                    (messages) => {
                      const current = roomMap.get(room.id);
                      if (current) {
                        roomMap.set(room.id, {
                          ...current,
                          messages: messages.docs.map(
                            (m) => ({ ...m.data(), id: m.id }) as Message,
                          ),
                        });
                        emit();
                      }
                    },
                    onError,
                  ),
                );
              }
            }),
          )
            .then(emit)
            .catch(onError);
        },
        onError,
      );
      disposeRooms = () => {
        generation++;
        stop();
        messageStops.forEach((off) => off());
        roomMap.clear();
      };
    },
    onError,
  );
  return () => {
    closed = true;
    authStop();
    disposeRooms();
  };
}
export async function searchPeople(term: string, uid: string) {
  const clean = term
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
  const snap = await getDocs(
    query(
      collection(clientDb(), "profiles"),
      orderBy("username"),
      startAt(clean),
      endAt(clean + "\uf8ff"),
      limit(20),
    ),
  );
  return snap.docs
    .filter((p) => p.id !== uid)
    .map((p) => ({ ...p.data(), id: p.id }) as Profile);
}
export const saveProfile = (profile: Profile) => api("profile", "PUT", profile);
export const startDirect = async (peer_id: string) =>
  (await api<{ id: string }>("conversation", "POST", { peer_id })).id;
export const markRead = (room: string) => api("read", "POST", { room });
export const deleteDirect = (room: string) =>
  api<{ warning?: string }>("conversation", "DELETE", { room });
export const editMessage = (room: string, id: string, body: string) =>
  api("message", "PATCH", { room, id, body });
export const deleteMessage = (room: string, id: string) =>
  api<{ warning?: string }>("message", "DELETE", { room, id });
export const sendMessage = (message: Message) =>
  api("message", "POST", message);
export async function uploadAttachment(room: string, uid: string, file: File) {
  if (!storageEnabled)
    throw new Error(
      "File sharing is not enabled for this space yet. Remove the attachment to send a text message.",
    );
  validateFile(file);
  const path = `conversations/${room}/${uid}/${crypto.randomUUID()}`;
  await uploadBytes(ref(clientStorage(), path), file, {
    contentType: file.type,
  });
  return path;
}
export const discardAttachment = (path: string) =>
  deleteObject(ref(clientStorage(), path));
export async function logout() {
  await api("session", "DELETE");
  await signOut(clientAuth());
}
export function watchActivity(
  room: string,
  uid: string,
  peerId: string,
  onChange: (online: boolean, typing: boolean) => void,
  onError: (error: Error) => void,
) {
  const db = clientDb();
  let seen = 0,
    until = 0;
  const evaluate = () =>
    onChange(Date.now() - seen < 60000, Date.now() < until);
  const stop = onSnapshot(
    doc(db, "conversations", room, "activity", peerId),
    (snap) => {
      seen = snap.data()?.seen_at ?? 0;
      until = snap.data()?.typing_until ?? 0;
      evaluate();
    },
    onError,
  );
  const heartbeat = () => {
    if (document.visibilityState === "visible")
      void api("activity", "PUT", { room, typing: false }).catch(onError);
  };
  heartbeat();
  const heartbeatInterval = setInterval(heartbeat, 20000),
    expireInterval = setInterval(evaluate, 1000);
  document.addEventListener("visibilitychange", heartbeat);
  return () => {
    stop();
    clearInterval(heartbeatInterval);
    clearInterval(expireInterval);
    document.removeEventListener("visibilitychange", heartbeat);
    void api("activity", "DELETE", { room }).catch(() => {});
  };
}
let lastTyping = 0;
export function signalTyping(room: string) {
  if (Date.now() - lastTyping < 1500) return;
  lastTyping = Date.now();
  void api("activity", "PUT", { room, typing: true }).catch(() => {});
}
