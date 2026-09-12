-- CreateTable
CREATE TABLE "job_assignments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "job_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_assignments_requestId_userId_key" ON "job_assignments"("requestId", "userId");

-- AddForeignKey
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "repair_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "sla_logs" ADD COLUMN     "technicianId" TEXT;

-- AddForeignKey
ALTER TABLE "sla_logs" ADD CONSTRAINT "sla_logs_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: preserve existing single-technician assignments as job_assignments rows.
-- Historical assignments were always self-claimed, so treat them as already acknowledged.
INSERT INTO "job_assignments" ("id", "requestId", "userId", "assignedAt", "acknowledgedAt")
SELECT gen_random_uuid()::text, "id", "assignedToId", COALESCE("assignedAt", "createdAt"), COALESCE("assignedAt", "createdAt")
FROM "repair_requests"
WHERE "assignedToId" IS NOT NULL;

-- DataMigration: attribute existing SLA logs to the technician who was assigned at the time.
UPDATE "sla_logs"
SET "technicianId" = "repair_requests"."assignedToId"
FROM "repair_requests"
WHERE "sla_logs"."requestId" = "repair_requests"."id"
  AND "repair_requests"."assignedToId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "repair_requests" DROP CONSTRAINT "repair_requests_assignedToId_fkey";

-- AlterTable
ALTER TABLE "repair_requests" DROP COLUMN "assignedToId";
