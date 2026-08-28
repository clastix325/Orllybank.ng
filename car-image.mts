import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const ADMIN_PASSWORD = "orllybank2026";

export default async (req: Request, context: Context) => {
  const store = getStore("car-images");
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (req.method === "GET") {
    if (!key) {
      return new Response("Missing key", { status: 400 });
    }
    const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
    if (!result || !result.data) {
      return new Response("Not found", { status: 404 });
    }
    const contentType = (result.metadata?.contentType as string) || "image/jpeg";
    return new Response(result.data as ArrayBuffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" },
    });
  }

  if (req.method === "POST") {
    const password = req.headers.get("x-admin-password");
    const adminPw = Netlify.env.get("CARS_ADMIN_PASSWORD") || ADMIN_PASSWORD;
    if (password !== adminPw) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "image/jpeg";
    const buffer = await req.arrayBuffer();

    if (buffer.byteLength > 6 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Image too large (max 6MB)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const key = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await store.set(key, buffer, { metadata: { contentType } });

    return new Response(JSON.stringify({ ok: true, key, url: `/api/car-image?key=${key}` }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/car-image",
};
