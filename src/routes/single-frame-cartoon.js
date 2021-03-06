import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'sfc';
const router = new Router();
const singleFCList = Object.keys(dbMap).reduce((sum, region) => {
  if (dbMap[region].masterSingleFrameCartoonList) {
    sum[region] = dbMap[region].masterSingleFrameCartoonList.entries;
  } else if (dbMap[region].masterSingleFrameCartoonMap) {
    sum[region] = mapToList(dbMap[region].masterSingleFrameCartoonMap.entries);
  }
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  switch (ctx.params.version) {
    case '1':
      ctx.body = singleFCList[ctx.params.server].map((elem) => {
        elem.assetAddress =
          `/assets/${ctx.params.server}/comic/comic_singleframe/${elem.assetBundleName}_rip/${elem.assetBundleName}.webp`;
        return elem;
      });

      ctx.body = {
        totalCount: ctx.body.length,
        data: ctx.body,
      };
      await next();
      break;
    case '2': {
      const limit = ctx.query.limit || pageLimit;
      const page = ctx.query.page || 1;
      const sort = ctx.query.sort || 'asc';
      if (Array.isArray(limit) ||
        Array.isArray(page) ||
        Array.isArray(sort) ||
        !Number.isInteger(Number(limit)) ||
        !Number.isInteger(Number(page)) ||
        (typeof sort !== 'string')
      ) {
        ctx.throw(400, 'wrong query param type');
      }

      ctx.body = singleFCList[ctx.params.server];
      if (sort === 'desc') ctx.body = ctx.body.slice().reverse();
      ctx.body = ctx.body.slice((page - 1) * limit, page * limit).map((elem) => {
        elem.assetAddress =
          `/assets/${ctx.params.server}/comic/comic_singleframe/${elem.assetBundleName}_rip/${elem.assetBundleName}.webp`;
        return elem;
      });

      if (!ctx.body.length) {
        ctx.throw(400, 'query length exceed limit');
        ctx.body = null;
      } else {
        ctx.body = {
          totalCount: singleFCList[ctx.params.server].length,
          data: ctx.body,
        };
      }
    }
      break;
    default:
      ctx.throw(404);
  }
});

router.get('/:id(\\d+)', async (ctx, next) => {
  try {
    ctx.body = singleFCList[ctx.params.server].find(sfc => sfc.singleFrameCartoonId === Number(ctx.params.id));
    ctx.body.assetAddress = `/assets/${ctx.params.server}/comic/comic_singleframe/${ctx.body.assetBundleName}_rip/${ctx.body.assetBundleName}.webp`;
  } catch (error) {
    ctx.throw(400, 'single frame comic not exists');
  } finally {
    await next();
  }
});

export default router;
