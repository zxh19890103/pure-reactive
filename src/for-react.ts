import { useEffect, useId } from "react";
import {
  ReactiveSystem,
  ReactiveSystemTarget,
  ReactiveSystemWatcher,
  fireReactiveTarget,
} from "./ReactiveSystem.class";
import { useTick } from "./tick";

const onTargetChange = (
  target: ReactiveSystemTarget,
  watcher: ReactiveSystemWatcher,
  key?: any
) => {
  ReactiveSystem.current.watch(target, watcher, key);

  return () => {
    ReactiveSystem.current.unWatch(target, watcher, key);
  };
};

/**
 * ????? What's the different?
 */
type UseReactiveUpdateFn<O extends ReactiveSystemTarget> = <K = keyof O>(
  o: Partial<O> | K,
  value?: any
) => void;

export const useReactive = <O extends ReactiveSystemTarget>(
  target: O,
  ...keys: Array<keyof O>
): UseReactiveUpdateFn<O> => {
  const id = useId();
  const tick = useTick();

  useEffect(() => {
    const watcher: ReactiveSystemWatcher = {
      tick: true,
      vuid: id,
      fn: tick,
    };

    const key = keys.join(" ");

    return onTargetChange(target, watcher, key);
  }, []);

  return (o, value?: any) => {
    fireReactiveTarget(target, o, value);
  };
};

export const useReactiveTarget = <O extends ReactiveSystemTarget>(
  target: O
) => {
  return (o, value?: any) => {
    fireReactiveTarget(target, o, value);
  };
};
