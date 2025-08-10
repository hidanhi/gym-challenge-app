import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, PanResponder, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

// ======================= THEME =======================
const THEME = {
  bg: '#06080F',
  hudGlass: 'rgba(255,255,255,0.08)',
  hudBorder: 'rgba(255,255,255,0.18)',
  hudText: 'rgba(255,255,255,0.95)',
  playerCore: '#6FF7FF',
  playerGlow: '#0ED1FF',
  bullet: '#FFE15A',
  vignette: 'rgba(0,0,0,0.55)',
};

// ======================= SPRITES =====================
// << ERSETZE DIE require(...) PFADE MIT DEINEN DATEIEN >>
// Pfade müssen statisch sein (kein String zusammenbauen).
const SPRITES = {
  player: require('../assets/player/ship.png'),                 // << SPIELER-BILD HIER AUSTAUSCHEN >>
  bullet: require('../assets/bullets/bullet.png'),              // << KUGEL-BILD HIER AUSTAUSCHEN >>
  enemies: {
    normal:    require('../assets/enemies/plane_normal.png'),   // << NORMALER GEGNER >>
    miniboss:  require('../assets/enemies/plane_miniboss.png'), // << MINIBOSS >>
    boss:      require('../assets/enemies/plane_boss.png'),     // << BOSS >>
    superboss: require('../assets/enemies/plane_superboss.png') // << SUPERBOSS >>
  }
};

// ======================= GAMEPLAY ===================
const PLAYER_RADIUS = 26;
const ENEMY_RADIUS = 20;
const BULLET_RADIUS = 5;

const ENEMY_SPEED = 1.5;
const DAMAGE_COOLDOWN = 800;
const ENEMY_WAVE_MULTIPLIER = 3;

const BULLET_SPEED = 8;
const FIRE_RATE = 300;

const ENEMY_TYPES = {
  normal:   { hp: 1,  speed: ENEMY_SPEED,       fill: '#F24D4D', ring:'#FF9AAE' }, // << leben erhöhen
  miniboss: { hp: 5,  speed: ENEMY_SPEED * 1.2, fill: '#FF8C42', ring:'#FFD089' },
  boss:     { hp: 12, speed: ENEMY_SPEED * 1.35,fill: '#7F57EA', ring:'#C1B1FF' },
  superboss:{ hp: 30, speed: ENEMY_SPEED * 1.55,fill: '#9D1B1B', ring:'#FFDE59' },
};

// << GLOBALE SCHWIERIGKEIT >>
const DIFFICULTY = {
  HP_MULT: 1.0,            // << Globaler HP-Multiplikator (z.B. 1.5 = +50% HP)
  SPEED_MULT: 5.0,         // << Globaler Speed-Multiplikator (z.B. 1.2 = +20% Speed)
  WAVE_HP_GROWTH: 0.10,    // << +10% HP pro Welle
  WAVE_SPEED_GROWTH: 1.05, // << +5% Speed pro Welle
};


// ======================= STARFIELD ==================
const STAR_COUNT = 80;
function createStars() {
  const arr = [];
  for (let i=0;i<STAR_COUNT;i++){
    arr.push({
      id: `s-${i}-${Math.random()}`,
      x: Math.random()*width,
      y: Math.random()*height,
      size: Math.random()*2 + 1,
      speed: Math.random()*0.4 + 0.15,
      opacity: Math.random()*0.6 + 0.25,
    });
  }
  return arr;
}

