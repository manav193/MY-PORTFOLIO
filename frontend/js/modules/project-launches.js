function addStyle(href){if(document.querySelector(`link[href="${href}"]`))return;const style=document.createElement('link');style.rel='stylesheet';style.href=href;document.head.appendChild(style)}
function loadLaunch({css,js,activeClass}){addStyle(css);import(js).catch(()=>{if(activeClass)document.body.classList.remove(activeClass);});}
function loadRemaining(name,css){addStyle(css);import('../../assets/case-studies/remaining-launches.js').then(({runRemainingLaunch})=>runRemainingLaunch(name)).catch(()=>document.body.classList.remove('project-batch-launch-active'));}

export function initProjectLaunch(){
  const params=new URLSearchParams(location.search);
  const path=location.pathname;
  const publicPage=path.includes('/assets/case-studies/public-project.html');
  const publicId=params.get('id');

  if(publicPage&&publicId==='fate-ai'){
    loadLaunch({css:'../../assets/case-studies/fate-launch.css',js:'../../assets/case-studies/fate-launch.js',activeClass:'fate-launch-active'});return;
  }
  if(publicPage&&publicId==='flora-and-flavor'){
    loadLaunch({css:'../../assets/case-studies/flora-launch.css',js:'../../assets/case-studies/flora-launch.js',activeClass:'flora-launch-active'});return;
  }
  const publicRemaining={'multi-api-system':'multiApi','resume-ai':'resumeAi','aurora-control-ui':'aurora','shift-zero-ui':'shiftUi'};
  if(publicPage&&publicRemaining[publicId]){loadRemaining(publicRemaining[publicId],'../../assets/case-studies/remaining-launches.css');return;}
  if(path.endsWith('/assets/case-studies/veldora-bites.html')||path.endsWith('assets/case-studies/veldora-bites.html')){
    loadLaunch({css:'veldora-launch.css',js:'../../assets/case-studies/veldora-launch.js',activeClass:'veldora-launch-active'});return;
  }

  const file=path.split('/').pop();
  if(file==='project-nimo.html'){
    loadLaunch({css:'assets/case-studies/nimo-launch.css',js:'../../assets/case-studies/nimo-launch.js',activeClass:'nimo-launch-active'});
    addStyle('css/nimo-premium.css');
    import('./nimo-case-study-lab.js').catch(()=>{});
    return;
  }
  const staticLaunches={
    'project-promptai.html':['prompt-launch.css','prompt-launch.js','prompt-launch-active'],
    'project-toolverse.html':['toolverse-launch.css','toolverse-launch.js','toolverse-launch-active'],
    'project-shift-zero.html':['shiftzero-launch.css','shiftzero-launch.js','shiftzero-launch-active'],
    'project-arcade-os.html':['arcade-launch.css','arcade-launch.js','arcade-launch-active']
  };
  if(staticLaunches[file]){const [css,js,activeClass]=staticLaunches[file];loadLaunch({css:`assets/case-studies/${css}`,js:`../../assets/case-studies/${js}`,activeClass});return;}
  const remainingStatic={'project-love-journey.html':'love','project-nintendo.html':'nintendo','project-nike.html':'nike','project-velora-bites.html':'veloraUi'};
  if(remainingStatic[file])loadRemaining(remainingStatic[file],'assets/case-studies/remaining-launches.css');
}
