export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const daysBetween = (then: number, now: number = Date.now()): number => {
  const ONE_DAY = 1000 * 60 * 60 * 24; // 86,400,000
  return Math.round((now - then) / ONE_DAY);
};
