export const _arr_delete = (arr: any[], item: any) => {
  const i = arr.indexOf(item);

  if (i === -1) return -1;

  arr.splice(i, 1);

  return i;
};

export const _arr_push = <T = any>(arr: T[], item: T) => {
  if (arr.includes(item)) return false;

  arr.push(item);
  return true;
};
