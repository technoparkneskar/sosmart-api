import fastifyMultipart from "@fastify/multipart";
import fastifyFormBody from "@fastify/formbody";
import fastifySecureSession from "@fastify/secure-session";
import { container, Store } from "@sapphire/pieces";
import { cast } from "@sapphire/utilities";
import fastify from "fastify";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { isDev } from "../config";
import { PreconditionStore } from "../stores/PreconditionStore";
import { RouteStore } from "../stores/RouteStore";
import { Util } from "../utils/Util";
import { PrismaClient, users } from "@prisma/client";
import { genSaltSync, hashSync } from "bcrypt";
import { readFileSync } from "fs";
import { SoSmartSnowflake } from "../utils/Snowflake";
import fastifyCors from "@fastify/cors";
import firebaseAdmin from "firebase-admin";
import { Database } from "firebase-admin/lib/database/database";
import fastifySocketIo from "fastify-socket.io";

const currentDir = dirname(fileURLToPath(import.meta.url));

export class Server {
    public readonly salt = genSaltSync(10);
    public readonly stores = container.stores;
    public readonly util = new Util(this);
    public readonly prisma = new PrismaClient();
    public firebase!: Database;
    public fastify = fastify({
        logger: {
            name: "API",
            timestamp: true,
            level: isDev ? "debug" : "info",
            formatters: {
                bindings: () => ({
                    pid: "API"
                })
            },
            transport: {
                targets: [
                    { target: "pino/file", level: "info", options: { destination: join(process.cwd(), "logs", `api-${Util.getCurrentDate()}.log`) } },
                    { target: "pino-pretty", level: isDev ? "debug" : "info", options: { translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l o" } }
                ]
            }
        }
    });

    public constructor() {
        container.server = this;
    }

    public async start(port: number): Promise<any> {
        const id = SoSmartSnowflake.generate().toString();
        this.fastify.log.info({
            id,
            email: "zen@sosmart.id",
            password: hashSync("apakek78", this.salt),
            token: Util.generateToken({ id, email: "zen@sosmart.id" })
        });

        const app = firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(join(process.cwd(), "sosmart-technopark-firebase.json")),
            databaseURL: "https://sosmart-technopark-default-rtdb.firebaseio.com"
        });

        this.firebase = app.database();
        await this.prisma.$connect();
        /* await this.fastify.register(fastifyRateLimit, {
           }); */
        await this.fastify.register(fastifyMultipart);
        await this.fastify.register(fastifyFormBody);
        await this.fastify.register(fastifySecureSession, {
            cookieName: "sosmart-session",
            key: readFileSync(join(process.cwd(), "secret-key")),
            cookie: {
                path: "/"
            }
        });


        await this.fastify.register(fastifyCors, {
            origin: "*"
        });

        await this.fastify.register(fastifySocketIo, {
            path: "/gateway",
            logLevel: "debug",
            cors: {
                origin: "*",
                credentials: true,
                methods: ["GET", "POST"]
            }
        });


        this.fastify.io.use(async (socket, next) => {
            if (!socket.handshake.auth.token) {
                return next(new Error("Unauthorized Access"));
            }

            const user = await this.prisma.users.findFirst({
                where: {
                    token: socket.handshake.auth.token
                }
            });

            if (!user) return next(new Error("Unauthorized Access"));

            socket.user = user;
            return next();
        });

        // Move to pieces
        this.fastify.io.on("connect", async socket => {
            socket.on("product:init:request", async () => {
                const products = await this.prisma.products.findMany({
                    where: {
                        owner: socket.user.id
                    }
                });

                if (products.length) {
                    for (const product of products) {
                        await this.firebase.ref(`Product/${product.id}`)
                            .once("value", snapshot => {
                                const data = snapshot.val();
                                socket.emit("productUpdate", {
                                    Product: product.id,
                                    ...data
                                });
                            });
                    }
                }
            });

            const products = await this.prisma.products.findMany({
                where: {
                    owner: socket.user.id
                }
            });

            if (products.length) {
                for (const product of products) {
                    this.firebase.ref(`Product/${product.id}`)
                        .on("child_changed", () => {
                            void this.firebase.ref(`Product/${product.id}`)
                                .once("value", snapshot => {
                                    socket.emit("productUpdate", {
                                        Product: product.id,
                                        ...snapshot.val()
                                    });
                                });
                        });
                }
            }
        });

        this.stores.register(new RouteStore().registerPath(resolve(currentDir, "..", "routes")));
        this.stores.register(new PreconditionStore().registerPath(resolve(currentDir, "..", "preconditions")));
        await Promise.all(this.stores.map(x => cast<Store<any>>(x).loadAll()));
        return this.fastify.listen({ port, host: "127.0.0.1" });
    }
}

declare module "@sapphire/pieces" {
    interface StoreRegistryEntries {
        routes: RouteStore;
        preconditions: PreconditionStore;
    }
    interface Container {
        server: Server;
    }
}

declare module "socket.io" {
    interface Socket {
        user: users;
    }
}
