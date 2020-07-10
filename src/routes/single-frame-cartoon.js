import Router from 'koa-router';
import { apiBase } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'sfc';
const router = new Router();
const singleFCList = Object.keys(dbMap).reduce((sum, region) => {
  if (dbMap[region].singleFrameCartoonList) {
    sum[region] = dbMap[region].singleFrameCartoonList.entries;
  } else if (dbMap[region].singleFrameCartoonMap) {
    sum[region] = mapToList(dbMap[region].singleFrameCartoonMap.entries);
  }
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  if (ctx.params.server === 'jp') {
    ctx.body = singleFCList[ctx.params.server].map((elem) => {
      elem.assetAddress =
        `/assets/${ctx.params.server}/comic/comic_singleframe/${elem.assetBundleName}_rip/${elem.assetBundleName}.png`;
      return elem;
    });
  } else {
    ctx.body = singleFCList[ctx.params.server].map((elem) => {
      elem.assetAddress = `/assets/${ctx.params.server}/loading/downloading_rip/${elem.assetBundleName}.png`;
      return elem;
    });
  }

  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body,
  };
  await next();
});

router.get('/:id(\\d+)', async (ctx, next) => {
  try {
    ctx.body = singleFCList[ctx.params.server].find(sfc => sfc.singleFrameCartoonId === Number(ctx.params.id));
    ctx.body.assetAddress = `/assets/${ctx.params.server}/loading/downloading_rip/${ctx.body.assetBundleName}.png`;
  } catch (error) {
    ctx.throw(400, 'music not exists');
  } finally {
    await next();
  }
});

export default router;
