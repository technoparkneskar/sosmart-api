/* eslint-disable class-methods-use-this */
import { PieceContext } from "@sapphire/pieces";
import { FastifyReply, FastifyRequest } from "fastify";
import { Route } from "../../stores/Route.js";

export class LogoutRoute extends Route {
    public constructor(context: PieceContext) {
        super(context, {
            method: "GET",
            path: "/auth/logout",
            preconditions: []
        });
    }

    public async run(request: FastifyRequest, reply: FastifyReply): Promise<any> {
        if (!request.session.get("token")) return reply.redirect(200, "/dashboard/login");
        request.session.delete();
        return reply.redirect(200, "/");
    }
}
