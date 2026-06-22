CREATE INDEX IF NOT EXISTS idx_active_workflows
ON "WorkflowSession"
("citizenId","serviceType")
WHERE "isCompleted" = false;

CREATE INDEX IF NOT EXISTS idx_open_complaints
ON "Complaint"
("citizenId","status")
WHERE "status" NOT IN ('COMPLETED','CLOSED');
