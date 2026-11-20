import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type WorldControls = {
  keys: Set<string>;
  yaw: number;
  pitch: number;
  dragging: boolean;
  lastX: number;
  lastY: number;
  moving: boolean;
};

const mat = (color: string, roughness = 0.88, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function addBox(parent: THREE.Group, name: string, position: [number, number, number], size: [number, number, number], material: THREE.Material, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent: THREE.Group, position: [number, number, number], radiusTop: number, radiusBottom: number, height: number, material: THREE.Material, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addTree(parent: THREE.Group, x: number, z: number, scale = 1, autumn = false) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  const bark = mat('#79503a');
  const leaves = mat(autumn ? '#a8b94c' : '#438b55');
  const lightLeaves = mat(autumn ? '#c4c85a' : '#70ae63');
  addCylinder(tree, [0, 1.05, 0], .18, .25, 2.1, bark, 9);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), leaves);
  crown.position.set(0, 2.45, 0);
  crown.scale.set(1, 1.18, 1);
  crown.castShadow = true; crown.receiveShadow = true; tree.add(crown);
  const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(.72, 1), lightLeaves);
  crown2.position.set(.48, 2.7, .12); crown2.castShadow = true; tree.add(crown2);
  parent.add(tree);
}

function addHouse(parent: THREE.Group, x: number, z: number, scale: number, palette: { wall: string; roof: string; trim: string }, rotation = 0) {
  const house = new THREE.Group();
  house.position.set(x, 0, z); house.rotation.y = rotation; house.scale.setScalar(scale);
  const plaster = mat(palette.wall), roofMat = mat(palette.roof), wood = mat('#684634'), trim = mat(palette.trim), glass = new THREE.MeshStandardMaterial({ color: '#8bd8e6', roughness: .24, metalness: .08, emissive: '#225d70', emissiveIntensity: .16 });
  const stone = mat('#a99c83');
  addBox(house, 'stone-foundation', [0, .22, 0], [4.5, .44, 3.8], stone);
  addBox(house, 'plaster-walls', [0, 1.65, 0], [4.15, 2.55, 3.5], plaster);
  // Gabled roof: two broad sloped planes, ridge beam and decorative fascia.
  const roofGeo = new THREE.BufferGeometry();
  const verts = new Float32Array([
    -2.42,2.85,-2.05, 0,5.05,-2.05, 0,5.05,2.05,
    -2.42,2.85,-2.05, 0,5.05,2.05, -2.42,2.85,2.05,
    2.42,2.85,2.05, 0,5.05,2.05, 0,5.05,-2.05,
    2.42,2.85,2.05, 0,5.05,-2.05, 2.42,2.85,-2.05
  ]);
  roofGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3)); roofGeo.computeVertexNormals();
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.castShadow = true; roofMesh.receiveShadow = true; house.add(roofMesh);
  addBox(house, 'ridge-cap', [0, 5.02, 0], [.18, .16, 4.25], trim);
  addBox(house, 'front-eave', [0, 2.86, 1.94], [4.9, .16, .18], trim);
  addBox(house, 'rear-eave', [0, 2.86, -1.94], [4.9, .16, .18], trim);
  addBox(house, 'door-frame', [0, 1.13, 1.79], [1.22, 2.12, .18], stone);
  addBox(house, 'front-door', [0, 1.1, 1.91], [.88, 1.86, .12], wood);
  addCylinder(house, [.31, 1.12, 1.99], .055, .055, .08, mat('#e8c879'), 8).rotation.z = Math.PI / 2;
  for (const wx of [-1.32, 1.32]) {
    addBox(house, 'window-shutter', [wx, 1.9, 1.79], [.88, 1.02, .12], wood);
    addBox(house, 'window-glass', [wx, 1.94, 1.88], [.57, .7, .08], glass);
    addBox(house, 'window-cross-v', [wx, 1.94, 1.94], [.07, .78, .05], trim);
    addBox(house, 'window-cross-h', [wx, 1.94, 1.94], [.66, .07, .05], trim);
    addBox(house, 'window-sill', [wx, 1.39, 1.91], [1.02, .13, .26], trim);
    addBox(house, 'shutter-left', [wx - .42, 1.94, 1.94], [.16, .88, .1], mat('#4b735d'));
    addBox(house, 'shutter-right', [wx + .42, 1.94, 1.94], [.16, .88, .1], mat('#4b735d'));
    addBox(house, 'flower-trough', [wx, 1.36, 2.02], [.86, .16, .34], mat('#86553e'));
    for (let i = 0; i < 3; i++) {
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), mat(i % 2 ? '#e8a5d0' : '#f4d16e'));
      bloom.position.set(wx - .22 + i * .22, 1.58, 2.08); house.add(bloom);
    }
  }
  addBox(house, 'dormer-wall', [0, 3.72, 1.23], [1.05, 1.45, .38], plaster);
  addBox(house, 'dormer-glass', [0, 3.8, 1.45], [.55, .78, .08], glass);
  const dormerRoof = new THREE.Mesh(new THREE.ConeGeometry(.9, .85, 4), roofMat);
  dormerRoof.position.set(0, 4.72, 1.23); dormerRoof.rotation.y = Math.PI / 4; dormerRoof.castShadow = true; house.add(dormerRoof);
  addBox(house, 'chimney', [-1.45, 4.35, -.75], [.48, 1.45, .5], mat('#9a7766'));
  addBox(house, 'chimney-cap', [-1.45, 5.1, -.75], [.62, .15, .64], stone);
  parent.add(house);
}

