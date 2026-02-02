import pino from "pino";
import { env } from "../config/env";

const options: pino.LoggerOptions = {
  level: env.NODE_ENV === "development" ? "debug" : "info",
  base: {
    service: "api",
  },
};

if (env.NODE_ENV === "development") {
  options.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  };
}

export const logger = pino(options);
