import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import 'express-async-errors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)),
);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Employee Management API is running',
    data: { timestamp: new Date().toISOString() },
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
