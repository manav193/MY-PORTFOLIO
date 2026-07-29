const params=new URLSearchParams(location.search);
if(params.get('id')==='fate-ai'){
  const key='portfolio-launch:fate-ai:v2';
  const soundKey='portfolio-launch-sound';
  const seen=sessionStorage.getItem(key)==='1';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let muted=localStorage.getItem(soundKey)==='off';
  let audioContext=null;
  let soundPlayed=false;

  const root=document.createElement('div');
  root.className='fate-launch';
  root.innerHTML=`<button class="fate-launch__sound" type="button" aria-label="${muted?'Enable':'Mute'} launch sound">${muted?'SOUND OFF':'SOUND ON'}</button><div class="fate-launch__grid" aria-hidden="true"></div><div class="fate-launch__core" aria-hidden="true"><span class="fate-launch__eyebrow">Project launch sequence</span><h1 class="fate-launch__title">FATE-AI</h1><div class="fate-launch__route"><div class="fate-node">OpenAI</div><div class="fate-node">Gemini</div><div class="fate-node">Groq</div><div class="fate-node">Anthropic</div></div><div class="fate-launch__status"><span>Provider pool <strong>online</strong></span><span style="display:flex;align-items:center;gap:10px"><i class="fate-launch__pulse"></i>continuous routing ready</span></div></div>`;
  document.body.prepend(root);
  document.body.classList.add('fate-launch-active');

  const soundButton=root.querySelector('.fate-launch__sound');
  const tone=(ctx,frequency,start,duration,gain=0.045,type='sine')=>{
    const oscillator=ctx.createOscillator();
    const envelope=ctx.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(frequency,start);
    envelope.gain.setValueAtTime(0,start);
    envelope.gain.linearRampToValueAtTime(gain,start+0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001,start+duration);
    oscillator.connect(envelope).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start+duration+0.02);
  };
  const sweep=(ctx,start)=>{
    const oscillator=ctx.createOscillator();
    const envelope=ctx.createGain();
    oscillator.type='sawtooth';
    oscillator.frequency.setValueAtTime(120,start);
    oscillator.frequency.exponentialRampToValueAtTime(620,start+0.42);
    envelope.gain.setValueAtTime(0.0001,start);
    envelope.gain.exponentialRampToValueAtTime(0.025,start+0.05);
    envelope.gain.exponentialRampToValueAtTime(0.0001,start+0.46);
    oscillator.connect(envelope).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start+0.48);
  };
  const playSound=async()=>{
    if(muted||soundPlayed||reduce) return;
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx) return;
    audioContext=audioContext||new AudioCtx();
    try{await audioContext.resume();}catch{return;}
    if(audioContext.state!=='running') return;
    soundPlayed=true;
    const now=audioContext.currentTime+0.025;
    sweep(audioContext,now);
    [220,277,330,415].forEach((frequency,index)=>tone(audioContext,frequency,now+0.28+(index*0.19),0.23,0.045,index%2?'triangle':'sine'));
    tone(audioContext,110,now+1.16,0.55,0.065,'sine');
    tone(audioContext,660,now+1.24,0.42,0.035,'triangle');
  };

  const unlockSound=()=>{playSound();};
  document.addEventListener('pointerdown',unlockSound,{once:true,capture:true});
  document.addEventListener('keydown',unlockSound,{once:true,capture:true});
  playSound();

  soundButton.addEventListener('click',(event)=>{
    event.stopPropagation();
    muted=!muted;
    localStorage.setItem(soundKey,muted?'off':'on');
    soundButton.textContent=muted?'SOUND OFF':'SOUND ON';
    soundButton.setAttribute('aria-label',muted?'Enable launch sound':'Mute launch sound');
    if(!muted){soundPlayed=false;playSound();}
    else if(audioContext){audioContext.suspend();}
  });

  const duration=reduce?180:seen?520:2200;
  requestAnimationFrame(()=>setTimeout(()=>{
    root.classList.add('is-complete');
    document.body.classList.remove('fate-launch-active');
    sessionStorage.setItem(key,'1');
    setTimeout(()=>{root.remove();if(audioContext)audioContext.close();},650);
  },duration));
}
