import {batch} from '@spearwolf/signalize';
import {effect, signal} from '@spearwolf/signalize/decorators';
import {
  TextureAtlas,
  TexturedSprites,
  TexturedSpritesGeometry,
  TexturedSpritesMaterial,
  type Stage2D,
  type TextureStore,
  type TexturedSpritePool,
} from '@spearwolf/twopoint5d';
import {StageRenderFrame, type StageRenderFrameProps} from '@spearwolf/twopoint5d/events.js';
import {Group, Vector3, type Scene} from 'three';

export class Starfield {
  readonly textureStore: TextureStore;
  readonly stage: Stage2D;
  readonly geometry: TexturedSpritesGeometry;

  @signal() accessor atlasName: string;
  @signal() accessor atlas: TextureAtlas;
  @signal() accessor material: TexturedSpritesMaterial;
  @signal() accessor sprites: TexturedSprites;

  get scene(): Scene {
    return this.stage.scene;
  }

  get pool(): TexturedSpritePool {
    return this.geometry.instancedPool;
  }

  origin = new Group();

  starBox = new Vector3(1, 1, 1);
  starSize = 0.01;
  starSpeed = 1;

  constructor(textureStore: TextureStore, stage: Stage2D, capacity: number, atlasName: string) {
    this.textureStore = textureStore;

    this.stage = stage;
    this.scene.add(this.origin);

    this.geometry = new TexturedSpritesGeometry(capacity);

    this.#loadAtlas();
    this.#appendSpritesToStage();
    this.#createSprites();

    this.atlasName = atlasName;

    this.stage.on(StageRenderFrame, ({deltaTime}: StageRenderFrameProps) => {
      if (this.sprites) {
        this.animateStars(deltaTime);
      }
    });
  }

  setStarBox(width: number, height: number, depth: number) {
    this.starBox.set(width, height, depth);
  }

  setStarBoxCenter(x: number, y: number, z: number) {
    this.origin.position.set(-x, -y, -z);
  }

  createStars(count: number) {
    const {pool} = this;

    if (pool.usedCount + count > pool.capacity) {
      count = pool.capacity - pool.usedCount;
    }

    if (count <= 0) return;

    for (let i = 0; i < count; i++) {
      const frame = this.atlas.randomFrame();
      const starHeight = (frame.coords.height / frame.coords.width) * (this.starSize / frame.coords.width) * frame.coords.height;

      const vo = pool.createVO();

      vo.setFrame(frame);
      vo.setSize(this.starSize, starHeight);
      vo.setPosition(this.starBox.x * Math.random(), this.starBox.y * Math.random(), this.starBox.z * Math.random());
    }
  }

  animateStars(deltaTime: number, speed = this.starSpeed) {
    for (let i = 0; i < this.pool.usedCount; i++) {
      const vo = this.pool.getVO(i);

      vo.z += deltaTime * speed;

      if (vo.z < 0) {
        vo.z += this.starBox.z;
      } else if (vo.z > this.starBox.z) {
        vo.z -= this.starBox.z;
      }
    }

    this.geometry.touchAttributes('position');
  }

  @effect({deps: ['atlasName']}) #loadAtlas() {
    return this.textureStore.get(this.atlasName, ['atlas', 'texture'], ([atlas, texture]) => {
      batch(() => {
        this.atlas = atlas;
        if (this.material != null || this.material?.colorMap != texture) {
          this.material?.dispose();
          this.material = new TexturedSpritesMaterial({colorMap: texture, depthTest: false, depthWrite: false});
        }
        if (this.sprites == null) {
          this.sprites = new TexturedSprites(this.geometry, this.material);
        }
        this.sprites.material = this.material;
      });
    });
  }

  @effect({deps: ['sprites']}) #appendSpritesToStage() {
    const {origin, sprites} = this;
    if (sprites) {
      origin.add(sprites);
      return () => {
        origin.remove(sprites);
      };
    }
  }

  @effect({deps: ['sprites', 'atlas']}) #createSprites() {
    if (this.atlas && this.sprites) {
      this.createStars(this.pool.availableCount);
    }
  }
}
