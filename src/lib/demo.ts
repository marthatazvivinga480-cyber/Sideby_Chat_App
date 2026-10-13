import type { Conversation, Profile } from "./types";
export const demoProfile: Profile = {
  id: "demo-me",
  display_name: "Alex Morgan",
  username: "alexm",
  bio: "Making useful things, one small idea at a time.",
};
export const demoPeople: Profile[] = [
  {
    id: "lebo",
    display_name: "Lebo Mokoena",
    username: "lebo",
    bio: "Designer. Weekend hiker. Always curious.",
  },
  {
    id: "maya",
    display_name: "Maya Patel",
    username: "mayap",
    bio: "Building better communities.",
  },
  {
    id: "sam",
    display_name: "Sam Williams",
    username: "samw",
    bio: "Coffee and code.",
  },
  {
    id: "nandi",
    display_name: "Nandi Dlamini",
    username: "nandi",
    bio: "Big ideas, small steps.",
  },
];
export function demoConversations(): Conversation[] {
  return demoPeople.slice(0, 3).map((peer, i) => ({
    id: "demo-" + peer.id,
    peer,
    last_read_at: i === 1 ? null : new Date().toISOString(),
    peer_read_at: new Date().toISOString(),
    messages: (i === 0
      ? [
          ["lebo", "Hey Alex! How’s the new project coming along?"],
          [
            "demo-me",
            "Really well. I’ve been thinking about making the conversations feel more personal.",
          ],
          ["lebo", "Love that. A little less noise, a little more connection."],
          [
            "lebo",
            "I put together a few ideas for the direction. Want to take a look?",
          ],
          [
            "demo-me",
            "Absolutely. Let’s make something we’d actually want to use. ✳",
          ],
        ]
      : i === 1
        ? [["maya", "Are you joining the community meetup on Friday?"]]
        : [["sam", "That sounds good. Catch you tomorrow!"]]
    ).map(([sender_id, body], n) => ({
      id: `seed-${i}-${n}`,
      conversation_id: "demo-" + peer.id,
      sender_id,
      body,
      created_at: new Date(Date.now() - (8 - n) * 60000).toISOString(),
      edited_at: null,
      attachment_path: null,
      attachment_name: null,
    })),
  }));
}
