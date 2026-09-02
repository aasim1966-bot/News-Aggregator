import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { newsEngine } from './server/newsEngine';
import { marketService } from './server/marketService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes FIRST
  app.get('/api/markets/live', async (req, res) => {
    try {
      const force = req.query.refresh === 'true';
      const data = await marketService.getLiveMarkets(force);
      res.json(data);
    } catch (err: any) {
      console.error('Error serving /api/markets/live:', err);
      res.status(500).json({ error: 'Failed to fetch live markets', message: err.message });
    }
  });

  app.post('/api/markets/refresh', async (req, res) => {
    try {
      await marketService.refreshLiveQuotes();
      const data = await marketService.getLiveMarkets(false);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error refreshing markets:', err);
      res.status(500).json({ error: 'Failed to refresh markets', message: err.message });
    }
  });

  app.get('/api/news', (req, res) => {
    try {
      const category = req.query.category as any;
      const q = req.query.q as string;
      const articles = newsEngine.getArticles(category, q);
      const syncStatus = newsEngine.getSyncStatus();
      const sources = newsEngine.getSources();
      const categories = newsEngine.getCategories();

      res.json({
        articles,
        syncStatus,
        sources,
        categories,
      });
    } catch (err: any) {
      console.error('Error serving /api/news:', err);
      res.status(500).json({ error: 'Internal server error', message: err.message });
    }
  });

  app.get('/api/sync-status', (req, res) => {
    try {
      const syncStatus = newsEngine.getSyncStatus();
      res.json({ syncStatus });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get sync status', message: err.message });
    }
  });

  app.post('/api/sync-now', async (req, res) => {
    try {
      const result = await newsEngine.syncLiveFeeds();
      const syncStatus = newsEngine.getSyncStatus();
      const articles = newsEngine.getArticles();
      res.json({
        success: true,
        result,
        syncStatus,
        articles,
      });
    } catch (err: any) {
      console.error('Error during manual sync:', err);
      res.status(500).json({ error: 'Sync failed', message: err.message });
    }
  });

  app.get('/api/article/:id', (req, res) => {
    try {
      const article = newsEngine.getArticleById(req.params.id);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      res.json({ article });
    } catch (err: any) {
      res.status(500).json({ error: 'Error fetching article', message: err.message });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite Middleware for SPA Frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NewsServer] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
