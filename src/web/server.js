/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const express = require('express');
const cors = require('cors');

const port = 3000;
const app = express();

app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  return express.static(path.join(__dirname, '../../dist/web'))(req, res, next);
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
