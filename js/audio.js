/* 原生 Web Audio 製作輕量 8-bit 音效，無外部音檔。 */
DotGame.Audio = (() => {
  let context;
  function play(kind) {
    if (!DotGame.Storage.get().sound) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === 'suspended') context.resume();
      const notes = {
        select: [440], match: [587, 784], bonus: [659, 784, 988, 1318],
        win: [523, 659, 784, 1047], lose: [330, 294, 220], shuffle: [392, 523, 440], error: [180]
      }[kind] || [440];
      notes.forEach((frequency, i) => {
        const osc = context.createOscillator(), gain = context.createGain();
        const at = context.currentTime + i * .075;
        osc.type = 'triangle'; osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.065, at + .008);
        gain.gain.exponentialRampToValueAtTime(.001, at + .15);
        osc.connect(gain); gain.connect(context.destination); osc.start(at); osc.stop(at + .16);
      });
    } catch { /* 音訊不可用時保留完整玩法。 */ }
  }
  return { play };
})();
