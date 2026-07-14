import app from "./app";
import { prisma } from "./db/prisma";

const PORT = 3002;

const server = app.listen(PORT, () => {
  console.log(`Product service running on ${PORT}`);
});

async function shutdown(signal: string) {
  console.log({ signal }, "Shutting down product service");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));