// app/KingDefense.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

/* ===== Sprites (optional) ===== */
const USE_SPRITES = true;
const SPRITES = {
  enemy: {
    basic: require('../assets/td/enemy_basic.png'),
    fast:  require('../assets/td/enemy_fast.png'),
    tank:  require('../assets/td/enemy_tank.png'),
  },
  tower:  require('../assets/td/tower_basic.png'),
  bullet: require('../assets/td/bullet.png'),
};

/* ===== Helpers ===== */
let uid = 0;
const nextId = () => ++uid;
const clamp = (v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));

/* ===== Balancing (deutlich markiert) ===== */
const PATH_WIDTH       = 48;   // << Sichtbare Wegbreite
const PATH_OUTLINE     = 8;    // << Dunkler Rand außen (Kontrast)
const NO_BUILD_MARGIN  = 12;   // << Mindestabstand Slot zum Weg

const BASE_ENEMY_HP     = 18;  // << Grund-HP (Wave 1)
const BASE_ENEMY_SPEED  = 58;  // << Grund-Geschwindigkeit (px/s)
const WAVE_HP_GROWTH    = 1.12;// << HP-Faktor je Welle
const WAVE_SPEED_GROWTH = 1.05;// << Speed-Faktor je Welle

const WAVE_SIZE   = 10;        // << Gegner pro Welle
const WAVE_GAP_MS = 1200;      // << Spawn-Intervall in ms

const START_GOLD   = 100;
const LIVES_START  = 10;

const TOWER_COST      = 50;    // << Turmpreis
const TOWER_RANGE     = 112;   // << Reichweite (px)
const TOWER_FIRE_RATE = 520;   // << Cooldown (ms)
const BULLET_SPEED    = 260;   // << Projektilgeschwindigkeit
const BULLET_DMG      = 6;     // << Schaden pro Schuss

/* ===== Gegner-Typen ===== */
type EnemyKind='basic'|'fast'|'tank';
const ENEMY_TYPES: Record<EnemyKind,{hpMult:number;speedMult:number;reward:number;w:number;h:number}> = {
  basic:{hpMult:1.0, speedMult:1.00, reward:5,  w:26,h:26},
  fast: {hpMult:0.7, speedMult:1.45, reward:6,  w:22,h:22},
  tank: {hpMult:2.2, speedMult:0.65, reward:10, w:30,h:30},
};

type Enemy={id:number;x:number;y:number;hp:number;maxHp:number;speed:number;wp:number;alive:boolean;kind:EnemyKind};
type Bullet={id:number;x:number;y:number;vx:number;vy:number;dmg:number;targetId:number|null};
type Tower={id:number;x:number;y:number;range:number;lastShot:number};

/* ===== Wegpunkte – S-Kurven, lange Strecke ===== */
// << HIER formst du die Route (Start -> Ziel). Mehr Punkte = geschmeidiger >>
const PAD=18;
const S={x:PAD+32,            y:PAD+72};
const A={x:width*0.35,        y:S.y};
const B={x:width*0.78,        y:S.y+28};
const C={x:B.x,               y:height*0.38};
const D={x:width*0.58,        y:height*0.48};
const E={x:width*0.26,        y:height*0.54};
const F={x:width*0.24,        y:height*0.68};
const G={x:width*0.76,        y:height*0.72};
const H={x:width*0.76,        y:height-PAD-110};
const T={x:PAD+32,            y:height-PAD-110};
const WAYPOINTS=[S,A,B,C,D,E,F,G,H,T];

