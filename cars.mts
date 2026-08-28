import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  const ADMIN_PASSWORD = Netlify.env.get("CARS_ADMIN_PASSWORD") || "orllybank2026";
  const store = getStore("car-listings");

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const cars = [];
    for (const b of blobs) {
      if (b.key.startsWith("car-")) {
        const data = await store.get(b.key, { type: "json" });
        if (data) cars.push(data);
      }
    }
    cars.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    return new Response(JSON.stringify({ cars }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    const body = await req.json();

    if (body.password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `car-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const car = {
      id,
      title: body.title || "",
      year: body.year || "",
      make: body.make || "",
      mileage: body.mileage || "",
      price: body.price || "",
      description: body.description || "",
      images: body.images || [],
      createdAt: Date.now(),
    };

    await store.setJSON(id, car);

    return new Response(JSON.stringify({ ok: true, car }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const body = await req.json();

    if (body.password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await store.delete(body.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/cars",
};
