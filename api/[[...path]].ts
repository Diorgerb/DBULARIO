import { createApp } from "../server/_core/app";

const app = createApp();

export default function handler(req: unknown, res: unknown) {
  return app(req, res);
}
