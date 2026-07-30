const scenarios={
  recruiter:{query:'Give me a recruiter briefing.',intent:'portfolio_briefing',context:'Verified public project catalog',action:'Summarize strengths and recommended work',answer:'Manav combines AI product engineering, interactive frontend systems and game/UI development. Start with NIMO, FATE-AI, ToolVerse and SHIFT-ZERO.'},
  ai:{query:'Show me the strongest AI project.',intent:'project_recommendation',context:'AI · architecture · public projects',action:'Recommend and navigate',answer:'NIMO is the portfolio intelligence layer; FATE-AI demonstrates multi-provider routing and failover. Both are strong technical starting points.'},
  frontend:{query:'Show me the strongest frontend work.',intent:'project_recommendation',context:'Frontend · interaction · visual systems',action:'Recommend a case study',answer:'Flora & Flavor, VELDORA-BITES and ArcadeOS best demonstrate visual systems, interaction design and product-level polish.'},
  system:{query:'How does NIMO process this request?',intent:'system_explanation',context:'Current NIMO case study',action:'Explain safe processing pipeline',answer:'NIMO resolves known intents locally, validates trusted project context and forwards only bounded requests to NIMO Core when remote intelligence is required.'}
};
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function mountLab(){
  let root=document.querySelector('[data-nimo-lab]');
  if(root)return root;
  const section=document.createElement('section');
  section.className='nimo-lab';
  section.dataset.nimoLab='true';
  section.innerHTML=`<div class="nimo-lab-shell"><div class="nimo-console"><div class="nimo-console-head"><span>Live intelligence lab</span><span class="nimo-live-dot" aria-label="Interactive demo ready"></span></div><div class="nimo-chat" data-nimo-chat><div class="nimo-msg assistant">I am NIMO, the intelligence layer of this portfolio. Choose a real portfolio intent below and watch the safe processing pipeline resolve it.</div></div><div class="nimo-commands"><button class="nimo-command" data-nimo-command="recruiter">Recruiter briefing</button><button class="nimo-command" data-nimo-command="ai">Strongest AI project</button><button class="nimo-command" data-nimo-command="frontend">Best frontend work</button><button class="nimo-command" data-nimo-command="system">How NIMO works</button></div></div><div class="nimo-pipeline"><div class="nimo-pipeline-head"><span>Safe request pipeline</span><span>Session context</span></div><div class="nimo-pipeline-body"><div class="nimo-stage" data-nimo-stage>Language detection</div><div class="nimo-stage" data-nimo-stage>Intent resolution</div><div class="nimo-stage" data-nimo-stage>Verified context</div><div class="nimo-stage" data-nimo-stage>Allowlisted action</div><div class="nimo-result" data-nimo-result>Ready for a demonstration. This visualizes routing metadata, not private chain-of-thought.</div><div class="nimo-mode-row"><div class="nimo-mode"><strong>Local</strong>Known intents</div><div class="nimo-mode"><strong>Core</strong>Bounded fallback</div><div class="nimo-mode"><strong>Safe</strong>Public context only</div></div><div class="nimo-signature"><span><i></i><i></i><i></i></span>NIMO signature channel</div></div></div></div>`;
  const main=document.querySelector('.cs-premium-layout');
  const firstSection=main?.querySelector('.cs-editorial-section');
  if(main)main.insertBefore(section,firstSection||null);
  return section;
}
export function initNimoCaseStudyLab(){
  const root=mountLab();if(!root)return;
  const chat=root.querySelector('[data-nimo-chat]');const stages=[...root.querySelectorAll('[data-nimo-stage]')];const result=root.querySelector('[data-nimo-result]');let running=false;
  async function run(key){
    if(running||!scenarios[key])return;running=true;const s=scenarios[key];stages.forEach(stage=>stage.classList.remove('active'));result.textContent='Processing verified portfolio context…';
    const user=document.createElement('div');user.className='nimo-msg user';user.textContent=s.query;chat.appendChild(user);chat.scrollTop=chat.scrollHeight;
    const values=['Language: English / Hinglish ready',`Intent: ${s.intent}`,`Context: ${s.context}`,`Action: ${s.action}`];
    for(let i=0;i<stages.length;i++){await sleep(i===0?140:230);stages[i].textContent=values[i];stages[i].classList.add('active');}
    await sleep(260);const assistant=document.createElement('div');assistant.className='nimo-msg assistant';assistant.textContent=s.answer;chat.appendChild(assistant);chat.scrollTop=chat.scrollHeight;result.textContent='Response grounded in the public project registry. No private project context used.';running=false;
  }
  root.querySelectorAll('[data-nimo-command]').forEach(button=>button.addEventListener('click',()=>run(button.dataset.nimoCommand)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initNimoCaseStudyLab);else initNimoCaseStudyLab();
