import Router from 'koa-router';
import fs from 'fs-extra';
import path from 'path';
import { apiBase, masDBAddr } from '../config';
import downloadDB from '../utils/downloadDB';

const api = 'manage';
const router = new Router();

router.prefix(`${apiBase}/${api}`);

router.get('/reload', async (ctx) => {
  // reject on wrong api key
  if (!ctx.headers['x-api-key'] ||
    ctx.headers['x-api-key'] !== process.env.ALLOW_API_KEY) {
    ctx.throw(403, 'missing api key');
  }
  // get new masterdb
  console.log('start updating masterdb');
  const toDL = [];
  Object.keys(masDBAddr).forEach((region) => {
    toDL.push(region);
    downloadDB(region).then(() => {
      const idx = toDL.indexOf(region);
      if (idx !== -1) {
        toDL.splice(idx, 1);
      }
      if (!toDL.length) {
        process.exit(1);
      }
    });
  });
  ctx.body = { result: 'succeed' };
});

router.delete('/musicscorecache', async (ctx) => {
  // reject on wrong api key
  if (!ctx.headers['x-api-key'] ||
    ctx.headers['x-api-key'] !== process.env.ALLOW_API_KEY) {
    ctx.throw(403, 'missing api key');
  }

  await fs.emptyDir(path.join(__dirname, '../../cache/musicscore/'));
  ctx.body = { result: 'succeed' };
});

export default router;
