// app/NebulaGame.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

const { width, height } = Dimensions.get('window');

/* ================= THEME ================= */
const THEME = {
  bg: '#06080F',
  star: '#CFE7FF',
  player: '#43B1FF',
  enemy: '#FF5A5A',
  neutral: '#7B7F8A',
  playerRing: '#AEE3FF',
  enemyRing: '#FFC1C1',
  neutralRing: '#C4C7D1',
  linePlayer: 'rgba(67,177,255,0.7)',
  hudGlass: 'rgba(255,255,255,0.08)',
  hudBorder: 'rgba(255,255,255,0.18)',
  hudText: 'rgba(255,255,255,0.95)',
};

/* ================= SPRITES =================
   Lege diese Dateien in /assets/nebula/ ab.
   -> Du kannst die Dateinamen/Größen anpassen.
*/
const SPRITES = {
  node: {
    player:  require('../assets/nebula/node_player.png'),   // Spieler-Basis
    enemy:   require('../assets/nebula/node_enemy.png'),    // Gegner-Basis
    neutral: require('../assets/nebula/node_neutral.png'),  // Neutrale-Basis
  },
  fleet: {
    player:  require('../assets/nebula/fleet_player.png'),  // Spieler-Flotte (klein)
    enemy:   require('../assets/nebula/fleet_enemy.png'),   // Gegner-Flotte (klein)
  },
};

const NODE_RADIUS = 26;        // passt die Node-Größe an (Sprites skalieren mit)
const NODE_TOUCH_RADIUS = 34;
const STAR_COUNT = 70;

type Owner = 'player' | 'enemy' | 'neutral';

type NodeT = {
  id: number;
  x: number;
  y: number;
  owner: Owner;
  units: number;
};

type Fleet = {
  id: number;
  fromId: number;
  toId: number;
  owner: Owner;
  amount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
};

type LayoutNode = {
  x: number;    // 0..1 relativ zur Breite
  y: number;    // 0..1 relativ zur Höhe
  owner: Owner; // 'player' | 'enemy' | 'neutral'
  units: number;
};

type LevelConfig = {
  title: string;
  playerProd: number;
  enemyProd: number;
  neutralProd: number;
  sendFraction: number;     // Anteil, der beim Senden rausgeht
  fleetSpeed: number;       // px/s
  enemyAIAttacks: boolean;  // KI sendet periodisch
  enemyDecisionMs: number;  // Intervall der KI-Sendungen
  layout?: LayoutNode[];    // feste Startaufstellung
};

