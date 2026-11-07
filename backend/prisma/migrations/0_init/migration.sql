-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" BIGINT,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "address" TEXT,
    "telegram_chat_id" VARCHAR(100),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL,
    "payment_method" VARCHAR(30) NOT NULL DEFAULT 'CASH',
    "payment_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "sku" VARCHAR(50),
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_name_snapshot" VARCHAR(200) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) DEFAULT (quantity::numeric * unit_price),

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" BIGSERIAL NOT NULL,
    "sale_number" VARCHAR(50) NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sale_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_notifications" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT,
    "sale_id" BIGINT,
    "payment_id" BIGINT,
    "chat_id" VARCHAR(100),
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_telegram_chat_id_key" ON "customers"("telegram_chat_id");

-- CreateIndex
CREATE INDEX "idx_payments_payment_date" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "idx_payments_sale_id" ON "payments"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "idx_sale_items_sale_id" ON "sale_items"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_sale_number_key" ON "sales"("sale_number");

-- CreateIndex
CREATE INDEX "idx_sales_customer_id" ON "sales"("customer_id");

-- CreateIndex
CREATE INDEX "idx_sales_sale_date" ON "sales"("sale_date");

-- CreateIndex
CREATE INDEX "idx_sales_user_id" ON "sales"("user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_status" ON "telegram_notifications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_stock_movements_product_id" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "idx_stock_movements_user_id" ON "stock_movements"("user_id");

-- CreateIndex
CREATE INDEX "idx_stock_movements_created_at" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "idx_stock_movements_type" ON "stock_movements"("movement_type");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "fk_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_sale" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "fk_sale_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "fk_sale_items_sale" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "fk_sales_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "fk_sales_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "telegram_notifications" ADD CONSTRAINT "fk_notifications_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "telegram_notifications" ADD CONSTRAINT "fk_notifications_payment" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "telegram_notifications" ADD CONSTRAINT "fk_notifications_sale" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "fk_stock_movements_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "fk_stock_movements_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
