import * as THREE from 'three';
import type { CharacterConfig } from './types';

interface CharacterOptions {
  uniformColor: string;
  weaponColor: string;
  accessory: CharacterConfig['accessory'];
}

export function getEnemyUniformColor(allyColor: string): string {
  const ally = new THREE.Color(allyColor);

  const candidates = [
    '#ec405c',
    '#29c5e8',
    '#eab940',
    '#753de0',
  ];

  // Distância RGB: heurística simples de separação visual,
  // não uma medida perceptual de acessibilidade.
  let bestColor = candidates[0];
  let bestDistance = -1;

  for (const candidate of candidates) {
    const color = new THREE.Color(candidate);

    const distance =
      (ally.r - color.r) ** 2 +
      (ally.g - color.g) ** 2 +
      (ally.b - color.b) ** 2;

    if (distance > bestDistance) {
      bestDistance = distance;
      bestColor = candidate;
    }
  }

  return bestColor;
}

export function createTacticalCharacter({
  uniformColor,
  weaponColor,
  accessory,
}: CharacterOptions): THREE.Group {
  const root = new THREE.Group();

  const uniform = new THREE.MeshStandardMaterial({
    color: uniformColor,
    roughness: 0.85,
  });

  const armor = new THREE.MeshStandardMaterial({
    color: '#242c39',
    roughness: 0.75,
  });

  const skin = new THREE.MeshStandardMaterial({
    color: '#d3a17d',
    roughness: 0.9,
  });

  const boots = new THREE.MeshStandardMaterial({
    color: '#121821',
    roughness: 0.9,
  });

  const weaponMaterial = new THREE.MeshStandardMaterial({
    color: weaponColor,
    metalness: 0.55,
    roughness: 0.38,
  });

  const metal = new THREE.MeshStandardMaterial({
    color: '#242832',
    metalness: 0.65,
    roughness: 0.35,
  });

  const gold = new THREE.MeshStandardMaterial({
    color: '#d5b35b',
    metalness: 0.75,
    roughness: 0.3,
  });

  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number]
  ) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    root.add(object);
    return object;
  }

  function box(
    dimensions: [number, number, number],
    material: THREE.Material,
    position: [number, number, number]
  ) {
    return mesh(
      new THREE.BoxGeometry(...dimensions),
      material,
      position
    );
  }

  function segment(
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    material: THREE.Material
  ) {
    const direction = end.clone().sub(start);
    const length = direction.length();

    const object = mesh(
      new THREE.CylinderGeometry(
        radius * 0.9,
        radius,
        length,
        10
      ),
      material,
      [0, 0, 0]
    );

    object.position.copy(start).add(end).multiplyScalar(0.5);

    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    return object;
  }

  // Quadril e tronco com cintura mais estreita.
  box([0.36, 0.23, 0.25], uniform, [0, 0.88, 0]);

  mesh(
    new THREE.CylinderGeometry(0.27, 0.2, 0.5, 8),
    uniform,
    [0, 1.22, 0]
  ).scale.z = 0.65;

  box([0.45, 0.37, 0.11], armor, [0, 1.25, 0.16]);
  box([0.4, 0.34, 0.1], armor, [0, 1.25, -0.17]);
  box([0.39, 0.07, 0.29], boots, [0, 0.98, 0]);

  for (const x of [-0.13, 0, 0.13]) {
    box([0.1, 0.14, 0.07], armor, [x, 1.15, 0.23]);
  }

  // Pescoço e cabeça.
  mesh(
    new THREE.CylinderGeometry(0.075, 0.08, 0.12, 10),
    skin,
    [0, 1.53, 0]
  );

  const head = mesh(
    new THREE.SphereGeometry(0.18, 18, 14),
    skin,
    [0, 1.73, 0]
  );
  head.scale.set(0.87, 1.13, 0.95);

  // O personagem olha para +Z, igual ao lookAt dos bots.
  box([0.1, 0.07, 0.045], skin, [0, 1.73, 0.165]);

  // Pernas segmentadas, joelheiras e botas.
  for (const side of [-1, 1]) {
    const hip = new THREE.Vector3(side * 0.12, 0.89, 0);
    const knee = new THREE.Vector3(side * 0.16, 0.52, 0.035);
    const ankle = new THREE.Vector3(side * 0.18, 0.15, 0);

    segment(hip, knee, 0.105, uniform);
    segment(knee, ankle, 0.082, uniform);

    box(
      [0.16, 0.17, 0.08],
      armor,
      [side * 0.16, 0.52, 0.12]
    );

    box(
      [0.19, 0.17, 0.32],
      boots,
      [side * 0.18, 0.09, 0.055]
    );
  }

  // Braços em posição de empunhadura.
  const rightShoulder = new THREE.Vector3(0.3, 1.42, 0);
  const rightElbow = new THREE.Vector3(0.39, 1.13, 0.13);
  const rightHand = new THREE.Vector3(0.19, 1.15, 0.37);

  const leftShoulder = new THREE.Vector3(-0.3, 1.42, 0);
  const leftElbow = new THREE.Vector3(-0.36, 1.12, 0.2);
  const leftHand = new THREE.Vector3(0.12, 1.19, 0.64);

  segment(rightShoulder, rightElbow, 0.085, uniform);
  segment(rightElbow, rightHand, 0.07, uniform);

  segment(leftShoulder, leftElbow, 0.085, uniform);
  segment(leftElbow, leftHand, 0.07, uniform);

  for (const hand of [rightHand, leftHand]) {
    mesh(
      new THREE.SphereGeometry(0.075, 10, 8),
      boots,
      [hand.x, hand.y, hand.z]
    );
  }

  // Rifle completo nas mãos de todos os personagens.
  box([0.12, 0.13, 0.46], weaponMaterial, [0.17, 1.27, 0.46]);
  box([0.1, 0.11, 0.2], weaponMaterial, [0.17, 1.27, 0.16]);
  box([0.08, 0.21, 0.11], metal, [0.17, 1.12, 0.39]);

  const barrel = mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.3, 12),
    metal,
    [0.17, 1.28, 0.84]
  );
  barrel.rotation.x = Math.PI / 2;

  box([0.13, 0.045, 0.26], gold, [0.17, 1.35, 0.49]);

  const scope = mesh(
    new THREE.CylinderGeometry(0.043, 0.043, 0.18, 12),
    metal,
    [0.17, 1.43, 0.46]
  );
  scope.rotation.x = Math.PI / 2;

  if (accessory === 'helmet') {
    const helmet = mesh(
      new THREE.SphereGeometry(
        0.2,
        18,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      ),
      uniform,
      [0, 1.77, 0]
    );

    helmet.scale.set(0.95, 0.9, 1);
  }

  if (accessory === 'headset') {
    for (const side of [-1, 1]) {
      box([0.07, 0.14, 0.12], armor, [side * 0.18, 1.74, 0]);
    }

    box([0.36, 0.045, 0.07], armor, [0, 1.91, 0]);
  }

  if (accessory === 'goggles') {
    box([0.29, 0.095, 0.06], metal, [0, 1.77, 0.16]);
    box([0.24, 0.055, 0.02], gold, [0, 1.77, 0.2]);
  }

  return root;
}