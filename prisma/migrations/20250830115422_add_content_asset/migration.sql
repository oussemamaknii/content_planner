-- CreateTable
CREATE TABLE "public"."ContentAsset" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'secondary',
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "alt" TEXT,
    "focalPoint" JSONB,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentAsset_contentId_idx" ON "public"."ContentAsset"("contentId");

-- CreateIndex
CREATE INDEX "ContentAsset_assetId_idx" ON "public"."ContentAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentAsset_contentId_assetId_key" ON "public"."ContentAsset"("contentId", "assetId");

-- AddForeignKey
ALTER TABLE "public"."ContentAsset" ADD CONSTRAINT "ContentAsset_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentAsset" ADD CONSTRAINT "ContentAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
