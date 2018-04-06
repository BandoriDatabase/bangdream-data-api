import Router from 'koa-router';
import path from 'path';
import fetch from 'isomorphic-fetch';
import { apiBase } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'live2d';
const router = new Router();
const live2dVoiceList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].commonsLive2dMap.entries);
  return sum;
}, {});
// const live2dVoiceMap = {
//   jp: dbJP.commonsLive2dMap.entries,
//   tw: dbTW.commonsLive2dMap.entries,
// };
const live2dCostumList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].costumeMap.entries);
  return sum;
}, {});
const live2dCostumMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].costumeMap.entries;
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/chara/:charaId(\\d{1,4})', async (ctx, next) => {
  try {
    const charaLive2dVoices = live2dVoiceList[ctx.params.server]
      .filter(elem => elem.characterId === Number(ctx.params.charaId));
    if (!charaLive2dVoices.length) throw new Error();
    const charaLive2dCostums = live2dCostumList[ctx.params.server]
      .filter(elem => elem.characterId === Number(ctx.params.charaId));
    if (!charaLive2dCostums.length) throw new Error();

    ctx.body = {
      voices: charaLive2dVoices,
      costums: charaLive2dCostums,
    };
  } catch (error) {
    ctx.throw(400, 'live2d data for this character not found');
  } finally {
    await next();
  }
});

router.get('/model/:costumId(\\d{1,4})', async (ctx, next) => {
  try {
    const costum = live2dCostumMap[ctx.params.server][ctx.params.costumId];
    if (!costum) throw new Error();
    const live2dAsset = costum.assetBundleName;
    const remoteLive2dBuildDataPath = `https://res.bangdream.ga/assets/live2d/chara/${live2dAsset}_buildData.json`;
    const buildData = await (await fetch(remoteLive2dBuildDataPath)).json();

    ctx.body = {
      type: 'Live2D Model Setting',
      name: costum.description,
      model: `live2d/${path.basename(buildData.model.bundleName)}_${buildData.model.fileName.replace('.bytes', '')}`,
      textures: buildData.textures.Array.map(elem => `live2d/${path.basename(elem.data.bundleName)}_${elem.data.fileName.replace('.png', '')}.png`),
      physics: `live2d/${path.basename(buildData.physics.bundleName)}_${buildData.physics.fileName.replace('.json', '')}`,
      expressions: buildData.expressions.Array.map(elem => ({
        name: elem.data.fileName.replace('.exp.json', ''),
        file: `live2d/${path.basename(elem.data.bundleName)}_${elem.data.fileName.replace('.json', '')}`,
      })),
      motions: buildData.motions.Array.reduce((prev, curr) => {
        const key = curr.data.fileName.split('.')[0];
        prev[key] = [
          {
            file: `live2d/${path.basename(curr.data.bundleName)}_${curr.data.fileName.replace('.bytes', '')}`,
            fade_in: 2000,
            fade_out: 2000,
          },
        ];
        return prev;
      }, {}),
    };
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'live2d data for this costum not found');
  } finally {
    await next();
  }
});

export default router;
