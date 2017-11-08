import Router from 'koa-router';
import fs from 'fs';
import fetch from 'isomorphic-fetch';
import { apiBase, masDBAddr } from '../config';

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
  fetch('https://res.bangdream.ga/static/MasterDB.json')
    .then(res => res.text())
    .then((res) => {
      fs.writeFileSync(masDBAddr, res);
      console.log('got a new masterdb, please restart server');
      // exit for auto reload, use with supervisord or similar tools
      process.exit(1);
    });
  ctx.body = 'succeed';
});

export default router;
