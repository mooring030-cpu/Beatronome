/*
  Beatronome local-file pitch shifter.
  Delay/crossfade pitch-shift core derived from Chris Wilson's Jungle example.
  Copyright 2012 Google Inc. - BSD 3-Clause terms retained in THIRD_PARTY_NOTICES.txt.
*/
(function(global){
  'use strict';
  function createFadeBuffer(context, activeTime, fadeTime) {
    const length1 = Math.floor(activeTime * context.sampleRate);
    const length2 = Math.floor((activeTime - 2 * fadeTime) * context.sampleRate);
    const length = length1 + length2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const p = buffer.getChannelData(0);
    const fadeLength = Math.floor(fadeTime * context.sampleRate);
    const fadeIndex1 = fadeLength;
    const fadeIndex2 = length1 - fadeLength;
    for (let i = 0; i < length1; ++i) {
      let value;
      if (i < fadeIndex1) value = Math.sqrt(i / Math.max(1, fadeLength));
      else if (i >= fadeIndex2) value = Math.sqrt(1 - (i - fadeIndex2) / Math.max(1, fadeLength));
      else value = 1;
      p[i] = Number.isFinite(value) ? value : 0;
    }
    return buffer;
  }

  function createDelayTimeBuffer(context, activeTime, fadeTime, shiftUp) {
    const length1 = Math.floor(activeTime * context.sampleRate);
    const length2 = Math.floor((activeTime - 2 * fadeTime) * context.sampleRate);
    const length = length1 + length2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const p = buffer.getChannelData(0);
    for (let i = 0; i < length1; ++i) p[i] = shiftUp ? (length1 - i) / length : i / length1;
    return buffer;
  }

  const delayTime = 0.100;
  const fadeTime = 0.050;
  const bufferTime = 0.100;

  function Jungle(context) {
    this.context = context;
    const input = context.createGain();
    const output = context.createGain();
    this.input = input;
    this.output = output;

    const mod1 = context.createBufferSource();
    const mod2 = context.createBufferSource();
    const mod3 = context.createBufferSource();
    const mod4 = context.createBufferSource();
    const shiftDownBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, false);
    const shiftUpBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, true);
    mod1.buffer = shiftDownBuffer; mod2.buffer = shiftDownBuffer; mod3.buffer = shiftUpBuffer; mod4.buffer = shiftUpBuffer;
    mod1.loop = mod2.loop = mod3.loop = mod4.loop = true;

    const mod1Gain = context.createGain();
    const mod2Gain = context.createGain();
    const mod3Gain = context.createGain();
    const mod4Gain = context.createGain();
    mod3Gain.gain.value = 0; mod4Gain.gain.value = 0;
    mod1.connect(mod1Gain); mod2.connect(mod2Gain); mod3.connect(mod3Gain); mod4.connect(mod4Gain);

    const modGain1 = context.createGain();
    const modGain2 = context.createGain();
    const delay1 = context.createDelay(1);
    const delay2 = context.createDelay(1);
    mod1Gain.connect(modGain1); mod2Gain.connect(modGain2); mod3Gain.connect(modGain1); mod4Gain.connect(modGain2);
    modGain1.connect(delay1.delayTime); modGain2.connect(delay2.delayTime);

    const fade1 = context.createBufferSource();
    const fade2 = context.createBufferSource();
    const fadeBuffer = createFadeBuffer(context, bufferTime, fadeTime);
    fade1.buffer = fadeBuffer; fade2.buffer = fadeBuffer; fade1.loop = fade2.loop = true;
    const mix1 = context.createGain(); const mix2 = context.createGain();
    mix1.gain.value = 0; mix2.gain.value = 0;
    fade1.connect(mix1.gain); fade2.connect(mix2.gain);

    input.connect(delay1); input.connect(delay2); delay1.connect(mix1); delay2.connect(mix2); mix1.connect(output); mix2.connect(output);

    const t = context.currentTime + 0.050;
    const t2 = t + bufferTime - fadeTime;
    mod1.start(t); mod2.start(t2); mod3.start(t); mod4.start(t2); fade1.start(t); fade2.start(t2);

    this.mod1Gain=mod1Gain; this.mod2Gain=mod2Gain; this.mod3Gain=mod3Gain; this.mod4Gain=mod4Gain;
    this.modGain1=modGain1; this.modGain2=modGain2;
    this.setDelay(delayTime);
  }

  Jungle.prototype.setDelay = function(value) {
    const now = this.context.currentTime;
    this.modGain1.gain.setTargetAtTime(0.5 * value, now, 0.010);
    this.modGain2.gain.setTargetAtTime(0.5 * value, now, 0.010);
  };

  Jungle.prototype.setPitchOffset = function(mult) {
    if (mult > 0) {
      this.mod1Gain.gain.value = 0; this.mod2Gain.gain.value = 0;
      this.mod3Gain.gain.value = 1; this.mod4Gain.gain.value = 1;
    } else {
      this.mod1Gain.gain.value = 1; this.mod2Gain.gain.value = 1;
      this.mod3Gain.gain.value = 0; this.mod4Gain.gain.value = 0;
    }
    this.setDelay(delayTime * Math.abs(mult));
  };

  function getMultiplier(x) {
    if (x < 0) return x / 12;
    const a5=1.8149080040913423e-7, a4=-0.000019413043101157434, a3=0.0009795096626987743;
    const a2=-0.014147877819596033, a1=0.23005591195033048, a0=0.02278153473118749;
    const x2=x*x, x3=x2*x, x4=x3*x, x5=x4*x;
    return a0 + x*a1 + x2*a2 + x3*a3 + x4*a4 + x5*a5;
  }

  function createBeatPitchShift(context) {
    const input=context.createGain(), output=context.createGain(), wet=context.createGain(), dry=context.createGain();
    const jungle=new Jungle(context);
    input.connect(wet); input.connect(dry); wet.connect(jungle.input); jungle.output.connect(output); dry.connect(output);
    let semitones=0;
    function setSemitones(value){
      semitones=Math.max(-12,Math.min(12,Number(value)||0));
      if(Math.abs(semitones)<0.001){dry.gain.setTargetAtTime(1,context.currentTime,.01);wet.gain.setTargetAtTime(0,context.currentTime,.01);}
      else{jungle.setPitchOffset(getMultiplier(semitones));dry.gain.setTargetAtTime(0,context.currentTime,.01);wet.gain.setTargetAtTime(1,context.currentTime,.01);}
    }
    setSemitones(0);
    return {input,output,setSemitones,get semitones(){return semitones;}};
  }

  global.createBeatPitchShift=createBeatPitchShift;
})(window);
