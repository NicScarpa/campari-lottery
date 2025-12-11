-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "planned_token_count" INTEGER NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeType" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initial_stock" INTEGER NOT NULL,
    "remaining_stock" INTEGER NOT NULL,

    CONSTRAINT "PrizeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "token_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "total_plays" INTEGER NOT NULL DEFAULT 0,
    "last_play_at" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "is_winner" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeAssignment" (
    "id" TEXT NOT NULL,
    "prize_type_id" TEXT NOT NULL,
    "prize_code" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrizeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_code_key" ON "Token"("token_code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_promotion_id_phone_number_key" ON "Customer"("promotion_id", "phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Play_token_id_key" ON "Play"("token_id");

-- CreateIndex
CREATE UNIQUE INDEX "PrizeAssignment_prize_code_key" ON "PrizeAssignment"("prize_code");

-- AddForeignKey
ALTER TABLE "PrizeType" ADD CONSTRAINT "PrizeType_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeAssignment" ADD CONSTRAINT "PrizeAssignment_prize_type_id_fkey" FOREIGN KEY ("prize_type_id") REFERENCES "PrizeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
