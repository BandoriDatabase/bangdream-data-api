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

router.get('/birthday', async (ctx, next) => {
  // chara birthday is stored as the day in year 2000, 00:00:00 UTC+9
  // get today's date and month
  const today = new Date();
  const todayMonth = today.toISOString().substr(5, 2);
  const todayDate = today.toISOString().substr(8, 2);

  const ret = {};
  charaList[ctx.params.server].filter(chara => chara.bandId).forEach((chara) => {
    const bd = new Date(Number(chara.profile.birthday) + (9 * 3600 * 1000));
    const bdMonth = bd.toISOString().substr(5, 2);
    const bdDate = bd.toISOString().substr(8, 2);

    if (bdMonth === todayMonth && bdDate === todayDate) {
      // check if today is the birthday
      ret.today = {
        chara,
        birthday: {
          timestamp: Number(chara.profile.birthday) + (9 * 3600 * 1000),
          month: bdMonth,
          day: bdDate,
        },
      };
    } else if (!ret.next || (bdMonth > todayMonth && bdMonth <= ret.next.birthday.month && bdDate < ret.next.birthday.day)
      || (bdMonth === todayMonth && bdMonth <= ret.next.birthday.month && bdDate > todayDate && bdDate < ret.next.birthday.day)) {
      // record it as next birthday
      ret.next = {
        chara,
        birthday: {
          timestamp: Number(chara.profile.birthday) + (9 * 3600 * 1000),
          month: bdMonth,
          day: bdDate,
        },
      };
    }
  });

  ctx.body = ret;
  await next();
});

export default router;
