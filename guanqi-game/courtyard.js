import * as THREE from "./vendor/three.module.js";

export function createCourtyard(renderer, canvas, game) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dce8e5");
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 100);
  camera.position.set(12, 17, 22);
  camera.lookAt(0, 0, -1.65);
  camera.updateMatrixWorld();
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

  const railA = new THREE.Vector3(3, .13, 3.4), railB = new THREE.Vector3(-1.1, .13, -.8);
  [-.13,.13].forEach(offset => line([[railA.x + offset,.14,railA.z],[railB.x + offset,.14,railB.z]], "#b99158"));
  [railA,railB].forEach(p => { const end = mesh(new THREE.TorusGeometry(.19, .035, 6, 20), brass, [p.x,.15,p.z]); end.rotation.x = -Math.PI / 2; });
  const screen = new THREE.Group(); screen.rotation.y = .28; scene.add(screen);
  [-.92,0,.92].forEach(z => {
    box(.25, 1.48, .86, mat("#bb5a52"), 0, 1.05, z, screen);
    box(.3, .07, .89, brass, 0, 1.83, z, screen);
    box(.3, .07, .89, brass, 0, .29, z, screen);
    for (let j = 0; j < 3; j++) box(.28, .025, .58, mat("#dfab7b"), 0, .75 + j * .24, z, screen);
  });
  [-1.4,-.47,.47,1.4].forEach(z => box(.32, 1.9, .07, red, 0, 1.02, z, screen));
  [-1.15,1.15].forEach(z => {
    box(.7,.12,.26,wood,0,.17,z,screen);
    [-.22,.22].forEach(x => { const wheel = cylinder(.09,.08,brass,x,.1,z,screen); wheel.rotation.z = Math.PI / 2; });
  });

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

  const wind = [], windDots = [];
  for(let i=0;i<5;i++) {
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(48*3),3));
    const ribbon=new THREE.Line(geo,new THREE.LineBasicMaterial({color:i%2?"#8ad2dd":"#269ab5",transparent:true,opacity:.68}));
    scene.add(ribbon);wind.push(ribbon);
    for(let j=0;j<3;j++) {const dot=mesh(new THREE.ConeGeometry(.075,.24,5),mat("#2e9fb9",{emissive:"#2e9fb9",emissiveIntensity:.25}),[0,0,0]);windDots.push({object:dot,lane:i,phase:j/3});}
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
  const destination=mesh(new THREE.RingGeometry(.22,.26,32),new THREE.MeshBasicMaterial({color:"#fff3bc",side:THREE.DoubleSide}),[0,.16,0]);destination.rotation.x=-Math.PI/2;destination.visible=false;

  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const handle=document.getElementById("screenHandle"),lampHandle=document.getElementById("lampHandle"),gateHandle=document.getElementById("gateHandle");
  let slide=0,opened=0,seed="",currentNode="start",queue=[],dragging=false,dragOffset=0,lastTime=0,viewport={top:0,height:1,width:1};
  let previousBridgeOpen=false;
  function ray(event) {
    const rect=canvas.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/viewport.width*2-1,-((event.clientY-rect.top-viewport.top)/viewport.height)*2+1);
    raycaster.setFromCamera(pointer,camera);
    return raycaster.ray.intersectPlane(floor,new THREE.Vector3());
  }
  function railProgress(p) { return p.clone().sub(railA).dot(railB.clone().sub(railA)) / railA.distanceToSquared(railB); }
  handle.addEventListener("pointerdown",event=>{
    const state=game.viewState();if(!state.started||state.dialogue||state.training.complete)return;
    const p=ray(event);if(!p)return;
    dragging=true;dragOffset=state.training.slide-railProgress(p);handle.setPointerCapture(event.pointerId);event.preventDefault();
  });
  handle.addEventListener("pointermove",event=>{if(!dragging)return;const p=ray(event);if(p)game.setScreenSlide(railProgress(p)+dragOffset);});
  function endDrag(){dragging=false;}
  handle.addEventListener("pointerup",endDrag);handle.addEventListener("pointercancel",endDrag);handle.addEventListener("lostpointercapture",endDrag);
  handle.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key))return;
    const t=game.viewState().training.slide;
    game.setScreenSlide(event.key==="Home"?0:event.key==="End"?1:t+(["ArrowLeft","ArrowUp"].includes(event.key)?-.04:.04));event.preventDefault();
  });
  function walkTo(id){
    const state=game.viewState();if(!state.started||state.dialogue||state.training.complete)return;
    const path=game.courtyardPath(currentNode,id,state.training.bridgeOpen);
    if(!path.length){document.getElementById("courtyardFeedback").textContent="桥面还看不清。先让灯稳定下来。";return;}
    queue=path;const last=path[path.length-1];destination.position.set(last.x,.16,last.z);destination.visible=true;
  }
  canvas.addEventListener("pointerup",event=>{
    if(!game.viewState().training.active)return;
    const state=game.viewState();if(!state.started||state.dialogue||state.training.complete)return;
    const p=ray(event);if(!p)return;
    if(Math.abs(p.x)<2&&p.z < -5){walkTo("gate");return;}
    if(p.x < -5||p.x >5.4||p.z< -5.5||p.z>4.2)return;
    const node=navNodes.reduce((best,n)=>p.distanceToSquared(new THREE.Vector3(n.x,0,n.z))<p.distanceToSquared(new THREE.Vector3(best.x,0,best.z))?n:best);
    walkTo(node.id);
  });
  lampHandle.onclick=()=>game.trainingAction("courtyard_light");
  gateHandle.onclick=()=>walkTo("gate");
  document.getElementById("courtyardWalk").onclick=()=>walkTo("gate");
  function placeLabel(element,point) {
    const p=point.clone().project(camera);
    element.style.left=`${(p.x+1)*viewport.width/2}px`;
    element.style.top=`${viewport.top+(1-p.y)*viewport.height/2}px`;
  }
  function fit() {
    const width=canvas.clientWidth,height=canvas.clientHeight,mobile=width<=640;
    const top=mobile?155:height<600?85:115;
    const bottom=mobile?225:height<600?155:195;
    viewport={top,height:Math.max(100,height-top-bottom),width};
    const ratio=width/viewport.height;
    const viewHeight=Math.max(13.4,16.4/ratio);
    camera.left=-viewHeight*ratio/2;camera.right=viewHeight*ratio/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
    camera.updateProjectionMatrix();
    renderer.setViewport(0,0,width,height);renderer.setScissorTest(false);renderer.clear();
    renderer.setViewport(0,height-top-viewport.height,width,viewport.height);
    renderer.setScissor(0,height-top-viewport.height,width,viewport.height);renderer.setScissorTest(true);
  }
  function render(state,time) {
    const dt=Math.min(.05,lastTime?(time-lastTime)/1000:.016);lastTime=time;
    if(seed!==state.seed){seed=state.seed;slide=state.training.slide;opened=state.training.bridgeOpen?1:0;queue=[];currentNode="start";avatar.position.set(-3.6,.15,2.6);destination.visible=false;}
    fit();
    slide=THREE.MathUtils.damp(slide,state.training.slide,dragging?30:10,dt);
    const layout=game.courtyardLayout(slide);
    screen.position.set(layout.x,.09,layout.z);
    const shelter=THREE.MathUtils.smoothstep(slide,.43,.56)*(1-THREE.MathUtils.smoothstep(slide,.92,1));
    const seconds=time/1000;
    // shortcut: wind follows authored curves; use obstacle-aware flow when adding freely movable objects.
    const curves=[];
    wind.forEach((ribbon,i)=>{
      const y=.75+i*.07,z=.1+(i-2)*.1;
      const direct=[new THREE.Vector3(5.9,y,z),new THREE.Vector3(3.9,y,z),new THREE.Vector3(1.9,y,z),new THREE.Vector3(-.2,y,z),new THREE.Vector3(-2.5,y,z),new THREE.Vector3(-5.6,y,z)];
      const bend=[direct[0],new THREE.Vector3(layout.x+1.3,y,z),new THREE.Vector3(layout.x+.7,y,layout.z+1.8),new THREE.Vector3(layout.x-.65,y,layout.z+2.0),new THREE.Vector3(-2.9,y,1.5+z),new THREE.Vector3(-5.6,y,1.5+z)];
      const curve=new THREE.CatmullRomCurve3(direct.map((p,j)=>p.lerp(bend[j],shelter)),false,"centripetal");curves.push(curve);
      const positions=ribbon.geometry.attributes.position;
      for(let j=0;j<48;j++){const p=curve.getPoint(j/47);positions.setXYZ(j,p.x,p.y,p.z);}
      positions.needsUpdate=true;
    });
    windDots.forEach(({object,lane,phase})=>{
      const t=(seconds*.17+phase+lane*.07)%1,curve=curves[lane];object.position.copy(curve.getPoint(t));
      object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent(t).normalize());
    });
    streamers.forEach((flag,i)=>{flag.rotation.y=Math.sin(seconds*5+i)*.18;flag.rotation.z=Math.sin(seconds*6+i)*.12;});
    const lit=state.training.lampLit;
    tassel.rotation.z=lit?.03:-(1-shelter)*1.1-Math.sin(seconds*8)*.12*(1-shelter);
    flame.rotation.z=lit?Math.sin(seconds*3)*.04:.9*(1-shelter);
    flame.scale.setScalar(lit?1:layout.safe?.2:Math.max(0,Math.sin(seconds*7))*.34);
    glow.intensity=THREE.MathUtils.damp(glow.intensity,lit?5:0,5,dt);
    const beamEnd=layout.lightBlocked?layout.z+1.1:-7;
    lightGeometry.attributes.position.setXYZ(0,-.8,1.3,.1);lightGeometry.attributes.position.setXYZ(1,-1.65,.2,beamEnd);lightGeometry.attributes.position.setXYZ(2,.05,.2,beamEnd);lightGeometry.attributes.position.needsUpdate=true;
    lightMaterial.opacity=THREE.MathUtils.damp(lightMaterial.opacity,lit?.22:.025,5,dt);
    lightLine.geometry.attributes.position.setXYZ(1,-.8,.16,beamEnd);lightLine.geometry.attributes.position.needsUpdate=true;
    opened=THREE.MathUtils.damp(opened,state.training.bridgeOpen?1:0,2.7,dt);
    bridge.forEach((slab,i)=>{slab.position.y=THREE.MathUtils.lerp(-.11,.09,THREE.MathUtils.smoothstep(opened,i*.08,.45+i*.08));slab.material.color.set("#91aaa8").lerp(new THREE.Color("#f9dda3"),opened);});
    fogVeils.forEach((veil,i)=>{veil.material.opacity=(1-opened)*.82;veil.position.x=-.8+Math.sin(seconds+i)*.1;});
    doors.forEach((door,i)=>{door.position.x=(i?1:-1)*opened*.9;});
    ripples.forEach((r,i)=>{r.position.x=((i*.72+seconds*.18+6)%12.7)-6.3;});
    if(previousBridgeOpen&&!state.training.bridgeOpen&&avatar.position.z < -2.2){avatar.position.set(-.8,.15,-2.2);currentNode="shore";queue=[];destination.visible=false;}
    previousBridgeOpen=state.training.bridgeOpen;
    if(queue.length&&!state.dialogue){
      const next=queue[0],target=new THREE.Vector3(next.x,.15,next.z),distance=avatar.position.distanceTo(target);
      if(distance<dt*2.6){avatar.position.copy(target);currentNode=next.id;queue.shift();if(!queue.length){destination.visible=false;if(currentNode==="gate")game.completeCourtyard();}}
      else {const direction=target.sub(avatar.position).normalize();avatar.position.addScaledVector(direction,dt*2.6);avatar.rotation.y=Math.atan2(direction.x,direction.z);}
    }
    legs.forEach((leg,i)=>{leg.rotation.x=queue.length?Math.sin(seconds*13+i*Math.PI)*.45:0;});
    robe.rotation.z=queue.length?Math.sin(seconds*7)*.035:0;scarf.rotation.y=Math.sin(seconds*4)*.06;
    handle.disabled=!state.started||state.dialogue||state.training.complete;
    handle.style.visibility=state.training.complete?"hidden":"visible";
    placeLabel(handle,new THREE.Vector3(layout.x+.38,1.65,layout.z+1.4));
    placeLabel(lampHandle,new THREE.Vector3(-1.3,2.1,-.25));
    placeLabel(gateHandle,new THREE.Vector3(-.8,3.3,-7.2));
    lampHandle.disabled=!state.started||state.dialogue||lit;gateHandle.disabled=!state.started||state.dialogue||state.training.complete;
    renderer.render(scene,camera);
    renderer.setScissorTest(false);renderer.setViewport(0,0,canvas.clientWidth,canvas.clientHeight);
    canvas.dataset.courtyard=JSON.stringify({slide:Number(slide.toFixed(3)),screenX:Number(layout.x.toFixed(3)),screenZ:Number(layout.z.toFixed(3)),shelter:Number(shelter.toFixed(3)),lightBlocked:layout.lightBlocked,bridge:Number(opened.toFixed(3)),walking:queue.length>0,node:currentNode});
  }
  return {render};
}
