import webpush from "web-push";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:hr@shiftmind.app",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

export async function sendPushToEmployee(
  employeeId: string,
  title: string,
  body: string,
  url = "/documents"
): Promise<number> {
  if (!ensureVapid()) return 0;

  const supabase = await createServerClient();
  const { data: rows } = await supabase
    .from(TABLES.pushSubscriptions)
    .select("subscription")
    .eq("employee_id", employeeId);

  if (!rows?.length) return 0;

  let sent = 0;
  const payload = JSON.stringify({ title, body, url });

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        row.subscription as webpush.PushSubscription,
        payload
      );
      sent++;
    } catch (e) {
      console.error("push send failed:", e);
    }
  }
  return sent;
}
