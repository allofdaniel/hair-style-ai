/**
 * n8n Workflow Setup - Creates a hair style generation workflow via n8n API
 *
 * This script creates a webhook-based workflow in n8n that:
 * 1. Receives image + prompt via webhook
 * 2. Calls Gemini API for hair generation
 * 3. Returns the generated image
 *
 * Usage: node testbed/setup-n8n-workflow.cjs
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const N8N_URL = process.env.VITE_N8N_URL || 'http://192.168.50.88:5678';
const N8N_EMAIL = 'admin@beforecut.app';
const N8N_PASSWORD = 'Pr12pr34!@';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

// n8n workflow definition for hair style generation (with reference image support)
const workflowDefinition = {
  name: 'Hair Style Test Bed - Gemini Generator',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'hair-test-generate',
        responseMode: 'responseNode',
        options: {},
      },
      id: 'webhook-trigger',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [250, 300],
      webhookId: 'hair-test-generate',
    },
    {
      parameters: {
        jsCode: `// Build Gemini API request body with optional reference image
const body = $input.first().json.body;
const parts = [];

// Add reference image first (IMAGE 1) if provided
if (body.refImageBase64) {
  parts.push({
    inline_data: {
      mime_type: body.refImageMimeType || 'image/jpeg',
      data: body.refImageBase64,
    }
  });
}

// Add selfie (IMAGE 2 or only image)
parts.push({
  inline_data: {
    mime_type: body.mimeType || 'image/jpeg',
    data: body.imageBase64,
  }
});

// Add prompt text
parts.push({ text: body.prompt });

return [{
  json: {
    model: body.model || 'gemini-2.0-flash-exp-image-generation',
    requestBody: {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 0.1
      }
    }
  }
}];`,
      },
      id: 'build-request',
      name: 'Build Request',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [500, 300],
    },
    {
      parameters: {
        method: 'POST',
        url: `=https://generativelanguage.googleapis.com/v1beta/models/{{ $json.model }}:generateContent?key=${GEMINI_API_KEY}`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Content-Type', value: 'application/json' },
          ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($json.requestBody) }}',
        options: {
          timeout: 120000,
        },
      },
      id: 'gemini-call',
      name: 'Call Gemini API',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [750, 300],
    },
    {
      parameters: {
        jsCode: `// Extract image from Gemini response
const geminiResponse = $input.first().json;

if (geminiResponse.candidates && geminiResponse.candidates[0]?.content?.parts) {
  for (const part of geminiResponse.candidates[0].content.parts) {
    if (part.inlineData) {
      return [{
        json: {
          success: true,
          image: \`data:\${part.inlineData.mimeType};base64,\${part.inlineData.data}\`,
          mimeType: part.inlineData.mimeType,
        }
      }];
    }
  }
}

return [{
  json: {
    success: false,
    error: 'No image in Gemini response',
    rawResponse: JSON.stringify(geminiResponse).substring(0, 500),
  }
}];`,
      },
      id: 'extract-image',
      name: 'Extract Image',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1000, 300],
    },
    {
      parameters: {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify($json) }}',
        options: {},
      },
      id: 'respond',
      name: 'Respond to Webhook',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.1,
      position: [1250, 300],
    },
  ],
  connections: {
    'Webhook': {
      main: [
        [{ node: 'Build Request', type: 'main', index: 0 }],
      ],
    },
    'Build Request': {
      main: [
        [{ node: 'Call Gemini API', type: 'main', index: 0 }],
      ],
    },
    'Call Gemini API': {
      main: [
        [{ node: 'Extract Image', type: 'main', index: 0 }],
      ],
    },
    'Extract Image': {
      main: [
        [{ node: 'Respond to Webhook', type: 'main', index: 0 }],
      ],
    },
  },
  settings: {
    executionOrder: 'v1',
  },
};

// Batch processing workflow (processes multiple styles at once)
const batchWorkflowDefinition = {
  name: 'Hair Style Test Bed - Batch Generator',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'hair-test-batch',
        responseMode: 'responseNode',
        options: {},
      },
      id: 'batch-webhook',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [250, 300],
      webhookId: 'hair-test-batch',
    },
    {
      parameters: {
        jsCode: `// Split batch request into individual items
const body = $input.first().json.body;
const styles = body.styles || [];
const imageBase64 = body.imageBase64;
const mimeType = body.mimeType || 'image/jpeg';
const model = body.model || 'gemini-2.5-flash-image';

return styles.map(style => ({
  json: {
    styleId: style.styleId,
    nameKo: style.nameKo,
    name: style.name,
    prompt: style.prompt,
    imageBase64,
    mimeType,
    model,
  }
}));`,
      },
      id: 'split-batch',
      name: 'Split into Items',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [500, 300],
    },
    {
      parameters: {
        method: 'POST',
        url: `=https://generativelanguage.googleapis.com/v1beta/models/{{ $json.model }}:generateContent?key=${GEMINI_API_KEY}`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Content-Type', value: 'application/json' },
          ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={
  "contents": [{
    "parts": [
      { "inline_data": { "mime_type": "{{ $json.mimeType }}", "data": "{{ $json.imageBase64 }}" } },
      { "text": "{{ $json.prompt }}" }
    ]
  }],
  "generationConfig": {
    "responseModalities": ["IMAGE", "TEXT"],
    "temperature": 0.1
  }
}`,
        options: {
          timeout: 120000,
          batching: {
            batch: {
              batchSize: 3,
              batchInterval: 1000,
            },
          },
        },
      },
      id: 'gemini-batch-call',
      name: 'Call Gemini (Batched)',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [750, 300],
    },
    {
      parameters: {
        jsCode: `// Collect all results
const items = $input.all();
const results = items.map(item => {
  const data = item.json;
  let image = null;
  let error = null;

  if (data.candidates && data.candidates[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        image = \`data:\${part.inlineData.mimeType};base64,\${part.inlineData.data}\`;
        break;
      }
    }
  }

  if (!image) error = 'No image in response';

  return {
    success: !!image,
    image,
    error,
  };
});

return [{ json: { results } }];`,
      },
      id: 'collect-results',
      name: 'Collect Results',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1000, 300],
    },
    {
      parameters: {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify($json) }}',
        options: {},
      },
      id: 'batch-respond',
      name: 'Respond',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.1,
      position: [1250, 300],
    },
  ],
  connections: {
    'Webhook': {
      main: [
        [{ node: 'Split into Items', type: 'main', index: 0 }],
      ],
    },
    'Split into Items': {
      main: [
        [{ node: 'Call Gemini (Batched)', type: 'main', index: 0 }],
      ],
    },
    'Call Gemini (Batched)': {
      main: [
        [{ node: 'Collect Results', type: 'main', index: 0 }],
      ],
    },
    'Collect Results': {
      main: [
        [{ node: 'Respond', type: 'main', index: 0 }],
      ],
    },
  },
  settings: {
    executionOrder: 'v1',
  },
};

async function login() {
  console.log('Logging in to n8n...');
  const res = await fetch(`${N8N_URL}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: N8N_EMAIL, password: N8N_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }

  // Get cookie from response
  const cookies = res.headers.get('set-cookie');
  return cookies;
}

async function createWorkflow(cookie, workflow) {
  console.log(`Creating workflow: ${workflow.name}...`);
  const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify(workflow),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Create workflow failed: ${res.status} ${errText.substring(0, 300)}`);
  }

  const data = await res.json();
  return data;
}

async function activateWorkflow(cookie, workflowId) {
  console.log(`Activating workflow ${workflowId}...`);
  const res = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
  });

  if (!res.ok) {
    console.warn(`  Warning: Could not activate workflow: ${res.status}`);
    return false;
  }
  return true;
}

async function main() {
  console.log('='.repeat(50));
  console.log('  n8n Workflow Setup for Hair Style Test Bed');
  console.log('='.repeat(50));
  console.log(`\nn8n URL: ${N8N_URL}`);
  console.log(`Gemini API Key: ${GEMINI_API_KEY ? '***' + GEMINI_API_KEY.slice(-8) : 'NOT SET'}`);

  try {
    const cookie = await login();
    console.log('  Logged in successfully\n');

    // Create single generation workflow
    const singleWf = await createWorkflow(cookie, workflowDefinition);
    console.log(`  Created: ${singleWf.name} (ID: ${singleWf.id})`);
    console.log(`  Webhook: ${N8N_URL}/webhook/hair-test-generate\n`);

    // Create batch workflow
    const batchWf = await createWorkflow(cookie, batchWorkflowDefinition);
    console.log(`  Created: ${batchWf.name} (ID: ${batchWf.id})`);
    console.log(`  Webhook: ${N8N_URL}/webhook/hair-test-batch\n`);

    // Try to activate
    await activateWorkflow(cookie, singleWf.id);
    await activateWorkflow(cookie, batchWf.id);

    console.log('\n' + '='.repeat(50));
    console.log('  Setup Complete!');
    console.log('='.repeat(50));
    console.log(`
Endpoints:
  Single: POST ${N8N_URL}/webhook/hair-test-generate
  Batch:  POST ${N8N_URL}/webhook/hair-test-batch

Single request body:
  {
    "prompt": "...",
    "imageBase64": "<base64>",
    "mimeType": "image/jpeg",
    "model": "gemini-2.5-flash-image"
  }

Batch request body:
  {
    "imageBase64": "<base64>",
    "mimeType": "image/jpeg",
    "model": "gemini-2.5-flash-image",
    "styles": [
      { "styleId": "m-가르마펌", "nameKo": "가르마펌", "name": "Side Part Perm", "prompt": "..." },
      ...
    ]
  }

Note: You may need to manually activate the workflows in the n8n UI at:
  ${N8N_URL}
`);
  } catch (err) {
    console.error('\nError:', err.message);
    console.log(`
If n8n is not reachable, please:
1. Check that n8n is running at ${N8N_URL}
2. Or create the workflows manually in the n8n UI
3. The webhook paths should be:
   - hair-test-generate (single)
   - hair-test-batch (batch)
`);
    process.exit(1);
  }
}

main();
