import Phaser from 'phaser';
import { START_POS } from './questConfig';
import { CHECKPOINTS } from './questConfig';

// ── Tileset images referenced by map.json ─────────────────────────────────────
const TILESET_ASSETS = [
  { key: 'terrain', file: 'terrain.png' },
  { key: 'Video', file: 'Video.png' },
  { key: 'plant repack', file: 'plant repack.png' },
  { key: 'plants', file: 'plants.png' },
  { key: 'rocks', file: 'rocks.png' },
  { key: 'terrain_atlas', file: 'terrain_atlas.png' },
  { key: 'base_out_atlas', file: 'base_out_atlas.png' },
  { key: 'farming_fishing', file: 'farming_fishing.png' },
  { key: 'fence', file: 'fence.png' },
  { key: 'plants_2', file: 'plants.png' },
  { key: 'PathAndObjects', file: 'PathAndObjects.png' },
  { key: 'town', file: 'town.png' },
  { key: 'tileset_preview', file: 'tileset_preview.png' },
  { key: 'trees_plants', file: 'trees_plants_rocks.png' },
  { key: 'transparent-bg-tiles', file: 'transparent-bg-tiles.png' },
  { key: 'forrestup', file: 'forrestup.png' },
  { key: 'chicken_walk', file: 'chicken_walk.png' },
  { key: 'cow_walk', file: 'cow_walk.png' },
  { key: 'sheep_eat', file: 'sheep_eat.png' },
  { key: 'llama_walk', file: 'llama_walk.png' },
  { key: 'decorations-medieval', file: 'decorations-medieval.png' },
  { key: 'foodfromcts1a', file: 'foodfromcts1a.png' },
  { key: 'fence_alt', file: 'fence_alt.png' },
  { key: 'fence_medieval', file: 'fence_medieval.png' },
  { key: 'fruit-trees', file: 'fruit-trees.png' },
  { key: 'thatched-roof', file: 'thatched-roof.png' },
  { key: 'cottage', file: 'cottage.png' },
  { key: 'window_w_shutters', file: 'window_w_shutters.png' },
  { key: 'castledoors', file: 'castledoors.png' },
  { key: 'monkeywin', file: 'monkeywin.png' },
  { key: 'frm', file: 'frm.png' },
  { key: 'fossils3-Photoroom', file: 'fossils3-Photoroom.png' },
  { key: 'horse-brown', file: 'horse-brown.png' },
  { key: 'horse-white', file: 'horse-white.png' },
  { key: 'horse-black', file: 'horse-black.png' },
  { key: 'bunnysheet5', file: 'bunnysheet5.png' },
  { key: '16oga (1)', file: '16oga (1).png' },
  { key: 'Checkpoint1', file: 'Checkpoint1.png' },
  { key: 'Checkpoint2', file: 'Checkpoint2.png' },
  { key: 'Checkpoint3', file: 'Checkpoint3.png' },
  { key: 'start-sign-means-don-t-wait-and-action-Photoroom', file: 'start-sign-means-don-t-wait-and-action-Photoroom.png' },
  { key: 'Checkpoint1_2', file: 'Checkpoint1.png' },
  { key: 'forest_tiles', file: 'forest_tiles.png' },
  { key: 'Try', file: 'Try.png' },
  { key: 'A', file: 'A.png' },
  { key: 'B', file: 'B.png' },
  { key: 'Arrows', file: 'Arrows.png' },
];

const PLAYER_SPEED = 2;

const TILE_LAYER_NAMES = [
  'map',
  'checkpointroad',
  'colourfloor',
  'fenceback',
  'fencemid',
  'cansitstarmushroomcaterpillarrockgrass',
  'layer1',
  'layer2',
  'fencefrontlayer3',
  'fishlowopacity',
  'smalltree',
  'bigtree',
];

