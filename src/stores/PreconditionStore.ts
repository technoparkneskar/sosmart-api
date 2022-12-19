import { Store } from "@sapphire/pieces";
import { ok } from "@sapphire/result";
import { cast, Constructor } from "@sapphire/utilities";
import { FastifyRequest } from "fastify";
import { Precondition, PreconditionResult } from "./Precondition.js";
import { Route } from "./Route.js";

export class PreconditionStore extends Store<Precondition> {
    private readonly globalPreconditions: Precondition[] = [];
    public constructor() {
        super(cast<Constructor<Precondition>>(Precondition), { name: "preconditions" });
    }

    public async runGlobal(request: FastifyRequest): Promise<PreconditionResult> {
        for (const precondition of this.globalPreconditions) {
            const result = await precondition.run(request);
            if (!result.isOk()) return result;
        }

        return ok(undefined);
    }

    public async run(request: FastifyRequest, route: Route): Promise<PreconditionResult> {
        for (const routePrecondition of route.options.preconditions ?? []) {
            const precondition = this.get(routePrecondition);
            if (!precondition) {
                request.log.warn(`Precondition "${routePrecondition}" not found, but it is required by route "${route.name}"`);
                continue;
            }
            const result = await precondition.run(request);
            if (!result.isOk()) return result;
        }

        return ok(undefined);
    }

    public set(key: string, value: Precondition): this {
        if (value.position !== null) {
            const index = this.globalPreconditions.findIndex(precondition => precondition.position! >= value.position!);
            if (index === -1) this.globalPreconditions.push(value);
            else this.globalPreconditions.splice(index, 0, value);
        }
        return super.set(key, value);
    }

    public delete(key: string): boolean {
        const globalIndex = this.globalPreconditions.findIndex(precondition => precondition.name === key);
        if (globalIndex !== -1) this.globalPreconditions.splice(globalIndex, 1);

        return super.delete(key);
    }

    public clear(): void {
        this.globalPreconditions.splice(0);
        return super.clear();
    }
}
