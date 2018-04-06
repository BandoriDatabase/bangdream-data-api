import Router from 'koa-router';
import { apiBase } from '../config';
import dbMap from '../db';

const api = 'version';
const router = new Router();
const resVer = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].constants.resVer;
  return sum;
}, {});
const masterVer = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].constants.masterVer;
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/res', async (ctx, next) => {
  ctx.body = resVer[ctx.params.server];
  await next();
});

router.get('/master', async (ctx, next) => {
  ctx.body = masterVer[ctx.params.server];
  await next();
});

export default router;
