# Workflow Map

## Workflow Design Rules
- The portal is the system of engagement for clients.
- `VeteranClientProfile` is the system of record for operations.
- Email should notify clients that something changed, but sensitive content should stay inside the portal.
- Every workflow should either save owner/assistant time or be deferred.

## 1. New Client Purchase And Account Unlock

### Trigger
Client pays for an owner service through Stripe Checkout, Stripe Payment Link, or a Stripe invoice.

### Flow
1. Stripe sends webhook event to the app.
2. Webhook handler validates signature and resolves the purchaser identity.
3. App creates or updates `UserAccount`.
4. App creates or updates `VeteranClientProfile`.
5. App creates initial `InvoicePayment` record.
6. App creates starter `TaskRecord` items such as intake completion and document upload.
7. App writes `TimelineEvent` entries.
8. SES sends a welcome email with portal access instructions.

### Automation outputs
- account activated
- intake unlocked
- owner or assistant notified of a new client

## 2. Intake Submission

### Trigger
Client signs in and completes the intake questionnaire.

### Flow
1. Client opens the intake module in the portal.
2. App saves a draft `IntakeSubmission` as the client progresses.
3. Client submits the completed intake.
4. App marks the submission as `submitted`.
5. App updates `VeteranClientProfile.intakeCompletedAt`.
6. App advances `ClaimCase.stage` to `intake_received` or the next operational stage.
7. App creates follow-up tasks for document requests.
8. Assistant receives an internal notification for review.

## 3. Secure Document Upload

### Trigger
Client uploads records from the portal.

### Flow
1. Client selects document type, service date, and file.
2. App validates size, type, and client authorization.
3. API creates a placeholder `DocumentRecord` with `pending_upload`.
4. API returns a short-lived presigned upload request.
5. Browser uploads directly to S3.
6. S3 event triggers a worker Lambda.
7. Worker confirms the object exists and updates `DocumentRecord.status` to `uploaded`.
8. Worker creates a review task and timeline event.
9. Assistant sees the item in the document review queue.

### Review follow-up
- If acceptable, assistant marks the document `complete`.
- If incomplete or unclear, assistant marks it `additional_info_requested` and the client gets a portal task.

## 4. Claim Progress Tracking

### Goal
Expose package-tracking style progress without overwhelming the client with legal or operational detail.

### Client-facing stages
1. Intake received
2. Documents requested
3. Records uploaded
4. Records under review
5. Evidence gaps identified
6. Consultation completed
7. Recommendations provided
8. Resources assigned
9. Follow-up needed
10. Completed or closed

### Internal flow
1. Owner or assistant updates `ClaimCase`.
2. App writes a `TimelineEvent`.
3. If the stage changed, the client dashboard updates immediately.
4. If next action is required, a client-visible task is created.

## 5. Consultation Booking And Completion

### Booking
1. Client books through the chosen scheduler.
2. Booking event creates or updates a `Consultation` record.
3. App sends confirmation email and writes a timeline entry.
4. App creates any preparation tasks or reminders.

### Completion
1. Owner completes the consultation.
2. Owner enters recommendations and summary notes.
3. App marks the consultation `completed`.
4. App updates `ClaimCase.stage` if needed.
5. App assigns relevant `EducationResource` items.
6. App schedules follow-up tasks and reminder events.

## 6. Secure Messaging

### Trigger
Client or staff starts a message thread in the portal.

### Flow
1. Sender opens or replies in `MessageThread`.
2. App stores `MessageEntry`.
3. Recipient gets a non-PHI email notification that a new portal message is available.
4. Thread remains visible in the client and admin portal until closed.

## 7. Education Resource Assignment

### Trigger
Owner assigns educational material, checklist, or template.

### Flow
1. Owner selects one or more `EducationResource` items.
2. App creates `AssignedResource` records.
3. App writes timeline entries.
4. Client sees the assignment in the dashboard resources area.
5. App tracks started or completed status when the client opens, downloads, or finishes the item.

## 8. Provider Directory Management

### Goal
Support public trusted-resource navigation without marketplace behavior.

### Flow
1. Assistant or owner creates or updates a `ProviderDirectoryEntry`.
2. Owner reviews the entry if approval is required.
3. App publishes the entry to the public site with the required independence disclaimer.
4. Public users click through to the provider's own website or booking page.

## 9. Follow-Up And Reminder Automation

### Reminder cases
- intake not completed
- requested records missing
- consultation coming up
- follow-up due after consultation
- membership renewal or payment issue

### Event pattern
1. Core app writes a business event to EventBridge.
2. Rule targets SQS or scheduled workflow processing.
3. Worker decides whether a reminder is still needed.
4. Worker creates a task, sends email, or both.
5. Worker writes a `TimelineEvent`.

## 10. Revenue And Payment Visibility

### Goal
Give the owner operational visibility without building a full accounting system.

### Flow
1. Stripe webhook updates `InvoicePayment`.
2. Admin dashboard shows revenue snapshots, recent payments, refunds, and subscription status.
3. Accounting sync to QuickBooks happens through an external connector, not custom MVP logic.
