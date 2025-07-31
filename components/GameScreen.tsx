import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Dimensions, Text } from 'react-native';
import RocketImage from '../assets/images/rocket.png';
import EnemyPlaneImage from '../assets/images/enemy-plane.png';


const { width, height } = Dimensions.get('window');
const ROCKET_WIDTH = 50;
const ROCKET_HEIGHT = 50;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 15;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;

export default function GameScreen() {
  const [running, setRunning] = useState(true);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [rocketX, setRocketX] = useState(width / 2 - ROCKET_WIDTH / 2);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [lastShot, setLastShot] = useState(Date.now());
  const [boss, setBoss] = useState(null);
  const [bossLives, setBossLives] = useState(20);
  const [bossBullets, setBossBullets] = useState([]);
  const [bossActive, setBossActive] = useState(false);
  const [nextBossScore, setNextBossScore] = useState(200);

  useEffect(() => {
    const interval = setInterval(() => {
      setEnemies(prev => [
        ...prev,
        { x: Math.random() * (width - ENEMY_WIDTH), y: -ENEMY_HEIGHT, id: Date.now() + Math.random(), level: 2 }
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const shoot = () => {
    setBullets(prev => [
      ...prev,
      { x: rocketX + ROCKET_WIDTH / 2 - 2.5, y: height - ROCKET_HEIGHT, id: Date.now() }
    ]);
  };

  const updateGame = () => {
    setBullets(prev =>
      prev.map(b => ({ ...b, y: b.y - 10 })).filter(b => b.y > -BULLET_HEIGHT)
    );

    // Boss bewegen, wenn aktiv
    if (bossActive && boss) {
      setBoss(prev => {
        if (!prev) return null;
        let newX = prev.x + prev.direction * 5; // Geschwindigkeit Boss
        let newDirection = prev.direction;
        // Am Rand umdrehen
        if (newX <= 0 || newX >= width - prev.width) {
          newDirection = -prev.direction;
          newX = prev.x + newDirection * 5;
        }
        return { ...prev, x: newX, direction: newDirection };
      });
    }

    setEnemies(prev => {
      const updated = prev.map(e => ({ ...e, y: e.y + 10 }));
      const filtered = updated.filter(e => {
        if (e.y + ENEMY_HEIGHT >= height) {
          setLives(l => l - 1);
          return false;
        }
        return true;
      });
      return filtered;
    });

    // Collision detection
    bullets.forEach(bullet => {
      enemies.forEach(enemy => {
        if (
          bullet.x < enemy.x + ENEMY_WIDTH &&
          bullet.x + BULLET_WIDTH > enemy.x &&
          bullet.y < enemy.y + ENEMY_HEIGHT &&
          bullet.y + BULLET_HEIGHT > enemy.y
        ) {
          setBullets(prev => prev.filter(b => b.id !== bullet.id));

          if (enemy.level === 2) {
            // Wenn Level 2: In zwei kleine Gegner (Level 1) splitten!
            setEnemies(prev => [
  ...prev.filter(e => e.id !== enemy.id),
  {
    x: enemy.x,
    y: enemy.y,
    id: Date.now() + Math.random(),
    level: 1
  },
  {
    x: enemy.x + ENEMY_WIDTH / 2,
    y: enemy.y,
    id: Date.now() + Math.random(),
    level: 1
  }
]);

// === NEU: Boss-Kollisionserkennung ===
if (bossActive && boss) {
  bullets.forEach(bullet => {
    if (
      bullet.x < boss.x + boss.width &&
      bullet.x + BULLET_WIDTH > boss.x &&
      bullet.y < boss.y + boss.height &&
      bullet.y + BULLET_HEIGHT > boss.y
    ) {
      setBullets(prev => prev.filter(b => b.id !== bullet.id));
      setBossLives(lives => lives - 1);

      // Boss besiegt?
      if (bossLives - 1 <= 0) {
        setBossActive(false);
        setBoss(null);
        setBossLives(20); // Hier kannst du den Wert erhöhen für den nächsten Boss!
        setScore(s => s + 50); // Bonuspunkte
      }
    }
  });
}

          } else {
            // Level 1: Einfach entfernen und Score erhöhen
            setEnemies(prev => prev.filter(e => e.id !== enemy.id));
            setScore(s => s + 1);
          }
        }
      });
    });

    if (!bossActive && score >= nextBossScore) {
      setBoss({
        x: width / 2 - ENEMY_WIDTH,
        y: 40,
        width: ENEMY_WIDTH * 2,
        height: ENEMY_HEIGHT,
        direction: 1 // 1 = rechts, -1 = links
      });
      setBossLives(20);
      setBossActive(true);
      setNextBossScore(prev => prev + 200);
    }

    if (lives <= 0) setRunning(false);
  };

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(updateGame, 50);
    return () => clearInterval(interval);
  }, [bullets, enemies, running, boss, bossActive]);

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onResponderMove={e => {
        const fingerX = e.nativeEvent.locationX;
        let newRocketX = fingerX - ROCKET_WIDTH / 2;
        if (newRocketX < 0) newRocketX = 0;
        if (newRocketX > width - ROCKET_WIDTH) newRocketX = width - ROCKET_WIDTH;
        setRocketX(newRocketX);

        // Schussrate begrenzen (z. B. alle 100ms)
        const now = Date.now();
        if (now - lastShot > 350) {
          shoot();
          setLastShot(now);
        }
      }}
    >
      {running ? (
        <>
          <Image source={RocketImage} style={[styles.rocket, { left: rocketX }]} />
          {bullets.map(bullet => (
            <View key={bullet.id} style={[styles.bullet, { left: bullet.x, top: bullet.y }]} />
          ))}
          {enemies.map(enemy => (
  <Image
    key={enemy.id}
    source={EnemyPlaneImage}
    style={{
      position: 'absolute',
      left: enemy.x,
      top: enemy.y,
      width: enemy.level === 2 ? ENEMY_WIDTH : ENEMY_WIDTH / 2,
      height: enemy.level === 2 ? ENEMY_HEIGHT : ENEMY_HEIGHT / 2,
      zIndex: 10,
    }}
    resizeMode="contain"
  />
))}
          {bossActive && boss && (
            <View
              style={{
                position: 'absolute',
                left: boss.x,
                top: boss.y,
                width: boss.width,
                height: boss.height,
                backgroundColor: 'purple',
                borderRadius: 10,
                borderWidth: 2,
                borderColor: 'yellow',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>BOSS {bossLives}</Text>
            </View>
          )}
          <Text style={styles.score}>❤️ {lives}   Score: {score}</Text>
        </>
      ) : (
        <Text style={styles.gameOver}>Game Over</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  rocket: {
    width: ROCKET_WIDTH,
    height: ROCKET_HEIGHT,
    position: 'absolute',
    bottom: 40,
  },
  bullet: {
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    backgroundColor: 'yellow',
    position: 'absolute',
  },
  enemy: {
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
    backgroundColor: 'red',
    position: 'absolute',
  },
  score: {
    position: 'absolute',
    top: 40,
    left: 20,
    color: 'white',
    fontSize: 18,
  },
  gameOver: {
    color: 'white',
    fontSize: 36,
    textAlign: 'center',
    marginTop: height / 2 - 50,
  },
});
