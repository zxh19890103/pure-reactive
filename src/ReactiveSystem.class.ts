import { _arr_delete, _arr_push } from "./utils";

export type ReactiveSystemWatcher = {
  /**
   * React component id.
   */
  vuid: string;
  /**
   * If it's just a re-tick, we use vuid to make sure
   * component will only be re-rendered during every cycle
   */
  tick: boolean;
  /**
   * The listener
   */
  fn: (payload: any, system: ReactiveSystem) => void;
};

export type ReactiveSystemTargetKey = string;
export type ReactiveSystemTarget = { id: string; [k: string]: any };

type ReactiveSystemQueueItem = {
  watcher: ReactiveSystemWatcher;
  payload: any;
  target: object;
  key: ReactiveSystemTargetKey;
};

export class ReactiveSystem extends WeakMap<
  ReactiveSystemTarget,
  ReactiveSystemWatcher[]
> {
  private getGroupByKey(key: ReactiveSystemTargetKey) {
    let _key = key;

    if (typeof _key === "string") {
      _key = _key.replace(/[,\s]+/g, "_");
    }

    return `$$group@by_${_key}`;
  }

  private getOrWrite(
    target: ReactiveSystemTarget,
    key?: ReactiveSystemTargetKey
  ) {
    let arr: ReactiveSystemWatcher[] = null;

    if (this.has(target)) {
      arr = this.get(target);
    } else {
      arr = [];
      this.set(target, arr);
    }

    if (key) {
      const gbk = this.getGroupByKey(key);

      return (arr[gbk] ? arr[gbk] : (arr[gbk] = [])) as ReactiveSystemWatcher[];
    } else {
      return arr;
    }
  }

  private getOnly(target: ReactiveSystemTarget, key?: ReactiveSystemTargetKey) {
    if (!key) {
      return this.get(target) ?? [];
    }

    if (!this.has(target)) {
      return [];
    }

    const arr = this.get(target);

    const items = [...arr];

    for (const i of Object.keys(arr)) {
      if (i.startsWith("$$") && i.includes("_" + key)) {
        items.push(...arr[i]);
      }
    }

    return items;
  }

  watch(
    target: ReactiveSystemTarget,
    watcher: ReactiveSystemWatcher,
    key?: ReactiveSystemTargetKey
  ) {
    const a = this.getOrWrite(target);
    const g = this.getOrWrite(target, key);

    _arr_push(a, watcher);

    if (a === g) return;
    _arr_push(g, watcher);
  }

  unWatch(
    target: ReactiveSystemTarget,
    watcher: ReactiveSystemWatcher,
    key?: ReactiveSystemTargetKey
  ) {
    const a = this.getOrWrite(target);
    const g = this.getOrWrite(target, key);

    _arr_delete(a, watcher);

    if (a === g) return;
    _arr_delete(g, watcher);
  }

  private firedQueque: ReactiveSystemQueueItem[] = [];
  private state: "idle" | "ready" | "running" = "idle";
  private tickedVuids = new Set();

  /**
   * This is sync, thus it'll never push item while in loop.
   */
  private loop = () => {
    this.state = "running";

    const firedObj = this.firedQueque.shift();

    if (!firedObj) {
      this.state = "idle";
      __just_fired__.clear();
      this.tickedVuids.clear();
      return;
    }

    const { watcher, payload } = firedObj;

    const { fn, vuid } = watcher;

    if (!watcher.tick || !this.tickedVuids.has(vuid)) {
      fn(payload, this);
    }

    if (watcher.tick) {
      this.tickedVuids.add(vuid);
    }

    this.loop();
  };

  fire(target: ReactiveSystemTarget, payload = null, key?: any) {
    const watchers = this.getOnly(target, key);

    this.firedQueque.push(
      ...watchers.map((watcher) => {
        return { watcher, target, payload, key };
      })
    );

    if (this.state === "idle") {
      queueMicrotask(this.loop);
      this.state = "ready";
    }
  }

  static get current() {
    if (!__current__) {
      __current__ = new ReactiveSystem();
    }
    return __current__;
  }
}

const __just_fired__ = new Map();
let __current__: ReactiveSystem = null;

/**
 * unique Key: target-key
 */
export const fireReactiveTarget = <O extends ReactiveSystemTarget, K = keyof O>(
  target: O,
  update: K | Partial<O>,
  value?: any
) => {
  if (update === null || update === undefined) return;

  if (typeof update === "object") {
    for (const k in update) fireOne(target, k, update[k]);
  } else if (value !== undefined) {
    fireOne(target, update, value);
  }
};

const fireOne = (target, key, value) => {
  if (value === target[key]) return;

  target[key] = value;

  const fired = __just_fired__.get(target);

  if (fired) {
    if (Object.hasOwn(fired, key)) {
      fired[key] = value;
      return;
    } else {
      fired[key] = value;
    }
  }

  __current__.fire(target, { key, value }, key);

  if (fired) return;

  // init
  __just_fired__.set(target, { [key]: value });
};
