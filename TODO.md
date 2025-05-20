# Project TODOs

## High Priority

### 1. Fix Channel Response Issues
- [ ] Debug why bot doesn't respond correctly in Slack channels
- [ ] Verify channel permissions and scopes
- [ ] Test different message formats in channel context
- [ ] Add logging for channel message handling

### 2. Implement Passive Channel Listening
- [ ] Add channel message event listener
- [ ] Implement context-aware message processing
- [ ] Add configuration for which channels to monitor
- [ ] Add rate limiting to prevent spam
- [ ] Add message relevance scoring

### 3. Implement RAG (Retrieval Augmented Generation)
- [ ] Set up vector database (e.g., Pinecone, Weaviate)
- [ ] Create document ingestion pipeline
- [ ] Implement embedding generation
- [ ] Add semantic search functionality
- [ ] Integrate search results with Nova prompts
- [ ] Add document management endpoints

## Implementation Details

### Channel Listening
```javascript
// Example structure for channel message handling
app.message(async ({ event, say }) => {
  // Check if message is relevant
  // Process message
  // Generate response
  // Send response
});
```

### RAG Setup
1. Document Processing
   - PDF/Text file ingestion
   - Text chunking
   - Metadata extraction

2. Vector Store
   - Document embedding
   - Index management
   - Similarity search

3. Query Processing
   - Query embedding
   - Context retrieval
   - Response generation

## Future Enhancements
- [ ] Add conversation summarization
- [ ] Implement user feedback mechanism
- [ ] Add analytics dashboard
- [ ] Implement rate limiting
- [ ] Add error recovery mechanisms 