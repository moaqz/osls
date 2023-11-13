import { Hono } from "hono";
import type { Bindings } from ".";
import { ValiError, flatten, parse } from "valibot";
import { addLinkSchema } from "./models";
import { nanoid } from "nanoid";

const GET_LINKS_LIMIT = 25;

export const api = new Hono<{ Bindings: Bindings }>();

// POST /api/links – create a new link
api.post("/", async (c) => {
  let body;

  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ message: "Missing or invalid body" }, 400);
  }

  try {
    let { url, key } = parse(addLinkSchema, body);

    if (key == null) {
      key = nanoid(6);
    }

    const response = await c.env.DB.prepare(
      "select id from links where key = ?",
    )
      .bind(key)
      .first();

    if (response) {
      return c.json(
        { message: "Duplicate key: this link already exists" },
        409,
      );
    }

    const { error } = await c.env.DB.prepare(
      "insert into links (url, key) values (?, ?)",
    )
      .bind(url, key)
      .run();

    if (error) {
      throw error;
    }

    return c.newResponse(null, 204);
  } catch (error) {
    if (error instanceof ValiError) {
      return c.json(
        { message: "Validation failed", errors: flatten(error).nested },
        400,
      );
    }

    return c.json(
      { message: "Something went wrong. Failed to create link" },
      500,
    );
  }
});

// GET /api/links/[linkId] – get a link
api.get("/:id", async (c) => {
  const linkId = parseInt(c.req.param("id"));

  if (isNaN(linkId) || linkId <= 0) {
    return c.json({ message: "Invalid or missing 'id' parameter" }, 400);
  }

  try {
    const link = await c.env.DB.prepare(
      "select id, url, key, created_at from links where id = ?",
    )
      .bind(linkId)
      .first();

    if (link == null) {
      return c.json({ message: "Link not found." }, 404);
    }

    return c.json(link);
  } catch (error) {
    return c.json(
      { message: "Something went wrong. Failed to retrieve the link" },
      500,
    );
  }
});

// GET /api/links – get all links
api.get("/", async (c) => {
  let page = parseInt(c.req.query("page") ?? "1");

  if (isNaN(page) || page <= 0) {
    page = 1;
  }

  const offset = (page - 1) * GET_LINKS_LIMIT;

  try {
    const { results, error } = await c.env.DB.prepare(
      "select id, url, key, created_at from links limit ? offset ?",
    )
      .bind(GET_LINKS_LIMIT, offset)
      .all();

    if (error) {
      throw error;
    }

    return c.json({ data: results });
  } catch (error) {
    return c.json(
      { message: "Something went wrong. Failed to retrieve the links" },
      500,
    );
  }
});

// DELETE /api/links/[linkId] – delete a link
api.delete("/:id", async (c) => {
  const linkId = parseInt(c.req.param("id"));

  if (isNaN(linkId) || linkId <= 0) {
    return c.json({ message: "Invalid or missing 'id' parameter" }, 400);
  }

  try {
    const result = await c.env.DB.prepare("select id from links where id = ?")
      .bind(linkId)
      .first();

    if (!result) {
      return c.json({ message: "Link not found" }, 404);
    }

    const { error } = await c.env.DB.prepare("delete from links where id = ?")
      .bind(linkId)
      .run();

    if (error) {
      throw error;
    }

    return c.newResponse(null, 204);
  } catch (error) {
    return c.json(
      { message: "Something went wrong. Failed to delete link" },
      500,
    );
  }
});
