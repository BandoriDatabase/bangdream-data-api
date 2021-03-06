import fetch from 'isomorphic-fetch';
import { remoteAddr } from '../config';
import chartNameOverride from '../overrides/chartAssetBundleName.json';

// map note type
const keyMap = {
  'flick.wav': 'Flick',
  'bd.wav': 'Single',
  'fever_note.wav': 'FeverSingle',
  'fever_note_flick.wav': 'FeverFlick',
  'slide_a.wav': 'Slide_A',
  'slide_end_a.wav': 'SlideEnd_A',
  'slide_b.wav': 'Slide_B',
  'slide_end_b.wav': 'SlideEnd_B',
  'skill.wav': 'Skill',
  'slide_end_flick_a.wav': 'SlideEndFlick_A',
  'slide_end_flick_b.wav': 'SlideEndFlick_B',
  'cmd_fever_ready.wav': 'CmdFeverReady',
  'cmd_fever_start.wav': 'CmdFeverStart',
  'cmd_fever_end.wav': 'CmdFeverEnd',
  'cmd_fever_checkpoint.wav': 'CmdFeverCheckpoint',
  'fever_slide_a.wav': 'Slide_A',
  'fever_slide_end_a.wav': 'SlideEnd_A',
  'fever_slide_b.wav': 'Slide_B',
  'fever_slide_end_b.wav': 'SlideEnd_B',
  'fever_note_slide_a.wav': 'Slide_A',
  'fever_note_slide_end_a.wav': 'SlideEnd_A',
  'fever_note_slide_b.wav': 'Slide_B',
  'fever_note_slide_end_b.wav': 'SlideEnd_B',
};

const laneMap = {
  6: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  8: 7,
};

/**
 *
 * @param {string} bmsText
 */
