import {EntityProxy} from './EntityProxy';

interface EntityEntry {
  entity: EntityProxy;
  children: Set<string>;
}

declare global {
  // eslint-disable-next-line no-var
  var __entityProxyContext: Map<string | symbol, EntityProxyContext> | undefined;
}

export class EntityProxyContext {
  static GlobalNS = Symbol.for('globalEntityProxyContext');

  static get(namespace?: string | symbol): EntityProxyContext {
    if (globalThis.__entityProxyContext === undefined) {
      globalThis.__entityProxyContext = new Map<string | symbol, EntityProxyContext>();
    }
    const ns = namespace ?? EntityProxyContext.GlobalNS;
    if (globalThis.__entityProxyContext.has(ns)) {
      return globalThis.__entityProxyContext.get(ns)!;
    } else {
      const ctx = new EntityProxyContext();
      globalThis.__entityProxyContext.set(ns, ctx);
      return ctx;
    }
  }

  #entities: Map<string, EntityEntry> = new Map();
  #rootEntities: Set<string> = new Set();

  addEntity(entity: EntityProxy) {
    if (this.hasEntity(entity)) {
      throw new Error(`Entity with uuid:${entity.uuid} already exists`);
    }
    this.#entities.set(entity.uuid, {
      entity,
      children: new Set<string>(),
    });
    if (entity.parent) {
      this.addToChildren(entity.parent, entity);
    } else {
      this.#rootEntities.add(entity.uuid);
    }
  }

  hasEntity(entity: EntityProxy) {
    return this.#entities.has(entity.uuid);
  }

  isRootEntity(entity: EntityProxy) {
    return this.#rootEntities.has(entity.uuid);
  }

  removeEntity(entity: EntityProxy) {
    if (this.hasEntity(entity)) {
      const entry = this.#entities.get(entity.uuid)!;

      for (const childUuid of entry.children) {
        this.#entities.get(childUuid)?.entity.removeFromParent();
      }

      this.#entities.delete(entity.uuid);
      this.#rootEntities.delete(entity.uuid);
    }
  }

  removeChildFromParent(childUuid: string, parent: EntityProxy) {
    if (this.hasEntity(parent)) {
      const entry = this.#entities.get(parent.uuid)!;
      entry.children.delete(childUuid);
    }
    this.#rootEntities.add(childUuid);
  }

  isChildOf(child: EntityProxy, parent: EntityProxy) {
    if (this.hasEntity(parent)) {
      const entry = this.#entities.get(parent.uuid)!;
      return entry.children.has(child.uuid);
    }
    return false;
  }

  addToChildren(parent: EntityProxy, child: EntityProxy) {
    const entry = this.#entities.get(parent.uuid);
    if (entry) {
      entry.children.add(child.uuid);
      this.#rootEntities.delete(child.uuid);
    } else {
      throw new Error(`Could not add child entity to parent! Parent entity with uuid:${parent.uuid} does not exist`);
    }
  }

  removeEntitySubTree(entityUuid: string) {
    const entry = this.#entities.get(entityUuid);
    if (entry) {
      for (const childUuid of Array.from(entry.children)) {
        this.removeEntitySubTree(childUuid);
      }
      this.removeEntity(entry.entity);
    }
  }

  clear() {
    for (const entity of Array.from(this.#rootEntities)) {
      this.removeEntitySubTree(entity);
    }

    if (this.#rootEntities.size !== 0) {
      throw new Error('entity-proxy-context clear panic: rootEntities is not empty!');
    }

    if (this.#entities.size !== 0) {
      throw new Error('entity-proxy-context clear panic: entities is not empty!');
    }
  }
}
