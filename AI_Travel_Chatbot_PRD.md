# Product Requirements Document (PRD)
## AI-Powered Conversational Lead Engine for Tour & Travel Agencies

| | |
|---|---|
| **Document Owner** | Amit |
| **Version** | 1.0 |
| **Status** | Draft for Development |
| **Last Updated** | July 23, 2026 |

---

## 1. Executive Summary

Tour and travel agencies generate high volumes of leads through social media (Facebook/Instagram ads, organic posts, WhatsApp forwards) but lack the manpower to respond instantly, answer repetitive package queries, and separate serious buyers from casual browsers. This results in lost conversions, delayed responses, and no structured system to prioritize sales follow-up.

This product is an **AI-powered conversational system** that acts as a 24/7 virtual travel receptionist. It answers customer queries about tour packages using real-time, agency-uploaded data (never hallucinated or stale information), naturally captures lead contact details mid-conversation, and automatically scores/categorizes leads (Hot / Warm / Cold) based on conversational signals — all surfaced through a centralized admin panel where the agency owner manages packages, reviews leads, and tracks performance.

The system is built on a **structured-data-first architecture** (not classic vector RAG) with LLM function-calling as the reasoning/orchestration layer, ensuring factual accuracy on prices, itineraries, and availability while retaining natural, human-like conversational quality.

---

## 2. Problem Statement

| Current Pain Point | Impact |
|---|---|
| Leads come from multiple social channels (FB/IG ads, DMs, comments) at unpredictable times | Delayed first response = lost trust and lost conversion |
| Agency staff manually answers repetitive questions (price, days, inclusions) for every package | High operational overhead, slow response, staff burnout |
| No systematic way to identify serious buyers vs casual browsers | Sales team wastes time on cold leads, misses hot ones |
| No centralized record of conversations/leads | Leads get lost, no follow-up accountability |
| Package details change frequently (price, availability) | Manual updates across multiple channels are error-prone |

---

## 3. Goals & Objectives

### Primary Goals
1. Provide instant, accurate, 24/7 responses to customer queries about tour packages.
2. Automatically capture and qualify leads (name, contact number, interest, budget, urgency).
3. Classify every lead as **Hot / Warm / Cold** based on real conversational signals, not rigid rules.
4. Give the agency owner a single admin panel to manage packages, view leads, and analyze performance.
5. Ensure the AI **only responds with data on currently active packages** — no stale/inactive package information reaches customers.

### Success Criteria (tied to KPIs — see Section 12)
- Reduce average first-response time to under 5 seconds.
- Increase lead capture rate (conversation → name+number captured) to 40%+.
- Achieve 85%+ factual accuracy on package-detail queries (validated via QA sampling).
- Reduce agency staff manual query-handling time by 60%+.

---

## 4. Target Users

| User Type | Description | Needs |
|---|---|---|
| **End Customer (Lead)** | Person who clicked a social media ad or landing page, wants tour info | Fast, accurate, friendly answers; low-friction way to share contact info |
| **Agency Owner / Admin** | Manages the business | Easy package upload, lead visibility, performance analytics, minimal technical burden |
| **Sales Agent (optional, multi-user)** | Follows up on leads | Assigned leads, conversation context, follow-up reminders |

---

## 5. Product Scope

### In Scope (Phase 1 — MVP)
- Web-based conversational chat widget (landing page, opened via social ad redirect)
- LLM-powered response engine using structured package data (function/tool calling)
- Real-time lead capture (name + number) after initial value delivery
- Automatic lead scoring (Hot/Warm/Cold) via hybrid AI + rule-based logic
- Admin panel: Package Management, Lead Management, Chat Logs, Basic Dashboard
- Active/Inactive package filtering — AI never surfaces inactive packages
- Secure multi-user concurrent chat handling

### Out of Scope (Phase 1, planned for later phases)
- WhatsApp Business API integration (Phase 2)
- Payment gateway / online booking (Phase 2)
- Voice-based assistant (Phase 3)
- Multi-language regional support beyond English/Hindi/Hinglish (Phase 2)
- CRM export integrations (Phase 2)

