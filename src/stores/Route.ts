/* eslint-disable @typescript-eslint/no-namespace */
import { Piece, PieceContext } from "@sapphire/pieces";
import { Awaitable } from "@sapphire/utilities";
import { FastifyReply, FastifyRequest, FastifySchema, HTTPMethods } from "fastify";
import { PreconditionResult } from "./Precondition.js";

export abstract class Route extends Piece<RouteOptions> {
    public constructor(public readonly context: PieceContext, public readonly options: RouteOptions) {
        super(context, options);

        if (typeof this.options.name !== "string") this.options.name = `${this.options.method} ${this.options.path}`;
    }

    public override onLoad(): unknown {
        this.container.server.fastify.route({
            schema: this.options.schema,
            method: this.options.method,
            url: this.options.path,
            handler: (request, reply) => this.run(request, reply),
            preHandler: async (request, reply) => {
                const precondition = this.container.stores.get("preconditions");

                // What to do if precondition isn't fulfilled / err
                const preconditionErr = (r: PreconditionResult): PreconditionResult => r.inspectErr(({ status, message }) => reply.status(status).send({ message }));

                // Execute globals preconditions
                await precondition.runGlobal(request)
                    .then(preconditionErr);

                // Execute route-specific preconditions
                await precondition.run(request, this)
                    .then(preconditionErr);
            }
        });

        return super.onLoad();
    }

    public abstract run(request: FastifyRequest, reply: FastifyReply): Awaitable<unknown>;
}

export namespace Route {
    export type Options = RouteOptions;
}

export interface RouteOptions extends Piece.Options {
    method: HTTPMethods;
    path: string;
    name?: string;
    preconditions?: string[];
    schema?: FastifySchema;
    wsHandler?: any;
}
