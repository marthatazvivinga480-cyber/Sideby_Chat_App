"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Asterisk,
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import type { Conversation, Message, Profile } from "@/lib/types";
import {
  watchConversations,
  watchActivity,
  signalTyping,
  searchPeople,
  startDirect,
  markRead,
  sendMessage,
  editMessage,
  deleteMessage,
  deleteDirect,
  uploadAttachment,
  discardAttachment,
  logout,
} from "@/lib/firebase/chat";
import { demoConversations, demoPeople } from "@/lib/demo";
import { messageSchema, validateFile, readableError } from "@/lib/validation";
import { ProfileForm } from "./profile-form";
import { EmojiPicker } from "./emoji-picker";
function initials(p: Profile) {
  return p.display_name
    .split(" ")
    .map((v) => v[0])
    .slice(0, 2)
    .join("");
}
function stamp(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function ChatWorkspace({
  initialProfile,
  demo = false,
}: {
  initialProfile: Profile;
  demo?: boolean;
}) {
  const [profile, setProfile] = useState(initialProfile),
    [conversations, setConversations] = useState<Conversation[]>([]),
    [active, setActive] = useState(demo ? "demo-lebo" : ""),
    [query, setQuery] = useState(""),
    [people, setPeople] = useState<Profile[]>([]),
    [modal, setModal] = useState<"people" | "settings" | null>(null),
    [body, setBody] = useState(""),
    [editing, setEditing] = useState<Message | null>(null),
    [file, setFile] = useState<File | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [demoReady, setDemoReady] = useState(false),
    [mobile, setMobile] = useState(false),
    [typing, setTyping] = useState(false),
    [connected, setConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [demoImages, setDemoImages] = useState<Record<string, string>>({});
  const imageUrls = useRef<string[]>([]);
  useEffect(() => {
    if (!file?.type.startsWith("image/")) { setSelectedImage(null); return; }
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => { imageUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null),
    searchSequence = useRef(0),
    pendingRead = useRef("");
  const [visible, setVisible] = useState(true);
  const current = conversations.find((c) => c.id === active);
  const run = async (fn: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(
        readableError(e, "Something went wrong. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const changed = () => setVisible(document.visibilityState === "visible");
    changed();
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  useEffect(() => {
    if (demo) {
      setConversations(demoConversations());
      try {
        const saved = localStorage.getItem("sideby-demo");
        if (saved) {
          const data = JSON.parse(saved);
          if (
            Array.isArray(data.conversations) &&
            data.profile?.id === "demo-me"
          ) {
            setConversations(data.conversations);
            setProfile(data.profile);
          }
        }
      } catch {}
      setDemoReady(true);
      setLoading(false);
      return;
    }
    return watchConversations(
      profile.id,
      (rooms) => {
        setConversations(rooms);
        setActive((previous) => previous || rooms[0]?.id || "");
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [demo, profile.id]);
  useEffect(() => {
    if (demo && demoReady) {
      try {
        localStorage.setItem(
          "sideby-demo",
          JSON.stringify({ conversations, profile }),
        );
      } catch {
        setError(
          "Browser storage is unavailable. Demo changes may not persist.",
        );
      }
    }
  }, [conversations, profile, demo, demoReady]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [active, current?.messages.length]);
  useEffect(() => {
    setTyping(false);
    setConnected(false);
    if (demo || !active || !current) return;
    return watchActivity(
      active,
      profile.id,
      current.peer.id,
      (online, typing) => {
        setConnected(online);
        setTyping(typing);
      },
      (e) => setError(e.message),
    );
  }, [active, demo, profile.id, current?.peer.id]);
  useEffect(() => {
    if (
      !visible ||
      !active ||
      !current ||
      (mobile === false && window.innerWidth <= 700)
    )
      return;
    const unread = current.messages.some(
      (m) =>
        m.sender_id !== profile.id &&
        (!current.last_read_at || m.created_at > current.last_read_at),
    );
    if (!unread || pendingRead.current === active) return;
    const now = new Date().toISOString();
    if (demo)
      setConversations((cs) =>
        cs.map((c) => (c.id === active ? { ...c, last_read_at: now } : c)),
      );
    else {
      pendingRead.current = active;
      void markRead(active)
        .catch((e) => setError(e.message))
        .finally(() => {
          pendingRead.current = "";
        });
    }
  }, [active, current, demo, profile.id, visible, mobile]);
  useEffect(() => {
    if (modal !== "people") return;
    const sequence = ++searchSequence.current;
    const timer = setTimeout(async () => {
      try {
        const results = demo
          ? demoPeople.filter(
              (p) =>
                p.display_name.toLowerCase().includes(query.toLowerCase()) ||
                p.username.includes(query.toLowerCase()),
            )
          : await searchPeople(query, profile.id);
        if (sequence === searchSequence.current) setPeople(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      searchSequence.current++;
    };
  }, [query, modal, demo, profile.id]);
  useEffect(() => {
    if (!modal) return;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href]",
        ) ?? [],
      );
    focusable()
      .find((el) => el.hasAttribute("autofocus"))
      ?.focus();
    if (!dialog?.contains(document.activeElement)) focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [modal]);
  async function start(peer: Profile) {
    await run(async () => {
      let id = conversations.find((c) => c.peer.id === peer.id)?.id;
      if (!id) {
        if (demo) {
          id = "demo-" + peer.id;
          setConversations((cs) => [
            ...cs,
            {
              id: id!,
              peer,
              last_read_at: null,
              peer_read_at: null,
              messages: [],
            },
          ]);
        } else id = await startDirect(peer.id);
      }
      setActive(id!);
      setBody("");
      setFile(null);
      setEditing(null);
      setMobile(true);
      setModal(null);
      setQuery("");
    });
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!current || busy || (!body.trim() && !file)) return;
    await run(async () => {
      const text = file ? body.trim() : messageSchema.parse(body);
      if (text.length > 4000)
        throw new Error("Keep messages under 4,000 characters");
      if (file) validateFile(file);
      let path: string | null = null;
      if (file && !demo)
        path = await uploadAttachment(active, profile.id, file);
      if (editing) {
        if (!demo)
          await editMessage(active, editing.id, messageSchema.parse(body));
        else
          setConversations((cs) =>
            cs.map((c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === editing.id
                  ? { ...m, body: text, edited_at: new Date().toISOString() }
                  : m,
              ),
            })),
          );
      } else {
        const message: Message = {
          id: crypto.randomUUID(),
          conversation_id: active,
          sender_id: profile.id,
          body: text,
          created_at: new Date().toISOString(),
          edited_at: null,
          attachment_path: path,
          attachment_name: file?.name ?? null,
        };
        if (demo && file?.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          imageUrls.current.push(url);
          setDemoImages((images) => ({ ...images, [message.id]: url }));
        }
        if (!demo) {
          try {
            await sendMessage(message);
          } catch (e) {
            if (path) await discardAttachment(path).catch(() => {});
            throw e;
          }
        } else
          setConversations((cs) =>
            cs.map((c) =>
              c.id === active
                ? { ...c, messages: [...c.messages, message] }
                : c,
            ),
          );
      }
      setBody("");
      setFile(null);
      setEditing(null);
    });
  }
  async function removeMessage(message: Message) {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    await run(async () => {
      if (demo)
        setConversations((cs) =>
          cs.map((c) => ({
            ...c,
            messages: c.messages.filter((m) => m.id !== message.id),
          })),
        );
      else {
        const result = await deleteMessage(message.conversation_id, message.id);
        if (result.warning) setError(result.warning);
      }
    });
  }
  async function removeConversation() {
    if (
      !current ||
      !confirm(
        "Delete this conversation for both people? This cannot be undone.",
      )
    )
      return;
    await run(async () => {
      if (demo) setConversations((cs) => cs.filter((c) => c.id !== active));
      else {
        const result = await deleteDirect(active);
        if (result.warning) setError(result.warning);
      }
      setActive("");
      setMobile(false);
      setBody("");
      setFile(null);
      setEditing(null);
    });
  }
  async function attachment(message: Message) {
    if (demo) {
      setError(
        "Demo attachments show filenames only. Connect Firebase Storage for private downloads.",
      );
      return;
    }
    window.open(
      "/api/attachment?path=" + encodeURIComponent(message.attachment_path!),
      "_blank",
      "noopener,noreferrer",
    );
  }
  return (
    <main className="workspace">
      <nav className="rail">
        <Link className="mark" href="/" aria-label="Home">
          <Asterisk size={40} aria-hidden="true" />
        </Link>
        <button
          className="rail-active icon-button"
          aria-label="Conversations"
          onClick={() => setMobile(false)}
        >
          <MessageCircle />
        </button>
        <button
          className="icon-button"
          aria-label="Find people"
          onClick={() => {
            setQuery("");
            setModal("people");
          }}
        >
          <Search />
        </button>
        <div className="rail-bottom">
          <button
            className="icon-button"
            aria-label="Settings"
            onClick={() => setModal("settings")}
          >
            <Settings />
          </button>
          <span className="avatar small">{initials(profile)}</span>
        </div>
      </nav>
      <aside className={`inbox ${mobile ? "hide-mobile" : ""}`}>
        <div className="inbox-head">
          <span className="brand">
            sideby<span><Asterisk size={30} aria-hidden="true" /></span>
          </span>
          <button
            className="icon-button"
            aria-label="New conversation"
            onClick={() => {
              setQuery("");
              setModal("people");
            }}
          >
            <Plus />
          </button>
        </div>
        <div className="inbox-title">
          <h1>Conversations</h1>
          <span>{conversations.length}</span>
        </div>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Search conversations"
            placeholder="Find a conversation"
            value={modal ? "" : query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="list-label">
          YOUR PEOPLE <span>Keep in touch</span>
        </div>
        <div className="conversation-list">
          {loading ? (
            <p className="muted p-5" role="status">
              Loading conversations...
            </p>
          ) : (
            conversations
              .filter(
                (c) =>
                  modal ||
                  c.peer.display_name
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .map((c) => {
                const last = c.messages.at(-1);
                const unread = c.messages.filter(
                  (m) =>
                    m.sender_id !== profile.id &&
                    (!c.last_read_at || m.created_at > c.last_read_at),
                ).length;
                return (
                  <button
                    className={`conversation ${active === c.id ? "selected" : ""}`}
                    key={c.id}
                    onClick={() => {
                      setActive(c.id);
                      setEditing(null);
                      setBody("");
                      setFile(null);
                      setMobile(true);
                    }}
                  >
                    <span className="avatar">{initials(c.peer)}</span>
                    <div>
                      <div className="conversation-top">
                        <b>{c.peer.display_name}</b>
                        <small>{last ? stamp(last.created_at) : "New"}</small>
                      </div>
                      <div className="conversation-bottom">
                        <p>
                          {last?.body || last?.attachment_name || "Say hello"}
                        </p>
                        {unread > 0 && <span className="unread">{unread}</span>}
                      </div>
                    </div>
                  </button>
                );
              })
          )}
          {!loading && !conversations.length && (
            <p className="muted p-5">
              Your next good conversation starts with a hello. Find someone to
              get started.
            </p>
          )}
        </div>
        <div className="inbox-note">
          <span><Asterisk size={28} aria-hidden="true" /></span>
          <b>A little closer, every day.</b>
          <p>A small hello can go a long way.</p>
        </div>
        <div className="account">
          <span className="avatar small">{initials(profile)}</span>
          <div>
            <b>{profile.display_name}</b>
            <p>@{profile.username}</p>
          </div>
          <button
            className="icon-button"
            aria-label="Open profile"
            onClick={() => setModal("settings")}
          >
            <MoreHorizontal />
          </button>
        </div>
      </aside>
      <section className={`chat ${mobile ? "show-mobile" : ""}`}>
        <div className="demo-banner">
          {demo ? (
            <>
              <span>DEMO MODE</span> Your changes stay in this browser.
              <Link href="/signup">
                Create an account <ArrowUpRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <span>YOUR SPACE</span> Good conversations, without the noise.
            </>
          )}
        </div>
        {current ? (
          <>
            <header className="chat-header">
              <button
                className="icon-button mobile-back"
                aria-label="Back to conversations"
                onClick={() => setMobile(false)}
              >
                <ArrowLeft />
              </button>
              <span className="avatar">{initials(current.peer)}</span>
              <div>
                <h2>{current.peer.display_name}</h2>
                <p>
                  <i className={connected ? "online" : ""} />
                  {demo
                    ? "Presence preview"
                    : connected
                      ? "Here in this conversation"
                      : "Offline"}
                </p>
              </div>
              <button
                className="icon-button ml-auto"
                disabled={busy}
                aria-label="Delete conversation"
                onClick={removeConversation}
              >
                <Trash2 size={18} />
              </button>
            </header>
            <div className="message-area">
              <div className="conversation-intro">
                <span className="avatar large">{initials(current.peer)}</span>
                <h3>
                  A little hello to {current.peer.display_name.split(" ")[0]}.
                </h3>
                <p>{current.peer.bio}</p>
                <span className="day-divider">TODAY</span>
              </div>
              {current.messages.map((m) => (
                <div
                  key={m.id}
                  className={`message-row ${m.sender_id === profile.id ? "mine" : ""}`}
                >
                  <div className="message-content">
                    <div className="bubble">
                      {m.body}
                      {m.attachment_name && (demoImages[m.id] || (!demo && m.attachment_path && /\.(png|jpe?g|webp)$/i.test(m.attachment_name))) && (
                        <MessageImage
                          src={demoImages[m.id] || "/api/attachment?path=" + encodeURIComponent(m.attachment_path!)}
                          name={m.attachment_name}
                        />
                      )}
                      {m.attachment_name && (
                        <button
                          className="attachment"
                          onClick={() => attachment(m)}
                        >
                          <Paperclip size={16} />
                          {m.attachment_name}
                        </button>
                      )}
                    </div>
                    <div className="message-meta">
                      <span>
                        {stamp(m.created_at)}
                        {m.edited_at ? " · edited" : ""}
                      </span>
                      {m.sender_id === profile.id && (
                        <>
                          <CheckCheck
                            size={14}
                            className={
                              current.peer_read_at &&
                              m.created_at <= current.peer_read_at
                                ? "read"
                                : ""
                            }
                          />
                          <button
                            onClick={() => {
                              setEditing(m);
                              setBody(m.body);
                              setFile(null);
                            }}
                            aria-label="Edit message"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeMessage(m)}
                            aria-label="Delete message"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {typing && (
                <p role="status" className="muted">
                  {current.peer.display_name.split(" ")[0]} is typing...
                </p>
              )}
              <div ref={end} />
            </div>
            <form className="composer" onSubmit={send}>
              {editing && (
                <div className="composer-context">
                  Editing your message{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setBody("");
                    }}
                    aria-label="Cancel editing"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
              {file && (
                <div className="composer-context">
                  <div className="selected-attachment">
                    {selectedImage && <img src={selectedImage} alt="Selected image preview" />}
                    <div><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} KB{demo ? " · Preview stays until you refresh" : ""}</small></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Remove attachment"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
              <div className="compose-box">
                <label
                  className="icon-button file-input"
                  aria-label="Attach a file"
                >
                  <Paperclip size={20} />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                    disabled={busy || !!editing}
                    onChange={(e) => {
                      try {
                        const f = e.target.files?.[0];
                        if (f) {
                          validateFile(f);
                          setFile(f);
                          setError("");
                        }
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "Invalid file",
                        );
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
                <EmojiPicker disabled={busy} onSelect={(emoji) => {
                  const input = messageInput.current;
                  const start = input?.selectionStart ?? body.length;
                  const finish = input?.selectionEnd ?? start;
                  const next = body.slice(0, start) + emoji + body.slice(finish);
                  if (next.length > 4000) return;
                  setBody(next);
                  if (!demo) signalTyping(active);
                  requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + emoji.length, start + emoji.length); });
                }} />
                <textarea
                  ref={messageInput}
                  aria-label="Message"
                  placeholder={`Message ${current.peer.display_name.split(" ")[0]}...`}
                  value={body}
                  maxLength={4000}
                  rows={1}
                  onChange={(e) => {
                    setBody(e.target.value);
                    if (!demo) signalTyping(active);
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <button
                  className="send"
                  aria-label={editing ? "Save message" : "Send message"}
                  disabled={busy || (!body.trim() && !file)}
                >
                  <Send size={19} />
                </button>
              </div>
              <div className="composer-footer">
                <span>Enter to send · Shift + Enter for a new line</span>
                <span>
                  {busy ? "Saving..." : "Make room for a good conversation"}
                </span>
              </div>
            </form>
          </>
        ) : (
          <div className="empty">
            <span><Asterisk size={28} aria-hidden="true" /></span>
            <h2>Your people are one hello away.</h2>
            <p>Start a conversation and make this space your own.</p>
            <button onClick={() => setModal("people")}>
              Find someone <Plus size={17} />
            </button>
          </div>
        )}
        {error && (
          <div className="toast" role="alert">
            {error}
            <button
              className="icon-button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </section>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setModal(null);
            }}
          >
            <button
              className="icon-button modal-close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            <span className="eyebrow">
              {modal === "people" ? "A NEW HELLO" : "MAKE IT YOURS"}
            </span>
            <h2 id="modal-title">
              {modal === "people"
                ? "Find your people."
                : "Your profile & settings."}
            </h2>
            {modal === "people" ? (
              <>
                <label className="search">
                  <Search size={18} />
                  <input
                    autoFocus
                    placeholder={demo ? "Search people" : "Search by username"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search users"
                  />
                </label>
                <div className="people">
                  {people.map((p) => (
                    <button
                      key={p.id}
                      className="person"
                      disabled={busy}
                      onClick={() => start(p)}
                    >
                      <span className="avatar">{initials(p)}</span>
                      <div>
                        <b>{p.display_name}</b>
                        <p>@{p.username}</p>
                      </div>
                      <Plus size={18} />
                    </button>
                  ))}
                  {!people.length && (
                    <p className="muted">
                      No people found. Try another username.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <ProfileForm
                  profile={profile}
                  onSave={(p) => {
                    setProfile(p);
                    setModal(null);
                  }}
                  onCancel={() => setModal(null)}
                />
                <hr />
                <p className="muted">
                  {demo
                    ? "Demo changes are saved locally in this browser."
                    : "Attachments are private. Your email is never listed in user search."}
                </p>
                <button
                  className="secondary"
                  onClick={() =>
                    run(async () => {
                      if (!demo) {
                        await logout();
                      }
                      location.assign("/");
                    })
                  }
                >
                  <LogOut size={16} />
                  {demo ? "Leave demo" : "Sign out"}
                </button>
              </>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function MessageImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p className="image-unavailable">Image preview unavailable. Use the attachment below.</p>;
  return <a className="message-image" href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open image: ${name}`}>
    <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} />
  </a>;
}
