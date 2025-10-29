import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration from environment
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error(
    "   SUPABASE_SERVICE_ROLE_KEY:",
    supabaseServiceKey ? "✓" : "✗"
  );
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function importXDark() {
  console.log("🚀 Importing xDark to Supabase...\n");

  try {
    // Read xDark.json
    const filePath = join(__dirname, "../src/data/developers/xDark.json");
    const content = readFileSync(filePath, "utf-8");
    const jsonDev = JSON.parse(content);

    console.log("📄 Loaded:", jsonDev.name, `(@${jsonDev.username})`);

    // Check if username already exists
    const { data: existing } = await supabase
      .from("developers")
      .select("username, id")
      .eq("username", jsonDev.username)
      .single();

    if (existing) {
      console.log(
        `\n⚠️  Developer "${jsonDev.username}" already exists in database!`
      );
      console.log(`   ID: ${existing.id}`);
      console.log("\n💡 Options:");
      console.log("   1. Delete the existing record from Supabase Dashboard");
      console.log("   2. Use a different username in the JSON file");
      process.exit(0);
    }

    // Transform data
    const dbDev = {
      username: jsonDev.username,
      name: jsonDev.name,
      avatar: jsonDev.avatar || null,
      github: jsonDev.github || null,
      linkedin: jsonDev.linkedin || null,
      telegram: jsonDev.telegram || null,
      website: jsonDev.website || null,
      bio: jsonDev.bio || null,
      slush_wallet: jsonDev.slushWallet || null,
      entry: jsonDev.entry || null,
      user_id: null,
      is_verified: false, // Set to false so admin can verify
    };

    console.log("\n📝 Inserting to database...");

    const { data, error } = await supabase
      .from("developers")
      .insert(dbDev)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log("\n✅ SUCCESS!");
    console.log("   Developer imported:", data.name, `(@${data.username})`);
    console.log("   ID:", data.id);
    console.log("   Verified:", data.is_verified);
    console.log("\n💡 Next steps:");
    console.log("   1. Go to admin dashboard to verify this developer");
    console.log("   2. Or they can login with GitHub to claim this profile\n");
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

// Run import
importXDark();
