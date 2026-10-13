import { test } from "node:test";
import assert from "node:assert/strict";
import {
  requireMember,
  requireOwner,
  nextRateWindow,
  directIdInput,
  ownAttachmentPath,
  RequestError,
} from "../src/lib/firebase/authorization";
test("unrelated users cannot access a conversation", () => {
  assert.throws(
    () => requireMember({ member_ids: ["alice", "bob"] }, "eve"),
    RequestError,
  );
  assert.doesNotThrow(() =>
    requireMember({ member_ids: ["alice", "bob"] }, "alice"),
  );
  assert.throws(() => requireMember(undefined, "alice"));
});
test("deletion lock prevents new writes, permits deletion retries", () => {
  assert.throws(() =>
    requireMember({ member_ids: ["alice"], deleting: true }, "alice"),
  );
  assert.doesNotThrow(() =>
    requireMember({ member_ids: ["alice"], deleting: true }, "alice", true),
  );
});
test("only message authors can edit or delete their messages", () => {
  assert.throws(() => requireOwner("alice", "bob"));
  assert.doesNotThrow(() => requireOwner("alice", "alice"));
});
test("direct conversation keys are order-independent and unambiguous", () => {
  assert.equal(directIdInput("alice", "bob"), directIdInput("bob", "alice"));
  assert.notEqual(directIdInput("a_b", "c"), directIdInput("a", "b_c"));
});
test("rate limit rejects the eleventh message and resets after ten seconds", () => {
  let rate = undefined as { started: number; count: number } | undefined;
  for (let i = 0; i < 10; i++) rate = nextRateWindow(rate, 1000 + i);
  assert.throws(() => nextRateWindow(rate, 1050));
  assert.deepEqual(nextRateWindow(rate, 11000), { started: 11000, count: 1 });
});
test("attachment paths must belong to the room and authenticated author", () => {
  const file = "12345678-1234-1234-1234-123456789abc";
  assert.equal(
    ownAttachmentPath(`conversations/room/alice/${file}`, "room", "alice"),
    true,
  );
  assert.equal(
    ownAttachmentPath(`conversations/room/bob/${file}`, "room", "alice"),
    false,
  );
  assert.equal(
    ownAttachmentPath(
      `conversations/room/alice/${file}/extra`,
      "room",
      "alice",
    ),
    false,
  );
  assert.equal(
    ownAttachmentPath("conversations/room/alice/../file", "room", "alice"),
    false,
  );
});
