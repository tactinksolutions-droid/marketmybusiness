import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("SUPABASE_URL is required");
if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_KEY is required");
if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY is required");

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
