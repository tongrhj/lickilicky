export const getNestedObject = (
  nestedObj: any,
  pathArr: Array<string | number>
): any => {
  return pathArr.reduce(
    (obj: any, key: string): any =>
      obj && obj[key] !== "undefined" ? obj[key] : undefined,
    nestedObj
  );
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const contains = (item: any, array: Array<any>) => {
  return array.indexOf(item) > -1;
};

export const daysBetween = (then: number, now: number = Date.now()): number => {
  const ONE_DAY = 1000 * 60 * 60 * 24; // 86,400,000
  return Math.round((now - then) / ONE_DAY);
};
