"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="center">
      <h1>Something interrupted the conversation.</h1>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