---

## 6. User Personas & Journey

### Persona: "Riya" — potential customer
Clicks a Facebook ad for "Kerala Family Packages." Lands on a page where a chat window is already open with a warm greeting. Asks a couple of questions in casual Hinglish. Gets a clear, friendly, accurate answer with 2-3 matching package options. Bot asks for her name and number to send the detailed itinerary. She provides it. A human agent calls her within the hour.

### Persona: "Mr. Sharma" — agency owner
Logs into the admin panel every morning. Sees overnight leads sorted by Hot/Warm/Cold. Opens a hot lead, reads the AI-generated conversation summary, and calls the customer directly — no need to re-read the full chat. Uploads a new "Goa Monsoon Special" package by filling a simple form; it goes live in the chatbot instantly.

---

## 7. Conversational AI Design Principles

The chatbot must feel like a **skilled human travel agency receptionist**, not a rigid rule-based bot. Design principles:

1. **Warm, professional, consultative tone** — not robotic, not overly casual. Uses natural greetings, empathetic phrasing, and light enthusiasm about destinations (without being salesy or exaggerated).
2. **Never says "I don't know" flatly** — if information is unavailable, it gracefully offers to connect the customer with a human agent or suggests closest alternatives.
3. **Asks clarifying questions before guessing** — e.g., if budget/destination is missing, it asks rather than assumes.
4. **Delivers value before asking for contact info** — answers the customer's first genuine query fully, then naturally transitions into asking for name/number (e.g., to "send the full itinerary" or "check live availability").
5. **Never fabricates data** — all package facts (price, days, inclusions) come strictly from the structured database via function calls; the LLM only handles language generation and reasoning, never invents numbers.
6. **Only discusses currently active packages** — inactive/sold-out packages are excluded at the database query level, never passed to the LLM as context.
7. **Multilingual comfort** — understands and responds naturally in English, Hindi, and Hinglish mixed input, matching the customer's tone.
8. **Graceful escalation** — if a conversation shows frustration, confusion, or repeated unresolved queries, the bot proactively offers a human callback.

---

## 8. System Architecture

### 8.1 High-Level Architecture

```
[Facebook/Instagram Ad]
        │
        ▼
[Landing Page + Chat Widget (React)]
        │  (HTTPS, WSS for real-time)
        ▼
[API Gateway]
   • Auth & session tokens
   • Rate limiting (per-IP, per-session)
   • Request validation & sanitization
   • Routing to backend services
   • DDoS protection
        │
        ▼
[Conversation Orchestration Service]
   • Manages conversation state per session
   • Calls LLM with function-calling schema
   • Executes function calls (package search, FAQ lookup)
   • Streams response back to client
        │
        ├──► [LLM Provider API] (response generation + structured extraction)
        │
        ├──► [Structured Database] (Packages, Leads, Conversations)
        │        - Only ACTIVE packages queryable by chat layer
        │
        ├──► [Lead Scoring Service] (async, runs per turn or per session)
        │
        └──► [Redis Cache Layer] (session state, frequent package queries)
        │
        ▼
[Admin Panel (React Dashboard)]
   • Package Management
   • Lead Management & Analytics
   • Chat Logs
   • Settings
        │
        ▼
[Notification Service]
   • Alerts agent on Hot Lead (Email/SMS/Push)
```

### 8.2 Why API Gateway Is Critical
- **Single entry point** for all client requests (web widget + future WhatsApp + admin panel), simplifying security policy enforcement.
- **Rate limiting & abuse protection** — prevents bot/script abuse of the LLM endpoint (which has real per-call cost).
- **Authentication** — session tokens for anonymous chat users, JWT-based auth for admin/agent users.
- **Request routing** — enables scaling individual services independently (chat service vs admin service vs lead-scoring service).
- **Logging & observability** — centralized point to monitor latency, errors, and traffic patterns.

