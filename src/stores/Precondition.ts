/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-namespace */
import { Piece } from "@sapphire/pieces";
import { Awaitable } from "@sapphire/utilities";
import { err, ok, Result } from "@sapphire/result";
import { FastifyRequest } from "fastify";

export abstract class Precondition extends Piece<PreconditionOptions> {
    public position: number | null = null;
    public constructor(context: Piece.Context, options: PreconditionOptions) {
        super(context, options);
        if (options.position) {
            this.position ??= options.position;
        }
    }

    public err(status: number, message: string): Result.Err<PreconditionError> {
        return err({ status, message });
    }

    public ok(): Result.Ok<undefined> {
        return ok(undefined);
    }

    public abstract run(request: FastifyRequest): Awaitable<Result<unknown, PreconditionError>>;
}

export namespace Precondition {
    export type Options = PreconditionOptions;
}

export interface PreconditionError {
    status: number;
    message: string;
}

export type PreconditionResult = Result<unknown, PreconditionError>;

interface PreconditionOptions extends Piece.Options {
    position?: number;
}
