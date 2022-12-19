/* eslint-disable class-methods-use-this */
import { PieceContext } from "@sapphire/pieces";
import { cast } from "@sapphire/utilities";
import { FastifyReply, FastifyRequest } from "fastify";
import { Errors } from "../../constants/errors.js";
import { Route } from "../../stores/Route.js";
import { generate } from "otp-generator";
import { hashSync } from "bcrypt";
import { otpExpiration } from "../../config.js";
import { Util } from "../../utils/Util.js";
import { SoSmartSnowflake } from "../../utils/Snowflake.js";
import S from "fluent-json-schema";

export class RegisterRoute extends Route {
    public constructor(context: PieceContext) {
        super(context, {
            method: "POST",
            path: "/auth/register",
            preconditions: [],
            schema: {
                body: S.object()
                    .prop("email", S.string()).required()
                    .prop("password", S.string())
                    .required()
            }
        });
    }

    public async run(request: FastifyRequest, reply: FastifyReply): Promise<any> {
        if (request.session.get("token")) return reply.status(403).send({ status: 403, message: Errors.ALREADY_LOGGED_IN });
        const body = cast<{ email?: string; password?: string } | undefined>(request.body);

        if (!body?.email || !body.password) {
            return reply.code(400).send({
                status: 400,
                message: Errors.BAD_REQUEST
            });
        }

        const existingUser = await this.container.server.prisma.users.findFirst({
            where: {
                email: body.email
            }
        });

        if (existingUser) {
            return reply.code(403)
                .send({ status: 403, message: Errors.ACCOUNT_ALREADY_EXISTS });
        }

        let otp = generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false, digits: true });
        let existing = await this.container.server.prisma.user_activation.findFirst({
            where: {
                code: Number(otp)
            }
        });

        while (existing) {
            otp = generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false, digits: true });
            existing = await this.container.server.prisma.user_activation.findFirst({
                where: {
                    code: Number(otp)
                }
            });
        }

        const id = SoSmartSnowflake.generate().toString();
        const user = await this.container.server.prisma.users.create({
            data: {
                id,
                email: body.email,
                password: hashSync(body.password, this.container.server.salt),
                token: Util.generateToken({ id, email: body.email })
            }
        });

        await this.container.server.prisma.user_activation.create({
            data: {
                user: user.id,
                code: Number(otp),
                expired_at: new Date(Date.now() + otpExpiration),
                last_ip: request.ip
            }
        });

        return reply.code(200)
            .send({
                status: 200,
                message: "Account created"
            });
    }
}