Recommended: **Kong**, **AWS API Gateway**, or **NGINX + custom middleware** depending on hosting choice.

### 8.3 Why Structured Data + LLM Function-Calling (not pure RAG)
Tour package data is highly structured and query patterns are filter-based (budget, days, destination, food type). Vector-based RAG is optimized for semantic similarity over unstructured prose and is unreliable for precise numeric/categorical filtering — it can hallucinate or mismatch prices and durations.

**Approach:**
- LLM performs **natural language understanding** and emits structured function calls (e.g., `search_packages({destination, budget, days, food_type})`).
- Backend executes this as a **parameterized SQL/DB query** against the structured `packages` table, filtered by `status = 'active'`.
- LLM receives the real query results and generates the final natural-language response — grounding every fact in verified data.
- A lightweight RAG layer is reserved only for unstructured content (FAQs, visa info, cancellation policy documents) where semantic search is genuinely useful.

This hybrid gives **conversational flexibility with factual guarantees**.

---

## 9. Functional Requirements

### 9.1 Customer-Facing Chat System

| ID | Requirement |
|---|---|
| FR-1 | Chat widget loads instantly on landing page (auto-open, no extra click) |
| FR-2 | Bot responds to free-text queries about destinations, packages, pricing, inclusions, itinerary, availability |
| FR-3 | Bot uses function-calling to query structured package DB; never fabricates package facts |
| FR-4 | Only packages with `status = active` are ever retrieved or mentioned |
| FR-5 | Bot asks clarifying questions when query is ambiguous (missing budget/destination/dates) |
| FR-6 | After delivering a substantive answer, bot naturally requests name + phone number |
| FR-7 | Conversation history persists within a session; context carries across multiple turns |
| FR-8 | Bot supports English, Hindi, and Hinglish input/output |
| FR-9 | If bot cannot resolve a query, it offers human agent callback and logs it as "unresolved" |
| FR-10 | All conversations are logged in full (timestamped, per session) for admin review |
| FR-11 | System supports concurrent multi-user sessions without cross-contamination of context |

### 9.2 Lead Capture & Scoring

| ID | Requirement |
|---|---|
| FR-12 | Extract structured intent (destination, budget, dates, group size, package interest) from each message via LLM extraction call |
| FR-13 | Match extracted intent against package DB to identify `matched_package_ids` |
| FR-14 | Track cumulative interest signals across the conversation (repeated mentions, follow-up questions, specific package clicks) |
| FR-15 | Compute lead score (Hot/Warm/Cold) using hybrid logic: LLM-based signal classification + rule-based weighting (see Section 10) |
| FR-16 | Store lead record: name, number, source campaign, matched packages, score, AI-generated summary, full transcript |
| FR-17 | Trigger real-time notification to agency owner/agent when a lead is scored Hot |
| FR-18 | Allow manual override of AI-assigned lead score by admin/agent |

### 9.3 Admin Panel

| Module | Key Features |
|---|---|
| **Dashboard** | Real-time stats: total leads, hot/warm/cold split, active conversations, conversion funnel |
| **Package Management** | Add/edit/delete packages (name, destination, days, price, meals, hotel category, inclusions/exclusions, itinerary builder, media upload, availability, active/inactive toggle), bulk CSV import |
| **Lead Management** | Sortable/filterable lead table, lead detail view with full transcript + AI summary, manual tagging, notes, follow-up reminders, agent assignment |
| **Chat Logs** | Full searchable conversation history, flag unresolved/low-confidence conversations for review |
| **Analytics** | Leads over time, conversion funnel, campaign-wise lead quality, popular packages, drop-off analysis |
| **Bot Settings** | Greeting message, tone/persona tuning, FAQ management, business hours, escalation contact |
| **Scoring Rules** | Adjustable weightage for what constitutes Hot/Warm/Cold (owner-configurable, no code needed) |
| **Team Management** | Add agents, role-based access control, activity logs |

---

