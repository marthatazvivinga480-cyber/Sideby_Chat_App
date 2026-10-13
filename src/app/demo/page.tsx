import { ChatWorkspace } from "@/components/chat-workspace";
import { demoProfile } from "@/lib/demo";
export default function Demo() {
  return <ChatWorkspace initialProfile={demoProfile} demo />;
}
