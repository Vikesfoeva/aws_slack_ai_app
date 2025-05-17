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

// Handle mentions of the bot
app.event('app_mention', async ({ event, say }) => {
  try {
    // Extract the user's message (remove the bot mention)
    const userMessage = event.text.replace(/<@[^>]+>/, '').trim();
    
    // Prepare the prompt for Bedrock
    const prompt = {
      prompt: userMessage,
      max_tokens: 500,
      temperature: 0.7,
    };

    // Call AWS Bedrock
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-v2', // Using Claude v2 model
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(prompt),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Send the response back to Slack
    await say({
      text: responseBody.completion || 'Sorry, I could not generate a response.',
      thread_ts: event.ts,
    });
  } catch (error) {
    console.error('Error:', error);
    await say({
      text: 'Sorry, I encountered an error while processing your request.',
      thread_ts: event.ts,
    });
  }
});

// Start the app
(async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');
})(); 