function createVillage(scene: THREE.Scene) {
  const world = new THREE.Group(); scene.add(world);
  const grass = mat('#79ae69'), path = mat('#b9a487'), pathLight = mat('#d2bea0'), stone = mat('#b4ae9f'), wallMat = mat('#b9b4a8'), wallTop = mat('#e0d8c6'), darkStone = mat('#777e82');
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), grass);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.12; ground.receiveShadow = true; world.add(ground);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 48), path); lane.rotation.x = -Math.PI / 2; lane.position.set(0, -.045, 0); lane.receiveShadow = true; world.add(lane);
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(45, 6), path); cross.rotation.x = -Math.PI / 2; cross.position.set(0, -.04, -1); cross.receiveShadow = true; world.add(cross);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(11, 64), pathLight); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, -.025, -1); plaza.receiveShadow = true; world.add(plaza);
  const cobbleMat = mat('#9d907d');
  for (let x = -20; x <= 20; x += 1.65) for (let z = -21; z <= 21; z += 1.65) {
    if (Math.abs(x) < 4.3 || Math.abs(z + 1) < 3.5 || Math.hypot(x, z + 1) < 11) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(1.48, .07, 1.48), (Math.round(x + z) % 2) ? path : cobbleMat);
      tile.position.set(x, -.01, z); tile.receiveShadow = true; world.add(tile);
    }
  }
  // Closed protective wall with one fortified entrance.
  const wallSegments: [number, number, number, number][] = [[0, 0, -28, 58], [-29, 0, 0, 1.4], [29, 0, 0, 1.4], [-12, 0, 28, 34], [12, 0, 28, 34]];
  for (const [x, , z, length] of wallSegments) {
    const horizontal = z === -28 || z === 28;
    addBox(world, 'fortification-wall', [x, 2.3, z], horizontal ? [length, 4.6, 1.55] : [1.55, 4.6, 56], wallMat);
    addBox(world, 'wall-walk', [x, 4.62, z], horizontal ? [length + .2, .28, 2.05] : [2.05, .28, 56], wallTop);
  }
  for (let x = -27; x <= 27; x += 2.5) for (const z of [-28, 28]) if (!(z === 28 && Math.abs(x) < 5.5)) addBox(world, 'crenel', [x, 5.05, z], [1.05, .72, 1.85], wallTop);
  for (let z = -25; z <= 25; z += 2.5) for (const x of [-29, 29]) addBox(world, 'crenel', [x, 5.05, z], [1.85, .72, 1.05], wallTop);
  for (const [x, z] of [[-29,-28],[29,-28],[-29,28],[29,28]] as [number,number][]) {
    addCylinder(world, [x, 3.1, z], 2.45, 2.8, 6.2, stone, 8);
    addCylinder(world, [x, 6.25, z], 2.7, 2.7, .32, wallTop, 8);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.15, 3.1, 8), mat('#52637c'));
    roof.position.set(x, 8, z); roof.castShadow = true; world.add(roof);
    addCylinder(world, [x, 9.68, z], .13, .13, .55, mat('#d6b86c'), 8);
  }
  for (const x of [-5.1, 5.1]) {
    addBox(world, 'gate-pier', [x, 3.1, 28], [2.1, 6.2, 3], stone);
    addBox(world, 'gate-pier-cap', [x, 6.3, 28], [2.5, .42, 3.5], wallTop);
  }
  addBox(world, 'gate-lintel', [0, 6.2, 28], [8.6, 1.1, 3.1], wallMat);
  addBox(world, 'gate-left-door', [-1.85, 2.6, 27.5], [3.6, 5.1, .34], mat('#62432f'));
  addBox(world, 'gate-right-door', [1.85, 2.6, 27.5], [3.6, 5.1, .34], mat('#765039'));
  for (let x = -3.2; x <= 3.2; x += .65) addBox(world, 'gate-iron-stud', [x, 2.7, 27.28], [.11, .11, .12], mat('#c5a56b'), false);

  addHouse(world, -13, -14, 1.22, { wall: '#e6d0a7', roof: '#283e55', trim: '#55c5c8' }, .1);
  addHouse(world, 13, -14, 1.18, { wall: '#d9c5a5', roof: '#9b454b', trim: '#e2c98d' }, -.12);
  addHouse(world, -17, 7, .94, { wall: '#e5c99f', roof: '#536d7c', trim: '#d5b16f' }, -.16);
  addHouse(world, 17, 7, .98, { wall: '#d9d2bc', roof: '#536b57', trim: '#d8bd80' }, .12);
  addHouse(world, -8, 17, .82, { wall: '#e6d6b8', roof: '#405b67', trim: '#8ac3b0' }, Math.PI);
  addHouse(world, 9, 17, .86, { wall: '#e6c9a8', roof: '#754b4d', trim: '#e1bd72' }, Math.PI);

  const fountain = new THREE.Group(); fountain.position.set(0, 0, -1); world.add(fountain);
  addCylinder(fountain, [0, .18, 0], 5.5, 5.8, .36, stone, 48);
  addCylinder(fountain, [0, .46, 0], 4.85, 5.2, .34, wallTop, 48);
  addCylinder(fountain, [0, .68, 0], 4.15, 4.4, .18, darkStone, 48);
  const water = new THREE.Mesh(new THREE.CircleGeometry(4.05, 48), new THREE.MeshPhysicalMaterial({ color: '#48b9d0', roughness: .18, metalness: .12, clearcoat: 1, clearcoatRoughness: .08 }));
  water.rotation.x = -Math.PI / 2; water.position.y = .8; fountain.add(water);
  addCylinder(fountain, [0, 1.15, 0], 1.25, 1.55, .85, wallTop, 32);
  addCylinder(fountain, [0, 1.65, 0], .82, 1.15, .22, stone, 32);
  addCylinder(fountain, [0, 2.05, 0], .38, .58, .65, wallTop, 24);
  const upperBowl = new THREE.Mesh(new THREE.CylinderGeometry(.5, .95, .24, 32, 1, true), wallTop);
  upperBowl.position.y = 2.38; fountain.add(upperBowl);
  const jet = new THREE.Mesh(new THREE.ConeGeometry(.19, 1.6, 12), new THREE.MeshStandardMaterial({ color: '#b6f5fa', transparent: true, opacity: .72, roughness: .12 }));
  jet.position.y = 3.05; fountain.add(jet);
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    const channel = new THREE.Mesh(new THREE.BoxGeometry(3.2, .13, 1.65), mat('#65bfd0'));
    channel.position.set(Math.cos(angle) * 6.7, .06, Math.sin(angle) * 6.7);
    channel.rotation.y = angle; fountain.add(channel);
    const rim = addBox(fountain, 'channel-rim', [Math.cos(angle) * 6.7, .25, Math.sin(angle) * 6.7], [3.45, .35, 1.9], wallTop);
    rim.rotation.y = angle;
  }
  const flowerColors = ['#f3c75e', '#e98ab8', '#a8a4ed', '#f5eee0'];
  for (const [x,z] of [[-7,-11],[7,-11],[-8,8],[8,8],[-19,-3],[19,-3]] as [number,number][]) {
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.8, .35, 16), mat('#82664b'));
    bed.position.set(x, .08, z); bed.castShadow = true; world.add(bed);
    for (let i = 0; i < 13; i++) {
      const a = i * 2.4, r = .35 + (i % 3) * .32;
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), mat(flowerColors[i % flowerColors.length]!));
      bloom.position.set(x + Math.cos(a) * r, .48, z + Math.sin(a) * r); bloom.castShadow = true; world.add(bloom);
    }
  }
  for (const [x,z] of [[-7,2],[7,2],[-20,12],[20,12],[-20,-17],[20,-17]] as [number,number][]) {
    addCylinder(world, [x, 1.8, z], .1, .13, 3.6, mat('#343d48'), 8);
    addBox(world, 'lantern-frame', [x, 3.55, z], [.55, .62, .55], mat('#39414b'));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 10), new THREE.MeshStandardMaterial({ color: '#ffe8a3', emissive: '#ffbd56', emissiveIntensity: 1.2 }));
    lamp.position.set(x, 3.55, z); world.add(lamp);
    const glow = new THREE.PointLight('#ffd98b', 3.2, 8); glow.position.set(x, 3.55, z); world.add(glow);
  }
  for (const [x,z] of [[-5,7],[5,7],[-18,1],[18,1]] as [number,number][]) {
    addBox(world, 'bench-seat', [x, .72, z], [2.1, .18, .65], mat('#916344'));
    for (const dx of [-.8,.8]) addBox(world, 'bench-leg', [x+dx,.35,z], [.16,.7,.16], mat('#544638'));
    addBox(world, 'bench-back', [x,1.25,z-.27], [2.1,.85,.16], mat('#916344'));
  }
  for (let i = 0; i < 52; i++) {
    const angle = i / 52 * Math.PI * 2, radius = 38 + (i % 4) * 2.1;
    addTree(world, Math.cos(angle) * radius, Math.sin(angle) * radius, .85 + (i % 5) * .12, i % 7 === 0);
  }
  for (const [x,z,s] of [[-23,-15,1.1],[23,-13,1.05],[-23,15,.95],[23,16,1.1],[-10,-23,.9],[11,-23,1]] as [number,number,number][]) addTree(world,x,z,s);
  for (const [x,z] of [[-24,-7],[-24,8],[24,-8],[24,9],[-13,23],[14,23]] as [number,number][]) {
    const hedge = new THREE.Mesh(new THREE.SphereGeometry(1.25, 12, 8), mat('#4f9255'));
    hedge.position.set(x, .7, z); hedge.scale.set(1.7,.75,.8); hedge.castShadow = true; world.add(hedge);
  }
  return { fountain };
}