/* ============== LEVELS: Layout + Schwierigkeit ============== */
const LEVELS: LevelConfig[] = [
  // ---------- Level 1: fair ----------
  {
    title: 'Level 1 — Orbit',
    playerProd: 0.50,
    enemyProd: 0.45,
    neutralProd: 0.10,
    sendFraction: 0.60,
    fleetSpeed: 260,
    enemyAIAttacks: false,   // KI greift NICHT an
    enemyDecisionMs: 1600,
    layout: [
      // Spieler (2 Basen)
      { x: 0.30, y: 0.25, owner: 'player',  units: 18 },
      { x: 0.35, y: 0.55, owner: 'player',  units: 16 },
      // Gegner (2 Basen)
      { x: 0.70, y: 0.25, owner: 'enemy',   units: 18 },
      { x: 0.75, y: 0.60, owner: 'enemy',   units: 16 },
      // Neutral (ein paar in der Mitte)
      { x: 0.50, y: 0.18, owner: 'neutral', units: 10 },
      { x: 0.52, y: 0.45, owner: 'neutral', units: 10 },
      { x: 0.48, y: 0.72, owner: 'neutral', units: 10 },
    ],
  },

  // ---------- Level 2: du unterzahl (1 vs 2) ----------
  {
    title: 'Level 2 — Nebula',
    playerProd: 0.50,
    enemyProd: 0.58,        // etwas höher
    neutralProd: 0.12,
    sendFraction: 0.60,
    fleetSpeed: 280,
    enemyAIAttacks: true,
    enemyDecisionMs: 1500,
    layout: [
      // Spieler (1 Basis)
      { x: 0.22, y: 0.50, owner: 'player',  units: 18 },
      // Gegner (2 Basen)
      { x: 0.68, y: 0.30, owner: 'enemy',   units: 18 },
      { x: 0.78, y: 0.60, owner: 'enemy',   units: 18 },
      // Neutral (mittig, umkämpft)
      { x: 0.45, y: 0.22, owner: 'neutral', units: 12 },
      { x: 0.50, y: 0.40, owner: 'neutral', units: 12 },
      { x: 0.55, y: 0.58, owner: 'neutral', units: 12 },
      { x: 0.50, y: 0.76, owner: 'neutral', units: 12 },
    ],
  },

  // ---------- Level 3: du 1 vs Gegner 3 ----------
  {
    title: 'Level 3 — Supernova',
    playerProd: 0.55,
    enemyProd: 0.72,        // deutlich höher
    neutralProd: 0.14,
    sendFraction: 0.65,
    fleetSpeed: 320,
    enemyAIAttacks: true,   // aggressiver
    enemyDecisionMs: 1200,
    layout: [
      // Spieler (1 Basis, weniger Startunits)
      { x: 0.18, y: 0.50, owner: 'player',  units: 14 },
      // Gegner (3 Basen)
      { x: 0.72, y: 0.24, owner: 'enemy',   units: 18 },
      { x: 0.82, y: 0.50, owner: 'enemy',   units: 20 },
      { x: 0.72, y: 0.76, owner: 'enemy',   units: 18 },
      // Neutrale Knoten als Zwischenziele
      { x: 0.40, y: 0.22, owner: 'neutral', units: 10 },
      { x: 0.48, y: 0.40, owner: 'neutral', units: 10 },
      { x: 0.52, y: 0.60, owner: 'neutral', units: 10 },
      { x: 0.60, y: 0.78, owner: 'neutral', units: 10 },
    ],
  },
];

/* =============== STARFIELD =============== */
let uid = 0;
const nextId = () => ++uid;

function createStars() {
  const arr: { id: number; x: number; y: number; size: number; speed: number; o: number }[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    arr.push({
      id: nextId(),
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.35 + 0.1,
      o: Math.random() * 0.55 + 0.25,
    });
  }
  return arr;
}

