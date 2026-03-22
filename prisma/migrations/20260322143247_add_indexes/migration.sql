-- CreateIndex
CREATE INDEX "TestResult_testRunId_idx" ON "TestResult"("testRunId");

-- CreateIndex
CREATE INDEX "TestResult_testRunId_category_idx" ON "TestResult"("testRunId", "category");

-- CreateIndex
CREATE INDEX "TestRun_configId_idx" ON "TestRun"("configId");

-- CreateIndex
CREATE INDEX "TestRun_startedAt_idx" ON "TestRun"("startedAt");