export default function GameScreen() {
  // ------------ State ------------
  const [player, setPlayer] = useState({ x: width / 2, y: height / 2 });
  const [enemies, setEnemies] = useState<any[]>([]);
  const [bullets, setBullets] = useState<any[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [running, setRunning] = useState(true);

  // Visuals
  const [stars, setStars] = useState(createStars());

  // ------------ Refs ------------
  const playerRef = useRef(player);
  const enemiesRef = useRef(enemies);
  const bulletsRef = useRef(bullets);
  const runningRef = useRef(running);
  const damageCooldown = useRef<Record<string, number>>({});

  useEffect(() => { playerRef.current = player }, [player]);
  useEffect(() => { enemiesRef.current = enemies }, [enemies]);
  useEffect(() => { bulletsRef.current = bullets }, [bullets]);
  useEffect(() => { runningRef.current = running }, [running]);

  // ------------ Spawns ------------
  const spawnEnemies = (count: number) => {
    const newEnemies:any[] = [];
    for (let i = 0; i < count; i++) {
      // Spawn auf Kreis außerhalb des Screens
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.max(width, height) / 2 + 120;
      const x = width / 2 + Math.cos(angle) * r;
      const y = height / 2 + Math.sin(angle) * r;

      const roll = Math.random();
      const type =
        roll < 0.08 ? 'miniboss'
      : roll < 0.10 ? 'boss'
      : 'normal';
      const stats = ENEMY_TYPES[type as keyof typeof ENEMY_TYPES];

      newEnemies.push({
        id: `enemy-${Date.now()}-${i}-${Math.random()}`,
        x, y,
        hp: stats.hp,
        maxHp: stats.hp,
        type,
      });
    }

    // Jede 10. Welle garantierter Superboss zusätzlich
    if ((wave % 10) === 0) {
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.max(width, height) / 2 + 150;
      newEnemies.push({
        id: `super-${Date.now()}`,
        x: width/2 + Math.cos(angle)*r,
        y: height/2 + Math.sin(angle)*r,
        hp: ENEMY_TYPES.superboss.hp,
        maxHp: ENEMY_TYPES.superboss.hp,
        type: 'superboss',
      });
    }

    setEnemies(newEnemies);
  };

  const nextWave = () => {
    spawnEnemies(Math.max(3, Math.floor(wave * ENEMY_WAVE_MULTIPLIER)));
    setWave(w => w + 1);
  };

  // ------------ Main loop (movement, collisions, stars) ------------
  useEffect(() => {
    const interval = setInterval(() => {
      if (!runningRef.current) return;

      // Sterne bewegen
      setStars(prev => {
        const updated = prev.map(s => {
          let ny = s.y + s.speed;
          let nx = s.x + 0.03; // leichter Drift
          if (ny > height) ny = 0;
          if (nx > width) nx = 0;
          return { ...s, y: ny, x: nx };
        });
        return updated;
      });

      // Gegner bewegen
      const newEnemies = enemiesRef.current.map((e:any) => {
        const dx = playerRef.current.x - e.x;
        const dy = playerRef.current.y - e.y;
        const dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));
        const speed = ENEMY_TYPES[e.type as keyof typeof ENEMY_TYPES].speed;
        return {
          ...e,
          x: e.x + (dx/dist)*speed,
          y: e.y + (dy/dist)*speed,
        };
      });

      // Gegnerkontakt-Schaden (mit Cooldown pro Gegner)
      newEnemies.forEach((e:any) => {
        const dx = playerRef.current.x - e.x;
        const dy = playerRef.current.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < PLAYER_RADIUS + ENEMY_RADIUS) {
          const last = damageCooldown.current[e.id] || 0;
          if (Date.now() - last > DAMAGE_COOLDOWN) {
            damageCooldown.current[e.id] = Date.now();
            setLives(l => {
              const nl = l - 1;
              if (nl <= 0) setRunning(false);
              return nl;
            });
          }
        }
      });

      // Kugeln bewegen
      const movedBullets = bulletsRef.current
        .map((b:any) => ({ ...b, x: b.x + b.dx, y: b.y + b.dy }))
        .filter((b:any) => b.x > -30 && b.x < width + 30 && b.y > -30 && b.y < height + 30);

      // Kollision Kugel ↔ Gegner
      const enemiesCopy = [...newEnemies];
      const remainingBullets:any[] = [];
      movedBullets.forEach((b:any) => {
        let hit = false;
        for (let i = 0; i < enemiesCopy.length; i++) {
          const e = enemiesCopy[i];
          const dx = b.x - e.x;
          const dy = b.y - e.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < ENEMY_RADIUS + BULLET_RADIUS) {
            e.hp -= 1;
            hit = true;
            break;
          }
        }
        if (!hit) remainingBullets.push(b);
      });

      // Gegner aussortieren & Score
      const alive = enemiesCopy.filter((e:any) => e.hp > 0);
      const defeated = enemiesCopy.length - alive.length;
      if (defeated > 0) setScore(s => s + defeated);

      setEnemies(alive);
      setBullets(remainingBullets);

      // Nächste Welle, wenn leer
      if (alive.length === 0) nextWave();
    }, 40);

    return () => clearInterval(interval);
  }, []);

  // ------------ Auto-Fire ------------
  useEffect(() => {
    const fire = setInterval(() => {
      if (!runningRef.current) return;
      const P = playerRef.current;
      const E = enemiesRef.current;
      if (E.length === 0) return;

      // Ziel: nächster Gegner
      let target = E[0];
      let best = Number.MAX_VALUE;
      for (let i=0;i<E.length;i++){
        const dx = E[i].x - P.x;
        const dy = E[i].y - P.y;
        const d = dx*dx + dy*dy;
        if (d < best) { best = d; target = E[i]; }
      }

      const dx = target.x - P.x;
      const dy = target.y - P.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;

      const bullet = {
        id: `b-${Date.now()}-${Math.random()}`,
        x: P.x,
        y: P.y,
        dx: (dx/dist)*BULLET_SPEED,
        dy: (dy/dist)*BULLET_SPEED,
      };
      setBullets(prev => [...prev, bullet]);
    }, FIRE_RATE);

    return () => clearInterval(fire);
  }, []);

  // ------------ Touch / Steuerung ------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const x = Math.max(PLAYER_RADIUS, Math.min(width - PLAYER_RADIUS, gesture.moveX));
        const y = Math.max(PLAYER_RADIUS, Math.min(height - PLAYER_RADIUS, gesture.moveY));
        const pos = { x, y };
        setPlayer(pos);
        playerRef.current = pos;
      },
    })
  ).current;

  // ======================= RENDER ====================
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Hintergrund: Sterne */}
      {stars.map(s => (
        <View
          key={s.id}
          style={{
            position:'absolute',
            left:s.x,
            top:s.y,
            width:s.size,
            height:s.size,
            borderRadius:s.size/2,
            backgroundColor:'#CFE7FF',
            opacity:s.opacity,
          }}
        />
      ))}

      {/* Vignette */}
      <View pointerEvents="none" style={styles.vignette} />

      {running ? (
        <>
          {/* Spieler: Glow + Bild */}
          <View style={[styles.playerGlow, { left: player.x - PLAYER_RADIUS*1.8, top: player.y - PLAYER_RADIUS*1.8 }]} />
          {/* << SPIELER-SPRITE: HIER KANNST DU DEIN BILD AUSTAUSCHEN >> */}
          <Image
            source={SPRITES.player}
            style={{
              position: 'absolute',
              left: player.x - PLAYER_RADIUS,
              top:  player.y - PLAYER_RADIUS,
              width: PLAYER_RADIUS * 2,
              height: PLAYER_RADIUS * 2,
              resizeMode: 'contain',
            }}
          />

          {/* Gegner */}
          {enemies.map((e:any) => {
            const t = ENEMY_TYPES[e.type as keyof typeof ENEMY_TYPES];
            const hpRatio = Math.max(0, e.hp / e.maxHp);
            const angleDeg = Math.atan2(
              (player.y - e.y),
              (player.x - e.x)
            ) * 180 / Math.PI + 90; // optional: Gegner schaut zum Spieler
            return (
              <View key={e.id} style={{ position:'absolute', left: e.x - ENEMY_RADIUS, top: e.y - ENEMY_RADIUS }}>
                <View style={[styles.enemyGlow, { borderColor: t.ring }]} />
                {/* << GEGNER-SPRITE NACH TYP >> */}
                <Image
                  source={SPRITES.enemies[e.type]} // normal/miniboss/boss/superboss
                  style={{
                    position:'absolute',
                    left:0, top:0,
                    width: ENEMY_RADIUS * 2,
                    height: ENEMY_RADIUS * 2,
                    resizeMode:'contain',
                    transform:[{ rotate: `${angleDeg}deg` }],
                  }}
                />
                {/* HP-Bar */}
                <View style={styles.hpBarWrap}>
                  <View style={[styles.hpBarFill, { width: hpRatio * (ENEMY_RADIUS*2) }]} />
                </View>
              </View>
            );
          })}

          {/* Bullets */}
          {bullets.map(b => (
            <View key={b.id} style={{ position:'absolute', left:b.x - BULLET_RADIUS, top:b.y - BULLET_RADIUS }}>
              <View style={styles.bulletGlow}/>
              {/* << BULLET-SPRITE: HIER KANNST DU DEIN BILD AUSTAUSCHEN >> */}
              <Image
                source={SPRITES.bullet}
                style={{
                  width: BULLET_RADIUS * 2,
                  height: BULLET_RADIUS * 2,
                  resizeMode: 'contain',
                }}
              />
            </View>
          ))}

          {/* HUD */}
          <View style={styles.hudWrap}>
            <Text style={styles.hudText}>❤️ {lives}</Text>
            <Text style={styles.hudText}>🌊 {wave - 1}</Text>
            <Text style={styles.hudText}>🎯 {score}</Text>
          </View>
        </>
      ) : (
        <Text style={styles.gameOver}>GAME OVER</Text>
      )}
    </View>
  );
}