function createAvatar(scene: THREE.Scene) {
  const root = new THREE.Group(); scene.add(root);
  const skin = mat('#e8b993'), tunic = mat('#6554a5'), tunicLight = mat('#8d7be0'), leather = mat('#634331'), gold = mat('#e8c36f');
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.43, .72, 5, 10), tunic);
  body.position.y = 1.22; body.castShadow = true; root.add(body);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(.39, .07, 8, 16), gold);
  belt.position.y = .98; belt.rotation.x = Math.PI / 2; root.add(belt);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.34, 16, 12), skin);
  head.position.y = 2.05; head.castShadow = true; root.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.36, 14, 10, 0, Math.PI * 2, 0, Math.PI * .55), leather);
  hair.position.y = 2.18; hair.castShadow = true; root.add(hair);
  const armGeo = new THREE.CapsuleGeometry(.13, .56, 4, 8), legGeo = new THREE.CapsuleGeometry(.16, .55, 4, 8);
  const arms: THREE.Mesh[] = [], legs: THREE.Mesh[] = [];
  for (const side of [-1,1]) {
    const arm = new THREE.Mesh(armGeo, tunicLight); arm.position.set(side*.52,1.35,0); arm.castShadow=true; root.add(arm); arms.push(arm);
    const leg = new THREE.Mesh(legGeo, leather); leg.position.set(side*.22,.43,0); leg.castShadow=true; root.add(leg); legs.push(leg);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.62, 24), new THREE.MeshBasicMaterial({ color: '#30452f', transparent: true, opacity: .2, depthWrite: false }));
  shadow.rotation.x = -Math.PI/2; shadow.position.y=.015; root.add(shadow);
  return { root, arms, legs };
}

