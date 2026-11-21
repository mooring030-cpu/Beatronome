/* Audio-thread heartbeat: avoids dependence on a background-throttled window timer.
 * No audio is generated; the existing Web Audio click/drum scheduler owns the voices. */
class BeatronomeAudioClock extends AudioWorkletProcessor {
  constructor(){super();this.frames=0;this.active=false;this.port.onmessage=e=>{this.active=e.data?.type==='start';};}
  process(){
    if(!this.active)return true;
    this.frames+=128;
    if(this.frames>=sampleRate*.045){this.frames=0;this.port.postMessage('tick');}
    return true;
  }
}
registerProcessor('beatronome-audio-clock',BeatronomeAudioClock);
