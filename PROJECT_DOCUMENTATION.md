# Market Price Information Service - Backend Project Documentation

## Project Overview (Backend Perspective)
We are building a **Market Price Information Service** that collects, stores, analyzes, and distributes market prices for essential goods across multiple cities, with delivery via **web, mobile, WhatsApp, and API access**.

The backend will serve as the **central source of truth** for:
*   Market price data
*   User preferences
*   Authentication & authorization
*   Analytics & historical data
*   External access via token-based APIs

The system must support **data ingestion**, **querying**, **aggregation**, and **secure distribution**.

---

## Core Responsibilities of the Backend

### 1. Authentication & Identity (Supabase)
Use **Supabase Auth** for:
*   User registration (email / phone)
*   Login
*   Session management

**Support:**
*   Web users
*   Mobile users
*   WhatsApp-only users (linked to phone numbers)

**Enforce role separation:**
*   Regular users
*   Admins
*   API consumers (external systems)

**Supabase will also manage:**
*   Row-level security (RLS)
*   User identity linkage to preferences and subscriptions

### 2. Database & Persistence (PostgreSQL via Supabase)
The database will store:
*   Market goods and categories
*   Cities and regions
*   Market price records (time-series)
*   Data sources and metadata
*   User preferences (goods, cities, notification frequency)
*   WhatsApp/SMS delivery logs
*   Prediction outputs (later phase)
*   API access tokens and usage metrics

**Key expectations:**
*   Prices are **append-only time-series**
*   Historical integrity is critical
*   **Ability to query:**
    *   Latest price
    *   Price history
    *   Aggregates (daily, weekly, monthly)
    *   Confidence or quality indicators

**The backend developer has full freedom to:**
*   Normalize or denormalize
*   Use views, materialized views, or functions
*   Optimize for read-heavy analytics

### 3. API Layer (Node.js + GraphQL)
The backend will expose a **GraphQL API** that serves:
*   Web frontend
*   Mobile app
*   WhatsApp service
*   Admin dashboards
*   External API consumers

**Core API Responsibilities:**
*   Fetch current prices per product + city
*   Fetch historical price trends
*   Fetch user-specific dashboards
*   Manage user preferences
*   Serve analytics (percentage change, averages)
*   Serve prediction outputs (when available)

**GraphQL is chosen to:**
*   Reduce over-fetching
*   Support flexible client queries
*   Allow aggregation-heavy queries

### 4. Data Ingestion (External to Backend, Consumed by It)
Data scraping and collection will be handled by:
*   n8n workflows
*   External scraping APIs
*   Manual/admin uploads (optional)

**Backend responsibility:**
*   Provide secure ingestion endpoints
*   Validate incoming data
*   Store raw + cleaned records
*   Associate metadata (source, date, city, product)

**The backend does not scrape directly**, but must be:
*   Resilient to noisy data
*   Able to flag inconsistencies
*   Ready for reprocessing or corrections

### 5. WhatsApp & Mobile Integration (Backend-Driven)
The backend will:
*   Provide endpoints for WhatsApp Business API (Twilio, Meta, etc.)
*   Handle:
    *   Subscription-based messages
    *   On-demand WhatsApp requests
*   Format concise price summaries
*   Enforce user preferences and rate limits

**WhatsApp logic relies on:**
*   Fast access to “latest price per product per city”
*   Precomputed summaries when possible

### 6. Token-Based API Access (External Consumers)
We will expose a **public / partner API** for:
*   NGOs
*   Researchers
*   Government agencies
*   Third-party apps

**Backend must support:**
*   API tokens (read-only and scoped)
*   Rate limiting
*   Usage tracking
*   Token revocation

**Access examples:**
*   “Give me today’s maize price in Goma”
*   “Give me last 30 days of fuel prices in Kinshasa”

**GraphQL tokens should:**
*   Be independent of user sessions
*   Enforce strict data access rules

### 7. Analytics & Aggregation Support
The backend is responsible for:
*   Aggregating time-series data
*   Computing deltas and trends
*   Supporting:
    *   Daily change
    *   Weekly averages
    *   Volatility indicators

**This is required for:**
*   Web dashboards
*   Mobile app charts
*   WhatsApp alerts
*   Prediction models

**The backend should expose:**
*   Clean query surfaces for analytics
*   Efficient historical queries

### 8. Prediction Readiness (Future Phase)
Initially, predictions may be:
*   Precomputed externally (Python, ML pipelines)
*   Stored in the database

Later, the backend should:
*   Serve prediction results
*   Link predictions to products and cities
*   Include confidence intervals and time horizons

**No ML logic is required inside Node.js initially, but the system must be ML-ready.**

### 9. Security & Data Integrity
**Backend expectations:**
*   RLS via Supabase
*   Secure API token handling
*   Protection against:
    *   Data poisoning
    *   Duplicate submissions
    *   Unauthorized access
*   Full auditability:
    *   Who submitted data
    *   When it was processed
    *   Source traceability

### 10. Performance & Scalability Assumptions
**The backend should assume:**
*   Read-heavy workloads
*   Time-series growth over years
*   Multiple cities and goods expansion
*   WhatsApp bursts during market volatility

**Optimizations are encouraged but not mandated:**
*   Caching
*   Pre-aggregations
*   Indexing strategies

### 11. What This Project Is NOT
*   Not a scraping engine
*   Not a real-time trading platform
*   Not consumer e-commerce
*   Not ML-heavy in phase one

---

## Summary for the Backend Developer
**You are building:**
*   A secure, scalable data backbone
*   A GraphQL API for prices, analytics, and users
*   A token-based access layer for partners
*   A Supabase-powered auth & Postgres system
*   A system designed for historical truth, analytics, and future prediction

**You own:**
*   Data modeling decisions
*   API structure
*   Performance strategy
*   Security boundaries

**The success of the project depends on:**
Trustworthy data, clean APIs, and long-term maintainability.
