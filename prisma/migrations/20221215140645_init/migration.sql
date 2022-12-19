-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" TEXT NOT NULL,
    "token" TEXT,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "avatar" VARCHAR NOT NULL DEFAULT 'default.png',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activation" (
    "user" VARCHAR NOT NULL,
    "expired_at" TIMESTAMPTZ(6) NOT NULL,
    "code" INTEGER NOT NULL,
    "last_retry" TIMESTAMPTZ(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_ip" VARCHAR NOT NULL,

    CONSTRAINT "user_activation_pkey" PRIMARY KEY ("user")
);

-- AddForeignKey
ALTER TABLE "user_activation" ADD CONSTRAINT "user_id" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
