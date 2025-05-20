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
  const baseInstruction = "<<SYS>>\n" + 
                          "You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe.  Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.\n" +
                          "If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.\n" +
                          "<</SYS>>";
  console.log('Received message:', event.text);
  try {
    // Extract the user's message (remove the bot mention if present)
    const userMessage = event.text.replace(/<@[^>]+>/, '').trim();
    console.log('Processed message:', userMessage);
    
    // Fetch thread history for context
    let conversation = '';
    let thread_ts = event.thread_ts || event.ts;
    const result = await app.client.conversations.replies({
      channel: event.channel,
      ts: thread_ts,
      token: process.env.SLACK_BOT_TOKEN
    });

    // Limit to the last 16 messages (8 user, 8 assistant turns)
    const N = 16;
    const recentMessages = result.messages.slice(-N);

    // Build conversation history, alternating roles, no duplicates
    for (const msg of recentMessages) {
      if (msg.user === botUserId) {
        conversation += `Assistant: ${msg.text}\n`;
      } else {
        conversation += `User: ${msg.text}\n`;
      }
    }

    // Only add 'Assistant:' if the last message was from the user
    const lastMsg = recentMessages[recentMessages.length - 1];
    if (lastMsg.user !== botUserId) {
      conversation += 'Assistant:';
    }

    // Prepare the prompt for Llama 3 70B Instruct
    const prompt = {
      prompt: `${baseInstruction}\n${conversation}`,
      max_gen_len: 512,
      temperature: 0.5,
      top_p: 0.9,
      // stop_sequences: ["User:"]
    };
    console.log('Sending prompt to Bedrock:', prompt);

    // Call AWS Bedrock
    const command = new InvokeModelCommand({
      modelId: 'meta.llama3-3-70b-instruct-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(prompt),
    });

    console.log('Sending request to Bedrock...');
    const response = await bedrockClient.send(command);
    console.log('Received response from Bedrock');
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Response body:', responseBody);
    
    // Post-process model output to remove hallucinated role labels or special tokens
    let reply = responseBody.generation || 'Sorry, I could not generate a response.';
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