export type UserRole = "public" | "client" | "assistant" | "owner";

export type ClaimStage =
  | "intake_received"
  | "documents_requested"
  | "records_uploaded"
  | "records_under_review"
  | "evidence_gaps_identified"
  | "consultation_completed"
  | "recommendations_provided"
  | "resources_assigned"
  | "follow_up_needed"
  | "completed_closed";

export type ConsultationType =
  | "initial_consultation"
  | "follow_up_consultation"
  | "medical_record_review"
  | "evidence_organization"
  | "medical_summary_service"
  | "workshop"
  | "academy_session";

export type DocumentType =
  | "va_decision_letter"
  | "dbq"
  | "service_treatment_record"
  | "private_medical_record"
  | "nexus_letter"
  | "lay_statement"
  | "buddy_statement"
  | "imaging_or_labs"
  | "personal_injury_record"
  | "attorney_letter"
  | "intake_attachment"
  | "other";

export type DocumentStatus =
  | "pending_upload"
  | "uploaded"
  | "under_review"
  | "additional_info_requested"
  | "complete"
  | "archived";

export type TaskStatus = "open" | "in_progress" | "waiting_on_client" | "done" | "cancelled";

export type TaskVisibility = "internal" | "client_visible";

export type PaymentStatus =
  | "draft"
  | "open"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed"
  | "void";

export type ResourceType =
  | "article"
  | "video"
  | "pdf"
  | "checklist"
  | "template"
  | "faq"
  | "quiz"
  | "webinar"
  | "course";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface MilitaryServiceRecord {
  branch?: string;
  component?: string;
  rankAtSeparation?: string;
  entryDate?: string;
  separationDate?: string;
  dischargeType?: string;
  deployments?: string[];
  mosOrAfsc?: string[];
}

export interface ClaimedCondition {
  id: string;
  name: string;
  category?: string;
  serviceConnectionTheory?: "direct" | "secondary" | "aggravation" | "presumptive" | "unknown";
  currentRatingPercent?: number;
  notes?: string;
}

export interface UserAccount {
  id: string;
  cognitoSub: string;
  email: string;
  phone?: string;
  role: UserRole;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface VeteranClientProfile {
  id: string;
  userAccountId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: string;
  email: string;
  phone?: string;
  address?: Address;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  militaryService: MilitaryServiceRecord;
  claimHistorySummary?: string;
  claimedConditions: ClaimedCondition[];
  currentStage: ClaimStage;
  assignedOwnerUserId: string;
  assignedAssistantUserId?: string;
  intakeCompletedAt?: string;
  lastPortalActivityAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IntakeSubmission {
  id: string;
  clientProfileId: string;
  version: number;
  status: "draft" | "submitted" | "reviewed";
  answers: Record<string, string | string[] | boolean | number | null>;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface DocumentRecord {
  id: string;
  clientProfileId: string;
  uploadedByUserId: string;
  type: DocumentType;
  title: string;
  description?: string;
  s3Key: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string;
  serviceDate?: string;
  receivedDate: string;
  status: DocumentStatus;
  reviewNotes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaimCase {
  id: string;
  clientProfileId: string;
  stage: ClaimStage;
  statusLabel: string;
  claimType?: string;
  claimedConditions: string[];
  evidenceGaps?: string[];
  nextRecommendedAction?: string;
  openedAt: string;
  closedAt?: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  clientProfileId: string;
  type: ConsultationType;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  meetingUrl?: string;
  bookingSource?: "portal" | "admin" | "calendly" | "manual";
  attendanceStatus?: "scheduled" | "completed" | "cancelled" | "no_show";
  recommendations?: string[];
  summaryNotes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  clientProfileId: string;
  title: string;
  description?: string;
  assignedToUserId?: string;
  visibility: TaskVisibility;
  status: TaskStatus;
  dueAt?: string;
  reminderAt?: string;
  completedAt?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageThread {
  id: string;
  clientProfileId: string;
  subject: string;
  participantUserIds: string[];
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageEntry {
  id: string;
  threadId: string;
  senderUserId: string;
  body: string;
  containsPhi: boolean;
  createdAt: string;
}

export interface InvoicePayment {
  id: string;
  clientProfileId: string;
  stripeCustomerId?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  description: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export interface EducationResource {
  id: string;
  slug: string;
  title: string;
  type: ResourceType;
  category: string;
  description?: string;
  isPublic: boolean;
  accessLevel: "public" | "client" | "member_only";
  estimatedMinutes?: number;
  downloadableAssetUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignedResource {
  id: string;
  clientProfileId: string;
  resourceId: string;
  assignedByUserId: string;
  status: "assigned" | "started" | "completed";
  assignedAt: string;
  completedAt?: string;
}

export interface ProviderDirectoryEntry {
  id: string;
  businessName: string;
  serviceCategory: string;
  description: string;
  statesServed: string[];
  deliveryMode: "virtual" | "in_person" | "both";
  veteranDiscountDetails?: string;
  websiteUrl: string;
  bookingUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  disclaimer: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReferralCategory = "realtor" | "attorney" | "educator" | "developer" | "other";
export type ReferralSubmissionStatus = "pending" | "reviewed" | "archived";
export type ReferralCommunicationPreference = "text" | "call" | "either";

export interface ReferralContact {
  name: string;
  phone: string;
}

export interface ReferralSubmission {
  id: string;
  businessName: string;
  category: ReferralCategory;
  contacts: ReferralContact[];
  communicationPreference: ReferralCommunicationPreference;
  communicationNotes?: string;
  services: string[];
  serviceArea: string;
  email?: string;
  websiteUrl?: string;
  notes?: string;
  disclaimerAcceptedAt: string;
  status: ReferralSubmissionStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
}

export interface TimelineEvent {
  id: string;
  clientProfileId: string;
  actorUserId?: string;
  eventType: string;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
  visibleToClient: boolean;
  createdAt: string;
}
