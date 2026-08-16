-- CreateTable
CREATE TABLE "repair_images" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "repair_images" ADD CONSTRAINT "repair_images_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "repair_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: copy existing image URLs from repair_requests.images into repair_images
INSERT INTO "repair_images" ("id", "requestId", "url", "createdAt")
SELECT gen_random_uuid()::text, "id", "url", "createdAt"
FROM "repair_requests", LATERAL unnest("images") AS "url"
WHERE "images" IS NOT NULL AND array_length("images", 1) > 0;

-- AlterTable
ALTER TABLE "repair_requests" DROP COLUMN "images";
