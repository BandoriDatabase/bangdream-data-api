import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import { dbJP, dbTW } from '../db';
import mapToList from '../utils/mapToList';

const api = 'gacha';
const router = new Router();
const gachaList = {
  jp: mapToList(dbJP.gachaMap.entries).sort((a, b) => Number(a.closedAt) - Number(b.closedAt)),
  tw: mapToList(dbTW.gachaMap.entries).sort((a, b) => Number(a.closedAt) - Number(b.closedAt)),
};
const gachaMap = {
  jp: dbJP.gachaMap.entries,
  tw: dbTW.gachaMap.entries,
};
const gachaInformationMap = {
  jp: dbJP.gachaInformationMap.entries,
  tw: dbTW.gachaInformationMap.entries,
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
  ctx.body = gachaList[ctx.params.server]
    .filter(elem => Number(elem.closedAt) > Date.now() &&
      elem.closedAt.substring(0, 1) !== '4');
  // resort
  ctx.body = ctx.body.sort((a, b) => Number(a.publishedAt) - Number(b.publishedAt));
  ctx.body = ctx.body.map(gacha => Object.assign({}, gacha, {
    information: gachaInformationMap[ctx.params.server][gacha.gachaId],
  }));
  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body,
  };
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = gachaMap[ctx.params.server][ctx.params.id];
    ctx.body.information = gachaInformationMap[ctx.params.server][ctx.params.id];
  } catch (error) {
    ctx.throw(400, 'degree not exists');
  } finally {
    await next();
  }
});

export default router;
