import Router from 'koa-router';
import { apiBase, masDBAddr } from '../config';

const api = 'version';
const router = new Router();
const masterdb = require(masDBAddr);

router.prefix(`${apiBase}/${api}`);

router.get('/res', async (ctx, next) => {
  ctx.body = masterdb.constants.resVer;
  await next();
});

router.get('/master', async (ctx, next) => {
  ctx.body = masterdb.constants.masterVer;
  await next();
});

export default router;
