import express from "express";
import { registerRoutes } from "../server/routes";
import { setupAuth } from "../server/auth";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let isReady = false;

// Setup Vercel serverless function
export default async function handler(req: any, res: any) {
  if (!isReady) {
    setupAuth(app);
    await registerRoutes(httpServer, app);
    isReady = true;
  }
  
  return app(req, res);
}
