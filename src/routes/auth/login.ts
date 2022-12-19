/* eslint-disable class-methods-use-this */
import { PieceContext } from "@sapphire/pieces";
import { cast } from "@sapphire/utilities";
import { compare } from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import { Errors } from "../../constants/errors.js";
import { Route } from "../../stores/Route.js";
import S from "fluent-json-schema";

export class LoginRoute extends Route {
    public constructor(context: PieceContext) {
        super(context, {
            method: "POST",
            path: "/auth/login",
            preconditions: ["contentTypeMustJson"],
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
                message: "Invalid email or password!"
            });
        }

        const user = await this.container.server.prisma.users.findFirst({
            where: {
                email: body.email
            }
        });

        if (!user) {
            return reply.code(403).send({
                status: 403,
                message: "Invalid username or password!"
            });
        }

        const result = await compare(body.password, user.password);

        if (!result) {
            return reply.code(403).send({
                status: 403,
                message: "Invalid username or password!"
            });
        }

        request.session.set("token", user.token);

        return reply.code(200).send({
            status: 200,
            token: user.token,
            activated: user.activated
        });
    }
}
