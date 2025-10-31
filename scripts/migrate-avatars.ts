/**
 * Migration script to download external avatar URLs to local storage
 * Run: npx tsx scripts/migrate-avatars.ts
 */

import { createClient } from '@supabase/supabase-js';
import { downloadAvatar, isExternalUrl } from '../src/lib/media-upload';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Developer {
  id: string;
  username: string;
  avatar: string | null;
  name: string;
}

async function migrateAvatars() {
  console.log('🚀 Starting avatar migration...\n');

  // Query all developers with external avatar URLs
  const { data: developers, error } = await supabase
    .from('developers')
    .select('id, username, avatar, name')
    .not('avatar', 'is', null);

  if (error) {
    console.error('❌ Failed to fetch developers:', error);
    process.exit(1);
  }

  if (!developers || developers.length === 0) {
    console.log('ℹ️ No developers found with avatars');
    return;
  }

  console.log(`📊 Found ${developers.length} developers with avatars\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const dev of developers as Developer[]) {
    const { id, username, avatar, name } = dev;

    if (!avatar) {
      skipCount++;
      continue;
    }

    // Skip if already a local path
    if (!isExternalUrl(avatar)) {
      console.log(`⏭️  ${username}: Already local (${avatar})`);
      skipCount++;
      continue;
    }

    console.log(`📥 ${username}: Downloading from ${avatar.slice(0, 50)}...`);

    try {
      // Download avatar and save to local storage
      const localPath = await downloadAvatar(avatar, username);

      // Update database with local path
      const { error: updateError } = await supabase
        .from('developers')
        .update({ avatar: localPath })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ ${username}: Saved to ${localPath}\n`);
      successCount++;
    } catch (err: any) {
      console.error(`❌ ${username}: Failed - ${err.message}\n`);
      failCount++;
    }

    // Small delay to avoid overwhelming external servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Failed:  ${failCount}`);
  console.log('='.repeat(50));
}

// Run migration
migrateAvatars()
  .then(() => {
    console.log('\n✨ Migration completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Migration failed:', err);
    process.exit(1);
  });

