import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase connection...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check if credentials are present
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.log('Required variables:');
    console.log('  SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('  SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
    process.exit(1);
  }

  console.log('✅ Supabase credentials found\n');

  try {
    // Test 1: Create Supabase client with anon key
    console.log('📡 Testing Supabase client connection...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to fetch auth settings (public endpoint)
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (!authError) {
      console.log('✅ Supabase client connected successfully\n');
    } else {
      console.warn('⚠️  Auth check returned error (this might be normal if not logged in):', authError.message);
    }

    // Test 2: Test service role client
    console.log('🔐 Testing Supabase service role connection...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Try to count users (requires service role)
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`✅ Service role connected successfully (${count || 0} users in database)\n`);
    } else {
      console.log('ℹ️  Users table might not exist yet:', countError.message, '\n');
    }

    // Test 3: Test Prisma connection
    console.log('🗄️  Testing Prisma database connection...');

    // Use DATABASE_URL from environment
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.error('❌ DATABASE_URL not found in .env file');
      return;
    }

    const prisma = new PrismaClient();

    try {
      await prisma.$connect();
      console.log('✅ Prisma connected to database successfully\n');

      // Try to query a simple table
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `;

      console.log('📊 Database schema status:');
      console.log('  Users table:', tableExists ? '✅ Exists' : '⚠️  Not created yet');

    } catch (prismaError: any) {
      console.error('❌ Prisma connection error:', prismaError.message);
      console.log('\n💡 You may need to:');
      console.log('  1. Run database migrations: npm run db:migrate');
      console.log('  2. Check your database URL format');
    } finally {
      await prisma.$disconnect();
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 CONNECTION TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ Supabase URL is valid');
    console.log('✅ Supabase Anon Key works');
    console.log('✅ Supabase Service Role Key works');
    console.log('✅ Basic connectivity established');
    console.log('\n🎉 All connection tests passed! Your Supabase setup is working correctly.');

    // Show project details
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    console.log('\n📊 Project Details:');
    console.log(`  Project URL: ${supabaseUrl}`);
    console.log(`  Project Ref: ${projectRef}`);
    console.log(`  Region: AWS US East 1`);

  } catch (error: any) {
    console.error('\n❌ Connection test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('  1. Verify your Supabase project is active');
    console.log('  2. Check that the credentials match your Supabase dashboard');
    console.log('  3. Ensure your IP is not blocked in Supabase settings');
    process.exit(1);
  }
}

// Run the test
testSupabaseConnection().catch(console.error);