import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'chara';
const router = new Router();
const charaList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].masterCharacterInfoMap.entries);
  return sum;
}, {});
const charaMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].masterCharacterInfoMap.entries;
  return sum;
}, {});

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

router.get('/:id(\\d+)', async (ctx, next) => {
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
  today.setFullYear(2000);

  const ret = {
    today: [],
    next: [],
  };
  let charaBirthdayList = charaList[ctx.params.server]
    .filter(chara => chara.bandId && Number(chara.profile.birthday) >= today.getTime() - (24 * 3600 * 1000))
    .sort((a, b) => Number(a.profile.birthday) - Number(b.profile.birthday));
  if (!charaBirthdayList.length) {
    charaBirthdayList = charaList[ctx.params.server].sort((a, b) => Number(a.profile.birthday) - Number(b.profile.birthday)).slice(0, 1);
  }

  if (today.getTime() < Number(charaBirthdayList[0].profile.birthday) + (24 * 3600 * 1000) &&
    today.getTime() > Number(charaBirthdayList[0].profile.birthday)) {
    // same birthday check
    const allTodayCharas = charaBirthdayList.filter(chara =>
      chara.profile.birthday === charaBirthdayList[0].profile.birthday);
    ret.today = allTodayCharas.map((chara) => {
      const bd = new Date(Number(chara.profile.birthday) + (9 * 3600 * 1000));
      return {
        chara,
        birthday: {
          month: bd.getMonth() + 1,
          day: bd.getDate(),
        },
      };
    });

    charaBirthdayList.splice(0, allTodayCharas.length);
  }

  // same birthday check
  const allNextCharas = charaBirthdayList.filter(chara =>
    chara.profile.birthday === charaBirthdayList[0].profile.birthday);
  ret.next = allNextCharas.map((chara) => {
    const bd = new Date(Number(chara.profile.birthday) + (9 * 3600 * 1000));
    return {
      chara,
      birthday: {
        month: bd.getMonth() + 1,
        day: bd.getDate(),
      },
    };
  });

  ctx.body = ret;
  await next();
});

export default router;
