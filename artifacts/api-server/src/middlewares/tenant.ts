import type { Request, Response, NextFunction } from "express";
import { supabaseAnon, supabaseAdmin } from "../lib/supabase";

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const {
      data: { user },
      error,
    } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      res.status(403).json({ error: "Invalid token" });
      return;
    }

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("owner_user_id", user.id)
      .single();

    (req as any).user = user;
    (req as any).tenant = business || null;
    next();
  } catch {
    res.status(500).json({ error: "Auth error" });
  }
}
