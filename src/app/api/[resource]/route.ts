import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { adminBucket, adminDb } from "@/lib/firebase/admin";
import { sessionUser } from "@/lib/firebase/session";
import {
  profileSchema,
  messageSchema,
  FILE_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validation";
import {
  RequestError,
  requireMember,
  requireOwner,
  nextRateWindow,
  directIdInput,
  ownAttachmentPath,
} from "@/lib/firebase/authorization";
import { readJson, isSameOrigin } from "@/lib/firebase/request";
export const runtime = "nodejs";
const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/);
type Context = { params: Promise<{ resource: string }> };
async function handle(request: NextRequest, context: Context) {
  if (!isSameOrigin(request.headers.get("origin"), request.url))
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  try {
    const user = await sessionUser();
    if (!user)
      throw new RequestError("Your session has expired. Sign in again.", 401);
    const uid = user.uid,
      db = adminDb(),
      { resource } = await context.params;
    if (Number(request.headers.get("content-length") ?? 0) > 20000)
      throw new RequestError("Request is too large.", 413);
    const raw = await readJson(request);
    const method = request.method;
    if (resource === "profile" && method === "PUT") {
      const profile = profileSchema.parse(raw);
      const profileRef = db.doc(`profiles/${uid}`),
        nameRef = db.doc(`usernames/${profile.username}`);
      await db.runTransaction(async (t) => {
        const [existing, name] = await Promise.all([
          t.get(profileRef),
          t.get(nameRef),
        ]);
        if (name.exists && name.data()?.uid !== uid)
          throw new RequestError("That username is taken. Try another.", 409);
        const old = existing.data()?.username;
        if (old && old !== profile.username)
          t.delete(db.doc(`usernames/${old}`));
        t.set(nameRef, { uid });
        t.set(profileRef, { ...profile, id: uid });
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "conversation" && method === "POST") {
      const { peer_id } = z.object({ peer_id: idSchema }).parse(raw);
      if (peer_id === uid) throw new RequestError("Choose another person.");
      const id = createHash("sha256")
          .update(directIdInput(uid, peer_id))
          .digest("hex"),
        room = db.doc(`conversations/${id}`);
      await db.runTransaction(async (t) => {
        const [self, peer, existing] = await Promise.all([
          t.get(db.doc(`profiles/${uid}`)),
          t.get(db.doc(`profiles/${peer_id}`)),
          t.get(room),
        ]);
        if (!self.exists || !peer.exists)
          throw new RequestError("Profile not found.", 404);
        if (existing.exists) {
          requireMember(existing.data(), uid);
          return;
        }
        t.create(room, {
          member_ids: [uid, peer_id].sort(),
          created_at: new Date().toISOString(),
          read_at: { [uid]: null, [peer_id]: null },
          deleting: false,
        });
      });
      return NextResponse.json({ id });
    }
    if (resource === "conversation" && method === "DELETE") {
      const { room } = z.object({ room: idSchema }).parse(raw);
      const roomRef = db.doc(`conversations/${room}`);
      await db.runTransaction(async (t) => {
        const snap = await t.get(roomRef);
        requireMember(snap.data(), uid, true);
        if (snap.data()?.deleting)
          throw new RequestError(
            "Deletion is already in progress. If it remains stuck, contact the administrator.",
            409,
          );
        t.update(roomRef, { deleting: true });
      });
      let warning: string | undefined;
      if (process.env.NEXT_PUBLIC_FIREBASE_ENABLE_STORAGE === "true") {
        try {
          await adminBucket().deleteFiles({ prefix: `conversations/${room}/` });
        } catch {
          warning =
            "Conversation deleted. Some files need administrator cleanup.";
        }
      }
      await db.recursiveDelete(roomRef);
      return NextResponse.json({ ok: true, warning });
    }
    if (resource === "message" && method === "POST") {
      const message = z
        .object({
          id: idSchema,
          conversation_id: idSchema,
          sender_id: idSchema,
          body: z.string().trim().max(4000),
          attachment_path: z.string().max(500).nullable(),
          attachment_name: z.string().min(1).max(255).nullable(),
          reply_to: idSchema.nullable().optional(),
        })
        .parse(raw);
      requireOwner(message.sender_id, uid);
      const room = message.conversation_id;
      if (!message.body && !message.attachment_path)
        throw new RequestError("Write a message or choose a file.");
      if (Boolean(message.attachment_path) !== Boolean(message.attachment_name))
        throw new RequestError("Invalid attachment.");
      if (message.attachment_path) {
        if (process.env.NEXT_PUBLIC_FIREBASE_ENABLE_STORAGE !== "true")
          throw new RequestError("Attachment storage is not enabled.");
        if (!ownAttachmentPath(message.attachment_path, room, uid))
          throw new RequestError("Invalid attachment path.");
        const [metadata] = await adminBucket()
          .file(message.attachment_path)
          .getMetadata();
        if (
          Number(metadata.size) > MAX_FILE_SIZE ||
          !FILE_TYPES.includes(metadata.contentType ?? "")
        )
          throw new RequestError("Invalid attachment type or size.");
      }
      const roomRef = db.doc(`conversations/${room}`),
        messageRef = roomRef.collection("messages").doc(message.id),
        rateRef = db.doc(`rateLimits/${uid}`);
      await db.runTransaction(async (t) => {
        const [conversation, existing, rate] = await Promise.all([
          t.get(roomRef),
          t.get(messageRef),
          t.get(rateRef),
        ]);
        requireMember(conversation.data(), uid);
        if (existing.exists) {
          requireOwner(existing.data()!.sender_id, uid);
          return;
        }
        let reply_preview = null;
        if (message.reply_to) {
          const original = await t.get(roomRef.collection("messages").doc(message.reply_to));
          if (!original.exists) throw new RequestError("The message you are replying to was deleted.", 404);
          reply_preview = { sender_id: original.data()!.sender_id, body: String(original.data()!.body || original.data()!.attachment_name || "Attachment").slice(0, 300) };
        }
        const window = nextRateWindow(
          rate.data() as { started: number; count: number } | undefined,
          Date.now(),
        );
        t.set(rateRef, window);
        t.create(messageRef, {
          ...message,
          reply_preview,
          reactions: {},
          created_at: new Date().toISOString(),
          edited_at: null,
        });
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "message" && (method === "PATCH" || method === "DELETE")) {
      const { room, id } = z
        .object({ room: idSchema, id: idSchema })
        .parse(raw);
      const body = method === "PATCH" ? messageSchema.parse(raw.body) : null;
      const messageRef = db.doc(`conversations/${room}/messages/${id}`);
      let attachment: string | null = null;
      await db.runTransaction(async (t) => {
        const [conversation, message] = await Promise.all([
          t.get(db.doc(`conversations/${room}`)),
          t.get(messageRef),
        ]);
        requireMember(conversation.data(), uid);
        if (!message.exists) throw new RequestError("Message not found.", 404);
        requireOwner(message.data()!.sender_id, uid);
        attachment = message.data()!.attachment_path;
        if (method === "PATCH")
          t.update(messageRef, { body, edited_at: new Date().toISOString() });
        else t.delete(messageRef);
      });
      let warning: string | undefined;
      if (method === "DELETE" && attachment) {
        try {
          await adminBucket().file(attachment).delete({ ignoreNotFound: true });
        } catch {
          warning =
            "Message deleted. Its attachment needs administrator cleanup.";
        }
      }
      return NextResponse.json({ ok: true, warning });
    }
    if (resource === "reaction" && method === "POST") {
      const { room, id, emoji } = z.object({ room: idSchema, id: idSchema, emoji: z.enum(["👍", "❤️", "😂", "🎉", "😮", "😢"]) }).parse(raw);
      await db.runTransaction(async (t) => {
        const ref = db.doc(`conversations/${room}/messages/${id}`);
        const [conversation, message] = await Promise.all([t.get(db.doc(`conversations/${room}`)), t.get(ref)]);
        requireMember(conversation.data(), uid);
        if (!message.exists) throw new RequestError("Message not found.", 404);
        const reactions = { ...(message.data()!.reactions ?? {}) };
        if (reactions[uid] === emoji) delete reactions[uid]; else reactions[uid] = emoji;
        t.update(ref, { reactions });
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "read" && method === "POST") {
      const { room } = z.object({ room: idSchema }).parse(raw);
      const roomRef = db.doc(`conversations/${room}`);
      await db.runTransaction(async (t) => {
        const snap = await t.get(roomRef);
        requireMember(snap.data(), uid);
        t.update(roomRef, {
          read_at: { ...snap.data()!.read_at, [uid]: new Date().toISOString() },
        });
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "activity" && (method === "PUT" || method === "DELETE")) {
      const { room, typing = false } = z
        .object({ room: idSchema, typing: z.boolean().optional() })
        .parse(raw);
      await db.runTransaction(async (t) => {
        const roomRef = db.doc(`conversations/${room}`),
          snap = await t.get(roomRef);
        requireMember(snap.data(), uid);
        const own = roomRef.collection("activity").doc(uid);
        if (method === "DELETE") t.delete(own);
        else
          t.set(own, {
            seen_at: Date.now(),
            typing_until: typing ? Date.now() + 3000 : 0,
          });
      });
      return NextResponse.json({ ok: true });
    }
    throw new RequestError("Endpoint not found.", 404);
  } catch (e) {
    if (e instanceof RequestError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input." },
        { status: 400 },
      );
    return NextResponse.json(
      {
        error:
          "The operation could not be completed. Check Firebase configuration, permissions and connectivity.",
      },
      { status: 500 },
    );
  }
}
export const POST = handle,
  PUT = handle,
  PATCH = handle,
  DELETE = handle;
