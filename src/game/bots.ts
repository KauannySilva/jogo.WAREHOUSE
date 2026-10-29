import * as THREE from 'three';

import {
    createTacticalCharacter,
    getEnemyUniformColor,
  } from './characterModel';
  
  import {
    SKIN_COLORS,
    type CharacterConfig,
  } from './types';
  
export interface Bot {
  id: number;
  team: 'blue' | 'red';
  mesh: THREE.Group;
  hp: number;
  alive: boolean;
  cooldown: number;
  routeIndex: number;
  route: THREE.Vector3[];
}

export function createBots(
    scene: THREE.Scene,
    config: CharacterConfig
  ): Bot[] {
    const enemyUniformColor = getEnemyUniformColor(
      config.clothesColor
    );
  
    const patrol = [
      [0, 0, 15],
      [-8, 0, 10],
      [-8, 4, -2],
      [-16, 4, -4],
      [-16, 4, -18],
      [16, 4, -18],
      [16, 4, 12],
      [8, 4, 10],
      [8, 8, -2],
      [16, 8, -4],
      [16, 8, -18],
      [-16, 8, -18],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  
    return Array.from({ length: 7 }, (_, id): Bot => {
      const team: Bot['team'] = id < 3 ? 'blue' : 'red';
      const allied = team === 'blue';
  
      const mesh = createTacticalCharacter({
        uniformColor: allied
          ? config.clothesColor
          : enemyUniformColor,
  
        weaponColor: allied
          ? SKIN_COLORS[config.skin]
          : '#59616c',
  
        accessory: allied
          ? config.accessory
          : 'helmet',
      });
  
      // Todos os componentes, incluindo armas e acessórios,
      // passam a identificar corretamente o proprietário do impacto.
      mesh.traverse((object) => {
        object.userData.botId = id;
      });
  
      mesh.position.set(
        allied ? -5 + id * 3 : -9 + (id - 3) * 6,
        0,
        allied ? 16 : -15
      );
  
      scene.add(mesh);
  
      return {
        id,
        team,
        mesh,
        hp: 100,
        alive: true,
        cooldown: 1 + Math.random(),
        routeIndex: allied ? 0 : 4,
        route: patrol.map((point) => point.clone()),
      };
    });
  }
export function updateBots(
  delta: number,
  bots: Bot[],
  playerPosition: THREE.Vector3,
  solids: THREE.Mesh[],
  damagePlayer: (amount: number) => void
) {
  const raycaster = new THREE.Raycaster();

  function visible(from: THREE.Vector3, to: THREE.Vector3) {
    const direction = to.clone().sub(from);
    const distance = direction.length();

    raycaster.set(from, direction.normalize());
    raycaster.far = distance;

    return raycaster.intersectObjects(solids, false).length === 0;
  }

  for (const bot of bots) {
    if (!bot.alive) continue;

    bot.cooldown -= delta;

    const origin = bot.mesh.position.clone().add(new THREE.Vector3(0, 1.45, 0));

    const candidates: {
      position: THREE.Vector3;
      target: Bot | null;
      distance: number;
    }[] = bots
      .filter((other) => other.alive && other.team !== bot.team)
      .map((other) => {
        const position = other.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0));
        return {
          position,
          target: other,
          distance: origin.distanceTo(position),
        };
      });

    if (bot.team === 'red') {
      candidates.push({
        position: playerPosition.clone(),
        target: null,
        distance: origin.distanceTo(playerPosition),
      });
    }

    candidates.sort((a, b) => a.distance - b.distance);

    const enemy = candidates.find(
      (candidate) =>
        candidate.distance < 28 &&
        visible(origin, candidate.position)
    );

    if (enemy) {
      bot.mesh.lookAt(
        enemy.position.x,
        bot.mesh.position.y,
        enemy.position.z
      );

      if (bot.cooldown <= 0) {
        bot.cooldown = 0.8 + Math.random() * 0.7;

        if (Math.random() < 0.55) {
          if (enemy.target) {
            enemy.target.hp -= 18;

            if (enemy.target.hp <= 0) {
              enemy.target.alive = false;
              enemy.target.mesh.visible = false;
            }
          } else {
            damagePlayer(9);
          }
        }
      }
    } else {
      const destination = bot.route[bot.routeIndex];
      const offset = destination.clone().sub(bot.mesh.position);

      if (offset.length() < 0.3) {
        bot.routeIndex = (bot.routeIndex + 1) % bot.route.length;
      } else {
        bot.mesh.position.addScaledVector(
          offset.normalize(),
          Math.min(delta * 2.1, offset.length())
        );

        bot.mesh.lookAt(
          destination.x,
          bot.mesh.position.y,
          destination.z
        );
      }
    }
  }
}