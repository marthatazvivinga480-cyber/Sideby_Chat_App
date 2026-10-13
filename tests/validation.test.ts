import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readableError,
  authSchema,
  messageSchema,
  profileSchema,
  validateFile,
} from "../src/lib/validation";
test("messages reject blank and oversized input, trim valid text", () => {
  assert.equal(messageSchema.parse(" hello "), "hello");
  assert.equal(messageSchema.safeParse("   ").success, false);
  assert.equal(messageSchema.safeParse("x".repeat(4001)).success, false);
});
test("profiles enforce safe discoverable usernames", () => {
  assert.equal(
    profileSchema.safeParse({ display_name: "Alex", username: "a,b%", bio: "" })
      .success,
    false,
  );
  assert.equal(
    profileSchema.parse({ display_name: " Alex ", username: "ALEX_1", bio: "" })
      .username,
    "alex_1",
  );
});
test("attachments enforce size and MIME allowlist", () => {
  assert.throws(() => validateFile({ size: 5242881, type: "image/png" }));
  assert.throws(() => validateFile({ size: 100, type: "text/html" }));
  assert.doesNotThrow(() =>
    validateFile({ size: 100, type: "application/pdf" }),
  );
});
test("credentials reject invalid email and short password", () => {
  assert.equal(
    authSchema.safeParse({ email: "not-mail", password: "password123" })
      .success,
    false,
  );
  assert.equal(
    authSchema.safeParse({ email: "a@b.com", password: "short" }).success,
    false,
  );
});

test("validation errors display readable messages instead of JSON", () => {
  const result = messageSchema.safeParse("   ");
  assert.equal(result.success, false);
  if (!result.success) assert.equal(readableError(result.error), "Write a message first");
  assert.equal(readableError(new Error("Connection failed")), "Connection failed");
  assert.equal(readableError(null, "Try again"), "Try again");
});
