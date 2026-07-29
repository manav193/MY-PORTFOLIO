function loadLaunch({css,js,activeClass}){const style=document.createElement('link');style.rel='stylesheet';style.href=css;document.head.appendChild(style);import(js).catch(()=>{if(activeClass)document.body.classList.remove(activeClass);});}

export function initProjectLaunch(){
  const params=new URLSearchParams(location.search);
  const path=location.pathname;
  if(path.includes('/assets/case-studies/public-project.html')&&params.get('id')==='fate-ai'){
    loadLaunch({css:'../../assets/case-studies/fate-launch.css',js:'../../assets/case-studies/fate-launch.js',activeClass:'fate-launch-active'});
    return;
  }
  if(path.includes('/assets/case-studies/public-project.html')&&params.get('id')==='flora-and-flavor'){
    loadLaunch({css:'../../assets/case-studies/flora-launch.css',js:'../../assets/case-studies/flora-launch.js',activeClass:'flora-launch-active'});
    return;
  }
  if(path.endsWith('/project-promptai.html')||path.endsWith('project-promptai.html')){
    loadLaunch({css:'assets/case-studies/prompt-launch.css',js:'assets/case-studies/prompt-launch.js',activeClass:'prompt-launch-active'});
    return;
  }
  if(path.endsWith('/project-toolverse.html')||path.endsWith('project-toolverse.html')){
    loadLaunch({css:'assets/case-studies/toolverse-launch.css',js:'assets/case-studies/toolverse-launch.js',activeClass:'toolverse-launch-active'});
    return;
  }
  if(path.endsWith('/project-shift-zero.html')||path.endsWith('project-shift-zero.html')){
    loadLaunch({css:'assets/case-studies/shiftzero-launch.css',js:'assets/case-studies/shiftzero-launch.js',activeClass:'shiftzero-launch-active'});
    return;
  }
  if(path.endsWith('/project-nimo.html')||path.endsWith('project-nimo.html')){
    loadLaunch({css:'assets/case-studies/nimo-launch.css',js:'assets/case-studies/nimo-launch.js',activeClass:'nimo-launch-active'});
    return;
  }
  if(path.endsWith('/project-velora-bites.html')||path.endsWith('project-velora-bites.html')){
    loadLaunch({css:'assets/case-studies/veldora-launch.css',js:'assets/case-studies/veldora-launch.js',activeClass:'veldora-launch-active'});
    return;
  }
  if(path.endsWith('/project-arcade-os.html')||path.endsWith('project-arcade-os.html')){
    loadLaunch({css:'assets/case-studies/arcade-launch.css',js:'assets/case-studies/arcade-launch.js',activeClass:'arcade-launch-active'});
  }
}