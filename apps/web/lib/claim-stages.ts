import type { ClaimStage } from "@vsn/types";

export const claimStageLabels: Record<ClaimStage, string> = {
  intake_received: "Intake received",
  documents_requested: "Documents requested",
  records_uploaded: "Records uploaded",
  records_under_review: "Records under review",
  evidence_gaps_identified: "Evidence gaps identified",
  consultation_completed: "Consultation completed",
  recommendations_provided: "Recommendations provided",
  resources_assigned: "Resources assigned",
  follow_up_needed: "Follow-up needed",
  completed_closed: "Completed / closed"
};

export const claimStages: ClaimStage[] = [
  "intake_received",
  "documents_requested",
  "records_uploaded",
  "records_under_review",
  "evidence_gaps_identified",
  "consultation_completed",
  "recommendations_provided",
  "resources_assigned",
  "follow_up_needed",
  "completed_closed"
];
