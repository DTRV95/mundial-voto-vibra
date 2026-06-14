// Re-exports for backwards compatibility
export { markChatRead as markAsRead, useNotifications as useUnreadMessages } from "@/lib/useNotifications";
export type { ChatNotif as UnreadLeague } from "@/lib/useNotifications";

// Helper used in SideNav badge
export function getLastRead(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem("notif_chat_last_read") ?? "{}"); } catch { return {}; }
}
