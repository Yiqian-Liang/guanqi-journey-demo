import * as THREE from "./vendor/three.module.js";
import { createSceneView } from "./scene-view.js?v=0.8.0";

export function createJourney(renderer,canvas,game,sound){
  const scene=new THREE.Scene();scene.background=new THREE.Color("#dce8e5");
  const camera=new THREE.OrthographicCamera(-10,10,8,-8,.1,100);
  camera.position.set(12,18,22);camera.lookAt(0,0,-.5);camera.updateMatrixWorld();
  const view=createSceneView(renderer,canvas,camera,{width:16.8,height:11.5,active:()=>game.viewState().journey.active,header:".journeyReadings",footer:".journeyFooter"});
  const palette={};
  function mat(color,extra={}){const key=color+JSON.stringify(extra);return palette[key]||=(new THREE.MeshStandardMaterial({color,roughness:.85,...extra}));}
  function mesh(geometry,material,x,y,z,parent){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,d,color,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),typeof color==="string"?mat(color):color,x,y,z,parent);}
  function cyl(r,h,color,x,y,z,parent){return mesh(new THREE.CylinderGeometry(r,r,h,16),typeof color==="string"?mat(color):color,x,y,z,parent);}
  function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
  function line(points,color,parent,opacity=1){const m=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:true,opacity}));parent.add(m);return m;}
  const stone="#edf1e9",jade="#638e7f",red="#aa5149",wood="#6d554c",gold="#cba262";
  const waterMat=mat("#54bbc7",{transparent:true,opacity:.88,roughness:.25,metalness:.1});
  const glowMat=mat("#ffcd70",{emissive:"#ffb34b",emissiveIntensity:.8});
  scene.add(new THREE.HemisphereLight("#f4fcf0","#487e74",2.3));
  const sun=new THREE.DirectionalLight("#fff0d9",3.4);sun.position.set(-8,18,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.1,far:60});sun.shadow.normalBias=.04;scene.add(sun);
  const rooms={canal:group(scene),garden:group(scene),ferry:group(scene)};
  function floor(parent){
    box(13.4,.95,10.2,jade,0,-.55,0,parent);box(13.5,.14,10.3,stone,0,0,0,parent);
    for(let x=-6;x<=6;x++)line([[x,.08,-5],[x,.08,5]],"#b8cec2",parent,.45);
    for(let z=-5;z<=5;z++)line([[-6.6,.08,z],[6.6,.08,z]],"#b8cec2",parent,.45);
    box(.26,.45,8.5,stone,-6.4,.25,.5,parent);box(.4,.1,8.5,jade,-6.4,.52,.5,parent);
    box(9.5,.35,.24,stone,-1,.25,4.8,parent);
  }
  function plant(parent,x,z,size=1){
    for(let i=0;i<3;i++){
      cyl(.03,1.5*size,"#467c64",x+i*.14,.75*size,z,parent);
      for(let j=0;j<3;j++){const leaf=mesh(new THREE.ConeGeometry(.11,.55*size,3),mat(j%2?"#6f9b65":"#427762"),x+i*.14+.13,.55+j*.35,z,parent);leaf.rotation.z=(i%2?1:-1)*1.1;}
    }
  }
  function rocks(parent,x,z){for(let i=0;i<3;i++){const rock=mesh(new THREE.DodecahedronGeometry(.6+i*.12),mat("#91a698",{flatShading:true}),x+i*.55,.45+i*.13,z-i*.3,parent);rock.scale.y=1.4;rock.rotation.y=i;}}
  function lantern(parent,x,z){
    cyl(.17,.85,stone,x,.5,z,parent);box(.55,.1,.55,gold,x,.95,z,parent);box(.4,.48,.4,glowMat,x,1.2,z,parent);
    const roof=mesh(new THREE.ConeGeometry(.44,.22,4),mat(red),x,1.56,z,parent);roof.rotation.y=Math.PI/4;
  }
  function arch(parent,x,z){
    const g=group(parent,x,0,z);[-.72,.72].forEach(dx=>{cyl(.1,2.4,red,dx,1.25,0,g);cyl(.14,.18,gold,dx,.2,0,g);});
    box(1.85,.14,.65,jade,0,2.5,0,g);const roof=mesh(new THREE.ConeGeometry(1.35,.5,4),mat("#4d8588"),0,2.8,0,g);roof.rotation.y=Math.PI/4;roof.scale.z=.5;
    return g;
  }
  function stonePath(parent,points){
    for(let i=1;i<points.length;i++){
      const [ax,az]=points[i-1],[bx,bz]=points[i],count=Math.ceil(Math.hypot(bx-ax,bz-az)/.55);
      for(let j=0;j<count;j++){const t=j/count,tile=box(.36,.05,.36,"#fafaf1",THREE.MathUtils.lerp(ax,bx,t),.12,THREE.MathUtils.lerp(az,bz,t),parent);tile.rotation.y=Math.PI/4;tile.castShadow=false;}
    }
  }
  function person(parent,x,z,color="#38828a"){
    const g=group(parent,x,.13,z);mesh(new THREE.CylinderGeometry(.16,.28,.65,8),mat(color),0,.5,0,g);
    mesh(new THREE.SphereGeometry(.17,12,8),mat("#efd2af"),0,1.03,0,g);mesh(new THREE.ConeGeometry(.32,.2,12),mat("#d5a77c"),0,1.22,0,g);
    const legs=[-.1,.1].map(dx=>box(.1,.28,.12,wood,dx,.14,0,g));
    const arms=[-.24,.24].map(dx=>{const arm=box(.1,.4,.12,color,dx,.76,0,g);arm.geometry.translate(0,-.17,0);return arm;});
    box(.4,.07,.16,red,0,.83,0,g);return {group:g,legs,arms};
  }
  Object.values(rooms).forEach(floor);

  const canal=rooms.canal;
  rocks(canal,-5.5,-3.7);plant(canal,-5.8,-3,1.1);plant(canal,5.7,3,.9);lantern(canal,4.2,3.7);
  arch(canal,5,-3.7);
  stonePath(canal,[[-5,3.5],[-3,2],[-1,2],[1,2],[5,2],[5,-3.7]]);
  const waterParts=[];
  for(let i=0;i<3;i++){
    const x=[-4.9,-1.35,3.7][i],length=[3.2,3.6,5.5][i];
    box(length,.16,1.45,"#b4beb0",x,.16,-1.8,canal);
    [-2.55,-1.05].forEach(z=>box(length,.38,.2,stone,x,.29,z,canal));
    const surface=box(length-.06,.12,1.25,waterMat,x,.3,-1.8,canal);
    surface.userData={start:x-(length-.06)/2,length:length-.06};waterParts.push(surface);
  }
  box(1.25,.16,3.0,stone,5,.4,-1.8,canal);
  const gate=group(canal,-3,.1,-1.8);
  [-.9,.9].forEach(z=>box(.28,2.7,.22,red,0,1.4,z,gate));box(.45,.25,2.2,gold,0,2.7,0,gate);
  const sluice=box(.23,1.3,1.5,"#886950",0,.75,0,gate);
  const wheel=group(canal,-3,1.4,-.65);
  mesh(new THREE.TorusGeometry(.93,.09,8,36),mat(wood),0,0,0,wheel);
  mesh(new THREE.TorusGeometry(.62,.035,6,30),mat(gold),0,0,0,wheel);
  for(let i=0;i<10;i++){
    const spoke=box(.065,.9,.08,wood,Math.sin(i*Math.PI/5)*.45,Math.cos(i*Math.PI/5)*.45,0,wheel);spoke.rotation.z=-i*Math.PI/5;
    const paddle=box(.3,.18,.38,wood,Math.sin(i*Math.PI/5),Math.cos(i*Math.PI/5),0,wheel);paddle.rotation.z=-i*Math.PI/5;
  }
  const socket=mesh(new THREE.TorusGeometry(.14,.05,8,20),mat(gold,{emissive:"#755127"}),-3,1.4,-.42,canal);
  const installedShaft=cyl(.1,.45,gold,-3,1.4,-.48,canal);installedShaft.rotation.x=Math.PI/2;
  const spare=group(canal,-4.7,.45,2.7);
  const shaft=cyl(.11,.8,gold,0,0,0,spare);shaft.rotation.z=Math.PI/2;
  box(1.1,.3,.7,wood,-4.7,.2,2.7,canal);box(.5,.12,.42,"#c5a47e",-4.5,.44,2.7,canal);
  const roots=group(canal,1.4,.1,-1.8);
  const rootBranches=[];
  for(let i=0;i<4;i++){
    const b=mesh(new THREE.CylinderGeometry(.075,.12,1.7+i*.15,8),mat("#896a53"),i*.16,.6,-.5+i*.3,roots);b.rotation.z=.5-i*.32;rootBranches.push(b);
    mesh(new THREE.SphereGeometry(.15,6,4),mat("#6f9d67"),i*.2,1.2,.3-i*.2,roots);
  }
  const foam=Array.from({length:12},(_,i)=>box(.13,.025,.055,"#c8f3eb",0,.4,-1.8+(i%3-1)*.25,canal));
  const gauge=group(canal,3.7,.1,-2.7);box(.12,1.8,.13,wood,0,.9,0,gauge);
  for(let i=0;i<6;i++)box(.25,.025,.04,gold,.08,.25+i*.25,.1,gauge);
  const float=cyl(.14,.07,red,3.6,.3,-1.8,canal);

  const garden=rooms.garden;
  rocks(garden,-5.5,-3.8);plant(garden,-5.7,3.4,.85);lantern(garden,4.8,3.6);arch(garden,5,-3.7);
  stonePath(garden,[[-5,3.5],[-3,2.6],[0,2.6],[5,2.6],[5,-3.7]]);
  box(12.2,.3,.5,stone,0,.25,-4.4,garden);box(12.3,.13,.65,jade,0,.46,-4.4,garden);
  const vent=group(garden,-4.1,.12,-1.2);
  [-1,1].forEach(z=>box(.28,2.9,.28,stone,0,1.45,z,vent));box(.45,.3,2.4,jade,0,3,0,vent);
  const louvers=Array.from({length:5},(_,i)=>box(.13,.4,1.8,red,0,.5+i*.48,0,vent));
  const handle=group(vent,.48,1.25,1.18);mesh(new THREE.TorusGeometry(.23,.035,8,24),mat(gold),0,0,0,handle);
  const beds=[];
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    const bed=group(garden,.3+col*1.8,.12,-1+row*1.8);box(1.55,.3,1.5,"#ae7660",0,.15,0,bed);box(1.38,.06,1.32,"#6d7770",0,.32,0,bed);
    for(let i=0;i<6;i++){
      const seedling=group(bed,(i%3-.9)*.44,.35,(Math.floor(i/3)-.5)*.65);
      cyl(.025,.42,"#4e8c61",0,.2,0,seedling);
      [-1,1].forEach(side=>{const leaf=mesh(new THREE.ConeGeometry(.12,.45,4),mat(i%2?"#77a774":"#4c946e"),side*.12,.35,0,seedling);leaf.rotation.z=side*.85;});beds.push(seedling);
    }
  }
  const shield=group(garden,-1.55,.1,-.2);
  [-1.7,1.7].forEach(z=>cyl(.055,2.9,wood,0,1.45,z,shield));box(.17,.15,3.8,jade,0,2.95,0,shield);
  const blind=group(shield,0,2.8,0);
  for(let i=0;i<12;i++)box(.09,.095,3.45,i%2?"#bdb77a":"#9aab79",0,-i*.115,0,blind);
  [-1.35,1.35].forEach(z=>box(.06,1.5,.04,wood,.07,-.65,z,blind));
  cyl(.016,1.7,wood,.16,2,1.6,shield);
  const pullRing=mesh(new THREE.TorusGeometry(.12,.025,6,20),mat(gold),.16,1.15,1.6,shield);pullRing.rotation.y=Math.PI/2;
  const windRibbons=[],windDots=[];
  for(let i=0;i<3;i++){
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(120),3));
    const ribbon=new THREE.Line(geo,new THREE.LineBasicMaterial({color:"#339fb6",transparent:true,opacity:.6}));garden.add(ribbon);windRibbons.push(ribbon);
    windDots.push(mesh(new THREE.ConeGeometry(.07,.22,5),mat("#319caf"),0,0,0,garden));
  }
  const mist=[];
  for(let i=0;i<7;i++){
    const cloud=mesh(new THREE.IcosahedronGeometry(1.1,1),mat("#d7e6e3",{transparent:true,opacity:.8,depthWrite:false}),4+(i%3)*.8,.8+Math.floor(i/3)*.65,-3.3+(i%2)*.9,garden);cloud.scale.set(1.35,.7,1);mist.push(cloud);
  }
  const gardener=person(garden,3.6,1.3,"#69856d");

  const ferry=rooms.ferry;
  // shortcut: three authored stages, extend them when optional quests receive the same interaction treatment.
  box(13.3,.17,5.4,waterMat,0,.17,-2.4,ferry);
  box(11,.25,1.8,stone,-.6,.3,2.4,ferry);box(3.2,.24,4.1,wood,1.1,.42,-.2,ferry);
  for(let z=-2;z<=1.7;z+=.3)box(3.15,.04,.05,"#9e7962",1.1,.57,z,ferry);
  [-.65,2.85].forEach(x=>[-1.4,1.5].forEach(z=>{cyl(.09,1.25,wood,x,.75,z,ferry);cyl(.12,.08,gold,x,1.38,z,ferry);}));
  [-.65,2.85].forEach(x=>line([[x,1.1,-1.4],[x,.95,0],[x,1.1,1.5]],"#c0a67b",ferry));
  rocks(ferry,-5.2,-4.2);plant(ferry,-5.7,3.5);plant(ferry,5.6,-3.6,.9);lantern(ferry,-3.5,2.7);arch(ferry,-4.6,3.2);
  stonePath(ferry,[[-4.6,3.2],[-2,2.5],[1.1,2.5],[1.1,-1.5]]);
  const boat=group(ferry,1.1,.6,-3.25);
  const hull=mesh(new THREE.SphereGeometry(1,16,8),mat("#805a4e"),0,-.12,0,boat);hull.scale.set(1.45,.4,.85);
  box(2.7,.1,1.3,"#b88f70",0,.02,0,boat);
  const cabin=mesh(new THREE.CylinderGeometry(.67,.67,1.3,16,1,false,0,Math.PI),mat("#a1b5a3"),.1,.48,0,boat);cabin.rotation.z=Math.PI/2;
  [-.55,.55].forEach(z=>box(1.35,.035,.04,gold,.1,.75,z,boat));
  const boatLamp=mesh(new THREE.SphereGeometry(.13,8,8),glowMat,-.9,.62,0,boat);
  const ferryman=person(ferry,2.5,-1.6,"#777487");ferryman.group.rotation.y=Math.PI;
  const receivedLetter=box(.4,.025,.28,"#f5e4b7",.3,.8,.2,ferryman.group);box(.08,.03,.07,red,0,.02,0,receivedLetter);
  const ripples=Array.from({length:15},(_,i)=>line([[0,0,0],[.6,0,0]],"#b9efea",ferry,.7));
  const actor=person(scene,-5,3.5);
  const carry=group(actor.group,.34,.8,.26);const carriedShaft=cyl(.09,.65,gold,0,0,0,carry);carriedShaft.rotation.z=Math.PI/2;
  const letter=box(.4,.025,.28,"#f5e4b7",0,0,0,carry);box(.08,.03,.07,red,0,.018,0,letter);
  const cursor=mesh(new THREE.RingGeometry(.2,.24,32),mat("#c09a55",{side:THREE.DoubleSide}),0,.16,0,scene);cursor.rotation.x=-Math.PI/2;cursor.visible=false;
  const elements=Object.fromEntries(["Pickup","Install","Root","Vent","Shield","Letter","BoatLabel"].map(id=>[id,document.getElementById("journey"+id)]));
  const primary=document.getElementById("journeyPrimary"),next=document.getElementById("journeyNext"),back=document.getElementById("journeyBack"),slider=document.getElementById("journeyVentRange");
  let room="",seed="",epoch=-1,last=0,queue=[],pending=null,busy=null,gesture=null,dragged=false,ghost=null,feedback="",ventTouchUntil=0;
  let water=0,root=0,repaired=0,shieldDown=0,wind=0,fog=1,signature="";
  const targets={pickup:[-4.7,2.5],install:[-3,.5],roots:[1.7,.4],vent:[-3.2,1],shield:[-1.5,2],garden:[5,-3.7],ferry:[5,-3.7],deliver:[2,-1.55]};
  const durations={pickup:.45,install:1.05,roots:1.2,shield:.9,deliver:1.1};
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.2);
  let viewport={width:1,height:1,top:0};
  function floorPoint(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/viewport.width*2-1,-((event.clientY-r.top-viewport.top)/viewport.height)*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.ray.intersectPlane(plane,new THREE.Vector3());}
  function available(){const s=game.viewState();return s.started&&s.journey.active&&!s.dialogue;}
  function walk(action){
    if(!available()||busy||pending)return;
    const s=game.viewState();if(["garden","ferry"].includes(action)&&!s.journey.ready)return;
    const target=targets[action];if(!target)return;
    queue=[new THREE.Vector3(actor.group.position.x,.13,2.6),new THREE.Vector3(target[0],.13,2.6),new THREE.Vector3(target[0],.13,target[1])];
    pending=action;cursor.position.set(target[0],.15,target[1]);cursor.visible=true;feedback="";sound.startAudio();
  }
  function finish(action){
    if(action==="garden"||action==="ferry"){game.journeyEnter(action);return;}
    if(game.journeyAction(action))sound.tone(action==="roots"?640:action==="deliver"?880:240,.35,.09);
  }
  function setVent(value){
    if(!available()||busy)return;
    const mode=["closed","notch","open"][value];if(!mode||game.viewState().journey.vent===mode)return;
    sound.startAudio();game.journeyAction("vent",mode);sound.tone(180,.12,.07);ventTouchUntil=performance.now()+1600;
    if(!queue.length){const p=targets.vent;queue=[new THREE.Vector3(actor.group.position.x,.13,2.6),new THREE.Vector3(p[0],.13,2.6),new THREE.Vector3(p[0],.13,p[1])];}
  }
  slider.oninput=()=>setVent(Number(slider.value));
  primary.onclick=()=>{const s=game.viewState();s.journey.action==="vent"?setVent(s.journey.vent==="closed"?1:s.journey.vent==="notch"?2:1):walk(s.journey.action);};
  next.onclick=()=>walk(room==="canal"?"garden":"ferry");
  back.onclick=()=>{if(!busy&&!pending)game.journeyEnter(room==="ferry"?"garden":"canal");};
  function bind(element,kind){
    element.addEventListener("pointerdown",event=>{
      if(!available()||busy||pending)return;
      gesture={kind,x:event.clientX,y:event.clientY,vent:["closed","notch","open"].indexOf(game.viewState().journey.vent)};dragged=false;
      element.setPointerCapture(event.pointerId);event.preventDefault();
    });
    element.addEventListener("pointermove",event=>{
      if(!gesture||gesture.kind!==kind)return;
      const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
      dragged ||= Math.hypot(dx,dy)>6;
      if(kind==="vent"&&dragged)setVent(THREE.MathUtils.clamp(gesture.vent+Math.round(dx/55),0,2));
      if((kind==="pickup"||kind==="letter")&&dragged){ghost=floorPoint(event);element.classList.add("dragging");}
    });
    element.addEventListener("pointerup",event=>{
      if(!gesture||gesture.kind!==kind)return;
      if(dragged){
        const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
        if(kind==="roots"&&dx>25)walk("roots");
        if(kind==="shield"&&dy>25)walk("shield");
        if(kind==="pickup"){
          const r=elements.Install.getBoundingClientRect();
          if(event.clientX>r.left-25&&event.clientX<r.right+25&&event.clientY>r.top-25&&event.clientY<r.bottom+25&&game.viewState().journey.itemsTaken)walk("install");
          else if(!game.viewState().journey.itemsTaken)walk("pickup");
          else feedback="把轴芯带到空着的轴座旁。";
        }
        if(kind==="letter"){
          const r=elements.BoatLabel.getBoundingClientRect();
          if(event.clientX>r.left-40&&event.clientX<r.right+40&&event.clientY>r.top-40&&event.clientY<r.bottom+40)walk("deliver");
          else feedback="摆渡人在船边等你。";
        }
      }
      gesture=null;ghost=null;element.classList.remove("dragging");
    });
    for(const name of ["pointercancel","lostpointercapture"])element.addEventListener(name,()=>{gesture=null;ghost=null;element.classList.remove("dragging");});
    element.onclick=()=>{
      if(!dragged){if(kind==="vent")setVent((["closed","notch","open"].indexOf(game.viewState().journey.vent)+1)%3);else walk(kind==="pickup"&&game.viewState().journey.itemsTaken?"install":kind==="letter"?"deliver":kind);}
      dragged=false;
    };
  }
  bind(elements.Pickup,"pickup");bind(elements.Install,"install");bind(elements.Root,"roots");bind(elements.Vent,"vent");bind(elements.Shield,"shield");bind(elements.Letter,"letter");
  canvas.addEventListener("pointerup",event=>{
    if(!available()||busy||pending||view.dragged)return;
    const p=floorPoint(event);if(!p)return;
    if(p.x>3.5&&p.z< -2.6&&game.viewState().journey.ready&&room!=="ferry"){walk(room==="canal"?"garden":"ferry");return;}
    if(p.x< -5.8||p.x>5.8||p.z<.3||p.z>4.4)return;
    queue=[new THREE.Vector3(p.x,.13,p.z)];cursor.position.set(p.x,.15,p.z);cursor.visible=true;
  });
  function label(element,point,visible){
    element.classList.toggle("hide",!visible);if(!visible)return;
    const p=view.project(point),half=element.offsetWidth/2+5;
    element.style.left=`${THREE.MathUtils.clamp(p.x,half,viewport.width-half)}px`;
    element.style.top=`${THREE.MathUtils.clamp(p.y,viewport.top+24,viewport.top+viewport.height-20)}px`;
    element.disabled=!available()||!!busy||!!pending;
  }
  function sync(s){
    const j=s.journey,env=s.environment,key=JSON.stringify([j,s.dialogue,!!pending,busy?.action,feedback]);
    if(key===signature)return;signature=key;
    const titles={canal:"旧渠 · 水声归来",garden:"药圃 · 留风护苗",ferry:"旧渡口 · 一封远信"};
    document.getElementById("journeyTitle").textContent=titles[room];
    document.querySelectorAll("[data-room]").forEach((item,i)=>{const index=["canal","garden","ferry"].indexOf(room);item.classList.toggle("current",i===index);item.classList.toggle("done",i<index||s.chapterComplete);item.setAttribute("aria-current",i===index?"step":"false");});
    const reading=room==="canal"?[[j.repaired?"水门已抬起":"水门没有轴芯",!j.repaired],[env.water?"水车转起来了":"下游还没有水",!env.water]]:room==="garden"?[[s.routeOpen?"雾门露出来了":"雾还压着路",!s.routeOpen],[env.herb>=60?"药苗立得稳":"风太急，药苗倒了",env.herb<60]]:[[j.delivered?"信已送到":"渡口信还在",false],["水路已连通",false]];
    document.getElementById("journeyReadings").innerHTML=reading.map(([text,bad])=>`<span class="${bad?"bad":""}">${text}</span>`).join("");
    const detail={
      pickup:["第一程 / 水门停了","让水重新流向渡口","轴芯落在渠边，水门的轴座空着。","拾起渠边的轴芯"],
      install:["第一程 / 轴芯找到了","把轴芯装回水门","带着轴芯走到空轴座，看看水门能否抬起。","装回轴芯"],
      roots:["第一程 / 水过不了根","给水让出一条路","水门开了，活根仍拦着水。把根牵到渠边，不必砍断它。","牵开堵根"],
      garden:["第一程 / 水声回来了","循着水声，去药圃","下游水尺升起，水车转了。水正在流向渡口。","沿水声去药圃"],
      vent:["第二程 / 雾与药苗","让雾散开，也让药苗站稳",env.herb<60?"风开得太急了。收窄风口，或者落下护苗屏。":"像院里的灯与铃：这里也要给风留路，给药苗留安静处。","调整风板"],
      ferry:["第二程 / 路显出来了","药苗站稳了，雾也退了","看，风从苗床旁绕过去，石路一直通向渡口。","沿石路去渡口"],
      deliver:["第三程 / 船就在眼前","把信送到摆渡人手上","摆渡人在栈桥尽头等你。走近他，把信交出去。","走到船边交信"],
      complete:["首章完成 / 雾隐渡","一封信，重新连起两岸","你接回水路、留下风路，也给药苗保住了一处安静。","信已送到"]
    }[j.action];
    ["journeyEyebrow","journeyObjective","journeyDetail"].forEach((id,i)=>document.getElementById(id).textContent=detail[i]);
    primary.textContent=pending?"正在走近…":busy?"正在动手…":detail[3];primary.disabled=!!pending||!!busy||s.dialogue||j.delivered;
    primary.classList.toggle("hide",j.ready&&room!=="ferry");
    next.classList.toggle("hide",!j.ready||room==="ferry");next.textContent=room==="canal"?"沿水声去药圃":"沿石路去渡口";next.disabled=!!pending||!!busy||s.dialogue;
    back.classList.toggle("hide",room==="canal");back.textContent=room==="ferry"?"返回药圃":"返回旧渠";back.disabled=!!pending||!!busy||s.dialogue;
    document.getElementById("journeyVentControl").classList.toggle("hide",room!=="garden");
    slider.value=["closed","notch","open"].indexOf(j.vent);slider.disabled=s.dialogue||!!busy;
    document.getElementById("journeyVentValue").textContent={closed:"全闭",notch:"留缝",open:"全开"}[j.vent];
    slider.setAttribute("aria-valuetext",{closed:"全闭，风被挡住",notch:"留缝，让风缓缓通过",open:"全开，风很急"}[j.vent]);
    const doing=busy?{pickup:"拾起轴芯。",install:"轴芯滑入轴座，水门正在抬起。",roots:"把活根慢慢牵到渠边。",shield:"竹屏落下，给药苗留出背风处。",deliver:"把信交到摆渡人手中。"}[busy.action]:"";
    document.getElementById("journeyFeedback").textContent=feedback||doing||(room==="ferry"?j.delivered?"摆渡人收下了信。这一程完成了。":"摆渡人在船边，信还在你的手里。":j.ready?room==="canal"?"水的去向变了。":"风从苗床旁经过，通往渡口的石路清晰了。":room==="garden"?"风板可以反复开合，试错不会扣取资源。":"每次只改一处，看看水走到了哪里。");
  }
  function render(s,time){
    const dt=Math.min(.05,last?(time-last)/1000:.016);last=time;
    const j=s.journey;
    if(seed!==s.seed||room!==j.room||epoch!==s.epoch){
      seed=s.seed;epoch=s.epoch;room=j.room;queue=[];pending=null;busy=null;gesture=null;ghost=null;feedback="";signature="";view.reset();
      const start=room==="ferry"&&j.delivered?targets.deliver:[-5,3.5];
      actor.group.position.set(start[0],.13,start[1]);actor.group.rotation.y=0;cursor.visible=false;
      Object.entries(rooms).forEach(([id,g])=>g.visible=id===room);
    }
    sync(s);viewport=view.frame();
    if(!s.dialogue){
      if(queue.length){
        const target=queue[0],distance=actor.group.position.distanceTo(target);
        if(distance<dt*3.8){actor.group.position.copy(target);queue.shift();if(!queue.length){cursor.visible=false;if(pending){const action=pending;pending=null;if(durations[action])busy={action,elapsed:0};else finish(action);}}}
        else{const direction=target.clone().sub(actor.group.position).normalize();actor.group.position.addScaledVector(direction,dt*3.8);actor.group.rotation.y=Math.atan2(direction.x,direction.z);}
      }else if(busy){
        busy.elapsed+=dt;
        if(busy.elapsed>=durations[busy.action]){const action=busy.action;busy=null;finish(action);}
      }
    }
    const seconds=time/1000,working=busy||time<ventTouchUntil;
    actor.legs.forEach((leg,i)=>leg.rotation.x=queue.length?Math.sin(seconds*13+i*Math.PI)*.45:0);
    actor.arms.forEach(arm=>arm.rotation.x=working?-1.1:room==="ferry"||j.itemsTaken&&!j.repaired?-.6:0);
    carry.visible=room==="ferry"&&!j.delivered||room==="canal"&&j.itemsTaken&&!j.repaired;
    carriedShaft.visible=room==="canal";letter.visible=room==="ferry";
    spare.visible=!j.itemsTaken;
    installedShaft.visible=j.repaired;
    repaired=THREE.MathUtils.damp(repaired,j.repaired?1:0,3,dt);
    root=THREE.MathUtils.damp(root,j.rootMode!=="blocked"?1:busy?.action==="roots"?busy.elapsed/durations.roots*.65:0,4,dt);
    water=THREE.MathUtils.damp(water,s.environment.water?1:0,1.8,dt);
    waterParts.forEach((part,i)=>{const fill=i===0?1:i===1?repaired:water;part.scale.x=Math.max(.001,fill);part.position.x=part.userData.start+part.userData.length*fill/2;part.position.y=i===2?.16+water*.19:.3;});
    sluice.position.y=.75+repaired*1.15;socket.material.emissive.set(j.repaired?"#000000":"#755127");
    wheel.rotation.z-=dt*water*1.5;
    roots.position.z=-1.8+root*1.6;roots.rotation.y=root*.6;rootBranches.forEach((b,i)=>b.rotation.z=.5-i*.32-root*.8);
    float.position.y=.25+water*.35;
    foam.forEach((f,i)=>{f.visible=i<4||s.environment.water;f.position.x=-6.5+((seconds*(s.environment.water?1.5:.3)+i*1.07)%12.8);if(!s.environment.water&&f.position.x> -3)f.visible=false;});
    shieldDown=THREE.MathUtils.damp(shieldDown,j.shield?1:busy?.action==="shield"?busy.elapsed/durations.shield:0,5,dt);
    blind.position.y=2.8-shieldDown*1.25;blind.scale.y=.15+shieldDown*.85;
    wind=THREE.MathUtils.damp(wind,s.environment.wind,5,dt);
    louvers.forEach(l=>l.rotation.y=wind*1.35);
    beds.forEach((seedling,i)=>{seedling.rotation.z=-Math.max(0,wind-(.1+shieldDown*.75))*(.85+Math.sin(seconds*5+i)*.12);});
    windRibbons.forEach((ribbon,i)=>{
      const around=shieldDown*2.9,y=.8+i*.2,z=-.4+i*.35;
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-5.5,y,z),new THREE.Vector3(-2.3,y,z),new THREE.Vector3(-1,y+around,z),new THREE.Vector3(2.4,y+around*.4,z),new THREE.Vector3(5.2,y,-3.5)]);
      const attr=ribbon.geometry.attributes.position;for(let k=0;k<40;k++){const p=curve.getPoint(k/39);attr.setXYZ(k,p.x,p.y,p.z);}attr.needsUpdate=true;
      ribbon.material.opacity=wind*.65;windDots[i].visible=wind>.05;windDots[i].position.copy(curve.getPoint((seconds*(.08+wind*.18)+i/3)%1));windDots[i].quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent((seconds*(.08+wind*.18)+i/3)%1).normalize());
    });
    fog=THREE.MathUtils.damp(fog,s.routeOpen?0:1,1.8,dt);
    mist.forEach((m,i)=>{m.material.opacity=fog*.78;m.position.y=.8+Math.floor(i/3)*.65+Math.sin(seconds*.7+i)*.08;});
    gardener.group.rotation.z=Math.sin(seconds)*.015;
    boat.position.y=.6+Math.sin(seconds*1.8)*.035;boat.rotation.z=Math.sin(seconds*1.2)*.025;boatLamp.scale.setScalar(.95+Math.sin(seconds*3)*.08);
    receivedLetter.visible=j.delivered;ferryman.arms.forEach(arm=>arm.rotation.x=j.delivered?-.7:0);
    ripples.forEach((r,i)=>r.position.set(-6.5+(i*.91+seconds*.25)%13,.3,-4.7+(i%5)*.8));
    if(ghost&&carry.visible){const desired=new THREE.Vector3(ghost.x,1.15,ghost.z);carry.position.copy(actor.group.worldToLocal(desired));}
    else if(busy&&["install","deliver"].includes(busy.action)){
      const target=busy.action==="install"?new THREE.Vector3(-3,1.4,-.3):new THREE.Vector3(2.5,.95,-1.6);
      carry.position.set(.34,.8,.26).lerp(actor.group.worldToLocal(target),Math.min(1,busy.elapsed/durations[busy.action]));
    }
    else carry.position.set(.34,.8,.26);
    label(elements.Pickup,j.itemsTaken?carry.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.65,0)):new THREE.Vector3(-4.7,1.35,2.7),room==="canal"&&!j.repaired);
    elements.Pickup.textContent=j.itemsTaken?"轴芯":"拾起轴芯";
    label(elements.Install,new THREE.Vector3(-3,2.8,-.65),room==="canal"&&j.itemsTaken&&!j.repaired);
    label(elements.Root,new THREE.Vector3(1.6,1.75,-1.8),room==="canal"&&j.repaired&&j.rootMode==="blocked");
    label(elements.Vent,new THREE.Vector3(-4.1,3.65,-1.2),room==="garden");
    label(elements.Shield,new THREE.Vector3(-1.4,1.8,1.7),room==="garden"&&!j.shield);
    label(elements.Letter,carry.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.7,0)),room==="ferry"&&!j.delivered);
    label(elements.BoatLabel,new THREE.Vector3(2.5,2.2,-1.6),room==="ferry");
    renderer.render(scene,camera);renderer.setScissorTest(false);renderer.setViewport(0,0,canvas.clientWidth,canvas.clientHeight);
    const audioState=sound.ambience(room==="garden"?wind:.1,room==="canal"?water:.35);
    canvas.dataset.journey=JSON.stringify({epoch:s.epoch,room,water:Number(water.toFixed(3)),root:Number(root.toFixed(3)),wheel:Number(wheel.rotation.z.toFixed(3)),wind:Number(wind.toFixed(3)),fog:Number(fog.toFixed(3)),shield:Number(shieldDown.toFixed(3)),sound:audioState,busy:busy?.action||pending||"",walking:queue.length>0,delivered:j.delivered,actor:[Number(actor.group.position.x.toFixed(2)),Number(actor.group.position.z.toFixed(2))]});
  }
  return {render};
}
