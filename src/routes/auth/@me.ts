/* eslint-disable class-methods-use-this */
import { PieceContext } from "@sapphire/pieces";
import { FastifyReply, FastifyRequest } from "fastify";
import { Route } from "../../stores/Route.js";

export class MeRoute extends Route {
    public constructor(context: PieceContext) {
        super(context, {
            method: "GET",
            path: "/auth/@me"
        });
    }

    public async run(request: FastifyRequest, reply: FastifyReply): Promise<any> {
        const resultUser = await this.container.server.util.fetchAuth(request);
        if (resultUser.isErr()) {
            const err = resultUser.unwrapErr();
            return reply.code(err.status).send(err);
        }

        const user = resultUser.unwrap();

        return reply.code(200).send({
            id: user.id,
            email: user.email,
            activated: user.activated
        });
    }
}
