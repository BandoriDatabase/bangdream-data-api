import Router from 'koa-router';
import path from 'path';
import fetch from 'isomorphic-fetch';
import { apiBase, remoteAddr } from '../config';
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
const live2dCostumeList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].costumeMap.entries);
  return sum;
}, {});
const live2dCostumeMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].costumeMap.entries;
  return sum;
}, {});
const cardList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].cardInfos.entries);
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/chara/:charaId(\\d+)', async (ctx, next) => {
  try {
    const charaLive2dVoices = live2dVoiceList[ctx.params.server]
      .filter(elem => elem.characterId === Number(ctx.params.charaId));
    if (!charaLive2dVoices.length) throw new Error();
    const charaLive2dCostumes = live2dCostumeList[ctx.params.server]
      .filter(elem => elem.characterId === Number(ctx.params.charaId))
      .map((costume) => {
        const costumeCard = cardList[ctx.params.server].find(card => card.costumeId === costume.costumeId);
        if (!costumeCard) return costume;
        return Object.assign({}, costume, {
          cardId: costumeCard.cardId,
        });
      });
    if (!charaLive2dCostumes.length) throw new Error();

    ctx.body = {
      voices: charaLive2dVoices,
      costumes: charaLive2dCostumes,
    };
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'live2d data for this character not found');
  } finally {
    await next();
  }
});

router.get('/costume/:costumeId(\\d+)', async (ctx, next) => {
  try {
    const costume = live2dCostumeMap[ctx.params.server][ctx.params.costumeId];
    if (!costume) throw new Error();

    ctx.body = costume;
  } catch (error) {
    ctx.throw(400, 'costume data for this id not found');
  } finally {
    await next();
  }
});

router.get('/model/:costumeId(\\d+)', async (ctx, next) => {
  try {
    const costume = live2dCostumeMap[ctx.params.server][ctx.params.costumeId];
    if (!costume) throw new Error();
    const live2dAsset = costume.assetBundleName;
    const remoteLive2dBuildDataPath = `${remoteAddr}/assets/live2d/chara/${live2dAsset}_rip/buildData.json`;
    const buildData = await (await fetch(remoteLive2dBuildDataPath)).json();

    ctx.body = {
      type: 'Live2D Model Setting',
      name: costume.description,
      model: `live2d/${path.basename(buildData.model.bundleName)}_rip/${buildData.model.fileName.replace('.bytes', '')}`,
      textures: buildData.textures.Array.map(elem => `live2d/${path.basename(elem.data.bundleName)}_rip/${elem.data.fileName.replace('.png', '')}.png`),
      physics: `live2d/${path.basename(buildData.physics.bundleName)}_rip/${buildData.physics.fileName.replace('.json', buildData.physics.fileName.indexOf('.physics') === -1 ? '.txt' : '')}`,
      expressions: buildData.expressions.Array.map(elem => ({
        name: elem.data.fileName.replace('.exp.json', ''),
        file: `live2d/${path.basename(elem.data.bundleName)}_rip/${elem.data.fileName.replace('.json', '')}`,
      })),
      motions: buildData.motions.Array.reduce((prev, curr) => {
        const key = curr.data.fileName.split('.')[0];
        prev[key] = [
          {
            file: `live2d/${path.basename(curr.data.bundleName)}_rip/${curr.data.fileName.replace('.bytes', '')}`,
            fade_in: 2000,
            fade_out: 2000,
          },
        ];
        return prev;
      }, {}),
    };
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'live2d data for this costume not found');
  } finally {
    await next();
  }
});

export default router;
