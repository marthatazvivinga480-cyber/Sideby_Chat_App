export type Profile = {
  id: string;
  display_name: string;
  username: string;
  bio: string;
};
export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
};
export type Conversation = {
  id: string;
  peer: Profile;
  last_read_at: string | null;
  peer_read_at: string | null;
  messages: Message[];
};
