import Router from 'koa-router';
import { apiBase, masterdb } from '../config';

const api = 'version';
const router = new Router();

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
