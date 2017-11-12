import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import { dbJP, dbTW } from '../db';
// import mapToList from '../utils/mapToList';

const api = 'music';
const router = new Router();
const musicList = {
  jp: dbJP.musicList.entries.slice().reverse(),
  tw: dbTW.musicList.entries.slice().reverse(),
};
const musicDiffiList = {
  jp: dbJP.musicDifficultyList.entries,
  tw: dbTW.musicDifficultyList.entries,
};
const bandMap = {
  jp: dbJP.bandMap.entries,
  tw: dbTW.bandMap.entries,
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
  if (limit * (page - 1) > musicList[ctx.params.server].length || limit > pageLimit) {
    ctx.throw(400, 'query length exceed limit');
  }
  ctx.body = musicList[ctx.params.server].map(music => ({
    musicId: music.musicId,
    bgmFile: `/assets/sound/${music.bgmId}.mp3`,
    jacket: `/assets/musicjacket/${music.jacketImage}_jacket.png`,
    title: music.title,
    bandId: music.bandId,
    tag: music.tag,
    bandName: bandMap[ctx.params.server][music.bandId].bandName,
  }));
  if (ctx.query.bandId) {
    ctx.body = ctx.body
      .filter(music => ctx.query.bandId.includes(music.bandId));
  }
  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body.slice((page - 1) * limit, page * limit),
  };
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = musicList[ctx.params.server].find(elem => elem.musicId === Number(ctx.params.id));
    ctx.body.difficulty = musicDiffiList[ctx.params.server].filter(elem => elem.musicId === Number(ctx.params.id));
    ctx.body.combo = ctx.body.difficulty[0].combo;
    ctx.body.bandName = bandMap[ctx.params.server][ctx.body.bandId].bandName;
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'music not exists');
  } finally {
    await next();
  }
});

export default router;
