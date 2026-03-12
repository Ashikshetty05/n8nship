import fetch from 'node-fetch';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config({ path: '.env.local' });

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + process.env.RAILWAY_API_TOKEN,
};

async function railwayQuery(query, variables) {
  const res = await fetch(RAILWAY_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}

async function test() {
  // Use the IDs from previous test
  const projectId = '23acc846-22ba-4f6c-b382-966d80cd5533';
  const environmentId = '9f251a2c-5973-41d1-8289-9c778af7aea9';
  const serviceId = '6a5f7f54-6903-4a85-b447-38c5737fa065';

  console.log('Setting environment variables...');
  const n8nEncryptionKey = crypto.randomBytes(24).toString('hex');
  
  const variables = [
    { name: 'N8N_ENCRYPTION_KEY', value: n8nEncryptionKey },
    { name: 'N8N_USER_MANAGEMENT_DISABLED', value: 'false' },
    { name: 'GENERIC_TIMEZONE', value: 'Asia/Kolkata' },
  ];

  for (const variable of variables) {
    const result = await railwayQuery(`
      mutation variableUpsert($input: VariableUpsertInput!) {
        variableUpsert(input: $input)
      }
    `, {
      input: {
        projectId,
        environmentId,
        serviceId,
        name: variable.name,
        value: variable.value,
      }
    });
    console.log(`${variable.name}:`, JSON.stringify(result));
  }

  console.log('✅ All done! Check Railway dashboard for your project!');
}

test().catch(err => console.error('Error:', err.message));