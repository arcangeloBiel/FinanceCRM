const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Function to load environment variables from a file
function loadEnv(filePath) {
    if (fs.existsSync(filePath)) {
        console.log(`Loading env from ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^\s*([^=]+)\s*=\s*(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            } else if (line.match(/^postgres(ql)?:\/\//)) {
                // If the line looks like a postgres connection string but has no key, assign it to DATABASE_URL
                if (!process.env.DATABASE_URL) {
                    console.log('Found raw connection string, assigning to DATABASE_URL');
                    process.env.DATABASE_URL = line.trim();
                }
            }
        });
    }
}

// Load env vars
const projectRoot = path.join(__dirname, '..');
loadEnv(path.join(projectRoot, '.env'));
loadEnv(path.join(projectRoot, '.env.local'));
loadEnv(path.join(projectRoot, 'env.local'));
loadEnv(path.join(projectRoot, 'env.supabase'));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: DATABASE_URL is not defined.');
    console.error('Please add DATABASE_URL to your .env, .env.local, or env.supabase file.');
    console.error('Example: postgres://postgres.[ref]:[password]@[host]:6543/postgres');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database');

        const schemaPath = path.join(projectRoot, 'supabase', 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at ${schemaPath}`);
        }

        const sql = fs.readFileSync(schemaPath, 'utf8');
        console.log('Executing schema...');

        await client.query(sql);

        console.log('\x1b[32m%s\x1b[0m', 'Database setup completed successfully!');
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', 'Error executing script:', err);
    } finally {
        await client.end();
    }
}

run();
