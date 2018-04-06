import Router from 'koa-router';
import fetch from 'isomorphic-fetch';
import { apiBase } from '../config';

const api = 'scenario';
const router = new Router();

router.prefix(`${apiBase}/${api}`);

router.get('/chara/:name', async (ctx, next) => {
  try {
    const remoteScenarioPath = `https://res.bangdream.ga/assets-${ctx.params.server}/characters/resourceset/Scenario${ctx.params.name}.json`;
    const scenarioData = await (await fetch(remoteScenarioPath)).json();
    const ret = {};
    ret.env = {
      backgroundImage: `assets/${scenarioData.firstLayout.firstBackgroundBundleName}_${scenarioData.firstLayout.firstBackground}.png`,
      bgm: `assets/sound/scenario/bgm/${scenarioData.firstLayout.firstBgm}.mp3`,
    };
    ret.talk = scenarioData.talkData.Array.map(elem => ({
      text: elem.data.talkCharacters.body,
      charaId: elem.data.talkCharacters.Array[0].data.characterId,
      charaName: elem.data.talkCharacters.windowDisplayName,
      voice: elem.data.voices.Array[0] ? `assets/sound/voice/scenario/resourceset/${elem.data.voices.Array[0].data.voiceId}.mp3` : null,
    }));

    ctx.body = ret;
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'scenario data not found');
  } finally {
    await next();
  }
});

export default router;