/* ================= COMPONENT ================= */
export default function NebulaGame() {
  // levelIndex aus der Route lesen
  const { levelIndex } = useLocalSearchParams<{ levelIndex?: string }>();
  const levelIdx = Math.max(0, Math.min(LEVELS.length - 1, parseInt(levelIndex ?? '0', 10) || 0));
  const config = LEVELS[levelIdx];

  const [stars, setStars] = useState(createStars());
  const nodesRef = useRef<NodeT[]>([]);
  const fleetsRef = useRef<Fleet[]>([]);
  const [nodesVersion, setNodesVersion] = useState(0);
  const [fleetsVersion, setFleetsVersion] = useState(0);
  const [running, setRunning] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Drag-State (Quelle merken, Linie zeichnen)
  const drag = useRef<{ fromId: number | null; x: number; y: number }>({ fromId: null, x: 0, y: 0 });

  /* ---------- Init Nodes: aus Level-Layout ---------- */
  useEffect(() => {
    const nodes: NodeT[] = (LEVELS[levelIdx].layout ?? []).map(n => ({
      id: nextId(),
      x: n.x * width,
      y: n.y * height,
      owner: n.owner,
      units: n.units,
    }));

    // Fallback falls kein Layout gesetzt wäre (hier nicht notwendig, aber sicher)
    if (nodes.length === 0) {
      const fallback = [
        { x: 0.30, y: 0.50, owner: 'player' as Owner, units: 18 },
        { x: 0.70, y: 0.50, owner: 'enemy'  as Owner, units: 18 },
        { x: 0.50, y: 0.30, owner: 'neutral' as Owner, units: 10 },
        { x: 0.50, y: 0.70, owner: 'neutral' as Owner, units: 10 },
      ].map(n => ({ id: nextId(), x: n.x * width, y: n.y * height, owner: n.owner, units: n.units }));
      nodes.push(...fallback);
    }

    nodesRef.current = nodes;
    setNodesVersion(v => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // nur beim Mount

  /* ---------- Sterne animieren ---------- */
  useEffect(() => {
    const t = setInterval(() => {
      setStars(prev => prev.map(s => {
        let nx = s.x + 0.05;
        let ny = s.y + s.speed;
        if (nx > width) nx = 0;
        if (ny > height) ny = 0;
        return { ...s, x: nx, y: ny };
      }));
    }, 40);
    return () => clearInterval(t);
  }, []);

  /* ---------- Produktion + Bewegungen + Win/Lose ---------- */
  useEffect(() => {
    let last = Date.now();
    const loop = setInterval(() => {
      if (!running) return;
      const now = Date.now();
      const dtSec = (now - last) / 1000;
      last = now;

      // Produktion (passiv)
      const nodes = nodesRef.current.map(n => {
        const rate =
          n.owner === 'player' ? config.playerProd :
          n.owner === 'enemy'  ? config.enemyProd  :
                                 config.neutralProd;
        return { ...n, units: Math.min(999, n.units + rate * dtSec) };
      });

      // Flotten bewegen
      const fleets = fleetsRef.current.map(f => ({
        ...f,
        x: f.x + f.vx * dtSec,
        y: f.y + f.vy * dtSec,
      }));

      // Ankunft prüfen
      const arrived: Fleet[] = [];
      const left: Fleet[] = [];
      for (const f of fleets) {
        const dx = f.targetX - f.x, dy = f.targetY - f.y;
        if (dx*dx + dy*dy <= (NODE_RADIUS * NODE_RADIUS)) arrived.push(f);
        else left.push(f);
      }

      // Kämpfe/Verstärkung
      for (const f of arrived) {
        const t = nodes.find(n => n.id === f.toId);
        if (!t) continue;
        if (t.owner === f.owner) {
          t.units = Math.min(999, t.units + f.amount);
        } else {
          t.units -= f.amount;
          if (t.units < 0) {
            t.owner = f.owner;
            t.units = Math.abs(t.units);
          }
        }
      }

      nodesRef.current = nodes;
      fleetsRef.current = left;
      setNodesVersion(v => v + 1);
      setFleetsVersion(v => v + 1);

      // Win/Lose
      const c = countOwners(nodes);
      if (c.enemy === 0 && c.player > 0) {
        endGame('win');
      } else if (c.player === 0 && c.enemy > 0) {
        endGame('lose');
      }
    }, 40);
    return () => clearInterval(loop);
  }, [running, config]);

  /* ---------- Gegner-KI (optional je Level) ---------- */
  useEffect(() => {
    if (!config.enemyAIAttacks) return;

    const t = setInterval(() => {
      if (!running) return;

      const nodes = nodesRef.current;
      const enemyBases = nodes.filter(n => n.owner === 'enemy' && n.units >= 8);
      if (enemyBases.length === 0) return;

      // stärkste Basis
      const from = enemyBases.sort((a, b) => b.units - a.units)[0];

      // Ziel: nahester Nicht-Enemy-Knoten
      const candidates = nodes.filter(n => n.owner !== 'enemy');
      if (candidates.length === 0) return;

      let to = candidates[0];
      let best = dist2(from.x, from.y, to.x, to.y);
      for (let i = 1; i < candidates.length; i++) {
        const d = dist2(from.x, from.y, candidates[i].x, candidates[i].y);
        if (d < best) { best = d; to = candidates[i]; }
      }

      sendFleet('enemy', from.id, to.id, from.units * 0.5, config);
    }, config.enemyDecisionMs);

    return () => clearInterval(t);
  }, [running, config]);

  /* ---------- Helpers ---------- */
  function endGame(result: 'win' | 'lose') {
    setRunning(false);
    setMessage(result === 'win' ? '🎉 Sieg! Alle Knoten erobert.' : '💀 Niederlage! Versuch’s nochmal.');
    // kurzer Moment, dann zurück ins Menü
    setTimeout(() => router.replace('/NebulaMenu'), 1200);
  }

  function countOwners(nodes: NodeT[]) {
    let player = 0, enemy = 0, neutral = 0;
    for (const n of nodes) {
      if (n.owner === 'player') player++;
      else if (n.owner === 'enemy') enemy++;
      else neutral++;
    }
    return { player, enemy, neutral };
  }

  function dist2(ax: number, ay: number, bx: number, by: number) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  }

  function sendFleet(owner: Owner, fromId: number, toId: number, amountRaw: number, cfg: LevelConfig) {
    const nodes = nodesRef.current.map(n => ({ ...n }));
    const from = nodes.find(n => n.id === fromId);
    const to = nodes.find(n => n.id === toId);
    if (!from || !to) return;
    if (from.owner !== owner) return;

    const amount = Math.max(1, Math.floor(amountRaw));
    if (from.units < amount) return;

    from.units -= amount;

    const dx = to.x - from.x, dy = to.y - from.y;
    const d = Math.max(1, Math.sqrt(dx*dx + dy*dy));
    const speed = cfg.fleetSpeed;
    const vx = (dx / d) * speed;
    const vy = (dy / d) * speed;

    const fleet: Fleet = {
      id: nextId(),
      fromId,
      toId,
      owner,
      amount,
      x: from.x, y: from.y,
      vx, vy,
      targetX: to.x, targetY: to.y,
    };

    fleetsRef.current = [...fleetsRef.current, fleet];
    nodesRef.current = nodes;
    setNodesVersion(v => v + 1);
    setFleetsVersion(v => v + 1);
  }

  function getNodeAt(x: number, y: number): NodeT | null {
    for (const n of nodesRef.current) {
      const d2 = dist2(x, y, n.x, n.y);
      if (d2 <= NODE_TOUCH_RADIUS * NODE_TOUCH_RADIUS) return n;
    }
    return null;
  }

  /* ---------- Touch/Drag (nur per Drag senden) ---------- */
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => running,
      onPanResponderGrant: (_, g) => {
        const x = g.x0, y = g.y0;
        const n = getNodeAt(x, y);
        // Spieler sendet NICHT automatisch; nur Quelle merken, wenn eigene Basis
        if (n && n.owner === 'player') {
          drag.current = { fromId: n.id, x, y };
        } else {
          drag.current = { fromId: null, x, y };
        }
      },
      onPanResponderMove: (_, g) => {
        drag.current = { ...drag.current, x: g.moveX, y: g.moveY };
      },
      onPanResponderRelease: () => {
        const { fromId, x, y } = drag.current;
        if (fromId) {
          const target = getNodeAt(x, y);
          if (target && target.id !== fromId) {
            const from = nodesRef.current.find(n => n.id === fromId)!;
            const amount = Math.floor(from.units * config.sendFraction);
            if (amount >= 1) sendFleet('player', from.id, target.id, amount, config);
          }
        }
        drag.current = { fromId: null, x: 0, y: 0 };
      },
    })
  ).current;

  /* ---------- Render ---------- */
  const nodes = useMemo(() => nodesRef.current, [nodesVersion]);
  const fleets = useMemo(() => fleetsRef.current, [fleetsVersion]);
  const playerCount = nodes.filter(n => n.owner === 'player').length;
  const enemyCount  = nodes.filter(n => n.owner === 'enemy').length;

  return (
    <View style={styles.container} {...pan.panHandlers}>
      {/* Starfield */}
      {stars.map(s => (
        <View key={s.id} style={{
          position: 'absolute',
          left: s.x, top: s.y,
          width: s.size, height: s.size,
          borderRadius: s.size/2,
          backgroundColor: THEME.star,
          opacity: s.o
        }}/>
      ))}

      {/* Fleets (BILDER statt Punkte) */}
      {fleets.map(f => (
        <Image
          key={f.id}
          source={f.owner === 'player' ? SPRITES.fleet.player : SPRITES.fleet.enemy}
          style={{
            position: 'absolute',
            left: f.x - 8,  // bei 16px Sprite halbieren zum Zentrieren
            top:  f.y - 8,
            width: 16,
            height: 16,
            resizeMode: 'contain',
            opacity: 0.95,
          }}
        />
      ))}

      {/* Drag line */}
      {drag.current.fromId && (
        <DragLine
          from={nodes.find(n => n.id === drag.current.fromId)!}
          x={drag.current.x}
          y={drag.current.y}
          color={THEME.linePlayer}
        />
      )}

      {/* Nodes */}
      {nodes.map(n => (
        <Node key={n.id} node={n} />
      ))}

      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.hudText}>🟦 {playerCount}</Text>
        <Text style={styles.hudText}>🟥 {enemyCount}</Text>
        <Text style={styles.hudText}>{config.title}</Text>
      </View>

      {/* End message */}
      {!running && message && (
        <View style={styles.centerMsg}>
          <Text style={styles.centerText}>{message}</Text>
        </View>
      )}
    </View>
  );
}

