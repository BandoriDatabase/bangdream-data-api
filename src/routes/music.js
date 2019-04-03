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
  ctx.body = musicList[ctx.params.server];
  if (ctx.query.bandId) {
    ctx.body = ctx.body
      .filter(music => ctx.query.bandId.includes(music.bandId.toString()));
  }
  if (ctx.query.tag && ctx.query.tag !== 'all') {
    ctx.body = ctx.body
      .filter(music => music.tag === ctx.query.tag);
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
      data: ctx.body.map(music => Object.assign({}, music, {
        bgmFile: `/assets${music.musicId >= 1000 ? `-${ctx.params.server}` : ''}/sound/${music.bgmId}_rip/${music.bgmId}.mp3`,
        thumb: `/assets${music.musicId >= 1000 ? `-${ctx.params.server}` : ''}/musicjacket/${music.jacketImage}_rip/thumb.png`,
        jacket: `/assets${music.musicId >= 1000 ? `-${ctx.params.server}` : ''}/musicjacket/${music.jacketImage}_rip/jacket.png`,
        bandName: bandMap[ctx.params.server][music.bandId] ? bandMap[ctx.params.server][music.bandId].bandName : 'Unknown',
        difficulty: musicDiffiList[ctx.params.server].filter(elem => elem.musicId === music.musicId).map(elem => elem.level),
        maxDifficilty: musicDiffiList[ctx.params.server].filter(elem => elem.musicId === music.musicId)[1].level,
      })),
    };
  }
  await next();
});

router.get('/:id(\\d+)', async (ctx, next) => {
  try {
    ctx.body = musicList[ctx.params.server].find(elem => elem.musicId === Number(ctx.params.id));
    ctx.body.difficulty = musicDiffiList[ctx.params.server].filter(elem => elem.musicId === Number(ctx.params.id));
    ctx.body.combo = ctx.body.difficulty[0].combo;
    ctx.body.bandName = bandMap[ctx.params.server][ctx.body.bandId].bandName;
    ctx.body.bgmFile = `/assets${Number(ctx.params.id) >= 1000 ? `-${ctx.params.server}` : ''}/sound/${ctx.body.bgmId}_rip/${ctx.body.bgmId}.mp3`;
    ctx.body.thumb = `/assets${Number(ctx.params.id) >= 1000 ? `-${ctx.params.server}` : ''}/musicjacket/${ctx.body.jacketImage}_rip/thumb.png`;
    ctx.body.jacket = `/assets${Number(ctx.params.id) >= 1000 ? `-${ctx.params.server}` : ''}/musicjacket/${ctx.body.jacketImage}_rip/jacket.png`;
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
