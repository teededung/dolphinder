import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Supabase configuration
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface JSONDeveloper {
  name: string;
  username: string;
  avatar?: string;
  github?: string;
  linkedin?: string;
  telegram?: string;
  bio?: string;
  slushWallet?: string;
  entry?: string;
  website?: string;
  projects?: any[];
  certificates?: any[];
}

interface DBDeveloper {
  username: string;
  name: string;
  avatar: string | null;
  github: string | null;
  linkedin: string | null;
  telegram: string | null;
  website: string | null;
  bio: string | null;
  slush_wallet: string | null;
  entry: string | null;
  projects: any[];
  certificates: any[];
  user_id: null;
  is_verified: boolean;
}

function transformDeveloper(json: JSONDeveloper): DBDeveloper {
  return {
    username: json.username,
    name: json.name,
    avatar: json.avatar || null,
    github: json.github || null,
    linkedin: json.linkedin || null,
    telegram: json.telegram || null,
    website: json.website || null,
    bio: json.bio || null,
    slush_wallet: json.slushWallet || null,
    entry: json.entry || null,
    projects: json.projects || [],
    certificates: json.certificates || [],
    user_id: null,
    is_verified: true
  };
}

async function importDevelopers() {
  console.log('🚀 Starting import of JSON developers to Supabase...\n');

  const developersDir = join(process.cwd(), 'src/data/developers');
  const files = readdirSync(developersDir).filter(f => f.endsWith('.json'));

  console.log(`📁 Found ${files.length} JSON files\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = join(developersDir, file);
    
    try {
      // Read and parse JSON
      const content = readFileSync(filePath, 'utf-8');
      const jsonDev: JSONDeveloper = JSON.parse(content);

      // Check if username already exists
      const { data: existing } = await supabase
        .from('developers')
        .select('username')
        .eq('username', jsonDev.username)
        .single();

      if (existing) {
        console.log(`⏭️  SKIP: ${jsonDev.username} (already exists)`);
        skipCount++;
        continue;
      }

      // Transform and insert
      const dbDev = transformDeveloper(jsonDev);
      
      const { error } = await supabase
        .from('developers')
        .insert(dbDev);

      if (error) {
        throw error;
      }

      console.log(`✅ SUCCESS: ${jsonDev.username} (${jsonDev.name})`);
      successCount++;

    } catch (error: any) {
      console.error(`❌ ERROR: ${file} - ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors:  ${errorCount}`);
  console.log(`📁 Total:   ${files.length}`);
  console.log('='.repeat(50) + '\n');

  if (successCount > 0) {
    console.log('🎉 Import completed successfully!');
    console.log('💡 All imported profiles have user_id=NULL and is_verified=true');
    console.log('💡 When these developers login via GitHub, profiles will be auto-claimed\n');
  }
}

// Run import
importDevelopers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

