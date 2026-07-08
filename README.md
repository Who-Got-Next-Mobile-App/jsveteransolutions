# JS Veteran Solutions

AWS-first MVP blueprint and implementation scaffold for veteran consultation services, secure document collection, claim progress tracking, education delivery, and resource navigation.

## Structure
- `docs/` business, architecture, workflow, and roadmap artifacts
- `packages/types/` shared TypeScript domain models for the future app and API
- `infra/` placeholder for AWS CDK or Terraform infrastructure code
- `apps/web/` placeholder for the public site, client portal, and admin portal

## Current Deliverables
- Core domain model centered on `VeteranClientProfile`
- AWS architecture and HIPAA-aware security baseline
- End-to-end workflow definitions
- Sequenced MVP implementation roadmap
- Runnable UI preview in `apps/web`

## Preview
```bash
npm install
npm run db:up          # requires Docker
npm run db:migrate
npm run dev:api        # terminal 1 — API on :4000
npm run dev            # terminal 2 — web on :3000
```

Open http://localhost:3000 for the public site and `/portal` for the live client portal.

Staff operations preview (not linked publicly): http://localhost:3000/staff

Backend docs: [docs/BACKEND.md](docs/BACKEND.md)
