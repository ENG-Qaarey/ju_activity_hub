-- CreateIndex
CREATE INDEX "applications_activityId_status_studentName_idx" ON "applications"("activityId", "status", "studentName");
