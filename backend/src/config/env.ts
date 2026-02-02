import { cleanEnv, str, port, url } from "envalid";
import dotenv from "dotenv";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "development",
  }),
  PORT: port({ default: 3000 }),
  MONGO_URI: str({ desc: "MongoDB Connection String" }),
  CLERK_SECRET_KEY: str({ desc: "Clerk Secret Key" }),
  CLERK_WEBHOOK_SIGNING_SECRET: str({ desc: "Clerk Webhook Signing Secret" }),
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_PASSWORD: str({ desc: "Redis Password", default: "" }), // Optional for local dev
  OPENAI_API_KEY: str({ desc: "OpenAI API Key", default: "" }), // Optional for API, required for Worker
  MAPBOX_ACCESS_TOKEN: str({ desc: "Mapbox Access Token", default: "" }), // Week 3
  GOOGLE_PLACES_API_KEY: str({ desc: "Google Places API Key", default: "" }), // Week 3
});