function decodeChart(bmsText) {
  const res = {
    metadata: {
      bpm: 0,
      bgm: '',
      fever: {
        ready: 0,
        start: 0,
        end: 0,
        check: 0,
      },
      combo: 0,
    },
    objects: [],
  };
  let useBPM = 0;
  let baseTiming = 0;
  let lastBPMChangeBeat = 0;

  // split by line
  const bmsLines = bmsText.split('\n');
  const keyEffect = {};
  const isInLongObj = {};
  const isInSlide = {
    A: false,
    B: false,
  };

  bmsLines.forEach((line) => {
    if (line.startsWith('#BPM')) {
      res.metadata.bpm = Number(bmsLines[7].slice(5));
      useBPM = res.metadata.bpm;
    } else if (line.startsWith('#WAV')) {
      const wavRegRes = line.match(/#WAV(.{2}) (.*\.wav)/);
      keyEffect[wavRegRes[1]] = keyMap[wavRegRes[2]] || wavRegRes[2];
      if (wavRegRes[2].indexOf('bgm') !== -1) {
        const { 2: bgm } = wavRegRes;
        res.metadata.bgm = bgm;
      }
    } else if (line.search(/#\d{5}:.*/) !== -1) {
      const objRegRes = line.match(/#(\d{3})(\d)(\d):(.*)/);
      const measure = Number(objRegRes[1]);
      const measureType = Number(objRegRes[2]);
      const lane = Number(objRegRes[3]);

      if (measureType === 1) {
        // normal object
        objRegRes[4].match(/(..)/g).forEach((objEffect, idx, arr) => {
          if (objEffect === '00') return;
          const effect = keyEffect[objEffect] || 'Single';
          const objBeat = (measure + ((1 / arr.length) * idx)) * 4;
          let property = 'Single';
          if (effect.includes('Slide')) {
            property = 'Slide';
          }

          res.objects.push({
            beat: objBeat,
            effect,
            property,
            type: 'Object',
            lane: laneMap[lane],
          });
        });
      } else if (measureType === 5) {
        // long object
        objRegRes[4].match(/(..)/g).forEach((objEffect, idx, arr) => {
          if (objEffect === '00') return;
          const effect = keyEffect[objEffect] || 'Single';
          const objBeat = (measure + ((1 / arr.length) * idx)) * 4;
          let property;

          if (!isInLongObj[lane]) {
            isInLongObj[lane] = true;
            property = 'LongStart';
          } else {
            isInLongObj[lane] = false;
            property = 'LongEnd';
          }

          res.objects.push({
            beat: objBeat,
            effect,
            property,
            type: 'Object',
            lane: laneMap[lane],
          });
        });
      } else if (measureType === 0) {
        // special
        if (lane === 1) {
          // some operation
          objRegRes[4].match(/(..)/g).forEach((objEffect, idx, arr) => {
            if (objEffect === '00') return;

            const effect = keyEffect[objEffect] || 'Single';
            const objBeat = (measure + ((1 / arr.length) * idx)) * 4;
            const newLen = res.objects.push({
              beat: objBeat,
              effect,
              property: 'Special',
              type: 'System',
            });

            if (effect === 'CmdFeverReady') {
              res.metadata.fever.ready = newLen - 1;
            } else if (effect === 'CmdFeverStart') {
              res.metadata.fever.start = newLen - 1;
            } else if (effect === 'CmdFeverEnd') {
              res.metadata.fever.end = newLen - 1;
            } else if (effect === 'CmdFeverCheckpoint') {
              res.metadata.fever.check = newLen - 1;
            }
          });
        } else if (lane === 3) {
          // bpm change
          objRegRes[4].match(/(..)/g).forEach((objEffect, idx, arr) => {
            if (objEffect === '00') return;

            const objBeat = (measure + ((1 / arr.length) * idx)) * 4;
            res.objects.push({
              beat: objBeat,
              effect: 'BPMChange',
              property: 'Special',
              type: 'System',
              value: Number(`0x${objEffect}`),
            });
          });
        }
      }
    }
  });

  // sort objects by beats
  res.objects = res.objects.sort((a, b) => {
    // check if they have same beat
    if (a.beat === b.beat) {
      // sort by their effect, slideEnd before other note
      return b.effect.indexOf('SlideEnd') - a.effect.indexOf('SlideEnd');
    }
    return a.beat - b.beat;
  });

  res.objects.forEach((obj) => {
    // calc timing
    const { beat, effect, property } = obj;
    switch (property) {
      case 'Special': {
        const timing = baseTiming + (((beat - lastBPMChangeBeat) / useBPM) * 60);
        obj.timing = timing;
        if (effect === 'BPMChange') {
          useBPM = obj.value;
          lastBPMChangeBeat = beat;
          baseTiming = timing;
        }
        break;
      }
      case 'Slide': {
        const timing = baseTiming + (((beat - lastBPMChangeBeat) / useBPM) * 60);
        obj.timing = timing;
        if (!isInSlide[effect.slice(-1)]) {
          if (effect.includes('End')) {
            obj.effect = effect.replace('SlideEnd', 'SlideStart');
          } else {
            obj.effect = effect.replace('Slide', 'SlideStart');
          }
          isInSlide[effect.slice(-1)] = true;
        } else if (effect.includes('End')) {
          isInSlide[effect.slice(-1)] = false;
        }
        break;
      }
      default: {
        const timing = baseTiming + (((beat - lastBPMChangeBeat) / useBPM) * 60);
        obj.timing = timing;
      }
    }
  });
  res.metadata.combo = res.objects.filter(obj => obj.type !== 'System').length;

  return res;
}

async function getRemoteBMSRaw(musicId, chartAssetBundleName, difficulty) {
  const remoteChartFileName = `${remoteAddr}/bandori-assets/musicscore/${String(musicId).padStart(3, '0')}_rip/${chartNameOverride[chartAssetBundleName] || chartAssetBundleName}_${difficulty}.txt`;
  return (await fetch(remoteChartFileName)).text();
}

export default async function getRemoteBMSChart(music, difficulty) {
  const bmsText = await getRemoteBMSRaw(music.musicId, music.chartAssetBundleName, difficulty);
  return decodeChart(bmsText);
}
