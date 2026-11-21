/* Lightweight secondary scheduling heartbeat. Browser throttling is possible;
 * AudioWorklet and a pre-scheduled audio horizon are the primary defenses. */
let timer=null;
onmessage=e=>{
  if(e.data?.type==='start'){
    if(timer===null)timer=setInterval(()=>postMessage('tick'),90);
  }else if(e.data?.type==='stop'){
    if(timer!==null)clearInterval(timer);
    timer=null;
  }
};
