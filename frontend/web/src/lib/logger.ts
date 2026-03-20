import pino from "pino";

const isDev = import.meta.env.DEV;

export function createBrowserLogger(name: string) {
  return pino({
    name,
    level: isDev ? "debug" : "info",
    browser: {
      asObject: true,
    },
  });
}