/* ===== NEU: Slots komplett neu & strategisch gesetzt =====
   - bewusst weiter vom Weg weg (NO_BUILD_MARGIN + Reserve)
   - decken frühe, mittlere und späte Segmente ab
*/
const TOWER_SLOTS = [
  // Top-Left & oberes Drittel (frühe Abdeckung)
  { x: width*0.18, y: S.y-84 },     // << weit links oben
  { x: width*0.46, y: S.y-58 },     // << oberhalb Segment S-A
  { x: width*0.88, y: S.y+60 },     // << rechts oben, weit außen
  // Mitte (Kreuzfeuer auf C-D-E)
  { x: width*0.64, y: height*0.34 },// << nördlich von C
  { x: width*0.40, y: height*0.44 },// << westlich von D
  { x: width*0.18, y: height*0.46 },// << weit links der Mitte
  // Untere Hälfte (vor G-H)
  { x: width*0.44, y: height*0.64 },// << zentral, aber weg vom F-Segment
  { x: width*0.86, y: height*0.64 },// << weit rechts vor G
  // Kurz vor Ziel (letzte Verteidigungslinie)
  { x: width*0.18, y: height*0.78 },
  { x: width*0.54, y: height*0.80 },
  { x: width*0.82, y: height*0.78 },
  // Safe unten links
  { x: width*0.14, y: height*0.90 },
];

/* ===== Distanz Punkt->Segment (für Bau-Blockade) ===== */
function distPointToSegment(px:number,py:number, ax:number,ay:number, bx:number,by:number){
  const vx=bx-ax, vy=by-ay;
  const wx=px-ax, wy=py-ay;
  const c1=wx*vx+wy*vy;
  if(c1<=0) return Math.hypot(px-ax,py-ay);
  const c2=vx*vx+vy*vy;
  if(c2<=c1) return Math.hypot(px-bx,py-by);
  const t=c1/c2;
  const projx=ax+t*vx, projy=ay+t*vy;
  return Math.hypot(px-projx,py-projy);
}
function isOnPath(x:number,y:number){
  const half = PATH_WIDTH/2 + NO_BUILD_MARGIN;
  for(let i=0;i<WAYPOINTS.length-1;i++){
    const a=WAYPOINTS[i], b=WAYPOINTS[i+1];
    if(distPointToSegment(x,y,a.x,a.y,b.x,b.y) <= half) return true;
  }
  return false;
}

