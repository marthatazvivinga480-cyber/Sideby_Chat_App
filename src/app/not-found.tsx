import Link from "next/link";
export default function NotFound() {
  return (
    <main className="center">
      <h1>This space doesn’t exist.</h1>
      <Link className="button" href="/">
        Back home
      </Link>
    </main>
  );
}
