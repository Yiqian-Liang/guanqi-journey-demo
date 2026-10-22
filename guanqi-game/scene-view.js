import * as THREE from "./vendor/three.module.js";

export function createSceneView(renderer, canvas, camera, { width, height, active, header, footer }) {
  let zoom=1,panX=0,panY=0,pointer=null,moved=false;
  let viewport={top:0,width:1,height:1};
  const output=document.getElementById("sceneZoomValue");
  function reset(){zoom=1;panX=panY=0;}
  function change(delta){zoom=THREE.MathUtils.clamp(Math.round((zoom+delta)*100)/100,1,1.6);if(zoom===1)panX=panY=0;}
  document.getElementById("sceneZoomIn").addEventListener("click",()=>{if(active())change(.15);});
  document.getElementById("sceneZoomOut").addEventListener("click",()=>{if(active())change(-.15);});
  document.getElementById("sceneViewReset").addEventListener("click",()=>{if(active())reset();});
  canvas.addEventListener("wheel",event=>{if(active()){event.preventDefault();change(event.deltaY<0?.1:-.1);}},{passive:false});
  canvas.addEventListener("pointerdown",event=>{
    if(!active()||zoom===1)return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY};moved=false;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove",event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    moved ||= Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>4;
    panX-=dx*(camera.right-camera.left)/viewport.width;
    panY+=dy*(camera.top-camera.bottom)/viewport.height;
    pointer.x=event.clientX;pointer.y=event.clientY;
  });
  for(const name of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(name,()=>{pointer=null;});
  function frame(){
    const w=canvas.clientWidth,h=canvas.clientHeight,rect=canvas.getBoundingClientRect();
    const top=Math.max(80,document.querySelector(header).getBoundingClientRect().bottom-rect.top+14);
    const bottom=document.querySelector(footer).getBoundingClientRect().height+54;
    viewport={top,width:w,height:Math.max(100,h-top-bottom)};
    canvas.parentElement.style.setProperty("--scene-footer",`${bottom-54}px`);
    const ratio=w/viewport.height,span=Math.max(height,width/ratio)/zoom;
    const maxX=width*(1-1/zoom)/2,maxY=height*(1-1/zoom)/2;
    panX=THREE.MathUtils.clamp(panX,-maxX,maxX);panY=THREE.MathUtils.clamp(panY,-maxY,maxY);
    camera.left=-span*ratio/2+panX;camera.right=span*ratio/2+panX;camera.top=span/2+panY;camera.bottom=-span/2+panY;camera.updateProjectionMatrix();
    renderer.setViewport(0,0,w,h);renderer.setScissorTest(false);renderer.clear();
    renderer.setViewport(0,h-top-viewport.height,w,viewport.height);renderer.setScissor(0,h-top-viewport.height,w,viewport.height);renderer.setScissorTest(true);
    output.value=`${Math.round(zoom*100)}%`;
    canvas.dataset.view=JSON.stringify({zoom,panX,panY,...viewport});
    return viewport;
  }
  function project(point){const p=point.clone().project(camera);return{x:(p.x+1)*viewport.width/2,y:viewport.top+(1-p.y)*viewport.height/2};}
  return {frame,project,reset,get dragged(){const result=moved;moved=false;return result;}};
}
