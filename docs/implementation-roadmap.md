# Implementation Roadmap

## Goal
Move from blueprint to a buildable AWS MVP in the smallest sequence that produces a usable operating system, not just a brochure site.

## Delivery Phases

### Phase 0: Foundation Design
Deliverables:
- finalized domain model
- role and permission matrix
- intake question set
- document taxonomy
- claim stage definitions
- workflow and automation map
- public and portal screen inventory
- security and compliance checklist

Exit criteria:
- no unresolved ambiguity around core entities, roles, or workflow triggers
- infrastructure stack choice confirmed as AWS CDK + serverless AWS services

### Phase 1: Platform Setup
Deliverables:
- monorepo scaffold
- shared TypeScript domain package
- AWS CDK project structure
- environment strategy for `dev`, `staging`, and `prod`
- Cognito setup for `client`, `assistant`, `owner`
- baseline logging, secrets, and KMS strategy

Exit criteria:
- developers can deploy a minimal authenticated app shell to AWS

### Phase 2: Client Record And Admin Operations Core
Deliverables:
- `VeteranClientProfile` CRUD model
- admin dashboard shell
- client list and profile detail views
- internal notes, tasks, and timeline foundations

Exit criteria:
- owner can create, view, and manage client profiles in one place

### Phase 3: Intake And Secure Document Pipeline
Deliverables:
- intake form flow
- document category model
- direct-to-S3 upload flow
- document review queue
- missing-document follow-up tasks

Exit criteria:
- a paid client can complete intake and upload records without using outside tools

### Phase 4: Payments, Scheduling, And Portal Unlock
Deliverables:
- Stripe checkout or payment links integration
- webhook processing
- payment records in admin
- consultation booking integration
- automatic account unlock and welcome flow

Exit criteria:
- a new paying client can become an active portal user with no manual setup

### Phase 5: Claim Tracking And Resource Assignment
Deliverables:
- client-facing claim status tracker
- owner and assistant stage updates
- education resource library
- assigned resources in portal

Exit criteria:
- clients can see progress and next steps without contacting support

### Phase 6: Public Content And Provider Directory
Deliverables:
- public pages
- FAQ and education starter content
- provider directory
- disclaimer and outbound resource handling

Exit criteria:
- the website works as a front door for trust-building and lead conversion

## Build Order By Engineering Priority
1. Shared types and schema definitions
2. Auth and authorization model
3. AWS infrastructure skeleton
4. Client profile and admin shell
5. Intake forms
6. Secure document upload
7. Stripe webhook and payment activation
8. Claim tracker
9. Education assignment
10. Provider directory and public site polish

## Suggested Initial Backlog

### Epic 1: Identity And Access
- create Cognito user pool and groups
- build sign-in and protected route middleware
- map roles to application permissions

### Epic 2: Client Profile System
- create schema and migrations
- build admin list/detail pages
- add notes, tasks, and timeline APIs

### Epic 3: Secure Documents
- generate presigned uploads
- persist document metadata
- build review queue and follow-up actions

### Epic 4: Payments And Intake
- configure Stripe products and webhook ingestion
- create intake unlock automation
- store invoice and payment state

### Epic 5: Education And Public Resources
- create education content model
- assign resources to clients
- build provider directory filters and detail pages

## Definition Of Done For MVP
- client can pay, sign in, complete intake, upload records, see progress, and receive resources
- owner can manage profiles, review records, update stages, assign resources, and view payments
- assistant can handle assigned follow-up, document completeness, and directory updates
- PHI-bearing workflows stay inside the approved AWS architecture
- manual setup steps are reduced to exceptions, not the normal workflow
