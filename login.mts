import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const ADMIN_PASSWORD = Netlify.env.get("CARS_ADMIN_PASSWORD") || "orllybank2026";
  const body = await req.json();

  if (body.password !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/login",
};
