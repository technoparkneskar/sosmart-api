/* eslint-disable class-methods-use-this */
import { PieceContext } from "@sapphire/pieces";
import { FastifyReply, FastifyRequest } from "fastify";
import { Route } from "../stores/Route.js";

export class MainRoute extends Route {
    public constructor(context: PieceContext) {
        super(context, {
            method: "GET",
            path: "/"
        });
    }

    public async run(request: FastifyRequest, reply: FastifyReply): Promise<any> {
        return reply.code(200).send({ status: 200, message: "Hello folks" });
    }
}
