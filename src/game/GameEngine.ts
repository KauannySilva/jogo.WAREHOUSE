import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { buildWarehouse, type Warehouse } from './buildWarehouse';
import { createBots, updateBots, type Bot } from './bots';
import {
  INITIAL_HUD,
  SKIN_COLORS,
  type CharacterConfig,
  type HudState,
} from './types';

export class GameEngine {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(75, 1, 0.05, 150);
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private controls: PointerLockControls;
  private world: Warehouse;
  private bots: Bot[];
  private hud: HudState = { ...INITIAL_HUD };

  private keys = new Set<string>();
  private raycaster = new THREE.Raycaster();
  private clock = new THREE.Clock();
  private weapon = new THREE.Group();
  private flash: THREE.Mesh;

  private observer: ResizeObserver;
  private shooting = false;
  private lastShot = 0;
  private reloadRemaining = 0;
  private elevatorDirection = 1;
  private verticalVelocity = 0;
  private hudTimer = 0;
  private disposed = false;

  constructor(
    private container: HTMLElement,
    config: CharacterConfig,
    private onHudChange: (state: HudState) => void
  ) {
    this.scene.background = new THREE.Color('#111923');
    this.scene.fog = new THREE.Fog('#111923', 32, 85);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 1.7, 18);
    this.scene.add(this.camera);

    this.controls = new PointerLockControls(
      this.camera,
      this.renderer.domElement
    );

    this.scene.add(new THREE.HemisphereLight(0xc1ddff, 0x34302b, 1.6));

    const sun = new THREE.DirectionalLight(0xffe4bc, 2.5);
    sun.position.set(8, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    sun.shadow.camera.far = 70;
    this.scene.add(sun);

    for (const x of [-14, 14]) {
      const light = new THREE.PointLight(0x9fcfff, 90, 28);
      light.position.set(x, 10, 0);
      this.scene.add(light);
    }

    this.world = buildWarehouse();
    this.scene.add(this.world.group);
    this.bots = createBots(this.scene, config);
    this.flash = this.buildWeapon(config);
    this.hud.weapon = `AR-9 • ${config.skin.toUpperCase()}`;

    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(container);
    this.resize();

    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('mouseup', this.mouseUp);
    window.addEventListener('blur', this.blur);
    this.renderer.domElement.addEventListener('mousedown', this.mouseDown);

    this.controls.addEventListener('lock', this.onLock);
    this.controls.addEventListener('unlock', this.onUnlock);
  }

