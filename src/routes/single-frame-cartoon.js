import Router from 'koa-router';
import { apiBase, masDBAddr } from '../config';

const api = 'sfc';
const router = new Router();
const masterdb = require(masDBAddr);
const singleFCList = masterdb.singleFrameCartoonList.entries;

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = singleFCList.map((elem) => {
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
  ctx.body = singleFCList.find(sfc => sfc.singleFrameCartoonId === ctx.params.id);
  await next();
});

export default router;