/* =============== Presentational Components =============== */

function Node({ node }: { node: NodeT }) {
  const ring =
    node.owner === 'player' ? THEME.playerRing :
    node.owner === 'enemy'  ? THEME.enemyRing : THEME.neutralRing;

  return (
    <View style={{
      position: 'absolute',
      left: node.x - NODE_RADIUS, top: node.y - NODE_RADIUS,
      width: NODE_RADIUS * 2, height: NODE_RADIUS * 2
    }}>
      {/* Glow-Ring */}
      <View style={{
        position: 'absolute',
        left: -6, top: -6,
        width: NODE_RADIUS*2 + 12,
        height: NODE_RADIUS*2 + 12,
        borderRadius: NODE_RADIUS + 6,
        borderWidth: 3,
        borderColor: ring,
        opacity: 0.4
      }}/>
      {/* KÖRPER als BILD */}
      <Image
        source={
          node.owner === 'player' ? SPRITES.node.player :
          node.owner === 'enemy'  ? SPRITES.node.enemy  :
                                    SPRITES.node.neutral
        }
        style={{
          position: 'absolute',
          left: 0, top: 0,
          width: NODE_RADIUS * 2,
          height: NODE_RADIUS * 2,
          resizeMode: 'contain',
        }}
      />
      {/* Units-Zahl */}
      <View style={{
        position: 'absolute',
        left: 0, top: NODE_RADIUS*2 + 4,
        width: NODE_RADIUS*2, height: 18,
        alignItems: 'center'
      }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
          {Math.floor(node.units)}
        </Text>
      </View>
    </View>
  );
}

function DragLine({ from, x, y, color }: { from: NodeT; x: number; y: number; color: string }) {
  const dx = x - from.x;
  const dy = y - from.y;
  const d = Math.max(1, Math.sqrt(dx*dx + dy*dy));
  const segments = Math.min(24, Math.floor(d / 20));
  const pts = [];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    pts.push({ id: i, px: from.x + dx * t, py: from.y + dy * t });
  }
  return (
    <>
      {pts.map(p => (
        <View key={p.id} style={{
          position: 'absolute',
          left: p.px - 2, top: p.py - 2,
          width: 4, height: 4,
          borderRadius: 2,
          backgroundColor: color
        }}/>
      ))}
    </>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  hud: {
    position: 'absolute',
    top: 18, left: 14,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: THEME.hudGlass,
    borderWidth: 1,
    borderColor: THEME.hudBorder,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  hudText: { color: THEME.hudText, fontWeight: '700' },
  centerMsg: {
    position: 'absolute', left: 0, right: 0, top: height/2 - 40,
    alignItems: 'center'
  },
  centerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 12
  }
});
