process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Reusing env loader
function loadEnv(filePath) {
    if (fs.existsSync(filePath)) {
        console.log(`Loading env from ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split(/\r?\n/).forEach(line => {
            const match = line.match(/^\s*([^=]+)\s*=\s*(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, '');
                if (!process.env[key]) process.env[key] = value;
            }
        });
    } else {
        console.log(`File not found: ${filePath}`);
    }
}

const projectRoot = path.join(__dirname, '..');
loadEnv(path.join(projectRoot, '.env'));
loadEnv(path.join(projectRoot, '.env.local'));
loadEnv(path.join(projectRoot, 'env.local'));

console.log('Loaded Debug:', {
    URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DB_URL: !!process.env.DATABASE_URL
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const connectionString = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey || !connectionString) {
    console.error('Missing environment variables. URL, KEY or DATABASE_URL.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const pgClient = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const ADMIN_EMAIL = 'admin@financecrm.com';
const ADMIN_PASSWORD = 'admin123'; // Weak password for testing
const ADMIN_NAME = 'Admin User';

async function run() {
    try {
        console.log(`Creating user ${ADMIN_EMAIL}...`);

        // 1. Sign Up User via Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            options: {
                data: { nome: ADMIN_NAME }
            }
        });

        if (error) {
            console.error('Error creating user:', error.message);
            // If user uses email confirmation, they might not be active yet. 
            // But for development usually auto-confirm is on or we just need the ID.
            // If user already exists, we just want to update role.
            if (!error.message.includes('already registered')) {
                process.exit(1);
            }
            console.log('User might already exist, attempting to update role anyway...');
        }

        let userId = data?.user?.id;

        // If signUp didn't return ID (e.g. already exists), we need to fetch the user.
        // But we can't simple fetchByEmail with anon key easily without login.
        // So we'll rely on SQL to find the user by email if we didn't get the ID.

        // 2. Connect to DB to update role
        await pgClient.connect();
        console.log('Connected to database.');

        // Update public.users role to 'admin'
        // We update based on email since ID might be missing from previous step if user existed
        const updateQuery = `
      UPDATE public.users 
      SET role = 'admin' 
      WHERE email = $1
      RETURNING id, role;
    `;

        const res = await pgClient.query(updateQuery, [ADMIN_EMAIL]);

        if (res.rowCount > 0) {
            console.log(`\x1b[32mSuccess! User ${ADMIN_EMAIL} is now an ADMIN.\x1b[0m`);
            console.log(`ID: ${res.rows[0].id}`);
        } else {
            console.error('\x1b[31mFailed to update user role. User might not exist in public.users table yet.\x1b[0m');
            console.error('Note: public.users is populated via trigger on auth.users.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        await pgClient.end();
    }
}

run();
