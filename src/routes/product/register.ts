/* eslint-disable class-methods-use-this */
import { PieceContext } from "@sapphire/pieces";
import { FastifyReply, FastifyRequest } from "fastify";
import S from "fluent-json-schema";
import { Route } from "../../stores/Route";
import { cast } from "@sapphire/utilities";
import { Errors } from "../../constants/errors";

export class ProductRegister extends Route {
    public constructor(context: PieceContext) {
        super(context, {
            method: "POST",
            path: "/product/register",
            preconditions: [],
            schema: {
                body: S.object()
                    .prop("product_id", S.string()).required()
                    .prop("name", S.string())
                    .required()
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
        if (!user.activated) {
            return reply.code(401).send({
                status: 401,
                message: Errors.ACCOUNT_UNVERIFIED
            });
        }

        const { product_id, name } = cast<{ product_id: string; name: string }>(request.body);
        const existing = await this.container.server.prisma.products.findFirst({
            where: {
                id: product_id
            }
        });

        if (existing) {
            return reply.status(403).send({
                status: 403,
                message: Errors.PRODUCT_ALREADY_REGISTERED
            });
        }

        let found = false;
        await this.container.server.firebase.ref(`Product/${product_id}`)
            .once("value", snapshot => {
                if (snapshot.exists()) {
                    found = true;
                }
            });

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!found) {
            return reply.code(403).send({
                status: 403,
                message: Errors.UNKNOWN_PRODUCT
            });
        }

        const data = await this.container.server.prisma.products.create({
            data: {
                id: product_id,
                owner: user.id,
                added_at: new Date(),
                name
            }
        });

        return reply.status(200).send({
            status: 200,
            message: "Product registered successfully",
            ...data
        });
    }
}
