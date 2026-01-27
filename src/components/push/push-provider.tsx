"use client";

import dynamic from "next/dynamic";

// Dynamic import for push notification prompt (client-side only)
const PushNotificationPrompt = dynamic(
  () => import("./push-notification-prompt"),
  { ssr: false }
);

export function PushProvider() {
  return <PushNotificationPrompt />;
}

export default PushProvider;
