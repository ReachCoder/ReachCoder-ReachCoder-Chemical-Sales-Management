CREATE TABLE "stock_movements" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "movement_type" VARCHAR(10) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stock_before" INTEGER NOT NULL,
    "stock_after" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_stock_movements_product_id"
ON "stock_movements"("product_id");

CREATE INDEX "idx_stock_movements_user_id"
ON "stock_movements"("user_id");

CREATE INDEX "idx_stock_movements_created_at"
ON "stock_movements"("created_at");

CREATE INDEX "idx_stock_movements_type"
ON "stock_movements"("movement_type");

ALTER TABLE "stock_movements"
ADD CONSTRAINT "fk_stock_movements_product"
FOREIGN KEY ("product_id")
REFERENCES "products"("id")
ON DELETE RESTRICT
ON UPDATE NO ACTION;

ALTER TABLE "stock_movements"
ADD CONSTRAINT "fk_stock_movements_user"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE NO ACTION;