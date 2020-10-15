import Router from 'koa-router';
import path from 'path';
import fs from 'fs-extra';
import { apiBase, pageLimit } from '../config';
import dbMap from '../db';
import bmsConverter from '../utils/bmsConverter';
// import mapToList from '../utils/mapToList';

const api = 'music';
const router = new Router();
const musicDiffiList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].masterMusicDifficultyList.entries;
  return sum;
}, {});
const bandMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].masterBandMap.entries;
  return sum;
}, {});
const musicVideoMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].masterMusicVideoListMap.entries;
  return sum;
}, {});
const musicList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].masterMusicList.entries.slice().reverse().map(music => Object.assign({}, music, {
    musicTitle: music.musicTitle.replace('\u7505', '[FULL] ').replace('\u8e84', '[ORIG] '),
    bgmFile: `/assets/${music.musicId >= 1000 ? `${region}` : 'jp'}/sound/${music.bgmId}_rip/${music.bgmId}.mp3`,
    thumb: music.musicId === 273 ? '/assets/jp/musicjacket/none_rip/thumb.webp' : `/assets/${music.musicId >= 1000 ? `${region}` : 'jp'}/musicjacket/musicjacket${Math.floor(music.musicId / 10) + Number(music.musicId % 10 !== 0)}0_rip/${music.jacketImage}/thumb.webp`,
    jacket: music.musicId === 273 ? '/assets/jp/musicjacket/none_rip/jacket.webp' : `/assets/${music.musicId >= 1000 ? `${region}` : 'jp'}/musicjacket/musicjacket${Math.floor(music.musicId / 10) + Number(music.musicId % 10 !== 0)}0_rip/${music.jacketImage}/jacket.webp`,
    bandName: bandMap[region][music.bandId] ? bandMap[region][music.bandId].bandName : 'Unknown',
    difficulty: musicDiffiList[region].filter(elem => elem.musicId === music.musicId).map(elem => elem.playLevel),
    hasMV: Boolean(musicVideoMap[region][music.musicId]),
  }));
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  // query accept 'bandId', 'limit', 'page', 'orderkey', 'sort'
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
  ctx.body = musicList[ctx.params.server];
  if (ctx.query.bandId) {
    ctx.body = ctx.body
      .filter(music => ctx.query.bandId.includes(music.bandId.toString()));
  }
  if (ctx.query.tag && ctx.query.tag !== 'all') {
    ctx.body = ctx.body
      .filter(music => music.musicDataType === ctx.query.musicDataType);
  }
  if (ctx.query.mv && ctx.query.mv === 'true') {
    ctx.body = ctx.body.filter(music => music.hasMV);
  }
  if (ctx.query.sp && ctx.query.sp === 'true') {
    ctx.body = ctx.body.filter(music => music.difficulty.length === 5);
  }
  if (ctx.query.sort && ctx.query.orderKey) {
    if (ctx.query.sort === 'asc') ctx.body = ctx.body.sort((a, b) => a[ctx.query.orderKey] - b[ctx.query.orderKey]);
    else if (ctx.query.sort === 'desc') ctx.body = ctx.body.sort((a, b) => b[ctx.query.orderKey] - a[ctx.query.orderKey]);
  }
  ctx.body = ctx.body.slice((page - 1) * limit, page * limit);
  if (!ctx.body.length) {
    ctx.throw(400, 'query length exceed limit');
    ctx.body = null;
  } else {
    ctx.body = {
      totalCount: ctx.body.length,
      data: ctx.body,
    };
  }
  await next();
});

router.get('/:id(\\d+)', async (ctx, next) => {
  try {
    ctx.body = musicList[ctx.params.server].find(elem => elem.musicId === Number(ctx.params.id));
    ctx.body = Object.assign({}, ctx.body, {
      difficulty: musicDiffiList[ctx.params.server].filter(elem => elem.musicId === Number(ctx.params.id)),
      notesQuantity: ctx.body.difficulty[0].notesQuantity,
      mv: ctx.body.hasMV ? musicVideoMap[ctx.params.server][ctx.params.id].entries : undefined,
    });
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'music not exists');
  } finally {
    await next();
  }
});

router.get('/chart/:id(\\d+)/:difficulty(\\w+)', async (ctx, next) => {
  try {
    const music = musicList[ctx.params.server].find(elem => elem.musicId === Number(ctx.params.id));
    const localChartFileName = path.join(
      __dirname,
      '../../cache/musicscore',
      `${music.chartAssetBundleName}_${ctx.params.difficulty}.json`,
    );
    if (!fs.existsSync(localChartFileName)) {
      // no cached file here, fetch a new one
      const chartData = await bmsConverter(music, ctx.params.difficulty);

      await fs.outputJSON(localChartFileName, chartData);
      ctx.body = chartData;
    } else {
      ctx.body = await fs.readJSON(localChartFileName);
    }
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'music not exists');
  } finally {
    await next();
  }
});

router.delete('/chart/:id(\\d+)/:difficulty(\\w+)', async (ctx, next) => {
  // reject on wrong api key
  if (!ctx.headers['x-api-key'] ||
    ctx.headers['x-api-key'] !== process.env.ALLOW_API_KEY) {
    ctx.throw(403, 'missing api key');
    await next();
    return;
  }
  try {
    const music = musicList[ctx.params.server].find(elem => elem.musicId === Number(ctx.params.id));
    const localChartFileName = path.join(
      __dirname,
      '../../cache/musicscore',
      `${music.chartAssetBundleName}_${ctx.params.difficulty}.json`,
    );
    if (fs.existsSync(localChartFileName)) {
      // delete this cached file
      await fs.remove(localChartFileName);
      ctx.body = { result: 'succeed' };
    }
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'music not exists');
  } finally {
    await next();
  }
});

export default router;
