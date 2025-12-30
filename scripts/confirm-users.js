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
    }
}

const projectRoot = path.join(__dirname, '..');
loadEnv(path.join(projectRoot, '.env'));
loadEnv(path.join(projectRoot, '.env.local'));
// Fallback for missing dot
loadEnv(path.join(projectRoot, 'env.local'));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Confirm ALL users for development convenience
        // Or strictly: WHERE email = 'admin@financecrm.com'
        console.log('Confirming emails for all users...');
        const query = `
      UPDATE auth.users
      SET email_confirmed_at = NOW()
      WHERE email_confirmed_at IS NULL;
    `;

        const res = await client.query(query);
        console.log(`Confirmed emails for ${res.rowCount} users.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
