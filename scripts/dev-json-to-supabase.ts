import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadAvatar, isExternalUrl } from '../src/lib/avatar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DeveloperJSON {
  name: string;
  username: string;
  avatar: string;
  github?: string;
  linkedin?: string;
  telegram?: string;
  bio?: string;
  slushWallet?: string;
  entry?: string;
}

async function main() {
  // Get environment variables
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🚀 Starting migration from JSON to Supabase...\n');

  // Read all JSON files
  const devDir = path.join(__dirname, '../src/data/developers');
  const files = fs.readdirSync(devDir).filter(f => f.endsWith('.json'));

  console.log(`📁 Found ${files.length} developer profiles\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(devDir, file);
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    const developer: DeveloperJSON = JSON.parse(jsonContent);

    console.log(`\n📝 Processing: ${developer.username}`);

    try {
      // Process avatar
      let avatarPath = developer.avatar;
      if (isExternalUrl(developer.avatar)) {
        console.log(`   ⬇️  Downloading external avatar...`);
        avatarPath = await downloadAvatar(developer.avatar, developer.username);
        console.log(`   ✅ Avatar saved: ${avatarPath}`);
      } else {
        console.log(`   ✅ Using local avatar: ${avatarPath}`);
      }

      // Create temporary auth user
      const email = `${developer.username}@dolphinder.local`;
      const password = generateRandomPassword();

      console.log(`   👤 Creating auth user: ${email}`);
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user returned from auth.admin.createUser');
      }

      console.log(`   ✅ Auth user created: ${authData.user.id}`);

      // Insert into developers table
      console.log(`   💾 Inserting into developers table...`);
      
      const { error: insertError } = await supabase
        .from('developers')
        .insert({
          user_id: authData.user.id,
          username: developer.username,
          name: developer.name,
          avatar: avatarPath,
          github: developer.github || null,
          linkedin: developer.linkedin || null,
          telegram: developer.telegram || null,
          bio: developer.bio || null,
          slush_wallet: developer.slushWallet || null,
          entry: developer.entry || null,
          is_verified: true, // Existing developers are pre-verified
        });

      if (insertError) {
        throw new Error(`Insert error: ${insertError.message}`);
      }

      console.log(`   ✅ Successfully migrated ${developer.username}`);
      successCount++;

    } catch (error: any) {
      console.error(`   ❌ Error migrating ${developer.username}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Migration complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('='.repeat(50) + '\n');
}

/**
 * Generate random password for temporary auth users
 */
function generateRandomPassword(): string {
  return Math.random().toString(36).slice(-12) + 
         Math.random().toString(36).slice(-12) +
         'A1!'; // Ensure it meets password requirements
}

// Run migration
main().catch(console.error);

