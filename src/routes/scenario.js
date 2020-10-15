import Router from 'koa-router';
import fetch from 'isomorphic-fetch';
import { apiBase, remoteAddr } from '../config';

const api = 'scenario';
const router = new Router();

router.prefix(`${apiBase}/${api}`);

const actionType = [
  'None', 'Talk', 'CharacerLayout', 'InputName', 'CharacterMotion',
  'Selectable', 'SpecialEffect', 'Sound',
];

const progressType = ['Now', 'WaitFinished'];

const specialEffectType = [
  'None', 'BlackIn', 'BlackOut', 'WhiteIn', 'WhiteOut', 'ShakeScreen',
  'ShakeWindow', 'ChangeBackground', 'Telop', 'FlashbackIn',
  'FlashbackOut', 'ChangeCardStill', 'AmbientColorNormal',
  'AmbientColorEvening', 'AmbientColorNight', 'PlayScenarioEffect',
  'StopScenarioEffect', 'ChangeBackgroundStill',
];

const layoutType = ['None', 'Move', 'Apper', 'Hide', 'ShakeX', 'ShakeY'];

const layoutMoveSpeedType = ['Normal', 'Fast', 'Slow'];

const layoutDepthType = ['NotSet', 'Front', 'Back'];

const selectableType = ['Talk', 'QuestList'];

router.get('/:assetBundleName/:name', async (ctx, next) => {
  try {
    const remoteScenarioPath = `${remoteAddr}/bandori-assets/${ctx.params.server}/characters/resourceset/${ctx.params.assetBundleName}_rip/scenario${ctx.params.name}.asset`;
    const scenarioData = await (await fetch(remoteScenarioPath)).json();
    const {
      firstLayout, firstBgm, firstBackground, firstBackgroundBundleName, appearCharacters, needBundleNames, includeSoundDataBundleNames,
    } = scenarioData;

    const snippets = scenarioData.snippets.map((elem) => {
      elem.progressType = progressType[elem.progressType];
      elem.actionType = actionType[elem.actionType];
      switch (elem.actionType) {
        case 'Talk':
          elem.talkData = scenarioData.talkData[elem.referenceIndex];
          if (elem.talkData.voices.length) {
            elem.talkData.voices = elem.talkData.voices.map(voice => Object.assign(voice, {
              voicePath: `assets/jp/sound/voice/scenario/resourceset/${ctx.params.assetBundleName}_rip/${voice.voiceId}.mp3`,
            }));
          }
          break;
        case 'CharacerLayout':
        case 'CharacterMotion':
          elem.layoutData = scenarioData.layoutData[elem.referenceIndex];
          elem.layoutData.type = layoutType[elem.layoutData.type];
          elem.layoutData.moveSpeedType = layoutMoveSpeedType[elem.layoutData.moveSpeedType];
          elem.layoutData.depthType = layoutDepthType[elem.layoutData.depthType];
          break;
        case 'Selectable':
          elem.selectableData = scenarioData.selectableData[elem.referenceIndex];
          elem.selectableData.type = selectableType[elem.selectableData.type];
          break;
        case 'SpecialEffect':
          elem.specialEffectData = scenarioData.specialEffectData[elem.referenceIndex];
          elem.specialEffectData.effectType = specialEffectType[elem.specialEffectData.effectType];
          break;
        case 'Sound':
          elem.soundData = scenarioData.soundData[elem.referenceIndex];
          break;
        default:
          break;
      }
      delete elem.referenceIndex;

      return elem;
    });

    ctx.body = {
      snippets,
      firstLayout,
      firstBgm: `assets/jp/sound/scenario/bgm/${firstBgm.toLowerCase()}_rip/${firstBgm}.mp3`,
      firstBackground: `assets/jp/${firstBackgroundBundleName}_rip/${firstBackground}.webp`,
      appearCharacters,
      needBundleNames,
      includeSoundDataBundleNames,
    };
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'scenario data not found');
  } finally {
    await next();
  }
});

export default router;
