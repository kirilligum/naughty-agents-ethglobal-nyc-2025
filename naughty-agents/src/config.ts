import { type Config } from "@coinbase/cdp-hooks";
import { type AppConfig } from "@coinbase/cdp-react";

const fallbackProjectId = (import.meta.env.VITE_CDP_PROJECT_ID as string | undefined) || "example-id";
if (!import.meta.env.VITE_CDP_PROJECT_ID) {
  // eslint-disable-next-line no-console
  console.warn("VITE_CDP_PROJECT_ID is not set. Using placeholder 'example-id'. Some features may not work.");
}

export const CDP_CONFIG: Config = { projectId: fallbackProjectId };

export const APP_CONFIG: AppConfig = {
  name: "CDP React StarterKit",
  logoUrl: "http://localhost:3000/logo.svg",
  authMethods: ["email", "sms"],
};
