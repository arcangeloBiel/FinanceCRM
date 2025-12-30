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

        // 1. Update the Function to include encrypted_password
        console.log('Updating handle_new_user function...');
        const updateFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.users (id, email, nome, role, senha_hash)
        VALUES (
          new.id, 
          new.email, 
          new.raw_user_meta_data->>'nome', 
          'normal',
          new.encrypted_password
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
        await client.query(updateFunctionSQL);
        console.log('Trigger function updated.');

        // 2. Sync existing users (backfill)
        console.log('Syncing passwords for existing users...');
        const syncSQL = `
      UPDATE public.users u
      SET senha_hash = au.encrypted_password
      FROM auth.users au
      WHERE u.id = au.id
      AND (u.senha_hash IS NULL OR u.senha_hash != au.encrypted_password);
    `;
        const res = await client.query(syncSQL);
        console.log(`Synced passwords for ${res.rowCount} users.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