export default class PhaserGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuestMapScene' });
  }

  init(data) {
    if (data?.onNearCheckpoint) this.onNearCheckpoint = data.onNearCheckpoint;
    if (data?.onCheckpointReached) this.onCheckpointReached = data.onCheckpointReached;
    if (data?.onLoadProgress) this.onLoadProgress = data.onLoadProgress;
    if (data?.onLoadComplete) this.onLoadComplete = data.onLoadComplete;
    if (data?.onLoadError) this.onLoadError = data.onLoadError;
    if (data?.getProgress) this.getProgress = data.getProgress;
    if (data?.getIsCheckpointUnlocked) this.getIsCheckpointUnlocked = data.getIsCheckpointUnlocked;
    if (data?.playerNickname) this.playerNickname = data.playerNickname;
    if (data?.initialPos) this.initialPos = data.initialPos;

    this.onNearCheckpoint = this.onNearCheckpoint || (() => { });
    this.onCheckpointReached = this.onCheckpointReached || (() => { });
    this.onLoadProgress = this.onLoadProgress || (() => { });
    this.onLoadComplete = this.onLoadComplete || (() => { });
    this.onLoadError = this.onLoadError || (() => { });
    this.getProgress = this.getProgress || (() => []);
    this.getIsCheckpointUnlocked = this.getIsCheckpointUnlocked || (() => true);
    this.playerNickname = this.playerNickname || 'Player';
    this.initialPos = this.initialPos || null;
  }

  preload() {
    this.load.on('progress', (value) => this.onLoadProgress(value));
    this.load.on('loaderror', (file) => {
      const src = file?.src || file?.url || file?.key || 'unknown asset';
      console.error('QuestMapScene: failed to load asset', src);
      this.onLoadError(`Could not load quest map asset: ${src}`);
    });

    this.load.tilemapTiledJSON('mainmap', '/assets/map.json');
    TILESET_ASSETS.forEach(({ key, file }) => {
      this.load.image(key, `/assets/${file}`);
    });
    this.load.spritesheet('playerSprite', '/assets/PokemonLike.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    const map = this.make.tilemap({ key: 'mainmap' });

    const startX = Number.isFinite(this.initialPos?.x) ? this.initialPos.x : START_POS.x;
    const startY = Number.isFinite(this.initialPos?.y) ? this.initialPos.y : START_POS.y;

    // Reduce physics iterations to ease CPU load
    this.matter.world.engine.positionIterations = 4;
    this.matter.world.engine.velocityIterations = 3;

    // Add tilesets
    const tilesetNames = map.tilesets.map(ts => ts.name);
    const tilesets = [];
    const usedNames = {};
    for (let i = 0; i < tilesetNames.length; i++) {
      const jsonName = tilesetNames[i];
      let phaserKey;
      if (usedNames[jsonName]) {
        phaserKey = jsonName + '_2';
        usedNames[jsonName]++;
      } else {
        phaserKey = jsonName;
        usedNames[jsonName] = 1;
      }
      const ts = map.addTilesetImage(jsonName, phaserKey);
      if (ts) tilesets.push(ts);
    }

    // Create tile layers
    this.tileLayers = [];
    TILE_LAYER_NAMES.forEach(name => {
      const layer = map.createLayer(name, tilesets);
      if (layer) {
        layer.setDepth(0);
        this.tileLayers.push(layer);
      }
    });

    const mapWidthPx = map.widthInPixels;
    const mapHeightPx = map.heightInPixels;

    const createBody = (obj, isSensor = false, label = 'wall') => {
      const options = { isStatic: true, isSensor, label };

      if (!obj.polygon && !obj.polyline && !obj.ellipse) {
        const cx = obj.x + obj.width / 2;
        const cy = obj.y + obj.height / 2;
        const body = this.matter.add.rectangle(cx, cy, obj.width, obj.height, {
          ...options,
          angle: Phaser.Math.DegToRad(obj.rotation || 0),
        });
        body.label = label;
        return body;
      }

      if (obj.ellipse) {
        const cx = obj.x + obj.width / 2;
        const cy = obj.y + obj.height / 2;
        const body = this.matter.add.circle(cx, cy, obj.width / 2, options);
        if (obj.width !== obj.height) {
          this.matter.body.scale(body, 1, obj.height / obj.width);
        }
        body.label = label;
        return body;
      }

      if (obj.polygon) {
        const worldVerts = obj.polygon.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }));
        const center = Phaser.Physics.Matter.Matter.Vertices.centre(worldVerts);
        const localVerts = worldVerts.map(v => ({ x: v.x - center.x, y: v.y - center.y }));
        const body = this.matter.add.fromVertices(center.x, center.y, localVerts, options, true);
        body.label = label;
        return body;
      }

      if (obj.polyline) {
        const thickness = 6;
        obj.polyline.forEach((p, i) => {
          if (i === obj.polyline.length - 1) return;
          const p1 = obj.polyline[i];
          const p2 = obj.polyline[i + 1];
          const x1 = obj.x + p1.x; const y1 = obj.y + p1.y;
          const x2 = obj.x + p2.x; const y2 = obj.y + p2.y;
          const length = Phaser.Math.Distance.Between(x1, y1, x2, y2);
          const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2);
          this.matter.add.rectangle((x1 + x2) / 2, (y1 + y2) / 2, length, thickness, { ...options, angle });
        });
        return null;
      }
    };

    // ── Player graphic ────────────────────────────────────────────────
    this.playerGraphic = this.add.container(startX, startY);

    this.bodyPart = this.add.rectangle(0, 3, 18, 20, 0x2563eb);
    this.bodyPart.setOrigin(0.5, 0.5);

    this.headPart = this.add.circle(0, -12, 10, 0xFBBF24);
    this.headPart.setStrokeStyle(1.5, 0xD97706);

    this.eyeL = this.add.circle(-3, -13, 1.5, 0x1e3a5f);
    this.eyeR = this.add.circle(3, -13, 1.5, 0x1e3a5f);

    this.legL = this.add.rectangle(-4, 19, 6, 9, 0x1e3a5f);
    this.legR = this.add.rectangle(4, 19, 6, 9, 0x1e3a5f);

    const playerLabel = this.playerNickname.length > 24
      ? `${this.playerNickname.slice(0, 23)}...`
      : this.playerNickname;
    const nameText = this.add.text(0, -30, playerLabel, {
      fontSize: '10px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#ffffff', align: 'center', stroke: '#1e3a5f', strokeThickness: 3,
    });
    nameText.setOrigin(0.5, 1);

    this.playerGraphic.add([nameText, this.bodyPart, this.headPart, this.eyeL, this.eyeR, this.legL, this.legR]);
    this.playerGraphic.setDepth(1000);

    this.playerBody = this.matter.add.rectangle(startX, startY + 22, 16, 10, {
      friction: 0,
      frictionAir: 0.2,
      inertia: Infinity,
      label: 'player'
    });

    // ── Tree collision — use Map(id → body) instead of Set(id)
    // so updatePlayerOpacity never needs to scan all world bodies.
    this.treeBodyMap = new Map(); // id → MatterBody reference

    this.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        const isTree =
          (bodyA.label === 'player' && bodyB.label === 'tree') ||
          (bodyB.label === 'player' && bodyA.label === 'tree');
        if (isTree) {
          const treeBody = bodyA.label === 'tree' ? bodyA : bodyB;
          this.treeBodyMap.set(treeBody.id, treeBody);
        }
      });
      this._opacityDirty = true;
    });

    this.matter.world.on('collisionend', (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        const isTree =
          (bodyA.label === 'player' && bodyB.label === 'tree') ||
          (bodyB.label === 'player' && bodyA.label === 'tree');
        if (isTree) {
          const treeBody = bodyA.label === 'tree' ? bodyA : bodyB;
          this.treeBodyMap.delete(treeBody.id);
        }
      });
      this._opacityDirty = true;
    });

    const addLayerBodies = (layerName, isSensor = false, label = 'wall') => {
      const layer = map.getObjectLayer(layerName);
      if (!layer) return;
      layer.objects.forEach(obj => createBody(obj, isSensor, label));
    };

    addLayerBodies('collisionbelowplayer', false, 'wall');
    addLayerBodies('collisionupperplayer', true, 'tree');

    // ── Checkpoint markers ────────────────────────────────────────────
    this.checkpointGraphics = [];
    CHECKPOINTS.forEach(cp => {
      const container = this.add.container(cp.x, cp.y);
      container.setDepth(90);

      const glow = this.add.circle(0, 0, cp.radius, cp.color, 0.2);
      glow.setVisible(false);
      const circle = this.add.circle(0, 0, 22, cp.color);
      circle.setStrokeStyle(3, 0xffffff);
      const idText = this.add.text(0, 0, String(cp.id), {
        fontSize: '16px', fontFamily: 'sans-serif', fontStyle: 'bold',
        color: '#ffffff', align: 'center',
      });
      idText.setOrigin(0.5, 0.5);
      const labelText = this.add.text(32, -8, cp.label, {
        fontSize: '11px', fontFamily: 'sans-serif', fontStyle: 'bold', color: '#FFD700',
      });
      const hintText = this.add.text(0, 42, 'Press E to enter', {
        fontSize: '10px', fontFamily: 'sans-serif', fontStyle: 'bold',
        color: '#ffffff', align: 'center',
      });
      hintText.setOrigin(0.5, 0.5);
      hintText.setVisible(false);
      const lockText = this.add.text(26, 6, '🔒', { fontSize: '12px' });
      lockText.setVisible(false);

      container.add([glow, circle, idText, labelText, hintText, lockText]);
      this.checkpointGraphics.push({ cpDef: cp, container, glow, circle, idText, labelText, hintText, lockText });
    });

    // ── Camera ───────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);
    this.cameras.main.startFollow(this.playerGraphic);
    this.cameras.main.centerOn(startX, startY);
    this.cameras.main.setZoom(2);
    this.cameras.main.roundPixels = true;

    // ── Input ────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.input.keyboard.disableGlobalCapture();

    // ── State ────────────────────────────────────────────────────────
    this.nearCheckpointId = null;
    this.walkFrame = 0;
    this.isPaused = false;
    this.virtualInput = { up: false, down: false, left: false, right: false };
    this.virtualEnterQueued = false;
    this.mapWidthPx = mapWidthPx;
    this.mapHeightPx = mapHeightPx;

    // Progress cache — avoids creating new arrays every frame
    this._lastProgressRef = null;
    this._cachedCompletedCPs = [];
    // Opacity dirty flag — only recalculate when collision state changes
    this._opacityDirty = true;

    this.onLoadComplete();
  }

  update() {
    if (this.isPaused) return;
    if (!this.playerBody) return;

    const pos = this.playerBody.position;
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
      this.matter.body.setPosition(this.playerBody, { x: START_POS.x, y: START_POS.y });
      return;
    }

    // ── INPUT ──
    let vx = 0;
    let vy = 0;

    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.a.isDown) vx = -PLAYER_SPEED;
      if (this.cursors.right.isDown || this.wasd.d.isDown) vx = PLAYER_SPEED;
      if (this.cursors.up.isDown || this.wasd.w.isDown) vy = -PLAYER_SPEED;
      if (this.cursors.down.isDown || this.wasd.s.isDown) vy = PLAYER_SPEED;
    }

    if (this.virtualInput) {
      if (this.virtualInput.left) vx = -PLAYER_SPEED;
      if (this.virtualInput.right) vx = PLAYER_SPEED;
      if (this.virtualInput.up) vy = -PLAYER_SPEED;
      if (this.virtualInput.down) vy = PLAYER_SPEED;
    }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    const SPEED = 2.5;
    this.matter.body.setVelocity(this.playerBody, { x: vx * SPEED, y: vy * SPEED });
    this.playerGraphic.setPosition(this.playerBody.position.x, this.playerBody.position.y - 22);
    this.playerGraphic.setDepth(this.playerBody.position.y);

    // ── ANIMATION ──
    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      this.walkFrame += 0.15;
      const legOffset = Math.sin(this.walkFrame) * 3;
      this.legL.y = 19 + legOffset;
      this.legR.y = 19 - legOffset;
    } else {
      this.legL.y = 19;
      this.legR.y = 19;
    }

    // ── TREE OPACITY — only recompute when collision state or position changed ──
    if (this._opacityDirty || isMoving) {
      this.updatePlayerOpacity();
      this._opacityDirty = false;
    }

    // ── PROGRESS (cached — avoids re-allocating arrays every frame) ──
    const progressRaw = this.getProgress?.();
    if (progressRaw !== this._lastProgressRef) {
      this._lastProgressRef = progressRaw;
      this._cachedCompletedCPs = Array.isArray(progressRaw)
        ? progressRaw.filter(p => p?.completed).map(p => p.checkpoint_number)
        : [];
    }
    const completedCPs = this._cachedCompletedCPs;

    // ── CHECKPOINT PROXIMITY ──
    let near = null;
    CHECKPOINTS.forEach(cp => {
      const dist = Phaser.Math.Distance.Between(
        this.playerBody.position.x, this.playerBody.position.y, cp.x, cp.y
      );
      if (dist < cp.radius + 20) near = cp.id;
    });

    // ── CHECKPOINT GRAPHICS (update only when state changes) ──
    const nearChanged = near !== this.nearCheckpointId;
    const progressChanged = progressRaw !== this._lastRenderedProgressRef;
    if (nearChanged || progressChanged) {
      this._lastRenderedProgressRef = progressRaw;
      this.checkpointGraphics.forEach(({ cpDef, glow, circle, idText, hintText, lockText }) => {
        const isCompleted = completedCPs.includes(cpDef.id);
        const isUnlocked = this.getIsCheckpointUnlocked ? this.getIsCheckpointUnlocked(cpDef.id) : true;
        const isNear = near === cpDef.id;

        if (isCompleted) {
          circle.setFillStyle(0x16a34a);
          idText.setText('✓');
        } else if (isUnlocked) {
          circle.setFillStyle(cpDef.color);
          idText.setText(String(cpDef.id));
        } else {
          circle.setFillStyle(0x94a3b8);
          idText.setText(String(cpDef.id));
        }

        glow.setVisible(isNear && isUnlocked && !isCompleted);
        hintText.setVisible(isNear && isUnlocked && !isCompleted);
        lockText.setVisible(!isUnlocked && !isCompleted);
      });
    }

    if (nearChanged) {
      this.nearCheckpointId = near;
      this.onNearCheckpoint(near);
    }

    // ── ENTER CHECKPOINT ──
    const shouldEnter = (Phaser.Input.Keyboard.JustDown(this.keyE) || this.virtualEnterQueued) && near;
    this.virtualEnterQueued = false;

    if (shouldEnter) {
      const isUnlocked = this.getIsCheckpointUnlocked ? this.getIsCheckpointUnlocked(near) : true;
      const isCompleted = completedCPs.includes(near);
      if (isUnlocked && !isCompleted) {
        this.onCheckpointReached(near);
      }
    }

    // ── WORLD BOUNDS ──
    const x = Phaser.Math.Clamp(this.playerBody.position.x, 0, this.mapWidthPx);
    const y = Phaser.Math.Clamp(this.playerBody.position.y, 0, this.mapHeightPx);
    if (x !== this.playerBody.position.x || y !== this.playerBody.position.y) {
      this.matter.body.setPosition(this.playerBody, { x, y });
    }
  }

  // Optimized: iterates only active tree bodies (treeBodyMap), not ALL world bodies.
  // Old version iterated this.matter.world.localWorld.bodies (hundreds of objects).
  updatePlayerOpacity() {
    const parts = [this.headPart, this.eyeL, this.eyeR, this.bodyPart, this.legL, this.legR];
    parts.forEach(part => part?.setAlpha(1));

    if (!this.treeBodyMap || this.treeBodyMap.size === 0) return;

    parts.forEach(part => {
      if (!part) return;
      const partBounds = part.getBounds();

      for (const body of this.treeBodyMap.values()) {
        const isOverlapping =
          partBounds.right > body.bounds.min.x &&
          partBounds.left < body.bounds.max.x &&
          partBounds.bottom > body.bounds.min.y &&
          partBounds.top < body.bounds.max.y;

        if (isOverlapping) {
          part.setAlpha(0.45);
          break; // no need to check other trees for this part
        }
      }
    });
  }

  pauseGame() { this.isPaused = true; }
  resumeGame() { this.isPaused = false; }

  setVirtualInput(input = {}) {
    this.virtualInput = {
      up: !!input.up,
      down: !!input.down,
      left: !!input.left,
      right: !!input.right,
    };
  }

  triggerVirtualEnter() {
    this.virtualEnterQueued = true;
  }

  getPlayerPosition() {
    return {
      x: this.playerGraphic?.x ?? START_POS.x,
      y: this.playerGraphic?.y ?? START_POS.y,
    };
  }

  setPlayerPosition(x, y) {
    if (this.playerBody) {
      this.matter.body.setPosition(this.playerBody, { x, y: y + 22 });
      this.playerGraphic.setPosition(x, y);
    }
  }
}
