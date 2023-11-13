import { Hono } from "hono";
import { api as apiRouter } from "./api";
import { logger } from "hono/logger";

export type Bindings = {
  DB: D1Database;
  AUTH_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

app.use("/api/*", async (c, next) => {
  if (c.req.method === "GET") {
    return await next();
  }

  const authToken = c.req.header("Authorization");
  if (authToken == null) {
    return c.newResponse("Unauthorized", 401);
  }

  if (authToken !== c.env.AUTH_SECRET) {
    return c.newResponse("Unauthorized", 401);
  }

  return await next();
});

app.use("/:key", async (c) => {
  const key = c.req.param("key");

  const link = await c.env.DB.prepare(
    "select url as target from links where key = ?",
  )
    .bind(key)
    .first<{ target: string } | null>();

  if (!link) {
    return c.redirect("/", 303);
  }

  return c.redirect(link.target);
});

app.get("/", (c) => {
  return c.html("<h1>😦</h1>");
});

app.route("/api/links", apiRouter);

app.notFound((c) => {
  return c.json({ message: "Not Found", success: false }, 404);
});

export default app;
