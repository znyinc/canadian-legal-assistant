# AWS Scaling Options for Canadian Legal Assistant

> **Audience**: Engineering team evaluating AWS as the cloud of choice.  
> **Current stack**: Node.js/Express backend · React/Vite frontend · SQLite (Prisma) · Docker Compose

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend Scaling – Static Hosting + CDN](#2-frontend-scaling--static-hosting--cdn)
3. [Backend / API Scaling](#3-backend--api-scaling)
   - [3.1 Containers on ECS Fargate](#31-containers-on-ecs-fargate)
   - [3.2 Containers on EKS (Kubernetes)](#32-containers-on-eks-kubernetes)
   - [3.3 Serverless with AWS Lambda](#33-serverless-with-aws-lambda)
   - [3.4 EC2 with Auto Scaling Groups](#34-ec2-with-auto-scaling-groups)
4. [Database Scaling – Migrate Away from SQLite](#4-database-scaling--migrate-away-from-sqlite)
   - [4.1 Amazon RDS (PostgreSQL / MySQL)](#41-amazon-rds-postgresql--mysql)
   - [4.2 Amazon Aurora Serverless v2](#42-amazon-aurora-serverless-v2)
   - [4.3 Amazon DynamoDB (NoSQL option)](#43-amazon-dynamodb-nosql-option)
5. [File / Evidence Storage – Replace Local Filesystem](#5-file--evidence-storage--replace-local-filesystem)
6. [Caching Layer – ElastiCache (Redis)](#6-caching-layer--elasticache-redis)
7. [Async Processing – SQS + Worker Pool](#7-async-processing--sqs--worker-pool)
8. [Load Balancing and Ingress](#8-load-balancing-and-ingress)
9. [Observability and Auto-Scaling Policies](#9-observability-and-auto-scaling-policies)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Recommended Scaling Tiers](#11-recommended-scaling-tiers)
12. [Migration Checklist](#12-migration-checklist)

---

## 1. Architecture Overview

The diagram below shows the target AWS architecture for a production-ready, horizontally scalable deployment.

```
 Users
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Amazon CloudFront (CDN)                                        │
│  • Caches React SPA from S3                                     │
│  • Edge terminates HTTPS (ACM cert)                             │
│  • WAF rules protect /api/*                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
               ┌─────────┴──────────┐
               │                    │
          Static assets          API requests
               │                    │
               ▼                    ▼
        ┌────────────┐     ┌─────────────────┐
        │   S3       │     │ Application LB  │
        │  (SPA)     │     │ (ALB / HTTPS)   │
        └────────────┘     └────────┬────────┘
                                    │
                       ┌────────────▼───────────┐
                       │  ECS Fargate Service    │
                       │  (backend containers)   │
                       │  • Min: 2 tasks         │
                       │  • Max: 20 tasks        │
                       │  • Target tracking on   │
                       │    CPU / request count  │
                       └────┬───────────┬────────┘
                            │           │
                   ┌────────▼──┐  ┌─────▼──────────┐
                   │  Aurora   │  │  ElastiCache    │
                   │  Serverless│  │  (Redis)        │
                   │  (Postgres)│  │  session cache  │
                   └────────────┘  └─────────────────┘
                            │
                   ┌────────▼──────────┐
                   │  Amazon S3        │
                   │  (evidence files) │
                   └───────────────────┘
```

---

## 2. Frontend Scaling – Static Hosting + CDN

The React/Vite application produces a fully static bundle. No container is needed.

| AWS Service | Role |
|---|---|
| **Amazon S3** | Host `dist/` bundle (static website hosting enabled) |
| **Amazon CloudFront** | Global CDN with edge caches; HTTPS via ACM; custom domain |
| **AWS WAF** | Rate limiting, IP block lists, OWASP rule sets on `/api/*` |
| **AWS Certificate Manager** | Free TLS certificates, auto-renewed |

### Why this beats a container for the frontend

- Zero ongoing compute cost (pay per GB transferred).
- Globally distributed automatically – Canadian users get content from the nearest edge (Montreal, Toronto).
- Blue/green deploys: upload new `dist/` to S3, invalidate CloudFront cache.

### Deployment snippet

```yaml
# Example CDK / CloudFormation fragment
S3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    WebsiteConfiguration:
      IndexDocument: index.html
      ErrorDocument: index.html   # SPA fallback

CloudFrontDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      DefaultCacheBehavior:
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: !Ref CachingOptimized
      Origins:
        - DomainName: !GetAtt S3Bucket.RegionalDomainName
```

---

## 3. Backend / API Scaling

### 3.1 Containers on ECS Fargate *(Recommended)*

**What it is**: AWS-managed container runtime – no EC2 instances to patch or resize.

**How scaling works**:

| Scaling type | Mechanism |
|---|---|
| **Horizontal (scale-out)** | ECS Application Auto Scaling adds/removes tasks |
| **Target Tracking** | Keep average CPU ≤ 60% or ALB `RequestCountPerTarget` ≤ 300 |
| **Step Scaling** | Add 2 tasks when CPU > 80% for 1 minute; remove 1 task when CPU < 40% |
| **Scheduled Scaling** | Pre-scale before known peak hours (e.g., business hours in Ontario) |

**Minimum footprint for HA**: 2 tasks in 2 different Availability Zones.

**Configuration example** (AWS CLI / CDK):

```json
{
  "ServiceName": "legal-backend",
  "MinCapacity": 2,
  "MaxCapacity": 20,
  "ScalableDimension": "ecs:service:DesiredCount",
  "TargetTrackingScalingPolicies": [
    {
      "PolicyName": "cpu-tracking",
      "TargetValue": 60.0,
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  ]
}
```

**Cost model**: Pay only for vCPU/memory per second while tasks run.

---

### 3.2 Containers on EKS (Kubernetes)

Use when the team already operates Kubernetes or needs advanced traffic management (Istio, canary releases, Horizontal Pod Autoscaler).

| Feature | Mechanism |
|---|---|
| **HPA** | `cpu`, `memory`, or custom metrics (e.g., request latency from Prometheus) |
| **KEDA** | Event-driven autoscaling from SQS queue depth |
| **Cluster Autoscaler / Karpenter** | Adds/removes EC2 nodes automatically |
| **Vertical Pod Autoscaler** | Right-sizes container resource requests |

**Trade-off vs. Fargate**: More control, more operational overhead. Recommended if Phase 3 agents introduce polyglot services (Python ML workers, etc.).

---

### 3.3 Serverless with AWS Lambda

Best for **infrequent workloads** or specific processing steps rather than the main Express API (Lambda cold starts add latency; long-lived WebSocket connections are not native).

| Use case | Lambda fit |
|---|---|
| Document package generation (async, bursty) | ✅ Excellent |
| Evidence PII redaction pipeline | ✅ Excellent |
| CanLII case-law search | ✅ Good (stateless) |
| Main REST API (synchronous, low-latency) | ⚠️ Acceptable with provisioned concurrency |

**Scaling**: Lambda scales to 1 000 concurrent executions per region by default (adjustable via Service Quotas). No configuration needed.

**AWS Lambda Power Tuning** can identify the ideal memory allocation (128 MB–10 GB) for cost-vs-speed optimization.

---

### 3.4 EC2 with Auto Scaling Groups

Use only when specialized hardware is needed (GPU instances for future AI inference, memory-optimized for large evidence processing).

| Scaling type | Mechanism |
|---|---|
| **Launch Template** | Define AMI, instance type, user data script |
| **Target Tracking** | Scale on CPU, ALB requests, or custom CloudWatch metric |
| **Predictive Scaling** | ML-based, forecasts demand 48 h ahead |
| **Warm Pools** | Pre-initialized instances reduce scale-out latency from ~5 min to <30 s |

---

## 4. Database Scaling – Migrate Away from SQLite

SQLite is single-file and cannot be shared across multiple containers. It must be replaced before horizontal scaling.

### 4.1 Amazon RDS (PostgreSQL / MySQL)

**Recommended for most scenarios** – minimal code change (Prisma supports PostgreSQL natively).

| Feature | Detail |
|---|---|
| **Vertical scaling** | Change instance class with minimal downtime (Multi-AZ failover <60 s) |
| **Read Replicas** | Up to 15 read replicas; route `SELECT` queries to replicas via a read endpoint |
| **Multi-AZ** | Synchronous standby in a second AZ; automatic failover |
| **Storage Auto Scaling** | Grows up to a configured maximum, no manual intervention |
| **Proxy (RDS Proxy)** | Connection pooling – critical when ECS scales to 20+ tasks each opening DB connections |

**Prisma migration**: Change one line in `schema.prisma`:

```diff
datasource db {
-  provider = "sqlite"
-  url      = "file:./dev.db"
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
}
```

Run `npx prisma migrate deploy` against the new RDS endpoint.

---

### 4.2 Amazon Aurora Serverless v2

**Best fit if traffic is spiky** (e.g., evenings/weekends when people file legal matters).

| Feature | Detail |
|---|---|
| **Capacity Units** | Scales from 0.5 ACU to 128 ACU in <1 s increments |
| **Minimum capacity** | Aurora Serverless v2 always maintains at least 0.5 ACU — it does **not** scale to zero. Only Aurora Serverless v1 can scale to zero (with a cold-start penalty). |
| **Global Database** | Multi-region active-active replication (<1 s lag) |
| **API Gateway integration** | HTTP-based Data API for Lambda without persistent connections |

**Cost advantage**: You pay per ACU-hour only during active scaling. Idle costs are ~$0.06/hr (0.5 ACU × $0.12/ACU-hour).

---

### 4.3 Amazon DynamoDB (NoSQL option)

Consider for the **audit log** and **evidence index** tables which are append-heavy and do not need complex joins.

| Feature | Detail |
|---|---|
| **On-Demand mode** | Scales to any traffic level with no capacity planning |
| **Provisioned + Auto Scaling** | Set min/max RCU/WCU; target tracking maintains utilization |
| **Global Tables** | Multi-region replication for DR or regional data residency |
| **TTL** | Built-in item expiry – perfect for 60-day evidence retention policy |

> **Data residency note**: DynamoDB Global Tables can be configured to keep audit data within the `ca-central-1` region (Montreal) to satisfy Canadian data residency requirements.

---

## 5. File / Evidence Storage – Replace Local Filesystem

Currently evidence files land in `./backend/uploads/:matterId/`. This breaks with multiple containers.

**Solution: Amazon S3 + pre-signed URLs**

```
User ──upload──► Backend API ──PutObject──► S3 bucket
                              ──presign──►  S3 (direct download link)
```

| Feature | Detail |
|---|---|
| **Infinite capacity** | No disk management |
| **Versioning** | Keeps previous file versions (useful for legal evidence integrity) |
| **Object Lock (WORM)** | Tamper-proof storage for legal hold items |
| **Server-Side Encryption** | SSE-S3 (free) or SSE-KMS (HIPAA/compliance grade) |
| **Intelligent-Tiering** | Automatically moves rarely accessed evidence to cheaper storage tiers |
| **Transfer Acceleration** | Faster uploads from clients across Canada |

**Code change needed** (backend `routes/evidence.ts`): replace `multer` disk storage with `@aws-sdk/client-s3` multipart upload. Pre-signed URLs let the frontend upload directly to S3, bypassing the API container entirely for large files.

**Bucket policy for legal hold matters**:

```json
{
  "Effect": "Deny",
  "Action": "s3:DeleteObject",
  "Condition": {
    "StringEquals": { "s3:prefix": "matters/LEGAL_HOLD_*" }
  }
}
```

---

## 6. Caching Layer – ElastiCache (Redis)

| What to cache | TTL suggestion |
|---|---|
| CanLII case-law search results | 24 h (static legal text changes rarely) |
| Authority registry lookups | 1 h |
| Session / API key validation | Per session lifetime |
| Matter classification results | 10 min (allow re-classification) |

**Scaling options**:

| Mode | Detail |
|---|---|
| **Cluster Mode Disabled** | Primary + up to 5 read replicas; manual shard resizing |
| **Cluster Mode Enabled** | Up to 500 shards, 90 TB memory; transparent horizontal scaling |
| **Serverless (new)** | ElastiCache Serverless – scales from zero, pay per GB-ECU; best for spiky workloads |

---

## 7. Async Processing – SQS + Worker Pool

Document generation (PDF/A compliance checks, evidence packaging, PII redaction) can take several seconds. Offloading to a queue prevents API timeouts and allows burst absorption.

```
POST /api/documents/:matterId/generate
         │
         ▼
    SQS Queue  ◄─────── Dead-Letter Queue (failed jobs)
         │
         ▼
  ECS Worker Service     ← scales on ApproximateNumberOfMessagesVisible
         │
         ▼
    S3 (results)  +  RDS (Document record update)
         │
         ▼
  WebSocket / polling  ─► Frontend (progress updates)
```

**Auto Scaling trigger**: Scale ECS worker tasks when `ApproximateNumberOfMessagesVisible > 50` (add 1 task per 50 messages, max 10 tasks). Tune this threshold based on your average message processing time — a lower threshold reduces latency but risks scaling churn on bursty queues.

---

## 8. Load Balancing and Ingress

| Component | Service | Notes |
|---|---|---|
| **HTTPS termination** | Application Load Balancer (ALB) | ACM certificate, HTTP→HTTPS redirect |
| **Path-based routing** | ALB Listener Rules | `/api/*` → ECS backend; `/*` → CloudFront (SPA) |
| **Health checks** | ALB Target Group | `GET /health` returns 200; unhealthy tasks deregistered |
| **Sticky sessions** | ALB (optional) | Not required; backend is stateless |
| **WebSockets** | ALB supports `ws://` upgrade | Required for Phase 3 agentic kit progress streaming |

**Health check endpoint** to add in `backend/src/server.ts`:

```typescript
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.npm_package_version });
});
```

---

## 9. Observability and Auto-Scaling Policies

### Key Metrics to Alarm On

| Metric | Alarm threshold | Action |
|---|---|---|
| `ECS CPUUtilization` | > 70% for 2 min | Scale out +2 tasks |
| `ECS MemoryUtilization` | > 80% for 2 min | Scale out +1 task |
| `ALB RequestCountPerTarget` | > 500 req/min/target | Scale out +2 tasks |
| `RDS DatabaseConnections` | > 80% of max_connections | Add read replica |
| `SQS ApproximateAgeOfOldestMessage` | > 60 s | Alert on-call |
| `S3 5xxErrors` | Any | Alert immediately |

### CloudWatch Dashboards

Recommended widgets per environment:
- **API latency** (p50, p95, p99) from ALB access logs
- **ECS task count** over time
- **DB connection pool** (via RDS Enhanced Monitoring)
- **SQS queue depth** for document generation worker
- **CloudFront cache hit ratio** (target: > 90%)

### AWS X-Ray

Add `aws-xray-sdk-node` to the backend to trace end-to-end latency across ALB → ECS → RDS → S3. Particularly useful for diagnosing slow document generation paths.

---

## 10. CI/CD Pipeline

| Stage | AWS Service | Detail |
|---|---|---|
| **Source** | GitHub (existing) | CodePipeline webhook on `main` branch |
| **Build** | AWS CodeBuild | Run `npm test`, `npm run build`, `docker build` |
| **Scan** | Amazon Inspector / Snyk | Container image CVE scan before push |
| **Push** | Amazon ECR | Private container registry; image scanning on push |
| **Deploy** | CodeDeploy (ECS) | Blue/Green deployment; automatic rollback on alarm |
| **Smoke test** | CodeBuild post-deploy | Hit `/health` and a sample API endpoint |

**Blue/Green ECS deployment**: New tasks start alongside old ones; ALB shifts traffic 10% → 50% → 100% over a configurable interval. If p99 latency spikes, CodeDeploy rolls back automatically.

---

## 11. Recommended Scaling Tiers

### Tier 1 – MVP / Low Traffic (<1 000 users/day)

| Component | Option | Approx. cost/month |
|---|---|---|
| Frontend | S3 + CloudFront | ~$2–5 |
| Backend | ECS Fargate, 2 × 0.5 vCPU / 1 GB | ~$25–40 |
| Database | RDS PostgreSQL db.t3.micro, Multi-AZ | ~$50 |
| Storage | S3 Standard (100 GB) | ~$3 |
| **Total** | | **~$80–100/month** |

### Tier 2 – Growth / Medium Traffic (1 000–50 000 users/day)

| Component | Option | Approx. cost/month |
|---|---|---|
| Frontend | S3 + CloudFront (higher transfer) | ~$10–30 |
| Backend | ECS Fargate, 2–8 tasks auto-scale, 1 vCPU / 2 GB | ~$100–300 |
| Database | Aurora Serverless v2 (2–16 ACU) | ~$80–250 |
| Cache | ElastiCache Serverless | ~$15–50 |
| Queue | SQS + 2 worker tasks | ~$20–50 |
| Storage | S3 Intelligent-Tiering (1 TB) | ~$25 |
| **Total** | | **~$250–700/month** |

### Tier 3 – Scale / High Traffic (>50 000 users/day) or Phase 3 AI Kits

| Component | Option | Approx. cost/month |
|---|---|---|
| Frontend | CloudFront with Shield Advanced | ~$50–150 |
| Backend | EKS Fargate or ECS, 8–50 tasks | ~$500–2 000 |
| Database | Aurora Global Database, 3 regions | ~$500–2 000 |
| Cache | ElastiCache Cluster Mode (3 shards) | ~$150–400 |
| AI inference | SageMaker Inference Endpoints (future) | ~$200–1 000 |
| **Total** | | **~$1 500–6 000/month** |

> All estimates assume `ca-central-1` (Montreal) for Canadian data residency. Use the [AWS Pricing Calculator](https://calculator.aws/pricing/2/home) for exact figures.

---

## 12. Migration Checklist

Use this checklist to move from the current Docker Compose local setup to a production AWS deployment.

### Phase A – Foundation (1–2 weeks)
- [ ] Create AWS account with billing alerts at $50, $100, $500/month
- [ ] Set up AWS Organizations with separate accounts for Dev / Staging / Prod
- [ ] Configure IAM roles (no root key usage); enable MFA on all accounts
- [ ] Create VPC with public/private/data subnets across 3 AZs in `ca-central-1`
- [ ] Enable AWS CloudTrail + Config for audit compliance

### Phase B – Database Migration (1 week)
- [ ] Provision RDS PostgreSQL (or Aurora Serverless v2) in private subnet
- [ ] Update `schema.prisma` provider to `postgresql`
- [ ] Run `npx prisma migrate deploy` against new RDS instance
- [ ] Add RDS Proxy for connection pooling
- [ ] Enable automated backups (7-day retention minimum)

### Phase C – Storage Migration (1 week)
- [ ] Create S3 bucket with versioning + Object Lock for legal hold matters
- [ ] Enable SSE-KMS encryption and bucket policy
- [ ] Refactor `backend/src/routes/evidence.ts` to use `@aws-sdk/client-s3`
- [ ] Migrate existing `./uploads` directory to S3

### Phase D – Containerisation & Deployment (1–2 weeks)
- [ ] Push backend Docker image to Amazon ECR
- [ ] Create ECS Fargate Cluster with Task Definition (env vars from Secrets Manager)
- [ ] Configure ALB with target groups and health check on `/health`
- [ ] Set up Application Auto Scaling policy (CPU target 60%)
- [ ] Deploy React SPA to S3 + CloudFront

### Phase E – Observability & Hardening (1 week)
- [ ] Create CloudWatch Dashboard with key metrics
- [ ] Set up CloudWatch Alarms → SNS → PagerDuty/email
- [ ] Enable AWS WAF on CloudFront (OWASP top 10 rule set)
- [ ] Enable GuardDuty for threat detection
- [ ] Enable Security Hub for compliance posture (CIS benchmarks)

### Phase F – CI/CD Pipeline (1 week)
- [ ] Connect GitHub Actions (existing `.github/workflows/ci.yml`) to Amazon ECR
- [ ] Configure CodeDeploy Blue/Green ECS deployment
- [ ] Add smoke-test stage post-deployment

---

## Key AWS Services Summary

| AWS Service | Purpose |
|---|---|
| **S3** | Static SPA hosting + evidence file storage |
| **CloudFront** | Global CDN, HTTPS edge, WAF |
| **ALB** | Load balancing, health checks, TLS termination |
| **ECS Fargate** | Container compute, zero node management |
| **EKS** | Kubernetes if polyglot / advanced traffic needed |
| **Lambda** | Async/event-driven processing steps |
| **RDS / Aurora** | Relational DB replacing SQLite |
| **ElastiCache** | Redis caching layer |
| **SQS** | Async document generation queue |
| **ECR** | Private container image registry |
| **Secrets Manager** | Store `DATABASE_URL`, `CANLII_API_KEY`, etc. |
| **CloudWatch** | Metrics, logs, alarms, dashboards |
| **X-Ray** | Distributed tracing |
| **WAF** | Web application firewall |
| **GuardDuty** | Threat detection |
| **ACM** | Free TLS certificates |
| **CodePipeline/Deploy** | CI/CD orchestration |

---

*Document generated: March 2026. AWS service pricing and feature availability subject to change – verify against [https://aws.amazon.com/pricing/](https://aws.amazon.com/pricing/) and [https://aws.amazon.com/new/](https://aws.amazon.com/new/) before finalizing architecture decisions.*
