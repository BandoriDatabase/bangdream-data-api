import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import { dbJP, dbTW } from '../db';
import mapToList from '../utils/mapToList';

const api = 'chara';
const router = new Router();
const charaList = {
  jp: mapToList(dbJP.characterInfoMap.entries),
  tw: mapToList(dbTW.characterInfoMap.entries),
};
const charaMap = {
  jp: dbJP.characterInfoMap.entries,
  tw: dbTW.characterInfoMap.entries,
};

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  // query accept 'bandId', 'limit', 'page'
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
  if (limit * (page - 1) > charaList[ctx.params.server].length || limit > pageLimit) {
    ctx.throw(400, 'query length exceed limit');
  }
  ctx.body = charaList[ctx.params.server].map(chara => ({
    characterId: chara.characterId,
    characterType: chara.characterType,
    bandId: chara.bandId,
    characterName: chara.characterName,
    firstName: chara.firstName,
    lastName: chara.lastName,
    ruby: chara.ruby,
  }));
  if (ctx.query.bandId) {
    ctx.body = ctx.body
      .filter(chara => ctx.query.bandId.includes(chara.bandId));
  }
  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body.slice((page - 1) * limit, page * limit),
  };
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = charaMap[ctx.params.server][ctx.params.id];
  } catch (error) {
    ctx.throw(400, 'character not exists');
  } finally {
    await next();
  }
});

router.get('/band', async (ctx, next) => {
  ctx.body = charaList[ctx.params.server].filter(chara => chara.bandId).map(chara => ({
    characterId: chara.characterId,
    characterType: chara.characterType,
    bandId: chara.bandId,
    characterName: chara.characterName,
    firstName: chara.firstName,
    lastName: chara.lastName,
    ruby: chara.ruby,
  }));
  await next();
});

export default router;
