import Link from "next/link";
import { ArrowUpRight, CheckCheck, Paperclip, Send } from "lucide-react";
export default function Home() {
  return (
    <main className="landing">
      <nav aria-label="Main navigation">
        <Link className="brand" href="/">
          sideby<span>✳</span>
        </Link>
        <Link className="button secondary" href="/login">
          Sign in <ArrowUpRight size={16} />
        </Link>
      </nav>
      <section className="hero">
        <div>
          <span className="eyebrow">GOOD CONVERSATIONS START HERE</span>
          <h1>
            A little closer.
            <br />
            One message
            <br />
            <em>at a time.</em>
          </h1>
          <p>
            A simple place to message friends and small teams. Keep your
            everyday conversations together.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link className="button" href="/signup">
              Create an account <ArrowUpRight size={18} />
            </Link>
            <Link className="button secondary" href="/demo">
              Explore the demo
            </Link>
          </div>
          <small>Take a look around. No account needed for the demo.</small>
        </div>
        <div
          className="hero-card"
          role="img"
          aria-label="Example conversation with Lebo: planning a catch-up over coffee. This is a static preview."
        >
          <div className="preview-heading">
            <span className="avatar">LM</span>
            <div>
              <b>Lebo Mokoena</b>
              <p className="preview-status">
                <span /> Online
              </p>
            </div>
            <span className="preview-label">CHAT PREVIEW</span>
          </div>
          <div className="preview-messages">
            <span className="preview-day">Today</span>
            <div className="preview-message">
              <div className="bubble">Hey! Coffee after work? ☕</div>
              <span className="preview-time">10:42</span>
            </div>
            <div className="preview-message outgoing">
              <div className="bubble own">Yes! Same spot at 5?</div>
              <span className="preview-time">
                10:43 <CheckCheck size={15} />
              </span>
            </div>
            <div className="preview-message">
              <div className="bubble">Perfect. See you there!</div>
              <span className="preview-time">10:43</span>
            </div>
          </div>
          <div className="preview-composer" aria-hidden="true">
            <Paperclip size={19} />
            <span>Write a message…</span>
            <span className="preview-send">
              <Send size={18} />
            </span>
          </div>
        </div>
      </section>
      <footer>
        Made for everyday connection.
        <span>A little space to stay close.</span>
      </footer>
    </main>
  );
}
