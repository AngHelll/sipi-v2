// Server startup file
import app from './app';
import { config } from './config/env';

const { port: PORT, host: HOST } = config.server;

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📝 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
});

