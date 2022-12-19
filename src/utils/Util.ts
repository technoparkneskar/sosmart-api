import { users } from "@prisma/client";
import { Result } from "@sapphire/result";
import { createHmac, randomBytes } from "crypto";
import { FastifyRequest } from "fastify";
import { Errors } from "../constants/errors";
import { Server } from "../structures/Server";
import { SoSmartSnowflake } from "./Snowflake";

export class Util {
    public constructor(public readonly server: Server) {}

    public async fetchAuth(request: FastifyRequest): Promise<Result<users, { status: number; message: string }>> {
        const token = request.headers.authorization;
        if (!token) {
            return Promise.resolve(Result.err({ status: 400, message: Errors.BAD_REQUEST }));
        }

        const user = await this.server.prisma.users.findFirst({
            where: {
                token
            }
        });

        if (!user) {
            return Promise.resolve(Result.err({ status: 403, message: Errors.INVALID_TOKEN }));
        }

        return Result.ok(user);
    }

    public static deserializeJSON(_: string, value: string): any {
        if (Array.isArray(value)) return value;
        try {
            if (Array.isArray(JSON.parse(value))) return JSON.parse(value);
        // eslint-disable-next-line no-empty
        } catch {}
        // @ts-expect-error-next-line
        if (value === true || value === false) return value;
        if (["true", "false"].includes(String(value))) return value === "true";
        if (!Number.isSafeInteger(Number(value))) return value;
        if (!isNaN(Number(value))) return Number(value);
        return value;
    }

    public static generateToken(user: { id: string; email: string }): string {
        const hmac = createHmac("SHA256", randomBytes(32));
        hmac.update(`${Date.now()}:${user.id}:${user.email}:${SoSmartSnowflake.generate()}`);
        const id = Buffer.from(`${user.id}${SoSmartSnowflake.generate()}`).toString("base64")
            .replace(/=/g, "")
            .replace(/\//g, "")
            .replace(/[+]/g, "");
        const token = hmac.digest("base64")
            .replace(/=/g, "")
            .replace(/\//g, "")
            .replace(/[+]/g, "");
        return `${id}.${token}`;
    }

    public static getCurrentDate(): string {
        const dateFormat = Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour12: false
        });
        return Util.formatDate(dateFormat);
    }

    public static formatDate(dateFormat: Intl.DateTimeFormat, date: Date | number = new Date()): string {
        const data = dateFormat.formatToParts(date);
        return "<year>-<month>-<day>"
            .replace(/<year>/g, data.find(d => d.type === "year")!.value)
            .replace(/<month>/g, data.find(d => d.type === "month")!.value)
            .replace(/<day>/g, data.find(d => d.type === "day")!.value);
    }
}
