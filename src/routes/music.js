import Router from 'koa-router';
import path from 'path';
import fs from 'fs-extra';
import { apiBase, pageLimit } from '../config';
import dbMap from '../db';
import bmsConverter from '../utils/bmsConverter';
// import mapToList from '../utils/mapToList';

const api = 'music';
const router = new Router();
const musicList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].musicList.entries.slice().reverse();
  return sum;
}, {});
const musicDiffiList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].musicDifficultyList.entries;
  return sum;
}, {});
const bandMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].bandMap.entries;
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
  ctx.body = musicList[ctx.params.server].map(music => Object.assign({}, music, {
    bgmFile: `/assets/sound/${music.bgmId}.mp3`,
    jacket: `/assets/musicjacket/${music.jacketImage}_jacket.png`,
    bandName: bandMap[ctx.params.server][music.bandId].bandName,
    difficulty: musicDiffiList[ctx.params.server].filter(elem => elem.musicId === music.musicId).map(elem => elem.level),
    maxDifficilty: musicDiffiList[ctx.params.server].filter(elem => elem.musicId === music.musicId)[1].level,
  }));
  if (ctx.query.bandId) {
    ctx.body = ctx.body
      .filter(music => ctx.query.bandId.includes(music.bandId.toString()));
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

router.get('/chart/:id(\\d{1,4})/:difficulty(\\w+)', async (ctx, next) => {
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

export default router;
