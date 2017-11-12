import Router from 'koa-router';
import { apiBase } from '../config';
import { dbJP, dbTW } from '../db';

const api = 'sfc';
const router = new Router();
const singleFCList = {
  jp: dbJP.singleFrameCartoonList.entries,
  tw: dbTW.singleFrameCartoonList.entries,
};

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = singleFCList[ctx.params.server].map((elem) => {
    elem.assetAddress = `/assets/loading/downloading_${elem.assetBundleName}.png`;
    return elem;
  });
  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body,
  };
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = singleFCList[ctx.params.server].find(sfc => sfc.singleFrameCartoonId === Number(ctx.params.id));
  } catch (error) {
    ctx.throw(400, 'music not exists');
  } finally {
    await next();
  }
});

export default router;
