'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  SKIN_COLORS,
  type CharacterConfig,
} from '@/game/types';

export default function CharacterPreview({
  config,
}: {
  config: CharacterConfig;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 1.5, 5);
    camera.lookAt(0, 1.1, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xc8dfff, 0x22202d, 2));

    const light = new THREE.DirectionalLight(0xffd9a3, 3);
    light.position.set(3, 5, 3);
    scene.add(light);

    const model = new THREE.Group();
    scene.add(model);

    function part(
      geometry: THREE.BufferGeometry,
      color: string,
      x: number,
      y: number,
      z: number,
      metalness = 0.1
    ) {
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color,
          metalness,
          roughness: 0.5,
        })
      );

      mesh.position.set(x, y, z);
      model.add(mesh);
      return mesh;
    }

    const uniform = config.clothesColor;
    const accent = SKIN_COLORS[config.skin];

    part(new THREE.BoxGeometry(0.62, 0.72, 0.36), uniform, 0, 1.12, 0);
    part(new THREE.BoxGeometry(0.47, 0.42, 0.12), '#202737', 0, 1.16, 0.22);

    [-1, 1].forEach((side) => {
      part(new THREE.BoxGeometry(0.23, 0.75, 0.26), uniform, side * 0.18, 0.39, 0);
      part(new THREE.BoxGeometry(0.25, 0.17, 0.4), '#151923', side * 0.18, 0.08, 0.05);

      const arm = part(
        new THREE.BoxGeometry(0.19, 0.65, 0.23),
        uniform,
        side * 0.43,
        1.13,
        0.04
      );

      arm.rotation.z = side * 0.13;
    });

    part(new THREE.SphereGeometry(0.23, 24, 20), '#dca67f', 0, 1.74, 0);

    if (config.accessory === 'helmet') {
      part(new THREE.SphereGeometry(0.25, 24, 16), accent, 0, 1.85, -0.025);
    }

    if (config.accessory === 'headset') {
      [-1, 1].forEach((side) => {
        part(new THREE.BoxGeometry(0.09, 0.2, 0.15), '#151923', side * 0.24, 1.76, 0);
      });
    }

    if (config.accessory === 'goggles') {
      part(new THREE.BoxGeometry(0.4, 0.11, 0.08), accent, 0, 1.77, 0.2);
    }

    part(new THREE.BoxGeometry(0.7, 0.12, 0.15), accent, 0.08, 1.02, 0.39, 0.7);
    part(new THREE.BoxGeometry(0.3, 0.045, 0.055), '#d9b55c', -0.4, 1.02, 0.39, 0.8);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, 0.12, 48),
      new THREE.MeshStandardMaterial({
        color: '#26354b',
        metalness: 0.6,
        roughness: 0.3,
      })
    );
    pedestal.position.y = -0.08;
    scene.add(pedestal);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight || 400;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    renderer.setAnimationLoop(() => {
      model.rotation.y = Math.sin(performance.now() * 0.0004) * 0.55;
      renderer.render(scene, camera);
    });

    return () => {
      observer.disconnect();
      renderer.setAnimationLoop(null);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [config.skin, config.clothesColor, config.accessory]);

  return <div className="character-preview" ref={containerRef} />;
}