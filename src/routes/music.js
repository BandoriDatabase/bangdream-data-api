import Router from 'koa-router';
import { apiBase, masDBAddr, pageLimit } from '../config';
// import mapToList from '../utils/mapToList';

const api = 'music';
const router = new Router();
const masterdb = require(masDBAddr);
const musicList = masterdb.musicList.entries;
const musicDiffiList = masterdb.musicDifficultyList.entries;

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
  if (limit * (page - 1) > musicList.length || limit > pageLimit) {
    ctx.throw(400, 'query length exceed limit');
  }
  ctx.body = musicList.map(music => ({
    id: music.id,
    bgmFile: `/assets/sound/${music.bgmId}.mp3`,
    jacket: `/assets/musicjacket/${music.jacketImage}_jacket.png`,
    title: music.title,
    bandId: music.bandId,
    tag: music.tag,
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
  ctx.body = musicList.find(elem => elem.id === ctx.params.id);
  ctx.body.difficulty = musicDiffiList.find(elem => elem.musicId === ctx.params.id);
  ctx.body.bandName = masterdb.bandMap.entries[ctx.body.bandId].bandName;
  await next();
});

export default router;