// ======================= STYLES ======================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  vignette: {
    position:'absolute',
    left:0, top:0, right:0, bottom:0,
    borderColor: THEME.vignette,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
  },

  playerGlow: {
    position:'absolute',
    width: PLAYER_RADIUS*3.6,
    height: PLAYER_RADIUS*3.6,
    borderRadius: PLAYER_RADIUS*1.8,
    backgroundColor: THEME.playerGlow,
    opacity: 0.25,
  },

  // enemy glow + hp bar bleiben für Tiefenwirkung erhalten
  enemyGlow: {
    position:'absolute',
    left:-6, top:-6,
    width: ENEMY_RADIUS*2 + 12,
    height: ENEMY_RADIUS*2 + 12,
    borderRadius: ENEMY_RADIUS + 6,
    borderWidth: 3,
    opacity: 0.35,
  },
  hpBarWrap: {
    position:'absolute',
    left:0,
    top: ENEMY_RADIUS*2 + 4,
    width: ENEMY_RADIUS*2,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow:'hidden',
  },
  hpBarFill: {
    height: 6,
    backgroundColor: '#7CFF6B',
  },

  bulletGlow: {
    position:'absolute',
    left:-6, top:-6,
    width: BULLET_RADIUS*2 + 12,
    height: BULLET_RADIUS*2 + 12,
    borderRadius: BULLET_RADIUS + 6,
    backgroundColor: THEME.bullet,
    opacity: 0.25,
  },

  hudWrap: {
    position:'absolute',
    top: 22,
    left: 16,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.hudGlass,
    borderWidth: 1,
    borderColor: THEME.hudBorder,
    flexDirection:'row',
    alignItems:'center',
    gap: 12,
  },
  hudText: {
    color: THEME.hudText,
    fontSize: 14,
    fontWeight: '600',
  },

  gameOver: {
    position:'absolute',
    top: height / 2 - 50,
    width: '100%',
    textAlign: 'center',
    fontSize: 34,
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
});
