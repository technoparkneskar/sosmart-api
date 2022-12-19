/* eslint-disable class-methods-use-this */
import { PieceContext } from "@sapphire/pieces";
import { FastifyReply, FastifyRequest } from "fastify";
import { Errors } from "../../../constants/errors.js";
import { Route } from "../../../stores/Route.js";

export class ActivationStatusRoute extends Route {
    public constructor(context: PieceContext) {
        super(context, {
            method: "GET",
            path: "/auth/activation/status"
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

        return reply.code(200).send({
            expired_at: activation?.expired_at,
            last_retry: activation?.last_retry,
            resend_attempt: activation?.attempts
        });
    }
}
