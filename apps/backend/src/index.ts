import app, { config, logger } from "./app";

const isVercelRuntime = process.env.VERCEL === "1";

if (!isVercelRuntime) {
  app.listen(config.port, () => {
    logger.info({ port: config.port, corsOrigins: config.corsOrigins }, "API server ready");
  });
}

export default app;
