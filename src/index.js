require('dotenv').config();
const { App } = require('@slack/bolt');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Initialize AWS Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

let botUserId = null;

// Fetch bot user ID at startup
(async () => {
  const authResult = await app.client.auth.test({ token: process.env.SLACK_BOT_TOKEN });
  botUserId = authResult.user_id;
})();

// Shared handler function
async function handleUserMessage({ event, say }) {

  console.log('Received message:', event.text);
  try {
    // System prompt as a string
    const systemPromptText = "You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible, while being safe.";

    // Fetch thread history for context
    let thread_ts = event.thread_ts || event.ts;
    const result = await app.client.conversations.replies({
      channel: event.channel,
      ts: thread_ts,
      token: process.env.SLACK_BOT_TOKEN
    });

    // Build messages array for Bedrock, filtering out fallback/error messages
    const messages = [];
    for (const msg of result.messages) {
      if (msg.text && !msg.text.startsWith('Sorry, I could not generate a response.')) {
        if (msg.user === botUserId) {
          messages.push({
            role: "assistant",
            content: [{ text: msg.text }]
          });
        } else {
          messages.push({
            role: "user",
            content: [{ text: msg.text }]
          });
        }
      }
    }

    // Limit to last N messages
    const N = 16;
    const limitedMessages = messages.slice(-N);

    // Prepare the payload for Amazon Nova Lite
    const payload = {
      inferenceConfig: {
        "max_new_tokens": 1000,
        "topP": 0.1,
        "topK": 20,
        "temperature": 0.5
      },
      "system": [{"text": systemPromptText}],
      messages: limitedMessages.map(msg => ({
        role: msg.role,
        content: [{ text: msg.content[0].text }]
      }))
    };
    console.log('Sending payload to Bedrock:', JSON.stringify(payload, null, 2));

    // Call AWS Bedrock
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-lite-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    console.log('Sending request to Bedrock...');
    const response = await bedrockClient.send(command);
    console.log('Received response from Bedrock');
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Raw response body:', JSON.stringify(responseBody, null, 2));
    
    // Extract the response text from the content array
    let reply = responseBody.output?.message?.content?.[0]?.text || 'Sorry, I could not generate a response.';
    // Truncate at the first occurrence of 'User:'
    const userIdx = reply.indexOf('User:');
    if (userIdx !== -1) {
      reply = reply.substring(0, userIdx);
    }
    // Remove any hallucinated role labels or special tokens
    reply = reply.replace(/Assistant:|<\\?\\|end_header_id\\|>?/gi, '').trim();

    // Send the response back to Slack
    await say({
      text: reply,
      thread_ts: event.ts,
    });
    console.log('Response sent to Slack');
  } catch (error) {
    console.error('Error details:', error);
    await say({
      text: 'Sorry, I encountered an error while processing your request.',
      thread_ts: event.ts,
    });
  }
}

// Handle mentions of the bot in channels
app.event('app_mention', handleUserMessage);

// Handle direct messages to the bot
app.message(async ({ event, say }) => {
  // Only respond to DMs (not messages in channels)
  if (event.channel_type === 'im') {
    await handleUserMessage({ event, say });
  }
});

// Add catch-all event listener
app.event(/.*/, async ({ event }) => {
  console.log('Received event:', event);
});

// Start the app
(async () => {
  try {
    await app.start();
    console.log('⚡️ Bolt app is running!');
    console.log('Environment variables check:');
    console.log('- SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? 'Set' : 'Not set');
    console.log('- SLACK_SIGNING_SECRET:', process.env.SLACK_SIGNING_SECRET ? 'Set' : 'Not set');
    console.log('- SLACK_APP_TOKEN:', process.env.SLACK_APP_TOKEN ? 'Set' : 'Not set');
    console.log('- AWS_REGION:', process.env.AWS_REGION ? 'Set' : 'Not set');
    console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
    console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
  } catch (error) {
    console.error('Error starting the app:', error);
  }
})(); 