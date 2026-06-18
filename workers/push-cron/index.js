import webpush from "web-push";

const SUPABASE_URL = globalThis.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = globalThis.SUPABASE_SERVICE_KEY;
const VAPID_PUBLIC_KEY = globalThis.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = globalThis.VAPID_PRIVATE_KEY;

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sendNotifications() {
  webpush.setVapidDetails(
    "mailto:davidvilaverde@hotmail.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  // Find matches starting between 55 and 65 minutes from now
  const now = new Date();
  const from = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
  const to = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

  const matches = await supabaseFetch(
    `/matches?match_date=gte.${from}&match_date=lte.${to}&voting_open=eq.true&select=id,home_team,away_team,match_date`
  );

  if (!matches || matches.length === 0) return { sent: 0, matches: 0 };

  // Get all push subscriptions
  const subscriptions = await supabaseFetch(`/push_subscriptions?select=user_id,subscription`);
  if (!subscriptions || subscriptions.length === 0) return { sent: 0, matches: matches.length };

  const matchNames = matches.map(m => `${m.home_team} vs ${m.away_team}`).join(", ");
  const payload = JSON.stringify({
    title: "⚽ Jogo a começar em 1 hora!",
    body: matchNames,
    tag: "match-reminder",
    url: "/jogos",
  });

  let sent = 0;
  const failed = [];

  await Promise.allSettled(
    subscriptions.map(async ({ user_id, subscription }) => {
      try {
        const sub = JSON.parse(subscription);
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err) {
        // Subscription expired or invalid — remove it
        if (err.statusCode === 404 || err.statusCode === 410) {
          failed.push(user_id);
        }
      }
    })
  );

  // Clean up invalid subscriptions
  if (failed.length > 0) {
    const ids = failed.map(id => `user_id.eq.${id}`).join(",");
    await supabaseFetch(`/push_subscriptions?or=(${ids})`, { method: "DELETE" });
  }

  return { sent, matches: matches.length, removed: failed.length };
}

export default {
  async scheduled(event, env, ctx) {
    globalThis.SUPABASE_URL = env.SUPABASE_URL;
    globalThis.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
    globalThis.VAPID_PUBLIC_KEY = env.VAPID_PUBLIC_KEY;
    globalThis.VAPID_PRIVATE_KEY = env.VAPID_PRIVATE_KEY;

    ctx.waitUntil(
      sendNotifications().then(result => {
        console.log("Push notifications result:", result);
      }).catch(err => {
        console.error("Push notifications error:", err);
      })
    );
  },
};