  private buildWeapon(config: CharacterConfig) {
    const add = (
      geometry: THREE.BufferGeometry,
      color: string,
      x: number,
      y: number,
      z: number
    ) => {
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color,
          metalness: 0.55,
          roughness: 0.4,
          depthTest: false,
          depthWrite: false,
        })
      );

      mesh.position.set(x, y, z);
      mesh.renderOrder = 100;
      mesh.frustumCulled = false;
      this.weapon.add(mesh);
      return mesh;
    };

    const pink = SKIN_COLORS[config.skin];

    add(new THREE.BoxGeometry(0.12, 0.14, 0.5), pink, 0, 0, 0);
    add(new THREE.BoxGeometry(0.09, 0.08, 0.35), '#d5b35b', 0, 0.02, -0.36);
    add(new THREE.BoxGeometry(0.08, 0.23, 0.12), '#262531', 0, -0.12, 0.06);
    add(new THREE.BoxGeometry(0.11, 0.13, 0.24), pink, 0, -0.01, 0.3);

    const scope = add(
      new THREE.CylinderGeometry(0.045, 0.045, 0.22, 16),
      '#242631',
      0,
      0.12,
      -0.04
    );
    scope.rotation.x = Math.PI / 2;

    // Braços visíveis no canto inferior direito.
    const leftArm = add(
      new THREE.BoxGeometry(0.12, 0.13, 0.43),
      config.clothesColor,
      -0.13,
      -0.19,
      0.12
    );
    leftArm.rotation.z = -0.35;

    add(new THREE.BoxGeometry(0.12, 0.13, 0.36), config.clothesColor, 0.1, -0.22, 0.3);
    add(new THREE.BoxGeometry(0.11, 0.1, 0.11), '#dca67f', -0.08, -0.1, -0.08);

    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 8, 8),
      new THREE.MeshBasicMaterial({
        color: '#ffe49a',
        depthTest: false,
        depthWrite: false,
      })
    );

    flash.position.set(0, 0.02, -0.57);
    flash.renderOrder = 101;
    flash.visible = false;
    this.weapon.add(flash);

    this.weapon.position.set(0.29, -0.24, -0.48);
    this.camera.add(this.weapon);

    return flash;
  }

  start() {
    this.clock.start();
    this.emitHud();
    this.renderer.setAnimationLoop(this.animate);
  }

  private resize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private onLock = () => {
    this.hud.locked = true;
    this.emitHud();
  };

  private onUnlock = () => {
    this.hud.locked = false;
    this.shooting = false;
    this.keys.clear();
    this.emitHud();
  };

  private blur = () => {
    this.keys.clear();
    this.shooting = false;
    this.controls.unlock();
  };

  private keyDown = (event: KeyboardEvent) => {
    if (!this.controls.isLocked) return;

    if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
      event.preventDefault();
    }

    this.keys.add(event.code);

    if (event.code === 'KeyR') this.reload();
  };

  private keyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private mouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || this.hud.result !== 'playing') return;

    if (!this.controls.isLocked) {
      this.controls.lock();
      return;
    }

    this.shooting = true;
  };

  private mouseUp = () => {
    this.shooting = false;
  };

  private emitHud() {
    this.hud.blueAlive =
      this.bots.filter((bot) => bot.alive && bot.team === 'blue').length +
      (this.hud.hp > 0 ? 1 : 0);

    this.hud.redAlive =
      this.bots.filter((bot) => bot.alive && bot.team === 'red').length;

    this.onHudChange({ ...this.hud });
  }

  private reload() {
    if (
      this.hud.reloading ||
      this.hud.ammo === 30 ||
      this.hud.reserveAmmo === 0
    ) return;

    this.hud.reloading = true;
    this.reloadRemaining = 1.4;
    this.emitHud();
  }

  private shoot() {
    const now = performance.now();

    if (
      this.hud.reloading ||
      now - this.lastShot < 120 ||
      this.hud.result !== 'playing'
    ) return;

    if (this.hud.ammo === 0) {
      this.reload();
      return;
    }

    this.lastShot = now;
    this.hud.ammo--;
    this.flash.visible = true;

    this.raycaster.setFromCamera(new THREE.Vector2(), this.camera);
    this.raycaster.far = 100;

    const targets = this.bots
      .filter((bot) => bot.alive)
      .map((bot) => bot.mesh);

    const hits = this.raycaster.intersectObjects(
      [...this.world.solids, ...targets],
      true
    );

    const hit = hits[0];

    if (hit && typeof hit.object.userData.botId === 'number') {
      const bot = this.bots.find(
        (item) => item.id === hit.object.userData.botId
      );

      // Aliados bloqueiam o tiro, mas não recebem dano.
      if (bot && bot.team === 'red') {
        bot.hp -= 34;

        if (bot.hp <= 0) {
          bot.alive = false;
          bot.mesh.visible = false;
          this.hud.kills++;
        }
      }
    }

    this.emitHud();
  }

  private blocked(position: THREE.Vector3) {
    const feet = position.y - 1.7;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(position.x - 0.3, feet + 0.3, position.z - 0.3),
      new THREE.Vector3(position.x + 0.3, feet + 1.6, position.z + 0.3)
    );

    return this.world.blockers.some((box) => box.intersectsBox(playerBox));
  }

  private movePlayer(delta: number) {
    const position = this.camera.position;
    const speed = this.keys.has('ShiftLeft') ? 8 : 5;
    const forward = new THREE.Vector3();

    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    const movement = new THREE.Vector3();

    if (this.keys.has('KeyW')) movement.add(forward);
    if (this.keys.has('KeyS')) movement.sub(forward);
    if (this.keys.has('KeyD')) movement.add(right);
    if (this.keys.has('KeyA')) movement.sub(right);

    movement.normalize().multiplyScalar(speed * delta);

    position.x += movement.x;
    if (this.blocked(position)) position.x -= movement.x;

    position.z += movement.z;
    if (this.blocked(position)) position.z -= movement.z;

    position.x = THREE.MathUtils.clamp(position.x, -21.3, 21.3);
    position.z = THREE.MathUtils.clamp(position.z, -21.3, 21.3);

    // Busca a superfície logo abaixo dos pés.
    const feet = position.y - 1.7;

    this.raycaster.set(
      new THREE.Vector3(position.x, feet + 0.65, position.z),
      new THREE.Vector3(0, -1, 0)
    );
    this.raycaster.far = 30;

    const hit = this.raycaster.intersectObjects(this.world.surfaces, false)[0];

    if (hit && feet - hit.point.y < 0.4) {
      position.y = hit.point.y + 1.7;
      this.verticalVelocity = 0;
    } else {
      this.verticalVelocity -= 18 * delta;
      position.y += this.verticalVelocity * delta;

      if (hit && position.y - 1.7 < hit.point.y) {
        position.y = hit.point.y + 1.7;
        this.verticalVelocity = 0;
      }
    }

    if (position.y < -10) {
      position.set(0, 1.7, 18);
      this.verticalVelocity = 0;
    }
  }

  private updateElevator(delta: number) {
    const oldHeight = this.world.elevatorHeight;
    const position = this.camera.position;

    const riding =
      Math.abs(position.x) < 1.9 &&
      Math.abs(position.z + 10) < 1.9 &&
      Math.abs(position.y - 1.7 - oldHeight) < 0.3;

    this.world.elevatorHeight = THREE.MathUtils.clamp(
      oldHeight + delta * this.elevatorDirection * 1.5,
      0,
      8
    );

    if (this.world.elevatorHeight >= 8) this.elevatorDirection = -1;
    if (this.world.elevatorHeight <= 0) this.elevatorDirection = 1;

    this.world.elevator.position.y = this.world.elevatorHeight - 0.125;
    this.world.elevator.updateMatrixWorld(true);

    if (riding) {
      position.y += this.world.elevatorHeight - oldHeight;
    }
  }

  private damagePlayer = (amount: number) => {
    if (
      this.hud.result !== 'playing' ||
      this.hud.hp <= 0 ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }
  
    // Reduz a vida do jogador.
    this.hud.hp = Math.max(
      0,
      this.hud.hp - amount
    );
  
    // Reinicia a vignette a cada dano recebido.
    this.hud.damageSequence++;
  
    if (this.hud.hp === 0) {
      this.finish('defeat');
      return;
    }
  
    // Envia imediatamente o estado atualizado para a interface.
    this.emitHud();
  };

  private finish(result: 'victory' | 'defeat') {
    this.hud.result = result;
    this.shooting = false;
    this.controls.unlock();
    this.emitHud();
  }

  private animate = () => {
    if (this.disposed) return;

    const delta = Math.min(this.clock.getDelta(), 0.04);

    if (this.controls.isLocked && this.hud.result === 'playing') {
      this.updateElevator(delta);
      this.movePlayer(delta);

      if (this.shooting) this.shoot();

      if (this.hud.reloading) {
        this.reloadRemaining -= delta;

        if (this.reloadRemaining <= 0) {
          const count = Math.min(30 - this.hud.ammo, this.hud.reserveAmmo);
          this.hud.ammo += count;
          this.hud.reserveAmmo -= count;
          this.hud.reloading = false;
          this.emitHud();
        }
      }

      updateBots(
        delta,
        this.bots,
        this.camera.position,
        this.world.solids,
        this.damagePlayer
      );

      if (
        this.hud.result === 'playing' &&
        !this.bots.some((bot) => bot.alive && bot.team === 'red')
      ) {
        this.finish('victory');
      }

      const moving = ['KeyW', 'KeyA', 'KeyS', 'KeyD']
        .some((key) => this.keys.has(key));

      this.weapon.position.y =
        -0.24 +
        (moving ? Math.sin(performance.now() * 0.012) * 0.012 : 0) -
        (this.hud.reloading ? 0.15 : 0);

      this.hudTimer += delta;

      if (this.hudTimer > 0.2) {
        this.hudTimer = 0;
        this.emitHud();
      }
    }

    if (performance.now() - this.lastShot > 45) {
      this.flash.visible = false;
    }

    this.scene.updateMatrixWorld(true);
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);

    this.controls.removeEventListener('lock', this.onLock);
    this.controls.removeEventListener('unlock', this.onUnlock);
    this.controls.unlock();
    this.controls.dispose();

    this.observer.disconnect();

    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('mouseup', this.mouseUp);
    window.removeEventListener('blur', this.blur);
    this.renderer.domElement.removeEventListener('mousedown', this.mouseDown);

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.forEach((material) => material.dispose());
      }
    });

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}