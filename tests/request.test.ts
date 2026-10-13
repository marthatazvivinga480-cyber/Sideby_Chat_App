import { test } from "node:test";
import assert from "node:assert/strict";
import { isSameOrigin, readJson } from "../src/lib/firebase/request";
test("same-origin checks reject foreign and missing origins", () => {
  assert.equal(
    isSameOrigin(
      "https://sideby.example",
      "https://sideby.example/api/profile",
    ),
    true,
  );
  assert.equal(
    isSameOrigin("https://evil.example", "https://sideby.example/api/profile"),
    false,
  );
  assert.equal(isSameOrigin(null, "https://sideby.example/api/profile"), false);
});
test("JSON reader accepts small bodies and rejects invalid syntax", async () => {
  assert.deepEqual(
    await readJson(
      new Request("https://app.example", {
        method: "POST",
        body: '{"hello":"world"}',
      }),
    ),
    { hello: "world" },
  );
  await assert.rejects(() =>
    readJson(
      new Request("https://app.example", { method: "POST", body: "not json" }),
    ),
  );
});
test("stream limit rejects oversized requests without trusting content-length", async () => {
  await assert.rejects(
    () =>
      readJson(
        new Request("https://app.example", {
          method: "POST",
          body: "x".repeat(100),
        }),
        10,
      ),
    (e) => e instanceof Error && e.message === "Request is too large.",
  );
});

test("Render checks the configured public origin rather than its internal address", () => {
  const internal = "http://localhost:10000/api/session";
  const publicUrl = "https://sideby.onrender.com";
  assert.equal(isSameOrigin(publicUrl, internal, publicUrl), true);
  assert.equal(isSameOrigin("https://evil.example", internal, publicUrl), false);
  assert.equal(isSameOrigin("http://localhost:10000", internal, publicUrl), false);
  assert.equal(isSameOrigin(null, internal, publicUrl), false);
  assert.equal(isSameOrigin("null", internal, publicUrl), false);
  assert.equal(isSameOrigin(publicUrl, internal, "invalid-url"), false);
});
