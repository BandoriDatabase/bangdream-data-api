import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import { dbJP, dbTW } from '../db';
import mapToList from '../utils/mapToList';

const api = 'gacha';
const router = new Router();
const gachaList = {
  jp: mapToList(dbJP.gachaMap.entries),
  tw: mapToList(dbTW.gachaMap.entries),
};
const gachaMap = {
  jp: dbJP.gachaMap.entries,
  tw: dbTW.gachaMap.entries,
};

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  // query accept 'rarity', 'attr', 'charaId', 'limit', 'page'
  // console.log(ctx.query);
  const limit = ctx.query.limit || pageLimit;
  const page = ctx.query.page || 1;
  if (Array.isArray(limit) ||
    Array.isArray(page) ||
    !Number.isInteger(Number(limit)) ||
    !Number.isInteger(Number(page))
  ) {
    ctx.throw(400, 'wrong query param type');
  }
  if (limit * (page - 1) > gachaList[ctx.params.server].length || limit > pageLimit) {
    ctx.throw(400, 'query length exceed limit');
  }
  ctx.body = gachaList[ctx.params.server];
  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body.slice((page - 1) * limit, page * limit),
  };
  await next();
});

router.get('/current', async (ctx, next) => {
  ctx.body = gachaList
    .filter(elem => Number(elem.publishedAt) < Date.now() &&
      Number(elem.closedAt) > Date.now() &&
      elem.closedAt.substring(0, 1) !== '4');
  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body,
  };
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = gachaMap.entries[ctx.params.id];
  } catch (error) {
    ctx.throw(400, 'degree not exists');
  } finally {
    await next();
  }
});

export default router;
