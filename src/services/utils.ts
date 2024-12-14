export const toRecord = <T, K extends Extract<keyof T, string | number>>(list: T[], key: K) => {
  const record: Record<string | number, T> = {};
  for (const item of list) {
    const keyValue = item[key] as string | number;
    record[keyValue] = item;
  }
  return record;
}

export const createId = () => crypto.randomUUID() as string;