import { useEffect, useRef } from 'react';
import { Icon } from '../art/Icons';

type V3 = { x: number; y: number; z: number };
type Face = { points: V3[]; color: string; depth: number };

const COLORS = {
  grass: '#79b96d', grassLight: '#9bcf7b', wall: '#b9b6a8', wallTop: '#e0d9c5',
  stone: '#8e8d84', path: '#d8bd8d', pathLight: '#ead5ad', wood: '#8d5c3c',
  roof: '#bd7058', roof2: '#d28b68', plaster: '#f0dfb9', plaster2: '#d7c49f',
  leaf: '#4f9659', leaf2: '#76b96b', water: '#56b9d2',
};

function face(points: V3[], color: string): Face {
  return { points, color, depth: 0 };
}
function box(faces: Face[], x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
  const x0=x-w/2, x1=x+w/2, y0=y, y1=y+h, z0=z-d/2, z1=z+d/2;
  const p = (a:number,b:number,c:number):V3 => ({x:a,y:b,z:c});
  faces.push(face([p(x0,y0,z0),p(x1,y0,z0),p(x1,y1,z0),p(x0,y1,z0)], color));
  faces.push(face([p(x1,y0,z1),p(x0,y0,z1),p(x0,y1,z1),p(x1,y1,z1)], '#'+tone(color,-13)));
  faces.push(face([p(x0,y0,z1),p(x0,y0,z0),p(x0,y1,z0),p(x0,y1,z1)], '#'+tone(color,-22)));
  faces.push(face([p(x1,y0,z0),p(x1,y0,z1),p(x1,y1,z1),p(x1,y1,z0)], '#'+tone(color,-8)));
  faces.push(face([p(x0,y1,z0),p(x1,y1,z0),p(x1,y1,z1),p(x0,y1,z1)], '#'+tone(color,13)));
}
function tone(hex: string, amount: number) {
  const n = parseInt(hex.replace('#',''),16);
  const r=Math.max(0,Math.min(255,(n>>16)+amount));
  const g=Math.max(0,Math.min(255,((n>>8)&255)+amount));
  const b=Math.max(0,Math.min(255,(n&255)+amount));
  return [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function pyramid(faces: Face[], x:number, y:number, z:number, w:number, h:number, d:number, color:string) {
  const a={x:x-w/2,y,z:z-d/2}, b={x:x+w/2,y,z:z-d/2}, c={x:x+w/2,y,z:z+d/2}, e={x:x-w/2,y,z:z+d/2}, top={x,y:y+h,z};
  faces.push(face([a,b,top],color),face([b,c,top],'#'+tone(color,-16)),face([c,e,top],'#'+tone(color,-8)),face([e,a,top],'#'+tone(color,-24)));
}
function quad(faces:Face[], points:V3[], color:string) { faces.push(face(points,color)); }

function villageFaces(): Face[] {
  const f:Face[]=[];
  for(let x=-20;x<20;x+=5) for(let z=-17;z<15;z+=4) quad(f,[{x,y:-.2,z},{x:x+5,y:-.2,z},{x:x+5,y:-.2,z:z+4},{x,y:-.2,z:z+4}],((x/5+z/4)%2===0)?COLORS.grass:'#82c276');
  // Pelouses et chemins du village
  quad(f,[{x:-2.3,y:.015,z:-15},{x:2.3,y:.015,z:-15},{x:2.3,y:.015,z:16},{x:-2.3,y:.015,z:16}],COLORS.path);
  quad(f,[{x:-18,y:.02,z:-2},{x:18,y:.02,z:-2},{x:18,y:.02,z:2},{x:-18,y:.02,z:2}],COLORS.path);
  quad(f,[{x:-13,y:.025,z:-14},{x:-9,y:.025,z:-14},{x:-2,y:.025,z:-2},{x:-5,y:.025,z:-2}],COLORS.pathLight);
  quad(f,[{x:9,y:.025,z:2},{x:13,y:.025,z:2},{x:16,y:.025,z:14},{x:12,y:.025,z:14}],COLORS.pathLight);
  // Remparts fermés, avec une vraie ouverture de porte à l'entrée
  box(f,0,0,-16,38,3.8,1.25,COLORS.wall);
  box(f,-19,0,0,1.25,3.8,33,COLORS.wall);
  box(f,19,0,0,1.25,3.8,33,COLORS.wall);
  box(f,-11,0,16,16,3.8,1.25,COLORS.wall);
  box(f,11,0,16,16,3.8,1.25,COLORS.wall);
  for(let x=-18;x<=18;x+=2.4) {
    if(Math.abs(x)>3.6) box(f,x,3.8,-16,1.15,.65,1.4,COLORS.wallTop);
    if(Math.abs(x)>3.6) box(f,x,3.8,16,1.15,.65,1.4,COLORS.wallTop);
  }
  for(let z=-14;z<=14;z+=2.4) { box(f,-19,3.8,z,1.4,.65,1.1,COLORS.wallTop); box(f,19,3.8,z,1.4,.65,1.1,COLORS.wallTop); }
  // Tours de garde
  for(const [x,z] of [[-19,-16],[19,-16],[-19,16],[19,16]] as number[][]) {
    box(f,x,0,z,3.2,5,3.2,'#aaa493'); pyramid(f,x,5,z,4.2,2.4,4.2,'#687d68');
  }
  // Porte fortifiée et ses deux piliers
  box(f,-3.7,0,16,1.2,4.5,1.8,'#9a927e'); box(f,3.7,0,16,1.2,4.5,1.8,'#9a927e');
  box(f,0,4.2,16,8.8,.8,2,'#9a927e');
  // Maisons : base, toit, porte et fenêtres
  const homes = [
    [-12,-10,4.6,4.2,'#c97a5c'],[11,-11,5,4.5,'#7899b6'],[-13,8,4.8,4.4,'#d5a24f'],
    [12,8,5.2,4.5,'#9b7ab5'],[-5,-13,3.8,3.8,'#b87564'],[6,13,4.3,3.8,'#6f9e78'],
  ] as [number,number,number,number,string][];
  homes.forEach(([x,z,w,d,roof],i)=>{
    box(f,x,0,z,w,3.5,d,i%2?COLORS.plaster2:COLORS.plaster);
    pyramid(f,x,3.5,z,w+1.1,2.7,d+1.1,roof);
    box(f,x,0.05,z+d/2+.06,.9,1.9,.14,'#754b35');
    box(f,x-w*.27,1.5,z+d/2+.09,.72,.75,.12,'#80c5d5');
    box(f,x+w*.27,1.5,z+d/2+.09,.72,.75,.12,'#80c5d5');
    box(f,x,2.1,z-d/2-.09,.8,.6,.12,'#80c5d5');
    box(f,x,3.52,z, w*.18,.12,d*.18,'#f4e6c9');
  });
  // Place centrale, fontaine et bancs
  box(f,0,0,-1,5.5,.35,5.5,'#b6aa91');
  box(f,0,.35,-1,2.5,.65,2.5,'#a9a28f');
  box(f,0,1,-1,1.35,.35,1.35,COLORS.water);
  box(f,0,1.35,-1,.35,.9,.35,'#d5d0bf');
  for(const [x,z] of [[-5,-1],[5,-1],[-.5,-6],[.5,5]] as number[][]) {
    box(f,x,0,z,2.4,.55,.65,'#936947'); box(f,x,0,z-.12,2.5,.12,.8,'#c18b5d');
  }
  // Arbres avec volumes et ombres en perspective
  const trees=[[-15,-5],[-16,3],[15,-4],[16,4],[-8,13],[9,-14],[-7,-14],[15,13],[-15,-13],[7,5]] as number[][];
  trees.forEach(([x,z],i)=>{
    box(f,x,0,z,.65,2.3,.65,'#80553b');
    pyramid(f,x,2,z,3.1,3.5,3.1,i%2?COLORS.leaf:COLORS.leaf2);
    pyramid(f,x,3.5,z,2.3,2.8,2.3,i%2?COLORS.leaf2:COLORS.leaf);
  });
  // Lanternes et petits éléments de village
  for(const [x,z] of [[-3,-8],[3,-8],[-3,8],[3,8],[-10,0],[10,0]] as number[][]) {
    box(f,x,0,z,.18,2.2,.18,'#57483b'); box(f,x,1.7,z,.65,.55,.65,'#e9c979');
  }
  return f;
}

export function ChezNousScreen() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const controlRef=useRef({x:0,z:7,yaw:0,pitch:.23,zoom:1,keys:new Set<string>(),drag:false,lastX:0,lastY:0});
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d'); if(!ctx) return;
    let raf=0, width=1, height=1, last=0;
    const resize=()=>{const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
    const observer=new ResizeObserver(resize); observer.observe(canvas); resize();
    const state=controlRef.current;
    const mapKey=(key:string)=>{const k=key.toLowerCase();return k==='z'?'w':k==='q'?'a':k;};
    const onKeyDown=(e:KeyboardEvent)=>{const key=mapKey(e.key);if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){e.preventDefault();state.keys.add(key);}};
    const onKeyUp=(e:KeyboardEvent)=>state.keys.delete(mapKey(e.key));
    const onBlur=()=>state.keys.clear();
    window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',onBlur);
    const onDown=(e:PointerEvent)=>{state.drag=true;state.lastX=e.clientX;state.lastY=e.clientY;canvas.setPointerCapture(e.pointerId);};
    const onMove=(e:PointerEvent)=>{if(!state.drag)return;const dx=e.clientX-state.lastX,dy=e.clientY-state.lastY;state.lastX=e.clientX;state.lastY=e.clientY;state.yaw+=dx*.006;state.pitch=Math.max(.08,Math.min(.72,state.pitch+dy*.002));};
    const onUp=()=>{state.drag=false;};
    const onWheel=(e:WheelEvent)=>{state.zoom=Math.max(.7,Math.min(1.6,state.zoom+(e.deltaY>0?-.06:.06)));};
    canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);canvas.addEventListener('wheel',onWheel,{passive:true});
    const staticFaces=villageFaces();
    const project=(v:V3,cx:number,cz:number,cy:number,focal:number)=>{
      const dx=v.x-cx,dz=v.z-cz,co=Math.cos(state.yaw),si=Math.sin(state.yaw);
      const right=dx*co+dz*si,forward=dx*si-dz*co;
      const depth=forward;
      if(depth<.25)return null;
      const vertical=(v.y-cy)*Math.cos(state.pitch)+forward*Math.sin(state.pitch);
      return {x:width/2+right*focal/depth,y:height*.48-vertical*focal/depth,depth};
    };
    const render=(time:number)=>{
      const dt=Math.min(.04,(time-last)/1000||.016);last=time;
      const forward=state.keys.has('w')||state.keys.has('arrowup')?1:state.keys.has('s')||state.keys.has('arrowdown')?-1:0;
      const side=state.keys.has('d')||state.keys.has('arrowright')?1:state.keys.has('a')||state.keys.has('arrowleft')?-1:0;
      const speed=7.2*dt;
      state.x=Math.max(-16,Math.min(16,state.x+(Math.sin(state.yaw)*forward+Math.cos(state.yaw)*side)*speed));
      state.z=Math.max(-13.5,Math.min(14.5,state.z+(-Math.cos(state.yaw)*forward+Math.sin(state.yaw)*side)*speed));
      const focal=height*.88*state.zoom,cx=state.x-Math.sin(state.yaw)*10,cz=state.z+Math.cos(state.yaw)*10,cy=6.2;
      const gradient=ctx.createLinearGradient(0,0,0,height);gradient.addColorStop(0,'#9ed5f0');gradient.addColorStop(.58,'#d7edda');gradient.addColorStop(1,'#8fc77d');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
      ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(width*.78,height*.16,38,24,0,0,Math.PI*2);ctx.fill();
      const faces:Face[]=staticFaces.map(a=>({...a,depth:a.points.reduce((s,p)=>s+Math.hypot(p.x-cx,p.z-cz),0)/a.points.length}));
      // Joueur : silhouette en volume, toujours au centre de la promenade
      const avatarStart=faces.length;
      box(faces,state.x,.03,state.z,.72,1.05,.62,'#7561c8');
      box(faces,state.x,1.08,state.z,.58,.58,.58,'#f2c9a5');
      box(faces,state.x,1.48,state.z,.66,.2,.66,'#6c4a3c');
      const avatarDepth=Math.hypot(state.x-cx,state.z-cz);
      for(let i=avatarStart;i<faces.length;i++) faces[i]!.depth=avatarDepth;
      faces.sort((a,b)=>b.depth-a.depth);
      for(const item of faces){
        const pts=item.points.map(p=>project(p,cx,cz,cy,focal));
        if(pts.some(p=>!p))continue;
        ctx.beginPath();ctx.moveTo(pts[0]!.x,pts[0]!.y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i]!.x,pts[i]!.y);ctx.closePath();
        ctx.fillStyle=item.color;ctx.fill();ctx.strokeStyle='rgba(45,58,48,.16)';ctx.lineWidth=1;ctx.stroke();
      }
      // Petite indication de direction au-dessus du personnage
      const marker=project({x:state.x,y:2.2,z:state.z},cx,cz,cy,focal);
      if(marker){ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(marker.x,marker.y,4,0,Math.PI*2);ctx.fill();}
      raf=requestAnimationFrame(render);
    };
    raf=requestAnimationFrame(render);
    return ()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',onBlur);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);canvas.removeEventListener('wheel',onWheel);};
  },[]);
  const press=(key:string,on:boolean)=>{if(on)controlRef.current.keys.add(key);else controlRef.current.keys.delete(key);};
  const reset=()=>{const s=controlRef.current;s.x=0;s.z=7;s.yaw=0;s.pitch=.23;s.zoom=1;s.keys.clear();};
  return (
    <section className="homeworld">
      <header className="homeworld-head">
        <div><span className="homeworld-kicker">TON REFUGE • TON VILLAGE</span><h2>Chez nous</h2><p>Un petit monde à explorer, entouré de remparts protecteurs.</p></div>
        <button className="homeworld-reset" onClick={reset} aria-label="Recentrer la caméra"><Icon name="compass"/> Recentrer</button>
      </header>
      <div className="homeworld-stage">
        <canvas ref={canvasRef} aria-label="Village 3D explorable avec maisons, arbres, fontaine et remparts" />
        <div className="homeworld-compass"><Icon name="map"/> VILLAGE PROTÉGÉ <span>•</span> 1 ZONE</div>
        <div className="homeworld-hint">Glisse pour regarder autour de toi · ZQSD ou flèches pour marcher · molette pour zoomer</div>
        <div className="homeworld-pad" aria-label="Commandes de déplacement">
          <button onPointerDown={()=>press('w',true)} onPointerUp={()=>press('w',false)} onPointerLeave={()=>press('w',false)} aria-label="Avancer">▲</button>
          <div><button onPointerDown={()=>press('a',true)} onPointerUp={()=>press('a',false)} onPointerLeave={()=>press('a',false)} aria-label="Aller à gauche">◀</button><button onPointerDown={()=>press('s',true)} onPointerUp={()=>press('s',false)} onPointerLeave={()=>press('s',false)} aria-label="Reculer">▼</button><button onPointerDown={()=>press('d',true)} onPointerUp={()=>press('d',false)} onPointerLeave={()=>press('d',false)} aria-label="Aller à droite">▶</button></div>
        </div>
      </div>
      <footer className="homeworld-footer"><span><i className="homeworld-dot"/> Remparts fermés</span><span>Maisons · place centrale · fontaine · jardins</span></footer>
    </section>
  );
}
