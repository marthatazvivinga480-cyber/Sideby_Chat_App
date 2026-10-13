"use client";
import { useEffect, useRef, useState, useId } from "react";
import { Smile, X } from "lucide-react";
const groups = {
  Faces: [["😀", "happy smile"], ["😊", "blush smile"], ["😂", "laugh tears"], ["🤣", "laugh rolling"], ["😍", "love heart eyes"], ["🥰", "love hearts"], ["😎", "cool sunglasses"], ["🥳", "party celebration"], ["🤔", "thinking"], ["😭", "cry sad"], ["😅", "sweat smile"], ["😉", "wink"], ["🙃", "upside down"], ["😴", "sleep"], ["😮", "surprised"], ["😌", "relieved"]],
  Gestures: [["👍", "thumbs up yes"], ["👎", "thumbs down"], ["👋", "wave hello"], ["👏", "clap applause"], ["🙌", "celebrate hands"], ["🙏", "thanks please"], ["🤝", "handshake"], ["✌️", "peace"], ["💪", "strong muscle"], ["🫶", "heart hands"]],
  Hearts: [["❤️", "red love heart"], ["🧡", "orange heart"], ["💛", "yellow heart"], ["💚", "green heart"], ["💙", "blue heart"], ["💜", "purple heart"], ["💕", "two hearts"], ["💔", "broken heart"], ["✨", "sparkles"], ["🎉", "party celebration"], ["🔥", "fire"], ["💯", "hundred perfect"]],
  Everyday: [["☕", "coffee"], ["🍕", "pizza"], ["🍰", "cake"], ["🌻", "flower sunflower"], ["🌈", "rainbow"], ["☀️", "sun"], ["🐶", "dog"], ["🐱", "cat"], ["🎵", "music"], ["⚽", "football sport"], ["📸", "camera photo"], ["🚀", "rocket"]],
};
export function EmojiPicker({ onSelect, disabled }: { onSelect: (emoji: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<keyof typeof groups>("Faces");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);
  const entries = query.trim() ? Object.values(groups).flat().filter(([emoji, name]) => name.includes(query.toLowerCase().trim()) || emoji === query.trim()) : groups[category];
  return <div className="emoji-picker" ref={root}>
    <button type="button" ref={trigger} className="icon-button" aria-label="Choose an emoji" aria-expanded={open} aria-controls={open ? id : undefined} disabled={disabled} onClick={() => { setOpen(!open); setQuery(""); }}><Smile size={20} /></button>
    {open && <section id={id} className="emoji-panel" aria-label="Emoji picker">
      <div className="emoji-heading"><strong>Emojis</strong><button type="button" className="icon-button" aria-label="Close emoji picker" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={16} /></button></div>
      <input ref={search} aria-label="Search emojis" placeholder="Search smiles, hearts, coffee..." value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="emoji-categories">{(Object.keys(groups) as (keyof typeof groups)[]).map((name) => <button type="button" key={name} aria-pressed={!query && category === name} onClick={() => { setCategory(name); setQuery(""); }}>{name}</button>)}</div>
      <div className="emoji-grid">{entries.map(([emoji, name]) => <button type="button" key={emoji} aria-label={name} title={name} onClick={() => { onSelect(emoji); setOpen(false); }}>{emoji}</button>)}</div>
      {!entries.length && <p className="emoji-empty">No emojis found. Try another word.</p>}
    </section>}
  </div>;
}
