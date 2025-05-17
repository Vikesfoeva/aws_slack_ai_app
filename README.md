# Bedrock Slack Bot

A Slack bot that uses AWS Bedrock's Nova Micro (Amazon Titan) model to respond to user messages.

## Prerequisites

- Node.js (v14 or higher)
- AWS Account with Bedrock access
- Slack Workspace with admin privileges

## Setup

1. Create a new Slack App:
   - Go to https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"
   - Enable Socket Mode
   - Add the following bot token scopes:
     - `app_mentions:read`
     - `chat:write`
     - `im:history`
     - `im:write`

2. Install the app to your workspace and note down:
   - Bot User OAuth Token (starts with `xoxb-`)
   - App-Level Token (starts with `xapp-`)
   - Signing Secret

3. Set up AWS Bedrock:
   - Ensure you have access to AWS Bedrock
   - Create an IAM user with appropriate Bedrock permissions
   - Note down your AWS credentials
   - Enable access to the Amazon Titan model in Bedrock

4. Install dependencies:
   ```bash
   npm install
   ```

5. Create a `.env` file with the following variables:
   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-token
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=your-preferred-region
   ```

## Running the Bot

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Usage

1. Invite the bot to a channel
2. Mention the bot with your question: `@YourBotName What is the capital of France?`
3. The bot will respond in a thread with the answer

## Notes

- The bot uses the Amazon Titan (Nova Micro) model
- Responses are limited to 500 tokens
- Temperature is set to 0.7 for balanced creativity and accuracy
- Top-p sampling is set to 0.9 for better response quality 