## 10. Lead Scoring Logic

Hybrid model — **not purely rule-based, not purely AI-guessed.**

### Signal Categories & Example Weights (owner-configurable in admin panel)

| Signal | Example Weight | Source |
|---|---|---|
| Specific package explicitly asked about | +20 | Rule (keyword/entity match) |
| Budget mentioned | +15 | LLM extraction |
| Travel date within 30 days | +25 | LLM extraction |
| Group size / family details shared | +10 | LLM extraction |
| Repeated engagement (3+ follow-up questions on same package) | +15 | Conversation tracking |
| Name + number provided | +20 | Direct capture |
| Asked about payment/booking process | +25 | LLM intent classification |
| Vague/single-message browsing, no details given | -10 | Rule |
| No response to clarifying questions | -15 | Conversation tracking |

**Scoring bands (configurable):**
- **Hot (70–100):** Immediate agent notification, top of lead queue
- **Warm (35–69):** Daily follow-up queue
- **Cold (0–34):** Nurture list, low-priority follow-up or automated re-engagement later

The LLM performs an **end-of-turn (or end-of-session) classification pass**, cross-checked against the rule-based score for consistency — preventing purely subjective AI misjudgment while still capturing conversational nuance.

---

## 11. Non-Functional Requirements

### 11.1 Latency & Performance
- Target **first-token response time < 1.5 seconds**, full response < 4 seconds under normal load.
- Streaming responses (token-by-token) to reduce perceived latency, not blocking on full LLM generation.
- Redis caching for frequently repeated package queries and session state to reduce DB round-trips.
- Async processing for lead scoring/extraction — must **not block the customer-facing response**.

### 11.2 Scalability
- Stateless conversation orchestration service — horizontally scalable behind the API Gateway/load balancer.
- Database read replicas for high-read package queries.
- Queue-based architecture (e.g., message queue for lead-scoring jobs) to decouple heavy async tasks from real-time chat path.
- Designed to handle concurrent multi-user sessions independently — each session isolated by unique session ID, no shared mutable state.

### 11.3 Security
- All traffic over HTTPS/WSS; TLS termination at API Gateway.
- Rate limiting per IP/session to prevent abuse and control LLM API cost exposure.
- Input sanitization on all user messages before any DB query construction (parameterized queries only — never raw SQL from LLM output).
- PII (name, phone number) encrypted at rest; access restricted by role-based permissions in admin panel.
- JWT-based authentication for admin/agent panel access; anonymous session tokens (short-lived) for customer chat.
- Audit logging for all admin actions (package edits, lead status changes).
- Compliance consideration: data handling aligned with applicable Indian data protection regulations (DPDP Act) for customer PII.

### 11.4 Reliability
- Graceful degradation: if LLM API is slow/unavailable, fallback to a cached FAQ response or "connecting you to an agent" message — never leave the user with no response.
- Health checks and auto-restart for all backend services.
- Database backups (daily) and point-in-time recovery.

### 11.5 Accuracy
- Zero tolerance for hallucinated prices/itinerary details — enforced structurally via function-calling grounding, not just prompting.
- Inactive packages excluded at the query layer, not just the prompt layer (defense in depth).
- Periodic QA sampling of chat logs to catch and correct systematic errors.

---

## 12. Key Performance Indicators (KPIs)

| Metric | Target |
|---|---|
| Average first-response latency | < 2 seconds |
| Lead capture rate (conversation → name+number) | ≥ 40% |
| Hot lead identification accuracy (validated by sales team feedback) | ≥ 80% |
| Factual accuracy on package queries | ≥ 95% |
| System uptime | ≥ 99.5% |
| Concurrent session handling | 500+ simultaneous sessions (MVP target) |
| Reduction in manual query handling time | ≥ 60% |

---

## 13. Data Model (Core Entities)

**Package**
`id, name, destination, category, min_days, max_days, price_per_person, child_price, hotel_category, meals_included, inclusions[], exclusions[], itinerary[], media[], available_dates[], group_size_limit, status(active/inactive), created_at, updated_at`