export function ChezNousScreen() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const control = useRef<WorldControls>({ keys: new Set(), yaw: 0, pitch: .23, dragging: false, lastX: 0, lastY: 0, moving: false });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      host.classList.add('homeworld-no-webgl');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.domElement.className = 'homeworld-canvas';
    renderer.domElement.setAttribute('aria-label', 'Village fantastique 3D explorable');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#b9d8df');
    scene.fog = new THREE.Fog('#b9d8df', 58, 118);
    const camera = new THREE.PerspectiveCamera(52, 1, .1, 180);
    camera.position.set(0, 8, 14);
    const hemi = new THREE.HemisphereLight('#e9f5ff', '#667b51', 2.05); scene.add(hemi);
    const sun = new THREE.DirectionalLight('#fff0d5', 3.1);
    sun.position.set(-24, 42, -18); sun.castShadow = true;
    sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left=-48; sun.shadow.camera.right=48; sun.shadow.camera.top=48; sun.shadow.camera.bottom=-48;
    sun.shadow.bias=-.00025; scene.add(sun); scene.add(sun.target);
    const fill = new THREE.DirectionalLight('#a5dfff', .8); fill.position.set(25,18,24); scene.add(fill);
    const { fountain } = createVillage(scene);
    const avatar = createAvatar(scene);
    const state = control.current;
    let frame = 0, previous = 0, elapsed = 0;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);
      camera.aspect=Math.max(1,rect.width)/Math.max(1,rect.height); camera.updateProjectionMatrix();
      setMobile(rect.width < 760);
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const keyMap = (key: string) => { const value=key.toLowerCase(); return value==='z'?'w':value==='q'?'a':value; };
    const onKeyDown = (event: KeyboardEvent) => {
      const key=keyMap(event.key);
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)) { event.preventDefault(); state.keys.add(key); }
    };
    const onKeyUp = (event: KeyboardEvent) => state.keys.delete(keyMap(event.key));
    const clearKeys = () => state.keys.clear();
    const onPointerDown = (event: PointerEvent) => { state.dragging=true; state.lastX=event.clientX; state.lastY=event.clientY; renderer.domElement.setPointerCapture(event.pointerId); };
    const onPointerMove = (event: PointerEvent) => {
      if (!state.dragging) return;
      const dx=event.clientX-state.lastX, dy=event.clientY-state.lastY;
      state.lastX=event.clientX; state.lastY=event.clientY;
      state.yaw-=dx*.0042; state.pitch=THREE.MathUtils.clamp(state.pitch+dy*.003,.12,.62);
    };
    const onPointerUp = () => { state.dragging=false; };
    const onWheel = (event: WheelEvent) => { state.pitch=THREE.MathUtils.clamp(state.pitch+Math.sign(event.deltaY)*.018,.12,.62); };
    window.addEventListener('keydown',onKeyDown); window.addEventListener('keyup',onKeyUp); window.addEventListener('blur',clearKeys);
    renderer.domElement.addEventListener('pointerdown',onPointerDown);
    renderer.domElement.addEventListener('pointermove',onPointerMove);
    renderer.domElement.addEventListener('pointerup',onPointerUp);
    renderer.domElement.addEventListener('pointercancel',onPointerUp);
    renderer.domElement.addEventListener('wheel',onWheel,{passive:true});

    const animate = (time: number) => {
      frame=requestAnimationFrame(animate);
      const dt=Math.min(.04,(time-previous)/1000 || .016); previous=time; elapsed+=dt;
      const forward=(state.keys.has('w')||state.keys.has('arrowup')?1:0)-(state.keys.has('s')||state.keys.has('arrowdown')?1:0);
      const side=(state.keys.has('d')||state.keys.has('arrowright')?1:0)-(state.keys.has('a')||state.keys.has('arrowleft')?1:0);
      const moving=forward!==0 || side!==0;
      if (moving) {
        const speed=(state.keys.has('shift')?8.2:5.1)*dt;
        const direction=new THREE.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));
        const right=new THREE.Vector3(Math.cos(state.yaw),0,Math.sin(state.yaw));
        const delta=direction.multiplyScalar(forward).add(right.multiplyScalar(side)).normalize().multiplyScalar(speed);
        const nextX=THREE.MathUtils.clamp(avatar.root.position.x+delta.x,-25.5,25.5);
        const nextZ=THREE.MathUtils.clamp(avatar.root.position.z+delta.z,-24.5,25.2);
        if (Math.hypot(nextX,nextZ+1)>6.1) avatar.root.position.x=nextX;
        if (Math.hypot(avatar.root.position.x,nextZ+1)>6.1) avatar.root.position.z=nextZ;
        avatar.root.rotation.y=Math.atan2(delta.x,delta.z);
      }
      const stride=moving ? Math.sin(elapsed*11)*.62 : 0;
      avatar.legs[0]!.rotation.x=stride; avatar.legs[1]!.rotation.x=-stride;
      avatar.arms[0]!.rotation.x=-stride*.72; avatar.arms[1]!.rotation.x=stride*.72;
      avatar.root.position.y=moving ? Math.abs(Math.sin(elapsed*11))*.045 : 0;
      const distance=10.5, horizontal=Math.cos(state.pitch)*distance;
      const desired=new THREE.Vector3(
        avatar.root.position.x+Math.sin(state.yaw)*horizontal,
        avatar.root.position.y+3.2+Math.sin(state.pitch)*distance,
        avatar.root.position.z+Math.cos(state.yaw)*horizontal
      );
      camera.position.lerp(desired,1-Math.exp(-dt*5.5));
      camera.lookAt(avatar.root.position.x,1.35,avatar.root.position.z);
      fountain.rotation.y=Math.sin(elapsed*.16)*.025;
      renderer.render(scene,camera);
    };
    frame=requestAnimationFrame(animate);
    setReady(true);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('keydown',onKeyDown); window.removeEventListener('keyup',onKeyUp); window.removeEventListener('blur',clearKeys);
      renderer.domElement.removeEventListener('pointerdown',onPointerDown); renderer.domElement.removeEventListener('pointermove',onPointerMove);
      renderer.domElement.removeEventListener('pointerup',onPointerUp); renderer.domElement.removeEventListener('pointercancel',onPointerUp); renderer.domElement.removeEventListener('wheel',onWheel);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials=Array.isArray(object.material)?object.material:[object.material];
          materials.forEach((material)=>material.dispose());
        }
      });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  const press = (key: string, down: boolean) => {
    const mapped=key==='z'?'w':key==='q'?'a':key;
    if (down) control.current.keys.add(mapped); else control.current.keys.delete(mapped);
  };
  const recenter = () => { control.current.yaw=0; control.current.pitch=.23; control.current.keys.clear(); };

  return (
    <section className="homeworld homeworld-immersive">
      <div className="homeworld-stage homeworld-stage-3d" ref={hostRef}>
        <div className="homeworld-topline">
          <div className="homeworld-title"><span>LE VILLAGE PROTÉGÉ</span><strong>Chez nous</strong></div>
          <button className="homeworld-recenter" onClick={recenter} aria-label="Recentrer la caméra">◎</button>
        </div>
        {!ready && <div className="homeworld-loading">Le village prend vie…</div>}
        <div className="homeworld-controls-hint">ZQSD / flèches : marcher · Maj : courir · Glisser : tourner la caméra</div>
        {mobile && <div className="homeworld-touchpad" aria-label="Commandes tactiles">
          <button onPointerDown={()=>press('z',true)} onPointerUp={()=>press('z',false)} onPointerLeave={()=>press('z',false)}>▲</button>
          <div>
            <button onPointerDown={()=>press('q',true)} onPointerUp={()=>press('q',false)} onPointerLeave={()=>press('q',false)}>◀</button>
            <button onPointerDown={()=>press('s',true)} onPointerUp={()=>press('s',false)} onPointerLeave={()=>press('s',false)}>▼</button>
            <button onPointerDown={()=>press('d',true)} onPointerUp={()=>press('d',false)} onPointerLeave={()=>press('d',false)}>▶</button>
          </div>
        </div>}
        <div className="homeworld-webgl-warning">Ton navigateur ne prend pas en charge la 3D WebGL.</div>
      </div>
    </section>
  );
}
