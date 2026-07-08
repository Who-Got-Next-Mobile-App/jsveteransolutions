# Infrastructure

AWS CDK stack for JS Veteran Solutions backend.

## Deploy
```bash
npm run build:api
cd infra
npm install
npx cdk bootstrap   # first time only
npm run deploy
```

## Resources created
- VPC + NAT
- RDS PostgreSQL 16
- Cognito User Pool (client / assistant / owner groups)
- S3 documents bucket (KMS encrypted)
- Lambda API + HTTP API Gateway (JWT authorizer)

See [docs/BACKEND.md](../docs/BACKEND.md) for local development.
