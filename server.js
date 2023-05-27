const express = require('express');
const tf = require('@tensorflow/tfjs');
require('@tensorflow-models/universal-sentence-encoder');

const app = express();
const port = 3000;

// Load the Universal Sentence Encoder model
async function loadModel() {
  const model = await tf.loadLayersModel('https://tfhub.dev/tensorflow/universal-sentence-encoder/4/model.json');
  return model;
}

// Perform sentiment analysis
async function analyzeSentiment(text) {
  const model = await loadModel();

  // Tokenize the input text
  const sentences = [text];
  const embeddings = await model.embed(sentences);

  // Make predictions
  const predictions = await model.predict(embeddings);
  const sentiment = tf.argMax(predictions).dataSync()[0];

  // Map sentiment label
  let sentimentLabel;
  switch (sentiment) {
    case 0:
      sentimentLabel = 'Negative';
      break;
    case 1:
      sentimentLabel = 'Neutral';
      break;
    case 2:
      sentimentLabel = 'Positive';
      break;
    default:
      sentimentLabel = 'Unknown';
  }

  // Get confidence score
  const confidenceScore = predictions.dataSync()[sentiment];

  // Dispose of tensors
  embeddings.dispose();
  predictions.dispose();
  model.dispose();

  return { sentiment: sentimentLabel, confidence: confidenceScore };
}

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// API endpoint for sentiment analysis
app.post('/analyze', express.json(), (req, res) => {
  const text = req.body.text;

  analyzeSentiment(text)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({ error: error.message }));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