**Lead**
`id, name, phone_number, source_campaign, session_id, matched_package_ids[], primary_interest, budget_mentioned, travel_date_mentioned, group_size, score, score_band(hot/warm/cold), ai_summary, assigned_agent_id, status(new/contacted/converted/lost), notes, created_at, updated_at`

**Conversation**
`id, lead_id, session_id, messages[](role, content, timestamp), resolved(boolean), flagged_for_review(boolean), created_at`

**Agent/User**
`id, name, email, role(owner/agent), assigned_lead_ids[], created_at`

---

## 14. Technology Stack Recommendation

| Layer | Recommendation | Rationale |
|---|---|---|
| Frontend (Chat Widget + Admin) | React + Tailwind | Aligns with existing skillset |
| API Gateway | NGINX / AWS API Gateway / Kong | Rate limiting, auth, routing |
| Backend | Node.js (Express/Fastify) | Async-friendly, good LLM SDK support |
| Database | PostgreSQL (or Supabase for managed Postgres + realtime) | Native support for complex multi-condition relational queries (destination + days + budget + food type), stronger fit than Firestore for this filtering pattern |
| Cache/Session Store | Redis | Low-latency session state, query caching |
| LLM Provider | Claude API (function/tool calling + streaming) | Structured extraction, reliable tool use, streaming for low perceived latency |
| Queue (async lead scoring) | Redis Queue / BullMQ or AWS SQS | Decouples scoring from real-time chat path |
| Hosting | Vercel (frontend) + Render/Railway/AWS (backend) | Fits current Vercel familiarity, scalable backend options |
| Notifications | Twilio (SMS) / Firebase Cloud Messaging / Email (SendGrid) | Hot lead alerts to agents |

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM hallucinates package details | Strict function-calling grounding; never let LLM state facts not present in DB query results |
| High LLM API cost at scale | Cache common queries, rate-limit sessions, use smaller/faster model for extraction calls vs response generation |
| Latency spikes under concurrent load | Streaming responses, horizontal scaling, async decoupling of non-critical tasks (scoring) |
| Inactive package leaking into chat responses | Enforce `status=active` filter at DB query layer, not just prompt instruction (defense in depth) |
| Poor lead scoring accuracy early on | Start with conservative rule-based weights, tune using real sales feedback loop, allow manual override |
| Multilingual (Hinglish) misunderstanding | Extensive prompt testing with real customer phrasing samples; fallback clarifying questions |
| Data privacy concerns (phone numbers, PII) | Encryption at rest, RBAC, DPDP Act-aligned data handling policy |

---

## 16. Phased Roadmap

### Phase 1 — MVP (Core Loop)
- Web chat widget + landing page
- Structured package DB + admin package management
- LLM function-calling response engine
- Lead capture (name + number) + basic Hot/Warm/Cold scoring
- Admin panel: Dashboard, Package Management, Lead Management, Chat Logs

### Phase 2 — Growth Features
- WhatsApp Business API integration (nurture channel)
- Campaign/source tracking and analytics
- Configurable scoring rules UI
- Team/agent management with role-based access
- CRM export (Google Sheets / third-party CRM)

### Phase 3 — Advanced
- Payment gateway + inline booking
- Voice-based assistant support
- Predictive analytics (best time to follow up, conversion likelihood scoring)
- Multi-agency / multi-tenant SaaS support (if productizing beyond single agency)

---

## 17. Open Questions for Stakeholder Alignment
1. Will the system serve a single agency initially, or should it be architected multi-tenant (SaaS) from day one?
2. What's the expected concurrent user volume at launch, to size infrastructure correctly?
3. Should lead follow-up (post-capture) remain fully manual (agent calls), or is automated re-engagement (email/SMS drip) needed in Phase 1?
4. Preferred LLM provider/budget ceiling, since this directly affects per-conversation cost at scale?

---

*End of Document*
