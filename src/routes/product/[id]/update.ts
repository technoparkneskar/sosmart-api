/* eslint-disable class-methods-use-this */
import { PieceContext } from "@sapphire/pieces";
import { FastifyReply, FastifyRequest } from "fastify";
import S from "fluent-json-schema";
import { Route } from "../../../stores/Route";
import { Errors } from "../../../constants/errors";
import { cast } from "@sapphire/utilities";

export class ProductUpdate extends Route {
    public constructor(context: PieceContext) {
        super(context, {
            method: "PATCH",
            path: "/product/:id/update",
            preconditions: [],
            schema: {
                body: S.object()
                    .prop("name", S.string())
                    .prop("state", S.object()
                        .prop("switch_1", S.boolean())
                        .prop("switch_2", S.boolean()))
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

        const { id: product_id } = cast<{ id: string }>(request.params);
        const body = cast<{ name?: string; state?: { switch_1?: boolean; switch_2?: boolean } }>(request.body);
        const existing = await this.container.server.prisma.products.findFirst({
            where: {
                id: product_id
            }
        });

        if (!existing) {
            return reply.status(403).send({
                status: 403,
                message: Errors.UNKNOWN_PRODUCT
            });
        }

        if (existing.owner !== user.id) {
            return reply.status(401).send({
                status: 401,
                message: Errors.PRODUCT_OWNED_BY_SOMEONE_ELSE
            });
        }

        if (body.name) {
            await this.container.server.prisma.products.update({
                where: {
                    id: product_id
                },
                data: {
                    name: body.name
                }
            });
        }

        if (body.state) {
            const ref = this.container.server.firebase.ref(`Product/${product_id}/Switch`);
            if (body.state.switch_1 !== undefined) await ref.child("1").set(body.state.switch_1);
            if (body.state.switch_2 !== undefined) await ref.child("2").set(body.state.switch_2);

            await this.container.server.firebase.ref(`Product/${product_id}/Switch`).once("value", async snapshot => {
                const [, first, second] = cast<[null, boolean, boolean]>(snapshot.val());

                if (first) {
                    const existingHistory = await this.container.server.prisma.product_history.findFirst({
                        where: {
                            product_id,
                            type: 0,
                            end_at: null
                        }
                    });

                    if (!existingHistory) {
                        await this.container.server.prisma.product_history.create({
                            data: {
                                product_id,
                                type: 0,
                                start_at: new Date()
                            }
                        });
                    }
                }

                if (second) {
                    const existingHistory = await this.container.server.prisma.product_history.findFirst({
                        where: {
                            product_id,
                            type: 1,
                            end_at: null
                        }
                    });

                    if (!existingHistory) {
                        await this.container.server.prisma.product_history.create({
                            data: {
                                product_id,
                                type: 1,
                                start_at: new Date()
                            }
                        });
                    }
                }

                if (!first) {
                    const firstHistory = await this.container.server.prisma.product_history.findFirst({
                        where: {
                            product_id,
                            type: 0,
                            end_at: null
                        }
                    });

                    if (firstHistory) {
                        await this.container.server.prisma.product_history.update({
                            where: {
                                id: firstHistory.id
                            },
                            data: {
                                end_at: new Date()
                            }
                        });
                    }
                }

                if (!second) {
                    const secondHistory = await this.container.server.prisma.product_history.findFirst({
                        where: {
                            product_id,
                            type: 1,
                            end_at: null
                        }
                    });

                    if (secondHistory) {
                        await this.container.server.prisma.product_history.update({
                            where: {
                                id: secondHistory.id
                            },
                            data: {
                                end_at: new Date()
                            }
                        });
                    }
                }
            });
        }

        return reply.status(200).send({
            status: 200,
            message: "Product updated successfully"
        });
    }
}
