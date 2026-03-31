import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import trendsRouter from './routes/trends.js';
import socialRouter from './routes/social.js';
import pipelineRouter from './routes/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// Serve generated images
app.use('/output', express.static(path.resolve(__dirname, '../../output')));

// API Routes
app.use('/api/trends', trendsRouter);
app.use('/api/social', socialRouter);
app.use('/api/pipeline', pipelineRouter);
app.get('/api/stats', pipelineRouter);

// Serve frontend
app.use(express.static(path.resolve(__dirname, 'frontend')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.resolve(__dirname, 'frontend/index.html'));
  }
});

const PORT = parseInt(config.PORT);
app.listen(PORT, () => {
  console.log(`\n🚀 GelGezGor Trend Pipeline Panel`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/stats`);
  console.log(`   DRY_RUN: ${config.DRY_RUN}\n`);
});

export default app;
