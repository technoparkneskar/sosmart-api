/* eslint-disable class-methods-use-this */
import { PieceContext } from "@sapphire/pieces";
import { FastifyReply, FastifyRequest } from "fastify";
import { Errors } from "../../../constants/errors.js";
import { Route } from "../../../stores/Route.js";
import S from "fluent-json-schema";
import { cast } from "@sapphire/utilities";

export class ActivationStatusRoute extends Route {
    public constructor(context: PieceContext) {
        super(context, {
            method: "POST",
            path: "/auth/activation/verify",
            preconditions: ["contentTypeMustJson"],
            schema: {
                body: S.object()
                    .prop("code", S.integer().minimum(6)).required()
            }
        });
    }

    public async run(request: FastifyRequest, reply: FastifyReply): Promise<any> {
        const resultUser = await this.container.server.util.fetchAuth(request);
        if (resultUser.isErr()) {
            const err = resultUser.unwrapErr();
            return reply.code(err.status).send(err);
        }

        const user = resultUser.unwrap();

        if (user.activated) {
            return reply.code(403)
                .send({
                    status: 403,
                    message: Errors.ACCOUNT_ALREADY_VERIFIED
                });
        }

        const activation = await this.container.server.prisma.user_activation.findFirst({
            where: {
                user: user.id
            }
        });

        const { code } = cast<{ code: number }>(request.body);
        if (code !== activation?.code) {
            return reply.code(400).send({
                status: 400,
                message: Errors.INVALID_OTP_CODE
            });
        }

        if (activation.expired_at.getTime() > Date.now()) {
            return reply.code(400).send({
                status: 400,
                message: Errors.OTP_EXPIRED
            });
        }

        await this.container.server.prisma.user_activation.delete({
            where: {
                user: user.id
            }
        });

        await this.container.server.prisma.users.update({
            where: {
                id: user.id
            },
            data: {
                activated: true
            }
        });

        return reply.code(200).send({
            status: 200,
            message: "Account successfully activated"
        });
    }
}
