import * as THREE from "./vendor/three.module.js";
import { createSceneView } from "./scene-view.js?v=0.8.0";

export function createCourtyard(renderer, canvas, game) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dce8e5");
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 100);
  camera.position.set(12, 17, 22);
  camera.lookAt(0, 0, -1.65);
  camera.updateMatrixWorld();
  const view=createSceneView(renderer,canvas,camera,{width:15.4,height:11.7,active:()=>game.viewState().training.active,header:".courtyardLegend",footer:".courtyardFooter"});
  const palette = {};
  function mat(color, options = {}) {
    const key = color + JSON.stringify(options);
    return palette[key] ||= new THREE.MeshStandardMaterial({ color, roughness: .9, ...options });
  }
  const stone = mat("#edf1ed"), edge = mat("#567f79"), red = mat("#a84c48"), brass = mat("#c99f61"), wood = mat("#634d4a");
  function mesh(geometry, material, position, parent = scene) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, material, x, y, z, parent = scene) { return mesh(new THREE.BoxGeometry(w, h, d), material, [x, y, z], parent); }
  function cylinder(r, h, material, x, y, z, parent = scene) { return mesh(new THREE.CylinderGeometry(r, r, h, 16), material, [x, y, z], parent); }
  function line(points, color, parent = scene, opacity = 1) {
    const object = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    parent.add(object);
    return object;
  }
  scene.add(new THREE.HemisphereLight("#f7f6ee", "#4d8378", 2.3));
  const sun = new THREE.DirectionalLight("#fff2e3", 3.4);
  sun.position.set(-7, 17, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: .1, far: 60 });
  sun.shadow.bias = -.0005;
  sun.shadow.normalBias = .04;
  scene.add(sun);

  box(10.8, 1.15, 7.6, edge, 0, -.62, .6);
  box(10.8, .15, 7.6, stone, 0, -.015, .6);
  box(4.3, 1.15, 3.5, edge, -.8, -.62, -6.55);
  box(4.45, .18, 3.6, stone, -.8, 0, -6.55);
  for (let x = -5; x <= 5; x++) line([[x,.065,-3.15],[x,.065,4.35]], "#bfcfc7", scene, .5);
  for (let z = -3; z <= 4; z++) line([[-5.35,.065,z],[5.35,.065,z]], "#bfcfc7", scene, .5);
  const waterMat = mat("#61b9c0", { transparent: true, opacity: .9, metalness: .1, roughness: .3 });
  box(12.5, .12, 1.6, waterMat, 0, -.58, -4.05);
  box(11.2, .4, .25, mat("#3e7779"), 0, -.63, -4.9);
  const ripples = [];
  for (let i = 0; i < 18; i++) {
    const ripple = line([[0,0,0],[.5,0,0]], "#d0eeee", scene, .55);
    ripple.position.set(i * .72 - 6, -.49, -3.65 - (i % 3) * .35); ripples.push(ripple);
  }
  box(.3, .55, 5.7, stone, -5.2, .35, .25);
  box(.42, .14, 5.8, mat("#76978b"), -5.2, .66, .25);
  [-3.3, 2.9].forEach(z => {
    box(.32, .8, 1.6, stone, 5.25, .48, z);
    box(.5, .13, 1.75, mat("#76978b"), 5.25, .92, z);
  });
  box(8, .43, .25, stone, -.9, .32, 4.18);
  for (let i = 0; i < 8; i++) box(.15, .35, .18, mat("#9bada1"), -4.4 + i, .56, 4.18);

  function rock(x, z, size) {
    const object = mesh(new THREE.DodecahedronGeometry(size, 0), mat("#8da79a", { flatShading: true }), [x, size * .45, z]);
    object.scale.set(.8, 1.5, .8); object.rotation.y = size;
  }
  rock(-4.5, -1.7, 1.1); rock(-4.1, -2.6, .8); rock(-4.8, -2.7, .6);
  function bamboo(x, z, scale = 1) {
    for (let i = 0; i < 3; i++) {
      const stem = cylinder(.035, scale * (1.6 + i * .2), mat("#467d67"), x + i * .16, scale * (.8 + i * .1), z + i * .11);
      for (let j = 0; j < 3; j++) {
        const leaf = mesh(new THREE.ConeGeometry(.14, .65 * scale, 3), mat(j % 2 ? "#749365" : "#4e886a"), [stem.position.x + .12, .8 + j * .4, stem.position.z]);
        leaf.rotation.z = (j % 2 ? -1 : 1) * 1.1;
      }
    }
  }
  bamboo(-4.4, -1, 1); bamboo(4, -1.8, .85); bamboo(3.5, 3.5, .7);
  [[-4.5,3.1],[4.5,-2.4],[-2.1,-7.8]].forEach(([x,z]) => {
    cylinder(.38, .36, mat("#b37161"), x, .22, z);
    mesh(new THREE.IcosahedronGeometry(.43, 0), mat("#70926e", { flatShading: true }), [x, .65, z]);
  });

  const pavilion = new THREE.Group(); scene.add(pavilion); pavilion.position.set(-.8, .1, -7.2);
  box(2.6, .18, 1.7, mat("#cfded7"), 0, .06, 0, pavilion);
  [-.95,.95].forEach(x => [-.5,.5].forEach(z => {
    cylinder(.085, 2.1, red, x, 1.15, z, pavilion);
    cylinder(.12, .14, brass, x, .22, z, pavilion);
  }));
  const roof = mesh(new THREE.ConeGeometry(1.9, .85, 4), mat("#45797d"), [0, 2.55, 0], pavilion); roof.rotation.y = Math.PI / 4; roof.scale.z = .75;
  box(2.8, .12, 1.9, mat("#315e66"), 0, 2.17, 0, pavilion);
  box(.6, .55, .08, wood, 0, 1.65, .56, pavilion);
  const doors = [-1, 1].map(side => {
    const door = new THREE.Group(); pavilion.add(door);
    box(.75, 1.55, .11, red, side * .375, .95, .38, door);
    for (let i = 0; i < 3; i++) box(.045, 1.38, .14, brass, side * (.12 + i * .25), .95, .39, door);
    return door;
  });

  const railPoints = [new THREE.Vector3(2.5,.14,3.4),new THREE.Vector3(2.5,.14,.75),new THREE.Vector3(-.9,.14,.75)];
  [-.1,.1].forEach(offset => line(railPoints.map(p => [p.x+offset,p.y,p.z+offset]), "#b99158"));
  [railPoints[0],railPoints[2]].forEach(p => { const end = mesh(new THREE.TorusGeometry(.19, .035, 6, 20), brass, [p.x,.15,p.z]); end.rotation.x = -Math.PI / 2; });
  const screen = new THREE.Group(); screen.rotation.y = .28; scene.add(screen);
  const wing = new THREE.Group(); screen.add(wing);
  const wheels = [];
  [[screen,-1],[wing,1]].forEach(([parent,side]) => {
    const z=side*.75;
    box(.16,1.4,1.38,mat("#bb5a52"),0,1.03,z,parent);
    [.3,1.78].forEach(y=>box(.23,.08,1.46,brass,0,y,z,parent));
    [0,side*1.5].forEach(edge=>box(.24,1.85,.075,red,0,1.03,edge,parent));
    for(let j=0;j<4;j++)box(.19,.025,1.12,mat("#dfab7b"),0,.65+j*.23,z,parent);
    box(.55,.12,.24,wood,0,.17,side*1.22,parent);
    [-.18,.18].forEach(x=>{const wheel=cylinder(.095,.07,brass,x,.1,side*1.22,parent);wheel.rotation.z=Math.PI/2;wheels.push(wheel);});
  });
  [.45,1.1,1.7].forEach(y=>cylinder(.055,.13,brass,0,y,0,screen));

  const lamp = new THREE.Group(); lamp.position.set(-.8,.1,.1); scene.add(lamp);
  box(.86,.16,.86,mat("#c4d5cc"),0,.09,0,lamp);
  cylinder(.23,.68,stone,0,.5,0,lamp);
  box(.62,.12,.62,brass,0,.9,0,lamp);
  cylinder(.24,.53,mat("#f2d487",{emissive:"#9d622c",emissiveIntensity:.05}),0,1.2,0,lamp);
  [-.25,.25].forEach(x => [-.25,.25].forEach(z => box(.035,.6,.035,wood,x,1.2,z,lamp)));
  const lampRoof = mesh(new THREE.ConeGeometry(.47,.25,4),red,[0,1.6,0],lamp);lampRoof.rotation.y=Math.PI/4;
  const flameMat = mat("#ffce63",{emissive:"#ff9c29",emissiveIntensity:1});
  const flame = mesh(new THREE.ConeGeometry(.12,.4,12),flameMat,[0,1.21,0],lamp);
  const glow = new THREE.PointLight("#ffc66c",0,7,2); glow.position.set(0,1.25,0);lamp.add(glow);
  const tassel = box(.035,.6,.035,red,.3,.8,0,lamp); tassel.geometry.translate(0,-.3,0);
  const streamers = [];
  for (let i=0;i<3;i++) {
    const flag = box(.72,.13,.018,mat("#5b99a4"),5.35,.75+i*.26,.1);
    flag.geometry.translate(-.36,0,0);streamers.push(flag);
  }
  cylinder(.045,1.75,wood,5.35,.9,.1);

  const bell = new THREE.Group(); bell.position.set(-4.5,.12,.1); scene.add(bell);
  [-.4,.4].forEach(x=>cylinder(.045,2.1,wood,x,1.05,0,bell));
  box(1.05,.1,.16,red,0,2.1,0,bell);
  const bellSwing = new THREE.Group(); bellSwing.position.y=1.95;bell.add(bellSwing);
  cylinder(.013,.35,brass,0,-.15,0,bellSwing);
  mesh(new THREE.ConeGeometry(.25,.35,16,1,true),brass,[0,-.5,0],bellSwing);
  mesh(new THREE.SphereGeometry(.065,8,6),wood,[0,-.72,0],bellSwing);
  const bellPaper=box(.18,.54,.018,mat("#d4ece8"),0,-1.05,0,bellSwing);
  const bellWaves=[0,1,2].map(()=>{const ring=mesh(new THREE.RingGeometry(.3,.32,40),new THREE.MeshBasicMaterial({color:"#5ca9ad",transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}),[-4.5,.2,.1]);ring.rotation.x=-Math.PI/2;return ring;});

  const wind = [], windBranches = [], windDots = [];
  for(let i=0;i<3;i++) {
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(48*3),3));
    const ribbon=new THREE.Line(geo,new THREE.LineBasicMaterial({color:i%2?"#8ad2dd":"#269ab5",transparent:true,opacity:.68}));
    scene.add(ribbon);wind.push(ribbon);
    const branch=new THREE.Line(geo.clone(),ribbon.material.clone());scene.add(branch);windBranches.push(branch);
    for(let j=0;j<2;j++) {const dot=mesh(new THREE.ConeGeometry(.06,.2,5),mat("#2e9fb9",{emissive:"#2e9fb9",emissiveIntensity:.25}),[0,0,0]);windDots.push({object:dot,lane:i,phase:j*.4,branch:j===1});}
  }
  const lightMaterial=new THREE.MeshBasicMaterial({color:"#ffd884",side:THREE.DoubleSide,transparent:true,opacity:.03,depthWrite:false});
  const lightGeometry=new THREE.BufferGeometry();lightGeometry.setAttribute("position",new THREE.BufferAttribute(new Float32Array(9),3));
  const light=mesh(lightGeometry,lightMaterial,[0,0,0]);
  const lightLine = line([[-.8,.16,.1],[-.8,.16,-7]],"#c99744",scene,.45);
  const bridge = [];
  const fogVeils = [];
  for(let i=0;i<6;i++) {
    const slab=box(1.15,.19,.5,mat("#91aaa8"),-.8,-.11,-2.8-i*.48); bridge.push(slab);
    const mist=box(2.2,.035,.47,mat("#dce8e5",{transparent:true,opacity:.9,depthWrite:false}),-.8,.36+i*.07,-2.8-i*.48);fogVeils.push(mist);
  }
  [-1.43,-.17].forEach(x => box(.09,.15,3.3,mat("#73958c"),x,-.01,-4));

  const navNodes = game.courtyardData.nodes;
  const pathMaterial = mat("#f8faf2");
  for(const [from,to] of game.courtyardData.links) {
    const a=navNodes.find(n=>n.id===from),b=navNodes.find(n=>n.id===to);
    if(a.z< -2.4 || b.z< -2.4) continue;
    const length=Math.hypot(a.x-b.x,a.z-b.z),count=Math.ceil(length/.46);
    for(let i=0;i<=count;i++) {
      const t=i/count;
      const tile=box(.35,.04,.35,pathMaterial,THREE.MathUtils.lerp(a.x,b.x,t),.12,THREE.MathUtils.lerp(a.z,b.z,t));
      tile.rotation.y=Math.PI/4;
      tile.castShadow=false;
    }
  }
  const avatar = new THREE.Group();scene.add(avatar);
  const robe=mesh(new THREE.CylinderGeometry(.15,.26,.6,8),mat("#357c87"),[0,.5,0],avatar);
  mesh(new THREE.SphereGeometry(.17,12,8),mat("#f2d5b9"),[0,.98,0],avatar);
  const hat=mesh(new THREE.ConeGeometry(.29,.19,12),mat("#dc9f73"),[0,1.15,0],avatar);hat.rotation.z=.08;
  const scarf=box(.36,.07,.16,red,0,.76,0,avatar);
  const legs=[-.09,.09].map(x=>box(.09,.25,.12,wood,x,.15,0,avatar));
  const arms=[-.22,.22].map(x=>{const arm=box(.1,.38,.12,mat("#357c87"),x,.73,0,avatar);arm.geometry.translate(0,-.16,0);return arm;});
  const tinder=new THREE.Group();scene.add(tinder);
  const stick=box(.055,.5,.055,wood,0,0,0,tinder);stick.rotation.z=-.45;
  const ember=mesh(new THREE.SphereGeometry(.075,8,6),flameMat,[-.11,.24,0],tinder);
  const sparks=Array.from({length:7},()=>mesh(new THREE.TetrahedronGeometry(.035),flameMat,[0,0,0]));
  const destination=mesh(new THREE.RingGeometry(.22,.26,32),new THREE.MeshBasicMaterial({color:"#fff3bc",side:THREE.DoubleSide}),[0,.16,0]);destination.rotation.x=-Math.PI/2;destination.visible=false;

  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const handle=document.getElementById("screenHandle"),foldHandle=document.getElementById("foldHandle"),tinderHandle=document.getElementById("tinderHandle");
  const lampHandle=document.getElementById("lampHandle"),gateHandle=document.getElementById("gateHandle"),bellLabel=document.getElementById("bellLabel");
  const lampButton=document.getElementById("courtyardLamp"),soundToggle=document.getElementById("courtyardSound");
  let slide=0,fold=0,opened=0,seed="",epoch=-1,currentNode="start",queue=[],dragging=false,foldDragging=false,dragOffset=0,lastTime=0,viewport={top:0,height:1,width:1};
  let foldStart=0,foldPointer=0,fireDragging=false,fireMoved=false,fireStart=null,firePoint=null,pendingLight=false;
  let previousBridgeOpen=false,previousIgnition=0,previousLit=false,lastBellAt=-10,bellStrikes=0,audio=null,sparkAge=10;
  function ray(event,height=0) {
    const rect=canvas.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/viewport.width*2-1,-((event.clientY-rect.top-viewport.top)/viewport.height)*2+1);
    raycaster.setFromCamera(pointer,camera);
    floor.constant=-height;
    return raycaster.ray.intersectPlane(floor,new THREE.Vector3());
  }
  function project(point) {
    return view.project(point);
  }
  function railProgress(event) {
    const rect=canvas.getBoundingClientRect(),p={x:event.clientX-rect.left,y:event.clientY-rect.top};
    const points=railPoints.map(point=>project(point.clone().add(new THREE.Vector3(-.26,1.45,-.91))));
    let closest={distance:Infinity,value:0};
    for(let i=0;i<2;i++){
      const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y;
      const t=THREE.MathUtils.clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy),0,1);
      const distance=(p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
      if(distance<closest.distance)closest={distance,value:(i+t)/2};
    }
    return closest.value;
  }
  function canManipulate(){const s=game.viewState();return s.started&&!s.dialogue&&!s.training.complete;}
  handle.addEventListener("pointerdown",event=>{
    if(!canManipulate())return;
    dragging=true;dragOffset=game.viewState().training.slide-railProgress(event);queue=[];pendingLight=false;
    handle.setPointerCapture(event.pointerId);event.preventDefault();startAudio();
  });
  handle.addEventListener("pointermove",event=>{if(dragging)game.setScreenSlide(railProgress(event)+dragOffset);});
  function endDrag(){if(dragging)tone(160,.09,.08);dragging=false;}
  handle.addEventListener("pointerup",endDrag);handle.addEventListener("pointercancel",endDrag);handle.addEventListener("lostpointercapture",endDrag);
  handle.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key))return;
    const t=game.viewState().training.slide;
    game.setScreenSlide(event.key==="Home"?0:event.key==="End"?1:t+(["ArrowLeft","ArrowUp"].includes(event.key)?-.04:.04));event.preventDefault();
  });
  foldHandle.addEventListener("pointerdown",event=>{
    if(!canManipulate())return;
    foldDragging=true;foldStart=game.viewState().training.fold;foldPointer=event.clientX;queue=[];pendingLight=false;
    foldHandle.setPointerCapture(event.pointerId);event.preventDefault();startAudio();
  });
  foldHandle.addEventListener("pointermove",event=>{if(foldDragging)game.setScreenFold(foldStart+(event.clientX-foldPointer)/Math.max(100,viewport.width*.14));});
  function endFold(){if(foldDragging)tone(280,.12,.045);foldDragging=false;}
  foldHandle.addEventListener("pointerup",endFold);foldHandle.addEventListener("pointercancel",endFold);foldHandle.addEventListener("lostpointercapture",endFold);
  foldHandle.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key))return;
    game.setScreenFold(event.key==="Home"?-1:event.key==="End"?1:game.viewState().training.fold+(["ArrowLeft","ArrowUp"].includes(event.key)?-.08:.08));event.preventDefault();
  });
  function walkTo(id,lighting=false){
    const state=game.viewState();if(!state.started||state.dialogue||state.training.complete)return;
    const path=game.courtyardPath(currentNode,id,state.training.bridgeOpen);
    if(!path.length){document.getElementById("courtyardFeedback").textContent="桥面还看不清。先让灯稳定下来。";return;}
    queue=path;pendingLight=lighting;const last=path[path.length-1];destination.position.set(last.x,.16,last.z);destination.visible=true;
  }
  canvas.addEventListener("pointerup",event=>{
    if(!game.viewState().training.active)return;
    if(view.dragged)return;
    const state=game.viewState();if(!state.started||state.dialogue||state.training.complete)return;
    const p=ray(event);if(!p)return;
    if(Math.abs(p.x)<2&&p.z < -5){walkTo("gate");return;}
    if(p.x < -5||p.x >5.4||p.z< -5.5||p.z>4.2)return;
    const node=navNodes.reduce((best,n)=>p.distanceToSquared(new THREE.Vector3(n.x,0,n.z))<p.distanceToSquared(new THREE.Vector3(best.x,0,best.z))?n:best);
    walkTo(node.id);
  });
  function requestLight(){
    const s=game.viewState();if(!canManipulate()||s.training.lampLit||s.training.ignition)return;
    startAudio();walkTo("lamp",true);
  }
  lampHandle.onclick=requestLight;lampButton.onclick=requestLight;
  tinderHandle.addEventListener("pointerdown",event=>{
    if(!canManipulate()||pendingLight||game.viewState().training.ignition)return;
    fireDragging=true;fireMoved=false;fireStart={x:event.clientX,y:event.clientY};firePoint=ray(event,1.2);
    tinderHandle.setPointerCapture(event.pointerId);event.preventDefault();startAudio();
  });
  tinderHandle.addEventListener("pointermove",event=>{
    if(!fireDragging)return;
    fireMoved ||= Math.hypot(event.clientX-fireStart.x,event.clientY-fireStart.y)>5;
    firePoint=ray(event,1.2);
  });
  tinderHandle.addEventListener("pointerup",event=>{
    if(!fireDragging)return;
    const target=lampHandle.getBoundingClientRect();
    if(fireMoved&&event.clientX>target.left-32&&event.clientX<target.right+32&&event.clientY>target.top-32&&event.clientY<target.bottom+32)requestLight();
    fireDragging=false;
  });
  tinderHandle.addEventListener("pointercancel",()=>{fireDragging=false;});
  tinderHandle.addEventListener("lostpointercapture",()=>{fireDragging=false;});
  tinderHandle.onclick=()=>{if(!fireMoved)requestLight();fireMoved=false;};
  gateHandle.onclick=()=>walkTo("gate");
  document.getElementById("courtyardWalk").onclick=()=>walkTo("gate");
  function placeLabel(element,point) {
    const p=project(point);element.style.left=`${p.x}px`;element.style.top=`${p.y}px`;
  }
  function startAudio(){
    if(!soundToggle.checked)return;
    try{
      if(!audio){
        const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
        const context=new Context(),master=context.createGain();master.gain.value=.18;master.connect(context.destination);
        const buffer=context.createBuffer(1,context.sampleRate,context.sampleRate),data=buffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.35;
        const noise=context.createBufferSource(),filter=context.createBiquadFilter(),windGain=context.createGain();
        noise.buffer=buffer;noise.loop=true;filter.type="bandpass";filter.frequency.value=550;filter.Q.value=.35;windGain.gain.value=.03;
        noise.connect(filter);filter.connect(windGain);windGain.connect(master);noise.start();audio={context,master,windGain};
      }
      audio.context.resume().catch(()=>{});
    }catch{soundToggle.checked=false;}
  }
  function tone(frequency,duration,volume){
    if(!audio||!soundToggle.checked||document.hidden)return;
    const {context,master}=audio,t=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
    osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain);gain.connect(master);osc.start();osc.stop(t+duration);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function silence(){if(audio)audio.master.gain.setTargetAtTime(0,audio.context.currentTime,.06);}
  const journeySound=document.getElementById("journeySound");
  for(const toggle of [soundToggle,journeySound])toggle.onchange=()=>{soundToggle.checked=journeySound.checked=toggle.checked;if(toggle.checked)startAudio();else silence();};
  function ambience(wind,water){
    if(audio){
      audio.master.gain.setTargetAtTime(soundToggle.checked&&!document.hidden?.18:0,audio.context.currentTime,.08);
      audio.windGain.gain.setTargetAtTime(.02+wind*.05+water*.07,audio.context.currentTime,.1);
    }
    return audio?.context.state||"idle";
  }
  document.addEventListener("pointerdown",startAudio,{once:true});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)silence();});
  function fit() {
    viewport=view.frame();
  }
  function render(state,time) {
    const dt=Math.min(.05,lastTime?(time-lastTime)/1000:.016);lastTime=time;
    if(seed!==state.seed||epoch!==state.epoch){view.reset();seed=state.seed;epoch=state.epoch;slide=state.training.slide;fold=state.training.fold;opened=state.training.bridgeOpen?1:0;queue=[];pendingLight=false;currentNode=state.training.complete?"gate":"start";const node=navNodes.find(n=>n.id===currentNode);avatar.position.set(node.x,.15,node.z);destination.visible=false;previousIgnition=0;previousLit=state.training.lampLit;sparkAge=10;bellStrikes=0;lastBellAt=-10;}
    fit();
    const previousSlide=slide;
    slide=THREE.MathUtils.damp(slide,state.training.slide,dragging?30:10,dt);
    fold=THREE.MathUtils.damp(fold,state.training.fold,foldDragging?30:12,dt);
    const layout=game.courtyardLayout(slide,fold);
    screen.position.set(layout.x,.09,layout.z);
    wing.rotation.y=fold*1.35;
    wheels.forEach(wheel=>{wheel.rotation.x+=(slide-previousSlide)*24;});
    const shelter=1-layout.lampWind;
    const seconds=time/1000;
    // shortcut: rays sample the hinged panels; downstream flow uses authored curves until more obstacles are introduced.
    const curves=[],branches=[];
    wind.forEach((ribbon,i)=>{
      const flow=layout.flows[i*4],y=.7+i*.08,z=flow.z;
      const end=flow.hit?new THREE.Vector3(flow.hit.x+.08,y,z):new THREE.Vector3(-5.6,y,z);
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(5.9,y,z),new THREE.Vector3((5.9+end.x)/2,y,z+.025*Math.sin(seconds+i)),end]);curves.push(curve);
      const around=fold<0?-1.65:2.3;
      const branch=new THREE.CatmullRomCurve3([end,new THREE.Vector3(end.x+.18,y,around*.65),new THREE.Vector3(Math.min(end.x-.7,-.3),y,around),new THREE.Vector3(-2.8,y,around),new THREE.Vector3(-4.5,y,z),new THREE.Vector3(-5.6,y,z)],false,"centripetal");branches.push(branch);
      windBranches[i].visible=!!flow.hit&&layout.opening>.03;
      windBranches[i].material.opacity=layout.opening*.65;
      const positions=ribbon.geometry.attributes.position;
      const downstream=windBranches[i].geometry.attributes.position;
      for(let j=0;j<48;j++){const p=curve.getPoint(j/47),b=branch.getPoint(j/47);positions.setXYZ(j,p.x,p.y,p.z);downstream.setXYZ(j,b.x,b.y,b.z);}
      positions.needsUpdate=true;
      downstream.needsUpdate=true;
    });
    windDots.forEach(({object,lane,phase,branch})=>{
      const t=(seconds*.22+phase+lane*.07)%1,curve=branch?branches[lane]:curves[lane];object.position.copy(curve.getPoint(t));
      object.visible=!branch||windBranches[lane].visible;
      object.scale.setScalar(branch?.35+layout.opening*.65:1);
      object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent(t).normalize());
    });
    streamers.forEach((flag,i)=>{flag.rotation.y=Math.sin(seconds*5+i)*.18;flag.rotation.z=Math.sin(seconds*6+i)*.12;});
    const lit=state.training.lampLit,igniting=state.training.ignition>0;
    tassel.rotation.z=-layout.lampWind*(1+Math.sin(seconds*8)*.12);
    flame.rotation.z=lit?Math.sin(seconds*3)*.04:.9*layout.lampWind;
    flame.scale.setScalar(lit?1:igniting?.3+Math.sin(seconds*18)*.15:0);
    glow.intensity=THREE.MathUtils.damp(glow.intensity,lit?5:0,5,dt);
    const beamEnd=layout.lightBlocked?-.2:-7;
    lightGeometry.attributes.position.setXYZ(0,-.8,1.3,.1);lightGeometry.attributes.position.setXYZ(1,-1.65,.2,beamEnd);lightGeometry.attributes.position.setXYZ(2,.05,.2,beamEnd);lightGeometry.attributes.position.needsUpdate=true;
    lightMaterial.opacity=THREE.MathUtils.damp(lightMaterial.opacity,lit?.22:.025,5,dt);
    lightLine.geometry.attributes.position.setXYZ(1,-.8,.16,beamEnd);lightLine.geometry.attributes.position.needsUpdate=true;
    opened=THREE.MathUtils.damp(opened,state.training.bridgeOpen?1:0,2.7,dt);
    bridge.forEach((slab,i)=>{slab.position.y=THREE.MathUtils.lerp(-.11,.09,THREE.MathUtils.smoothstep(opened,i*.08,.45+i*.08));slab.material.color.set("#91aaa8").lerp(new THREE.Color("#f9dda3"),opened);});
    fogVeils.forEach((veil,i)=>{veil.material.opacity=(1-opened)*.82;veil.position.x=-.8+Math.sin(seconds+i)*.1;});
    doors.forEach((door,i)=>{door.position.x=(i?1:-1)*opened*.9;});
    ripples.forEach((r,i)=>{r.position.x=((i*.72+seconds*.18+6)%12.7)-6.3;});
    bellSwing.rotation.z=Math.sin(seconds*(3.8+layout.bellWind))*layout.bellWind*.4;
    bellPaper.rotation.y=Math.sin(seconds*7)*layout.bellWind*.4;
    if(layout.bellRinging&&state.started&&!state.dialogue&&seconds-lastBellAt>1.4){lastBellAt=seconds;bellStrikes+=1;tone(880,1.8,.18);tone(1323,1.2,.07);tone(1768,.7,.025);}
    bellWaves.forEach((ring,i)=>{const age=seconds-lastBellAt-i*.15;ring.visible=layout.bellRinging&&age>0&&age<1;ring.scale.setScalar(1+Math.max(0,age)*2);ring.material.opacity=ring.visible?(1-age)*.3:0;});
    if(audio){audio.master.gain.setTargetAtTime(soundToggle.checked&&state.started&&!document.hidden?.18:0,audio.context.currentTime,.08);audio.windGain.gain.setTargetAtTime(dragging||foldDragging?.12:.025,audio.context.currentTime,.06);}
    if(previousBridgeOpen&&!state.training.bridgeOpen&&avatar.position.z < -2.2){avatar.position.set(-.8,.15,-2.2);currentNode="shore";queue=[];destination.visible=false;}
    previousBridgeOpen=state.training.bridgeOpen;
    if(dragging||foldDragging){
      const contact=new THREE.Vector3(layout.x+.6,.15,layout.z+.25);
      avatar.position.lerp(contact,1-Math.exp(-dt*8));avatar.rotation.y=Math.atan2(layout.x-avatar.position.x,layout.z-avatar.position.z);
      currentNode=navNodes.reduce((best,node)=>Math.hypot(node.x-avatar.position.x,node.z-avatar.position.z)<Math.hypot(best.x-avatar.position.x,best.z-avatar.position.z)?node:best).id;
    }else if(queue.length&&!state.dialogue){
      const next=queue[0],target=new THREE.Vector3(next.x,.15,next.z),distance=avatar.position.distanceTo(target);
      if(distance<dt*2.6){avatar.position.copy(target);currentNode=next.id;queue.shift();if(!queue.length){destination.visible=false;if(pendingLight){pendingLight=false;game.trainingAction("courtyard_light");}else if(currentNode==="gate")game.completeCourtyard();}}
      else {const direction=target.sub(avatar.position).normalize();avatar.position.addScaledVector(direction,dt*2.6);avatar.rotation.y=Math.atan2(direction.x,direction.z);}
    }
    const moving=queue.length||dragging||foldDragging;
    legs.forEach((leg,i)=>{leg.rotation.x=moving?Math.sin(seconds*13+i*Math.PI)*.45:0;});
    arms.forEach(arm=>{arm.rotation.x=dragging||foldDragging||igniting?-1.1:pendingLight?-.65:0;});
    robe.rotation.z=queue.length?Math.sin(seconds*7)*.035:0;scarf.rotation.y=Math.sin(seconds*4)*.06;
    const hand=avatar.localToWorld(new THREE.Vector3(.3,.85,.3));
    if(fireDragging&&firePoint)tinder.position.copy(firePoint);
    else tinder.position.copy(hand).lerp(new THREE.Vector3(-.85,1.2,.2),igniting?Math.min(1,(1.1-state.training.ignition)*4):0);
    ember.scale.setScalar(.7+Math.sin(seconds*16)*.15);
    if(previousIgnition>0&&!igniting){sparkAge=0;tone(lit?660:160,lit?.3:.2,.08);}
    if(previousLit&&!lit)sparkAge=0;
    previousIgnition=state.training.ignition;previousLit=lit;sparkAge+=dt;
    sparks.forEach((spark,i)=>{spark.visible=sparkAge<.75;spark.position.set(-.8+(lit?.2:layout.lampWind*1.5)*Math.sin(i*3)*sparkAge,1.35+sparkAge*(.7+i*.08),.1+(i-3)*sparkAge*.18);spark.scale.setScalar(Math.max(0,1-sparkAge/.75));});
    handle.disabled=!state.started||state.dialogue||state.training.complete;
    handle.style.visibility=state.training.complete?"hidden":"visible";
    foldHandle.disabled=handle.disabled;foldHandle.style.visibility=handle.style.visibility;
    placeLabel(handle,screen.localToWorld(new THREE.Vector3(0,1.45,-.95)));
    placeLabel(foldHandle,wing.localToWorld(new THREE.Vector3(0,2.05,1.4)));
    placeLabel(lampHandle,new THREE.Vector3(-1.3,2.1,-.25));
    placeLabel(bellLabel,new THREE.Vector3(-4.5,2.5,.1));
    placeLabel(gateHandle,new THREE.Vector3(-.8,3.3,-7.2));
    placeLabel(tinderHandle,tinder.position.clone().add(new THREE.Vector3(0,.4,0)));
    tinderHandle.classList.toggle("dragging",fireDragging);
    tinderHandle.style.visibility=lit||state.training.complete||igniting?"hidden":"visible";
    tinderHandle.disabled=handle.disabled||pendingLight;
    lampHandle.disabled=!state.started||state.dialogue||lit||igniting||pendingLight;lampButton.disabled=lampHandle.disabled;
    if(pendingLight)lampButton.textContent="携火走近灯台…";
    gateHandle.disabled=!state.started||state.dialogue||state.training.complete;
    renderer.render(scene,camera);
    renderer.setScissorTest(false);renderer.setViewport(0,0,canvas.clientWidth,canvas.clientHeight);
    canvas.dataset.courtyard=JSON.stringify({slide:Number(slide.toFixed(3)),fold:Number(fold.toFixed(3)),screenX:Number(layout.x.toFixed(3)),screenZ:Number(layout.z.toFixed(3)),shelter:Number(shelter.toFixed(3)),bellWind:Number(layout.bellWind.toFixed(3)),bellRinging:layout.bellRinging,bellStrikes,sound:audio?.context.state||"idle",muted:!soundToggle.checked,lighting:igniting||pendingLight,lightBlocked:layout.lightBlocked,bridge:Number(opened.toFixed(3)),walking:queue.length>0,node:currentNode});
  }
  return {render,silence,startAudio,tone,ambience};
}
