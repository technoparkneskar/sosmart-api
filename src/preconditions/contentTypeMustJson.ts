import { PieceContext } from "@sapphire/pieces";
import { FastifyRequest } from "fastify";
import { Precondition, PreconditionResult } from "../stores/Precondition.js";

export class contentTypeMustJson extends Precondition {
    public constructor(context: PieceContext) {
        super(context, { name: "contentTypeMustJson" });
    }

    public run(request: FastifyRequest): PreconditionResult {
        return request.headers["content-type"] === "application/json" ? this.ok() : this.err(400, "Content-Type must be application/json");
    }
}
