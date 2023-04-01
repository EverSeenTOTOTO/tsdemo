import path from 'path';
import http from 'http';
import express from 'express';
import pinoHttp from 'pino-http';
import pinoPretty from 'pino-pretty';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const server1 = http.createServer(app);
const server2 = http.createServer(app);

const loggerMiddleware = pinoHttp(pinoPretty());
const { logger } = loggerMiddleware;

app.use(cookieParser());
app.use(loggerMiddleware);
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.cookie('same_origin_cookie', 'hello world');

  return express.static(path.join(__dirname, '../dist/web'))(req, res, next);
});

app.use(cors({
  origin: [/localhost:3001/, /everseenflash\.com:3001/],
}));

app.get('/get', (req, res) => {
  const len = Object.keys(req.cookies).length;
  res.end(len > 0 ? 'Get with cookie' : 'Get without cookie');
});
app.post('/post', (req, res) => {
  const len = Object.keys(req.cookies).length;
  res.end(len > 0 ? 'Post with cookie' : 'Post without cookie');
});

server1.listen(3001, () => logger.info(`server1 listening on port ${server1.address()?.port}`));
server2.listen(3002, () => logger.info(`server2 listening on port ${server2.address()?.port}`));
