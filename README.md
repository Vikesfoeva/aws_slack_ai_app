# Slack Bot with Amazon Bedrock Nova

A Slack bot that uses Amazon Bedrock's Nova model for natural language conversations with thread history support.

## Features

- Real-time Slack integration
- Conversational memory within threads
- Powered by Amazon Bedrock's Nova model
- Configurable response parameters

## Prerequisites

- Node.js (v14 or higher)
- AWS Account with Bedrock access
- Slack Workspace with admin privileges

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [repo-name]
```

2. Install dependencies:
```bash
npm install
```

3. Start the bot:
```bash
npm start
```

## Configuration

The bot uses the following default parameters for Nova:
- max_new_tokens: 1000
- topP: 0.1
- topK: 20
- temperature: 0.5

These can be adjusted in `src/index.js` to suit your needs.

## Usage

1. Invite the bot to a channel or DM it directly
2. Start a conversation - the bot will maintain context within threads
3. The bot will respond using Amazon Bedrock's Nova model

## License

MIT 