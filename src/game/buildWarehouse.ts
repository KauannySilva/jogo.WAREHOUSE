import * as THREE from 'three';

export interface Warehouse {
  group: THREE.Group;
  solids: THREE.Mesh[];
  surfaces: THREE.Mesh[];
  blockers: THREE.Box3[];
  elevator: THREE.Mesh;
  elevatorHeight: number;
}

export function buildWarehouse(): Warehouse {
  const group = new THREE.Group();
  const solids: THREE.Mesh[] = [];
  const surfaces: THREE.Mesh[] = [];
  const blockers: THREE.Box3[] = [];

  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: string,
    walkable = false,
    blocking = false
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    solids.push(mesh);

    if (walkable) surfaces.push(mesh);

    if (blocking) {
      mesh.updateMatrixWorld(true);
      blockers.push(new THREE.Box3().setFromObject(mesh));
    }

    return mesh;
  }

  box(44, 0.4, 44, 0, -0.2, 0, '#343b47', true);

  box(0.5, 12, 44, -22, 6, 0, '#293342', false, true);
  box(0.5, 12, 44, 22, 6, 0, '#293342', false, true);
  box(44, 12, 0.5, 0, 6, -22, '#293342', false, true);
  box(44, 12, 0.5, 0, 6, 22, '#293342', false, true);

  for (const level of [4, 8]) {
    box(10, 0.3, 40, -16, level - 0.15, 0, '#455268', true);
    box(10, 0.3, 40, 16, level - 0.15, 0, '#455268', true);
    box(22, 0.3, 4, 0, level - 0.15, -18, '#455268', true);
  }

  function ramp(x: number, z: number, base: number) {
    const length = Math.hypot(12, 4);
    const mesh = box(4, 0.2, length, x, base + 2, z, '#6e7a8c');
    mesh.rotation.x = Math.atan2(4, 12);
    surfaces.push(mesh);
  }

  ramp(-8, 4, 0);
  ramp(8, 4, 4);

  // Patamares ligando as rampas aos mezaninos.
  box(9, 0.3, 4, -10, 3.85, -4, '#536078', true);
  box(9, 0.3, 4, 10, 3.85, 12, '#536078', true);
  box(9, 0.3, 4, 10, 7.85, -4, '#536078', true);

  // Escada entre térreo e primeiro mezanino.
  for (let i = 0; i < 16; i++) {
    const height = (i + 1) * 0.25;
    box(3, height, 0.6, -17, height / 2, 15 - i * 0.6, '#7b8795', true);
  }

  const cratePositions = [
    [-4, 11], [4, 8], [-2, 0], [5, -7],
    [-7, -11], [11, -12], [-13, 0], [15, 9],
    [-2, -16], [9, 16],
  ];

  cratePositions.forEach(([x, z], index) => {
    const h = index % 3 === 0 ? 2.4 : 1.5;
    box(2.3, h, 2.3, x, h / 2, z, '#977246', true, true);
  });

  for (const x of [-20, 20]) {
    for (const z of [-16, 0, 16]) {
      box(0.5, 11, 0.5, x, 5.5, z, '#1e2634', false, true);
    }
  }

  const elevator = box(4, 0.25, 4, 0, -0.125, -10, '#e7b944', true);

  // Guias visuais do elevador.
  box(0.15, 10, 0.15, -2.2, 5, -12.2, '#e7b944');
  box(0.15, 10, 0.15, 2.2, 5, -12.2, '#e7b944');

  group.updateMatrixWorld(true);

  return {
    group,
    solids,
    surfaces,
    blockers,
    elevator,
    elevatorHeight: 0,
  };
}