/* ===== Komponente ===== */
export default function KingDefense(){
  const [gold,setGold]=useState(START_GOLD);
  const [lives,setLives]=useState(LIVES_START);
  const [wave,setWave]=useState(1);

  const [towers,setTowers]=useState<Tower[]>([]);
  const [placed,setPlaced]=useState<boolean[]>(Array(TOWER_SLOTS.length).fill(false));

  const enemiesRef=useRef<Enemy[]>([]);
  const bulletsRef=useRef<Bullet[]>([]);
  const runningRef=useRef(true);
  const spawningRef=useRef(false);
  const [tick,setTick]=useState(0);
  const [message,setMessage]=useState<string|null>(null);

  /* === Loop === */
  useEffect(()=>{
    let last=Date.now();
    const loop=setInterval(()=>{
      if(!runningRef.current) return;
      const now=Date.now(); const dt=(now-last)/1000; last=now;

      // Gegner entlang Weg
      enemiesRef.current=enemiesRef.current.map(e=>{
        if(!e.alive) return e;
        const wp=WAYPOINTS[Math.max(0,Math.min(WAYPOINTS.length-1,e.wp))];
        const dx=wp.x-e.x, dy=wp.y-e.y;
        const dist=Math.hypot(dx,dy);
        if(dist<2){
          if(e.wp>=WAYPOINTS.length-1){
            e.alive=false;
            setLives(L=>{const n=L-1; if(n<=0) gameOver(false); return n;});
          }else{ e.wp+=1; }
          return e;
        }
        const vx=(dx/Math.max(1,dist))*e.speed;
        const vy=(dy/Math.max(1,dist))*e.speed;
        return {...e, x:e.x+vx*dt, y:e.y+vy*dt};
      }).filter(e=>e.alive);

      // Türme feuern
      const nowMs=Date.now();
      const newBullets:Bullet[]=[];
      towers.forEach(t=>{
        if(nowMs-t.lastShot<TOWER_FIRE_RATE) return; // << TOWER_FIRE_RATE
        let best:Enemy|null=null, bestD2=Infinity;
        for(const e of enemiesRef.current){
          const d2=(e.x-t.x)**2+(e.y-t.y)**2;
          if(d2<=t.range*t.range && d2<bestD2){best=e;bestD2=d2;}
        }
        if(best){
          const d=Math.sqrt(bestD2)||1;
          newBullets.push({
            id:nextId(),
            x:t.x,y:t.y,
            vx:(best.x-t.x)/d*BULLET_SPEED,  // << BULLET_SPEED
            vy:(best.y-t.y)/d*BULLET_SPEED,
            dmg:BULLET_DMG,                  // << BULLET_DMG
            targetId:best.id,
          });
          t.lastShot=nowMs;
        }
      });
      if(newBullets.length) bulletsRef.current = bulletsRef.current.concat(newBullets);

      // Bullets & Treffer
      const aliveBullets:Bullet[]=[];
      bulletsRef.current.forEach(b=>{
        const nx=b.x+b.vx*dt, ny=b.y+b.vy*dt;
        let hitIndex=-1;
        if(b.targetId) hitIndex=enemiesRef.current.findIndex(e=>e.id===b.targetId);
        const tests = hitIndex>=0?[hitIndex]:enemiesRef.current.map((_,i)=>i);
        let hit=false;
        for(const i of tests){
          const e=enemiesRef.current[i];
          if(((nx-e.x)**2+(ny-e.y)**2) < 12*12){
            e.hp-=b.dmg;
            if(e.hp<=0){ e.alive=false; setGold(g=>g+ENEMY_TYPES[e.kind].reward); }
            hit=true; break;
          }
        }
        if(!hit && nx>-40 && nx<width+40 && ny>-40 && ny<height+40){
          aliveBullets.push({...b,x:nx,y:ny});
        }
      });
      bulletsRef.current=aliveBullets;
      enemiesRef.current=enemiesRef.current.filter(e=>e.alive);

      if(!spawningRef.current && enemiesRef.current.length===0) startNextWave();

      setTick(t=>t+1);
    },16);
    return ()=>clearInterval(loop);
  },[towers]);

  /* === Spawn === */
  const startNextWave=()=>{
    spawningRef.current=true;
    const hpBase=BASE_ENEMY_HP    * Math.pow(WAVE_HP_GROWTH,   wave-1); // << HP-Skalierung
    const spBase=BASE_ENEMY_SPEED * Math.pow(WAVE_SPEED_GROWTH,wave-1); // << Speed-Skalierung

    const weights = wave<4 ? {basic:0.75,fast:0.20,tank:0.05}
                  : wave<8 ? {basic:0.55,fast:0.30,tank:0.15}
                           : {basic:0.40,fast:0.35,tank:0.25};

    let spawned=0;
    const timer=setInterval(()=>{
      if(spawned>=WAVE_SIZE){ // << WAVE_SIZE
        clearInterval(timer); spawningRef.current=false; setWave(w=>w+1); return;
      }
      const kind=pickKind(weights);
      const t=ENEMY_TYPES[kind];
      const hp=hpBase*t.hpMult, sp=spBase*t.speedMult;
      const spawn=WAYPOINTS[0];
      enemiesRef.current.push({id:nextId(),x:spawn.x,y:spawn.y,hp,maxHp:hp,speed:sp,wp:1,alive:true,kind});
      spawned++;
    }, WAVE_GAP_MS);            // << WAVE_GAP_MS (Spawn-Rate)
  };
  function pickKind(w:{basic:number,fast:number,tank:number}):EnemyKind{
    const r=Math.random(); if(r<w.basic) return 'basic'; if(r<w.basic+w.fast) return 'fast'; return 'tank';
  }

  /* === Bauen (Weg blockiert) === */
  const onPlace=(idx:number)=>{
    if(placed[idx]) return;
    if(gold<TOWER_COST) return;
    const s=TOWER_SLOTS[idx];
    if(isOnPath(s.x,s.y)){ setMessage('🚧 Zu nah am Weg!'); setTimeout(()=>setMessage(null),800); return; }
    const t:Tower={id:nextId(),x:s.x,y:s.y,range:TOWER_RANGE,lastShot:0}; // << TOWER_RANGE
    setTowers(p=>[...p,t]);
    setPlaced(p=>{const c=p.slice(); c[idx]=true; return c;});
    setGold(g=>g-TOWER_COST); // << TOWER_COST
  };

  const gameOver=(win:boolean)=>{
    runningRef.current=false;
    setMessage(win?'🎉 Sieg!':'💀 Niederlage');
    setTimeout(()=>{
      enemiesRef.current=[]; bulletsRef.current=[];
      setTowers([]); setPlaced(Array(TOWER_SLOTS.length).fill(false));
      setGold(START_GOLD); setLives(LIVES_START); setWave(1);
      runningRef.current=true; setMessage(null); startNextWave();
    },1200);
  };

  /* === Render === */
  const enemies=useMemo(()=>enemiesRef.current,[tick]);
  const bullets=useMemo(()=>bulletsRef.current,[tick]);

  return(
    <View style={styles.container}>
      <PathTiled /> {/* << DURCHGEHENDER KACHEL-WEG */}

      {/* Türme */}
      {towers.map(t=> USE_SPRITES
        ? <Image key={t.id} source={SPRITES.tower} style={{position:'absolute',left:t.x-16,top:t.y-16,width:32,height:32,resizeMode:'contain'}}/>
        : <View key={t.id} style={[styles.tower,{left:t.x-14,top:t.y-14}]}/>
      )}

      {/* Slots */}
      {TOWER_SLOTS.map((s,i)=>(
        <TouchableOpacity key={`slot-${i}`} onPress={()=>onPlace(i)} activeOpacity={0.85}
          style={[styles.slot,{left:s.x-20,top:s.y-20,borderColor: placed[i]?'#1db954':'#ffd76a'}]}>
          <Text style={styles.slotText}>{placed[i]?'✓':`${TOWER_COST}`}</Text>
        </TouchableOpacity>
      ))}

      {/* Gegner */}
      {enemies.map(e=>{
        const et=ENEMY_TYPES[e.kind]; const hpW=clamp((e.hp/e.maxHp)*et.w,0,et.w);
        return USE_SPRITES?(
          <View key={e.id} style={{position:'absolute',left:e.x-et.w/2,top:e.y-et.h/2}}>
            <Image source={SPRITES.enemy[e.kind]} style={{width:et.w,height:et.h,resizeMode:'contain'}}/>
            <View style={{position:'absolute',left:0,top:et.h+2,width:et.w,height:4,backgroundColor:'rgba(0,0,0,0.45)',borderRadius:2,overflow:'hidden'}}>
              <View style={{width:hpW,height:4,backgroundColor:'#6bff6b'}}/>
            </View>
          </View>
        ):(
          <View key={e.id} style={[styles.enemy,{left:e.x-12,top:e.y-12}]}>
            <View style={styles.hpWrap}><View style={[styles.hpFill,{width:clamp((e.hp/e.maxHp)*24,0,24)}]}/></View>
          </View>
        );
      })}

      {/* Bullets */}
      {bullets.map(b=> USE_SPRITES
        ? <Image key={b.id} source={SPRITES.bullet} style={{position:'absolute',left:b.x-6,top:b.y-6,width:12,height:12,resizeMode:'contain'}}/>
        : <View key={b.id} style={[styles.bullet,{left:b.x-3,top:b.y-3}]}/>
      )}

      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.hudText}>💰 {gold}</Text>
        <Text style={styles.hudText}>❤️ {lives}</Text>
        <Text style={styles.hudText}>🌊 {wave}</Text>
      </View>

      {message && <View style={styles.centerMsg}><Text style={styles.centerText}>{message}</Text></View>}
    </View>
  );
}

