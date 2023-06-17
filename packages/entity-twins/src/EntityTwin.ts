import {EntityTwinContext} from './EntityTwinContext';
import {generateUUID} from './generateUUID';

export class EntityTwin {
  #uuid: string;
  #token: string;
  #namespace?: string | symbol;
  #order = 0;

  #context: EntityTwinContext;
  #parent?: EntityTwin;

  get uuid() {
    return this.#uuid;
  }

  get token() {
    return this.#token;
  }

  get parent(): EntityTwin | undefined {
    return this.#parent;
  }

  set parent(parent: EntityTwin | null | undefined) {
    if (parent) {
      parent.addChild(this);
    } else {
      this.removeFromParent();
    }
  }

  /**
   * The order property sets the order to lay out an entity in a children array of the parent entity container.
   * Items in a children array are sorted by ascending order value and then by their insertion order.
   */
  get order(): number {
    return this.#order;
  }

  set order(order: number | null | undefined) {
    const prevOrder = this.#order;
    this.#order = order ?? 0;
    if (prevOrder !== this.#order) {
      this.#context.changeOrder(this);
    }
  }

  constructor(token: string, parent?: EntityTwin, order = 0, namespace?: string | symbol) {
    this.#uuid = generateUUID();

    this.#token = token;
    this.#parent = parent;
    this.#order = order;
    this.#namespace = namespace;

    this.#context = EntityTwinContext.get(this.#namespace);
    this.#context.addEntity(this);
  }

  isChildOf(entity: EntityTwin) {
    return this.#parent === entity;
  }

  removeFromParent() {
    if (this.#parent) {
      this.#context.removeChildFromParent(this.uuid, this.#parent);
      this.#parent = undefined;
    }
  }

  addChild(child: EntityTwin) {
    if (!child.isChildOf(this)) {
      child.removeFromParent();
      child.#parent = this;
      this.#context.addToChildren(this, child);
    }
  }

  setProperty<T = unknown>(name: string, value: T, isEqual?: (a: T, b: T) => boolean) {
    this.#context.setProperty(this, name, value, isEqual);
  }

  removeProperty(name: string) {
    this.#context.removeProperty(this, name);
  }

  destroy() {
    this.removeFromParent();
    this.#context.removeEntity(this);
  }
}
