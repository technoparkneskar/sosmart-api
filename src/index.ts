import { cast } from "@sapphire/utilities";
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { Server } from "./structures/Server";

const server = new Server();
export const version = cast<Record<string, string>>(JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"))).version;

server.start(Number(process.env.PORT)).catch(e => server.fastify.log.fatal(e, "FASTIFY_LISTEN_ERR:"));
