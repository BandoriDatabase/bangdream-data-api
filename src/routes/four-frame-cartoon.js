import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'ffc';
const router = new Router();
const fourFCList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].masterFourFrameCartoonMap.entries);
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  switch (ctx.params.version) {
    case '1':
      ctx.body = fourFCList[ctx.params.server].map((elem) => {
        elem.assetAddress =
          `/assets/${ctx.params.server}/comic/comic_fourframe/${elem.assetBundleName}_rip/${elem.assetBundleName}.webp`;
        return elem;
      });

      ctx.body = {
        totalCount: ctx.body.length,
        data: ctx.body,
      };
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

      ctx.body = fourFCList[ctx.params.server];
      if (sort === 'desc') ctx.body = ctx.body.slice().reverse();
      ctx.body = ctx.body.slice((page - 1) * limit, page * limit).map((elem) => {
        elem.assetAddress =
          `/assets/${ctx.params.server}/comic/comic_fourframe/${elem.assetBundleName}_rip/${elem.assetBundleName}.webp`;
        return elem;
      });

      if (!ctx.body.length) {
        ctx.throw(400, 'query length exceed limit');
        ctx.body = null;
      } else {
        ctx.body = {
          totalCount: fourFCList[ctx.params.server].length,
          data: ctx.body,
        };
      }
    }
      break;
    default:
      ctx.throw(404);
  }

  await next();
});

router.get('/:id(\\d+)', async (ctx, next) => {
  try {
    ctx.body = fourFCList[ctx.params.server].find(sfc => sfc.fourFrameCartoonId === Number(ctx.params.id));
    ctx.body.assetAddress = `/assets/${ctx.params.server}/comic/comic_fourframe/${ctx.body.assetBundleName}_rip/${ctx.body.assetBundleName}.webp`;
  } catch (error) {
    ctx.throw(400, 'four frame comic not exists');
  } finally {
    await next();
  }
});

export default router;
