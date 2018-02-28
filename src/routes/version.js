import Router from 'koa-router';
import { apiBase } from '../config';
import { dbJP, dbTW } from '../db';

const api = 'version';
const router = new Router();
const resVer = {
  jp: dbJP.constants.resVer,
  tw: dbTW.constants.resVer,
};
const masterVer = {
  jp: dbJP.constants.masterVer,
  tw: dbTW.constants.masterVer,
};

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
