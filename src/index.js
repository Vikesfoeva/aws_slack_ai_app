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

// Shared handler function
async function handleUserMessage({ event, say }) {
  console.log('Received message:', event.text);
  try {
    // Extract the user's message (remove the bot mention if present)
    const userMessage = event.text.replace(/<@[^>]+>/, '').trim();
    console.log('Processed message:', userMessage);
    
    // Prepare the prompt for Nova Micro
    const prompt = {
      prompt: userMessage,
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      stop_sequences: ["\n\n"]
    };
    console.log('Sending prompt to Bedrock:', prompt);

    // Call AWS Bedrock
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0', // Using Claude 3 Haiku model
      inferenceProfileArn: 'arn:aws:bedrock:us-east-2:092571177669:inference-profile/us.anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(prompt),
    });

    console.log('Sending request to Bedrock...');
    const response = await bedrockClient.send(command);
    console.log('Received response from Bedrock');
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Response body:', responseBody);
    
    // Send the response back to Slack
    await say({
      text: responseBody.completion || 'Sorry, I could not generate a response.',
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