/* ===== Kachel-Weg + Outline ===== */
function PathTiled(){
  const TILE_LEN = 16;           // Kachellänge
  const TILE_GAP = 2;            // Lücke zwischen Kacheln
  const TILE_RADIUS = PATH_WIDTH/2 - 4;

  const OUTLINE_COLOR = '#9b8a73';  // dunkler Rand
  const TILE_COLOR    = '#dcd6cf';  // helles Pflaster
  const CENTER_LINE   = '#c9c3bc';  // zarte Mittelspur

  const children: React.ReactNode[] = [];

  for(let i=0;i<WAYPOINTS.length-1;i++){
    const a=WAYPOINTS[i], b=WAYPOINTS[i+1];
    const dx=b.x-a.x, dy=b.y-a.y;
    const len=Math.hypot(dx,dy);
    const angle=Math.atan2(dy,dx)*180/Math.PI;

    children.push(
      <View key={`ol-${i}`} style={{
        position:'absolute',
        left:a.x, top:a.y-(PATH_WIDTH/2 + PATH_OUTLINE/2),
        width:len, height:PATH_WIDTH+PATH_OUTLINE,
        backgroundColor:OUTLINE_COLOR,
        transform:[{rotate:`${angle}deg`}],
        borderRadius:(PATH_WIDTH+PATH_OUTLINE)/2,
      }}/>
    );

    const tileSpan = TILE_LEN + TILE_GAP;
    const count = Math.max(1, Math.floor(len / tileSpan));
    for(let k=0;k<=count;k++){
      const t = Math.min(1, (k*tileSpan)/len);
      const x = a.x + dx * t;
      const y = a.y + dy * t;
      children.push(
        <View key={`tile-${i}-${k}`} style={{
          position:'absolute',
          left:x - TILE_LEN/2,
          top:y - (TILE_RADIUS),
          width:TILE_LEN, height:TILE_RADIUS*2,
          backgroundColor:TILE_COLOR,
          transform:[{rotate:`${angle}deg`}],
          borderRadius:TILE_RADIUS,
          shadowColor:'#000', shadowOpacity:0.07, shadowRadius:2, shadowOffset:{width:0,height:1}
        }}/>
      );
    }

    children.push(
      <View key={`mid-${i}`} style={{
        position:'absolute',
        left:a.x, top:a.y-2,
        width:len, height:4,
        backgroundColor:CENTER_LINE,
        transform:[{rotate:`${angle}deg`}],
        opacity:0.35,
        borderRadius:2,
      }}/>
    );
  }

  const start=WAYPOINTS[0], goal=WAYPOINTS[WAYPOINTS.length-1];
  children.push(
    <View key="start" style={{position:'absolute',left:start.x-22,top:start.y-22,width:44,height:44,backgroundColor:'#b7f3b7',borderRadius:12,borderWidth:2,borderColor:'#fff'}}/>
  );
  children.push(
    <View key="goal"  style={{position:'absolute',left:goal.x-22, top:goal.y-22, width:44, height:44, backgroundColor:'#f3b7b7', borderRadius:12, borderWidth:2, borderColor:'#fff'}}/>
  );

  return <>{children}</>;
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0f3310' }, // dunkles Grün
  hud:{
    position:'absolute', top:16, left:16,
    paddingHorizontal:12, height:36, borderRadius:10,
    backgroundColor:'rgba(0,0,0,0.35)', borderWidth:1, borderColor:'rgba(255,255,255,0.2)',
    flexDirection:'row', alignItems:'center', gap:12,
  },
  hudText:{ color:'#fff', fontWeight:'700' },

  slot:{
    position:'absolute', width:40, height:40, borderRadius:10,
    backgroundColor:'rgba(255,255,255,0.07)',
    borderWidth:2, alignItems:'center', justifyContent:'center'
  },
  slotText:{ color:'#ffd76a', fontWeight:'800', fontSize:12 },

  tower:{
    position:'absolute', width:28, height:28, borderRadius:6,
    backgroundColor:'#3966ff', borderWidth:2, borderColor:'#cfe3ff'
  },

  enemy:{
    position:'absolute', width:24, height:24, borderRadius:6,
    backgroundColor:'#e74c3c', borderWidth:2, borderColor:'#ffd0d0',
    alignItems:'center', justifyContent:'center'
  },
  hpWrap:{ position:'absolute', bottom:-8, left:0, width:24, height:4, backgroundColor:'rgba(0,0,0,0.45)', borderRadius:2, overflow:'hidden' },
  hpFill:{ height:4, backgroundColor:'#6bff6b' },

  bullet:{ position:'absolute', width:6, height:6, borderRadius:3, backgroundColor:'#ffe15a', borderWidth:1, borderColor:'#fff0b0' },

  centerMsg:{ position:'absolute', left:0,right:0, top:height/2-40, alignItems:'center' },
  centerText:{ color:'#fff', fontSize:22, fontWeight:'800' },
});
