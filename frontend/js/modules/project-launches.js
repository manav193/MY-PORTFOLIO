function loadLaunch({css,js,activeClass}){const style=document.createElement('link');style.rel='stylesheet';style.href=css;document.head.appendChild(style);import(js).catch(()=>{if(activeClass)document.body.classList.remove(activeClass);});}

export function initProjectLaunch(){
  const params=new URLSearchParams(location.search);
  const path=location.pathname;
  if(path.includes('/assets/case-studies/public-project.html')&&params.get('id')==='fate-ai'){
    loadLaunch({css:'../../assets/case-studies/fate-launch.css',js:'../../assets/case-studies/fate-launch.js',activeClass:'fate-launch-active'});
    return;
  }
  if(path.endsWith('/project-promptai.html')||path.endsWith('project-promptai.html')){
    loadLaunch({css:'assets/case-studies/prompt-launch.css',js:'assets/case-studies/prompt-launch.js',activeClass:'prompt-launch-active'});
  }
}
