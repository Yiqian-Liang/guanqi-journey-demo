import * as THREE from "./vendor/three.module.js";

const game = window.GuanqiGame;
const canvas = document.getElementById("world3d");

try {
  initWorld();
} catch (error) {
  console.warn("3D scene unavailable; using map view.", error);
  game.setViewMode("map");
}

function initWorld() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const renderCheck = new URLSearchParams(location.search).has("rendercheck");
  let renderCheckFrame = 0;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const sky = new THREE.Color("#a9cbc2");
  scene.background = sky;
  scene.fog = new THREE.FogExp2(sky, .026);

  const camera = new THREE.PerspectiveCamera(58, 16 / 9, .1, 100);
  const gradientMap = new THREE.DataTexture(new Uint8Array([62, 126, 196, 255]), 4, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  const world = game.worldData;
  const spotById = Object.fromEntries(world.spots.map(spot => [spot.id, spot]));
  const materials = {
    ground: material("#6f8d59", .9), meadow: material("#8aa169", .92), earth: material("#b69a6a", .95),
    road: material("#cbb486", 1), water: material("#3b91aa", .78, true), channel: material("#456b6d", .5),
    wall: material("#d4c3a1", 1), wood: material("#76513a", 1), roof: material("#9d493d", 1),
    roofGold: material("#c68d3f", 1), leaf: material("#3e7650", 1), herb: material("#69a65e", 1),
    stone: material("#7a8580", 1), gold: material("#ffd45e", 1, true)
  };

  scene.add(new THREE.HemisphereLight("#dff7ee", "#5c493c", 2.2));
  const sun = new THREE.DirectionalLight("#ffe2a5", 3.1);
  sun.position.set(-12, 22, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -26;
  sun.shadow.camera.right = sun.shadow.camera.top = 26;
  scene.add(sun);

  const ground = mesh(new THREE.PlaneGeometry(46, 28), materials.ground, [0, 0, 0], [-Math.PI / 2, 0, 0]);
  ground.receiveShadow = true;
  patch(-10, -3, 10, "#91a867");
  patch(7, 3, 12, "#709a73");
  patch(15, -5, 8, "#a6a26c");

  let trainingRoad;
  world.links.forEach(([a, b]) => {
    const path = road(toWorld(spotById[a]), toWorld(spotById[b]));
    if ((a === "camp" && b === "village") || (a === "village" && b === "camp")) trainingRoad = path;
  });
  addRiver();
  addScenery();
  addLandmarks();
  const training = addTrainingYard();

  const player = makePlayer();
  player.scale.setScalar(.82);
  scene.add(player);
  const marker = makeMarker();
  scene.add(marker.group);
  const guidePositions = new Float32Array(6);
  const guideGeometry = new THREE.BufferGeometry();
  guideGeometry.setAttribute("position", new THREE.BufferAttribute(guidePositions, 3));
  const guideLine = new THREE.Line(guideGeometry, new THREE.LineDashedMaterial({ color: "#ffd45e", dashSize: .45, gapSize: .28, transparent: true, opacity: .9 }));
  scene.add(guideLine);

  const playerPosition = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  let orbitYaw = 0;
  let dragging = false;
  let pointerX = 0;
  canvas.addEventListener("pointerdown", event => { dragging = true; pointerX = event.clientX; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener("pointermove", event => {
    if (!dragging) return;
    orbitYaw -= (event.clientX - pointerX) * .006;
    pointerX = event.clientX;
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  function render() {
    requestAnimationFrame(render);
    const state = game.viewState();
    resize();
    if (state.viewMode !== "close") return;

    const targetPosition = toWorld(state.player);
    playerPosition.lerp(targetPosition, .22);
    const moving = playerPosition.distanceToSquared(targetPosition) > .0002;
    player.position.copy(playerPosition);
    player.position.y = Math.sin(state.tick * .12) * (moving ? .04 : .015);

    const facing = new THREE.Vector3(state.facing.x, 0, state.facing.y).normalize();
    facing.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitYaw);
    player.rotation.y = Math.atan2(state.facing.x, state.facing.y);
    const side = new THREE.Vector3(facing.z, 0, -facing.x);
    cameraPosition.copy(playerPosition).addScaledVector(facing, -4.45).addScaledVector(side, 1.35).add(new THREE.Vector3(0, 2.75, 0));
    camera.position.lerp(cameraPosition, .1);
    camera.lookAt(playerPosition.clone().addScaledVector(facing, 4.8).add(new THREE.Vector3(0, .95, 0)));

    const fogAmount = state.environment.fog / 100;
    scene.fog.density = .014 + fogAmount * .021;
    scene.background.copy(new THREE.Color("#b9d8cf").lerp(new THREE.Color("#91aaa7"), fogAmount));
    materials.water.opacity = state.environment.water ? .82 : .18;
    materials.herb.color.set(state.environment.herb >= 60 ? "#69a65e" : "#9a7347");
    updateTraining(state.training);

    marker.group.visible = !!state.target;
    guideLine.visible = !!state.target;
    if (state.target) {
      const target = toWorld(state.target);
      marker.group.position.copy(target);
      marker.group.rotation.y += .012;
      marker.gem.position.y = 2.45 + Math.sin(state.tick * .08) * .2;
      marker.setText(state.target.name);
      guidePositions.set([playerPosition.x, .08, playerPosition.z, target.x, .08, target.z]);
      guideGeometry.attributes.position.needsUpdate = true;
      guideLine.computeLineDistances();
    }
    renderer.render(scene, camera);
    if (renderCheck && renderCheckFrame++ === 12) writeRenderHealth();
  }

  function writeRenderHealth() {
    const gl = renderer.getContext();
    const pixel = new Uint8Array(4), colors = [];
    for (let y = 1; y <= 5; y += 1) {
      for (let x = 1; x <= 5; x += 1) {
        gl.readPixels(
          Math.floor(gl.drawingBufferWidth * x / 6),
          Math.floor(gl.drawingBufferHeight * y / 6),
          1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel
        );
        colors.push(Array.from(pixel).join(","));
      }
    }
    canvas.dataset.renderHealth = JSON.stringify({
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      sampled: colors.length,
      opaque: colors.filter(color => !color.endsWith(",0")).length,
      uniqueColors: new Set(colors).size
    });
  }

  function resize() {
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    const pixelRatio = renderer.getPixelRatio();
    if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  render();

  function material(color, opacity = 1, emissive = false) {
    return new THREE.MeshToonMaterial({ color, gradientMap, transparent: opacity < 1, opacity, emissive: emissive ? color : "#000000", emissiveIntensity: emissive ? .16 : 0 });
  }

  function mesh(geometry, mat, position, rotation = [0, 0, 0], parent = scene) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position);
    object.rotation.set(...rotation);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function toWorld(point) { return new THREE.Vector3((point.x - 480) / 24, 0, (point.y - 270) / 24); }

  function patch(x, z, radius, color) {
    const shape = mesh(new THREE.CircleGeometry(radius, 32), material(color, .7), [x, .012, z], [-Math.PI / 2, 0, 0]);
    shape.receiveShadow = true;
  }

  function road(a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz);
    const path = mesh(new THREE.BoxGeometry(.52, .045, length), materials.road, [(a.x + b.x) / 2, .035, (a.z + b.z) / 2], [0, Math.atan2(dx, dz), 0]);
    path.receiveShadow = true;
    return path;
  }

  function addRiver() {
    const points = [[300,115],[325,190],[345,245],[430,310],[560,365],[690,385],[820,420]].map(([x,y]) => toWorld({ x, y })).map(p => p.setY(.025));
    const curve = new THREE.CatmullRomCurve3(points);
    mesh(new THREE.TubeGeometry(curve, 64, .48, 8, false), materials.channel, [0, -.08, 0]);
    mesh(new THREE.TubeGeometry(curve, 64, .32, 8, false), materials.water, [0, .02, 0]);
  }

  function addScenery() {
    [[20,40,5],[180,35,4],[385,45,4],[680,35,5],[920,55,5],[30,490,4],[170,505,5],[480,510,4],[720,500,5],[930,470,4]].forEach(([x,y,s]) => {
      const p = toWorld({ x, y });
      mesh(new THREE.ConeGeometry(s, s * 1.7, 7), material(y < 100 ? "#687b68" : "#617a5e"), [p.x, s * .55 - .2, p.z]);
    });
    [[55,155],[155,165],[205,260],[160,330],[305,315],[410,190],[465,275],[610,250],[705,300],[775,120],[835,330],[915,220],[895,390]].forEach(([x,y], i) => tree(toWorld({ x, y }), .75 + i % 3 * .12));
  }

  function tree(p, scale) {
    const group = new THREE.Group();
    mesh(new THREE.CylinderGeometry(.09, .13, 1.05, 7), materials.wood, [0, .52, 0], [0, 0, 0], group);
    mesh(new THREE.ConeGeometry(.58, 1.35, 7), materials.leaf, [0, 1.35, 0], [0, 0, 0], group);
    mesh(new THREE.ConeGeometry(.42, 1.05, 7), material("#5f8a58"), [0, 1.95, 0], [0, 0, 0], group);
    group.position.copy(p);
    group.scale.setScalar(scale);
    scene.add(group);
  }

  function addLandmarks() {
    house(toWorld(spotById.village).add(new THREE.Vector3(-.7,0,-.35)), 1, materials.roof);
    house(toWorld(spotById.village).add(new THREE.Vector3(.75,0,.2)), .75, materials.roofGold);
    house(toWorld(spotById.workshop), 1.15, materials.roof);
    tent(toWorld(spotById.camp));
    canal(toWorld(spotById.canal));
    herb(toWorld(spotById.herb));
    wall(toWorld(spotById.wall));
    tower(toWorld(spotById.ridge), materials.roofGold);
    tower(toWorld(spotById.bell), materials.roof);
    rocks(toWorld(spotById.gorge));
    monument(toWorld(spotById.stone), "#708783");
    gate(toWorld(spotById.gate));
    dock(toWorld(spotById.ferry));
    shrine(toWorld(spotById.shrine));
    stalls(toWorld(spotById.market));
    figure(toWorld(spotById.village).add(new THREE.Vector3(0,0,.9)), "#357f91");
    figure(toWorld(spotById.ferry).add(new THREE.Vector3(.7,0,-.4)), "#745a4c");
  }

  function addTrainingYard() {
    const screen = new THREE.Group();
    mesh(new THREE.BoxGeometry(1.35, .78, .08), material("#d6b477"), [0, .72, 0], [0, 0, 0], screen);
    [-.63,.63].forEach(x => mesh(new THREE.CylinderGeometry(.045, .055, 1.55, 7), materials.wood, [x, .76, 0], [0, 0, 0], screen));
    scene.add(screen);

    const lamp = new THREE.Group();
    mesh(new THREE.CylinderGeometry(.24, .32, .72, 8), materials.stone, [0, .36, 0], [0, 0, 0], lamp);
    mesh(new THREE.BoxGeometry(.65, .12, .65), materials.stone, [0, .76, 0], [0, 0, 0], lamp);
    const flame = mesh(new THREE.ConeGeometry(.12, .34, 10), material("#ffc94f", 1, true), [0, 1.04, 0], [0, 0, 0], lamp);
    const glow = new THREE.PointLight("#ffb54d", 0, 6, 2);
    glow.position.set(0, 1.08, 0); lamp.add(glow);
    lamp.position.copy(toWorld({ x: 112, y: 178 })); scene.add(lamp);

    const wind = new THREE.Group();
    const windMaterial = material("#66c5df", .72, true);
    [[90,225,104,198],[104,198,112,178],[112,178,104,150]].forEach(([ax,ay,bx,by]) => {
      const a = toWorld({x:ax,y:ay}), b = toWorld({x:bx,y:by});
      beam(wind, a, b, .07, windMaterial, .22);
      arrow(wind, a, b, 0x66c5df);
    });
    scene.add(wind);

    const light = new THREE.Group();
    const lightMaterial = material("#ffd45e", .55, true);
    beam(light, toWorld({x:112,y:174}), toWorld({x:104,y:133}), .09, lightMaterial, .3);
    scene.add(light);

    const basinMaterial = material("#d86649", .55, true);
    const basin = mesh(new THREE.RingGeometry(1.05, 1.22, 48), basinMaterial, [0, .035, 0], [-Math.PI / 2, 0, 0]);
    basin.position.copy(toWorld({ x: 108, y: 172 })).setY(.035);

    const formLabels = new THREE.Group();
    [
      ["来风", 84, 218, "#66c5df"], ["照桥", 104, 146, "#ffd45e"], ["灯", 116, 176, "#ef8968"]
    ].forEach(([text, x, y, color]) => {
      const label = makeLabel(color);
      label.setText(text);
      label.sprite.position.copy(toWorld({ x, y })).setY(1.1);
      label.sprite.scale.set(.92, .27, 1);
      formLabels.add(label.sprite);
    });
    scene.add(formLabels);

    const bridge = new THREE.Group();
    const bridgeMaterial = material("#d8b855", 1, true);
    for (let i = 0; i < 7; i++) {
      const p = toWorld({ x: 105, y: 154 - i * 5.3 });
      mesh(new THREE.BoxGeometry(1.25, .12, .25), bridgeMaterial, [p.x, .05, p.z], [0, 0, 0], bridge);
    }
    beam(bridge, toWorld({x:91,y:155}), toWorld({x:91,y:120}), .07, bridgeMaterial, .35);
    beam(bridge, toWorld({x:119,y:155}), toWorld({x:119,y:120}), .07, bridgeMaterial, .35);
    scene.add(bridge);

    const awning = new THREE.Group();
    mesh(new THREE.BoxGeometry(1.25, .06, .75), material("#bb6845"), [0, 0, 0], [0, 0, 0], awning);
    awning.position.copy(toWorld({ x: 132, y: 106 })).add(new THREE.Vector3(0, 1.25, 0));
    scene.add(awning);
    return { screen, lamp, flame, glow, wind, light, lightMaterial, basin, basinMaterial, formLabels, bridge, awning };
  }

  function beam(parent, a, b, width, mat, height) {
    const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz);
    mesh(new THREE.BoxGeometry(width, width, length), mat, [(a.x + b.x) / 2, height, (a.z + b.z) / 2], [0, Math.atan2(dx, dz), 0], parent);
  }

  function arrow(parent, a, b, color) {
    const origin = a.clone().setY(.34), direction = b.clone().sub(a), length = direction.length();
    const helper = new THREE.ArrowHelper(direction.normalize(), origin, length, color, .25, .16);
    helper.traverse(object => { if (object.material) object.material.transparent = true; });
    parent.add(helper);
  }

  function updateTraining(state) {
    const screenPoints = {
      home: toWorld({ x: 72, y: 185 }),
      cross: toWorld({ x: 106, y: 162 }),
      angled: toWorld({ x: 86, y: 182 })
    };
    training.screen.position.copy(screenPoints[state.screen]);
    training.screen.rotation.y = state.screen === "angled" ? -.68 : 0;
    training.wind.visible = state.windSeen && state.lens;
    training.wind.traverse(object => { if (object.material) object.material.opacity = state.screen === "angled" ? .24 : .72; });
    training.flame.scale.setScalar(state.lampLit ? 1 : .38 + Math.sin(performance.now() * .015) * .12);
    training.flame.rotation.z = state.lampLit ? 0 : .8;
    training.glow.intensity = state.lampLit ? 3 : .15;
    training.light.visible = state.windSeen && state.lens;
    training.lightMaterial.color.set(state.screen === "cross" ? "#df6b4f" : "#ffd45e");
    training.lightMaterial.emissive.copy(training.lightMaterial.color);
    training.lightMaterial.opacity = state.bridgeRevealed ? .9 : .55;
    training.basin.visible = state.windSeen && state.lens;
    training.basinMaterial.color.set(state.screen === "angled" ? "#63c88a" : state.screen === "cross" ? "#d4a34c" : "#d86649");
    training.basinMaterial.emissive.copy(training.basinMaterial.color);
    training.formLabels.visible = state.windSeen && state.lens;
    training.bridge.visible = state.bridgeRevealed;
    training.bridge.position.y = state.bridgeOpen ? .08 : -.25;
    if (trainingRoad) trainingRoad.visible = state.bridgeOpen;
    training.awning.rotation.x = state.awning === "flat" ? 0 : state.awning === "raised" ? -1.05 : -.35 + Math.sin(performance.now() * .004) * .08;
  }

  function house(p, scale, roofMaterial) {
    const group = new THREE.Group();
    mesh(new THREE.BoxGeometry(1.3, 1, 1.15), materials.wall, [0, .5, 0], [0, 0, 0], group);
    mesh(new THREE.ConeGeometry(1.05, .75, 4), roofMaterial, [0, 1.35, 0], [0, Math.PI / 4, 0], group);
    mesh(new THREE.BoxGeometry(.28, .55, .03), materials.wood, [0, .3, .59], [0, 0, 0], group);
    group.position.copy(p); group.scale.setScalar(scale); scene.add(group);
  }

  function tent(p) {
    const group = new THREE.Group();
    mesh(new THREE.ConeGeometry(.8, 1.25, 4), material("#d6b96e"), [0, .62, 0], [0, Math.PI / 4, 0], group);
    mesh(new THREE.CylinderGeometry(.035, .035, 1.7, 6), materials.wood, [0, .85, 0], [0, 0, 0], group);
    group.position.copy(p); scene.add(group);
  }

  function canal(p) {
    const group = new THREE.Group();
    mesh(new THREE.TorusGeometry(.7, .09, 8, 24), materials.wood, [0, 1, 0], [0, 0, 0], group);
    for (let i = 0; i < 8; i++) mesh(new THREE.BoxGeometry(.07, 1.25, .08), materials.wood, [0, 1, 0], [0, 0, i * Math.PI / 4], group);
    mesh(new THREE.CylinderGeometry(.1, .1, 1.5, 8), materials.stone, [0, 1, 0], [0, Math.PI / 2, 0], group);
    group.position.copy(p); scene.add(group);
  }

  function herb(p) {
    const group = new THREE.Group();
    for (let i = -2; i <= 2; i++) mesh(new THREE.BoxGeometry(.22, .2, 1.7), materials.herb, [i * .34, .12, 0], [0, 0, 0], group);
    group.position.copy(p); scene.add(group);
  }

  function wall(p) {
    const group = new THREE.Group();
    mesh(new THREE.BoxGeometry(3.2, 1.7, .3), materials.wall, [0, .85, 0], [0, 0, 0], group);
    mesh(new THREE.BoxGeometry(.7, 1.35, .4), materials.wood, [-.5, .68, .02], [0, -.22, 0], group);
    mesh(new THREE.BoxGeometry(.7, 1.35, .4), materials.wood, [.5, .68, .02], [0, .22, 0], group);
    group.position.copy(p); scene.add(group);
  }

  function tower(p, roofMaterial) {
    const group = new THREE.Group();
    mesh(new THREE.BoxGeometry(.9, 2.2, .9), materials.wall, [0, 1.1, 0], [0, 0, 0], group);
    mesh(new THREE.ConeGeometry(.85, .65, 4), roofMaterial, [0, 2.52, 0], [0, Math.PI / 4, 0], group);
    group.position.copy(p); scene.add(group);
  }

  function rocks(p) {
    for (let i = 0; i < 5; i++) mesh(new THREE.DodecahedronGeometry(.35 + i * .04, 0), materials.stone, [p.x + (i - 2) * .42, .25, p.z + Math.sin(i) * .35], [i, i * .4, 0]);
  }

  function monument(p, color) { mesh(new THREE.BoxGeometry(.65, 2, .28), material(color), [p.x, 1, p.z], [0, -.2, 0]); }

  function gate(p) {
    mesh(new THREE.BoxGeometry(.45, 2.8, .55), materials.stone, [p.x - 1.2, 1.4, p.z]);
    mesh(new THREE.BoxGeometry(.45, 2.8, .55), materials.stone, [p.x + 1.2, 1.4, p.z]);
    mesh(new THREE.BoxGeometry(2.9, .45, .65), materials.roofGold, [p.x, 2.7, p.z]);
  }

  function dock(p) {
    for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(2.5, .12, .32), materials.wood, [p.x, .12, p.z + (i - 2) * .34]);
    mesh(new THREE.CapsuleGeometry(.38, 1.45, 4, 8), material("#80523b"), [p.x + 1.8, .2, p.z + .4], [0, 0, Math.PI / 2]);
  }

  function shrine(p) {
    const group = new THREE.Group();
    mesh(new THREE.BoxGeometry(2.5, .22, .45), materials.roof, [0, 2.25, 0], [0, 0, 0], group);
    [-.85,.85].forEach(x => mesh(new THREE.CylinderGeometry(.1, .12, 2.1, 8), material("#a44736"), [x, 1.05, 0], [0, 0, 0], group));
    monument(new THREE.Vector3(p.x, 0, p.z + .55), "#666f6d");
    group.position.copy(p); scene.add(group);
  }

  function stalls(p) {
    [-.7,.7].forEach((x, i) => {
      mesh(new THREE.BoxGeometry(1.05, .65, .8), materials.wood, [p.x + x, .34, p.z]);
      mesh(new THREE.ConeGeometry(.8, .55, 4), i ? materials.roof : materials.roofGold, [p.x + x, 1.05, p.z], [0, Math.PI / 4, 0]);
    });
  }

  function figure(p, color) {
    mesh(new THREE.CylinderGeometry(.2, .34, .85, 7), material(color), [p.x, .43, p.z]);
    mesh(new THREE.SphereGeometry(.2, 12, 8), material("#e2b68f"), [p.x, 1.03, p.z]);
  }

  function makePlayer() {
    const group = new THREE.Group();
    mesh(new THREE.CylinderGeometry(.24, .43, 1.05, 8), material("#285e76"), [0, .6, 0], [0, 0, 0], group);
    mesh(new THREE.BoxGeometry(.58, .1, .08), material("#b64c38"), [0, .7, -.28], [0, 0, 0], group);
    mesh(new THREE.SphereGeometry(.24, 16, 12), material("#efc49e"), [0, 1.28, 0], [0, 0, 0], group);
    mesh(new THREE.SphereGeometry(.255, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), material("#263331"), [0, 1.36, 0], [0, 0, 0], group);
    mesh(new THREE.ConeGeometry(.3, .75, 7), material("#203f50"), [0, .75, .3], [Math.PI / 2.9, 0, 0], group);
    return group;
  }

  function makeMarker() {
    const group = new THREE.Group();
    mesh(new THREE.TorusGeometry(.65, .06, 8, 32), materials.gold, [0, .08, 0], [Math.PI / 2, 0, 0], group);
    const gem = mesh(new THREE.OctahedronGeometry(.22), materials.gold, [0, 2.45, 0], [0, 0, 0], group);
    mesh(new THREE.CylinderGeometry(.018, .08, 1.75, 8), materials.gold, [0, 1.25, 0], [0, 0, 0], group);
    const label = makeLabel();
    label.sprite.position.set(0, 2.9, 0);
    label.sprite.scale.set(1.65, .42, 1);
    group.add(label.sprite);
    return { group, gem, setText: label.setText };
  }

  function makeLabel(borderColor = "#ffd45e") {
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 256; labelCanvas.height = 64;
    const context = labelCanvas.getContext("2d");
    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    sprite.scale.set(2.5, .63, 1);
    let previous = "";
    return { sprite, setText(text) {
      if (text === previous) return;
      previous = text;
      context.clearRect(0, 0, 256, 64);
      context.fillStyle = "rgba(24,36,33,.9)"; context.fillRect(4, 4, 248, 56);
      context.strokeStyle = borderColor; context.lineWidth = 3; context.strokeRect(4, 4, 248, 56);
      context.fillStyle = "#fff6d4"; context.font = "bold 25px sans-serif"; context.textAlign = "center"; context.textBaseline = "middle";
      context.fillText(text, 128, 34);
      texture.needsUpdate = true;
    }};
  }
}
