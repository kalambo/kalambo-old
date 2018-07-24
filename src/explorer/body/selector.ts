const doSelector = (selector, props) => {
  if (selector === undefined) return undefined;
  if (selector === null) return props;
  if (typeof selector === 'string') {
    return selector.split('.').reduce((res, k) => res && res[k], props);
  }
  return selector(props);
};
const runSelectors = (selectors, props) => {
  const args: any[] = [];
  const length = selectors.length;
  for (let i = 0; i < length; i++) {
    args.push(doSelector(selectors[i], props));
  }
  return args;
};

const argsEqual = (prev, next) => {
  const length = prev.length;
  for (let i = 0; i < length; i++) {
    if (prev[i] !== next[i]) return false;
  }
  return true;
};
export default (selectors, map, onCreate?, onDispose?, ...extra) => {
  let lastArgs;
  let current;
  return (props?) => {
    if (props) {
      const args = runSelectors(selectors, props);
      if (!lastArgs || !argsEqual(lastArgs, args)) {
        if (lastArgs && onDispose) onDispose(current);
        current = map.apply(null, args.concat(extra));
        if (onCreate) current = onCreate(current) || current;
      }
      lastArgs = args;
      return current;
    }
    if (onDispose) onDispose(current);
  };
};
