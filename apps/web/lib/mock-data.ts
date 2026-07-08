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

export const mockClient = {
  id: "client-001",
  name: "James R. Mitchell",
  email: "j.mitchell@example.com",
  branch: "U.S. Army",
  currentStage: "records_under_review" as ClaimStage,
  nextAction: "Upload your most recent VA decision letter if available.",
  assignedOwner: "JS Veteran Solutions",
  assignedAssistant: "Maria L."
};

export const mockDocuments = [
  { id: "1", title: "VA Decision Letter (2024)", type: "VA Decision Letter", status: "complete", date: "Mar 12, 2026" },
  { id: "2", title: "Service Treatment Records", type: "STR", status: "under_review", date: "Mar 18, 2026" },
  { id: "3", title: "Private Medical Records - Neurology", type: "Private Medical", status: "uploaded", date: "Mar 20, 2026" },
  { id: "4", title: "Buddy Statement - SSG Williams", type: "Buddy Statement", status: "additional_info_requested", date: "Mar 22, 2026" }
];

export const mockTasks = [
  { id: "1", title: "Complete intake questionnaire", status: "done", due: "Mar 10, 2026" },
  { id: "2", title: "Upload VA decision letter", status: "open", due: "Mar 28, 2026" },
  { id: "3", title: "Schedule follow-up consultation", status: "open", due: "Apr 5, 2026" }
];

export const mockTimeline = [
  { date: "Mar 22, 2026", event: "Buddy statement flagged for additional signature page" },
  { date: "Mar 20, 2026", event: "Neurology records uploaded" },
  { date: "Mar 18, 2026", event: "Service treatment records received" },
  { date: "Mar 15, 2026", event: "Initial consultation completed" },
  { date: "Mar 10, 2026", event: "Navigator Package purchased and intake unlocked" }
];

export const mockProviders = [
  {
    name: "Veterans Legal Aid Group",
    category: "Attorney",
    states: ["Nationwide"],
    mode: "Virtual",
    discount: "10% veteran discount",
    description: "VA disability claim appeals and CUE motions."
  },
  {
    name: "Pathfinder Career Coaching",
    category: "Career Coach",
    states: ["TX", "OK", "LA"],
    mode: "Both",
    discount: "Free 30-min intro for veterans",
    description: "Federal employment and civilian career transition support."
  },
  {
    name: "Summit Sleep Medicine",
    category: "Sleep Specialist",
    states: ["FL", "GA", "AL"],
    mode: "In-person",
    discount: null,
    description: "Sleep apnea evaluation and treatment documentation."
  }
];

export const mockEducation = [
  { title: "How to Read a VA Decision Letter", category: "VA Claim Basics", type: "Article", minutes: 12 },
  { title: "Evidence Checklist for PTSD Claims", category: "PTSD Claims", type: "Checklist", minutes: 8 },
  { title: "Understanding Secondary Service Connection", category: "Secondary Connection", type: "Video", minutes: 18 },
  { title: "TDIU / IU Eligibility Overview", category: "TDIU / IU", type: "Article", minutes: 15 }
];

export const mockServices = [
  {
    id: "pathfinder",
    name: "Pathfinder Session",
    price: "$100",
    description: "1-hour group info session with an overview of VA claims and live Q&A."
  },
  {
    id: "compass",
    name: "Compass Review",
    price: "$250",
    description: "Individual appraisal, condition identification, next-step recommendations, and documentation checklist."
  },
  {
    id: "navigator",
    name: "Navigator Package",
    price: "$500",
    description: "Appraisal report and claims plan with documentation recommendations and strategy guidance."
  },
  {
    id: "advocate",
    name: "Advocate Package",
    price: "$900",
    description:
      "Appraisal report, claims plan, and professional deliverables including condition summary, evidence outline, claim support documents, and claim checklist."
  },
  {
    id: "elite",
    name: "Elite Package",
    price: "$1,400",
    description:
      "Appraisal report, claims plan, professional deliverables, mock C&P exam, examiner strategy guide, and final checklist."
  }
];

export const providerDisclaimer =
  "The providers listed are independent businesses. JS Veteran Solutions does not employ, supervise, bill for, or receive referral fees from listed providers. Listings are for informational and educational purposes only.";

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
