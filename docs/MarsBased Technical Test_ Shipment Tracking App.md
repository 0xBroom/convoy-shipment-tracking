## MarsBased Technical Test: Shipment Tracking App

## 1. What we are asking for

A proposal for how you would approach a shipment tracking app, backed by a clickable frontend prototype that demonstrates it.

We expect an understanding of the business requirements, a deliberate cut of scope, a well-built prototype, and a short written rationale. The whole exercise should fit in 8 hours of work. Judgment and polish on what you do show matter more than coverage.

## 2. Context

An industrial manufacturer ships products from several production and warehouse sites to customers and subsidiaries, domestically and internationally. They have no in-house tool that gives consolidated visibility over those shipments. Today, tracking a shipment is fragmented across each logistics operator's portal, email and phone calls.

The problem compounds because they ship from multiple sites, domestically and internationally, through several logistics operators, by road and by sea, often combining both modes within a single international shipment.

## 3. Functionality

## 3.1 Business

Give consolidated, reliable, end-to-end visibility of shipment status, unifying in a single view what is today spread across operators and inboxes. A shipment can:

- \- leave from different origin sites (factories / warehouses)

- \- go to a domestic or international destination

- \- travel with different logistics operators, by road or by sea, and combine modes (e.g. road → port → vessel → port → last-mile road)

- \- pass through different milestones depending on the mode and, internationally, through customs


Each shipping operator's information arrives in heterogeneous formats and status vocabularies. Part of the value is in normalising it and presenting it coherently.

## 3.2 Users and roles

The product serves two roles, each with its own view:

- \- Customer / subsidiary (self-service). Sees only their own shipments: status, ETA, milestones, documents, and proactive alerts when something will be late or an incident affects them. They care about clarity and confidence: is it on time, and when does it arrive?

- \- Internal operations (logistics / customer support). Sees a portfolio of shipments across sites and operators. Here the system manages by exception: it surfaces what needs attention (delay, hold, stale, customs incident) and proposes the next action (notify the customer, contact the operator, upload a document).

Each user only sees what is theirs: the customer sees their own perimeter; the internal team sees what corresponds to their site, account and role.

## 3.3 Objectives

- \- Customer: know, without calling anyone, where the shipment is, whether it is on time, and when it will arrive. Find out before things go wrong.

- \- Operations: stop chasing shipments one by one; have the system highlight what matters and guide them through resolving it.

## 3.4 AI features built into the product

The client wants AI to be a core part of this product, a way to attack the problems described above. How much AI, where in the experience and in what form is your call, and we will ask you to justify it. These are examples of the kind of value we mean, not a closed checklist:

- \- Exception management: the system highlights shipments at risk or with an incident, instead of forcing the user to go looking for them.

- \- ETA and risk prediction: estimating delays and warning before a shipment misses its date.


- \- Smart consolidation: unifying milestones from several operators and modes into one coherent timeline per shipment.

- \- Summaries and next action: "today: 3 at risk, 1 held at customs, 2 delivered", with a proposed action for each case.

- \- Natural language search: "shipments to France this week running late", "what's going on with order 12345?".

- \- Customer anticipation: understandable proactive notices. "Your shipment will arrive 2 days later due to an incident at the port; new estimated date: …".

## 3.5 Domain challenges

- \- Heterogeneity of operators and status formats; different milestones per mode (road vs sea).

- \- Multimodal and international: combined modes and customs within a single shipment.

- \- Multi-site: several points of origin.

- \- Freshness / real time: statuses change. How does the view refresh and notify?

- \- Reliability: never invent statuses or ETAs; distinguish confirmed data from estimation.

## 4. Scope

You decide what to go deep on and what to leave out, and you justify it. That judgment is part of what we evaluate. Some guidance so the result is evaluable:

- \- The prototype should let us run a demo of the features you are proposing.

- \- Show enough of both roles for us to understand how the product serves each of them.

- \- Make sure the AI features are shown in the prototype, end to end.

## 5. Constraints

- \- Frontend only: No backend, no database, no real integrations. Everything is mocked.

- \- Synthetic data only: No real or personal data. Invent the sites, operators, routes, shipments and documents you need.


- \- Simulated AI: The AI outputs in the prototype can be hardcoded or driven by mock logic. What we want to see is where the AI adds value in the experience and how it is presented. Your write-up should explain how you would take it to production.

- \- Use AI coding tools: We expect it. This scope is not achievable in 8 hours otherwise.

- \- Your own UI and design criteria: There is no brand guide or design system to follow.

- \- Free stack: Pick whatever lets you move fastest and justify it briefly.

- \- Effort: 8 hours max.

## 6. Deliverables

## 6.1 Prototype (Git repository)

A repository we can access, containing the frontend prototype. No deployment required. We will run it locally.

## 6.2 Write-up (max. 4 pages)

A short document sent to us, covering:

- \- The cut you chose and why

- \- Where and how the AI adds value to the product

- \- Technical approach / architecture

- \- Assumptions, limitations and next steps

Being concise counts in your favour.
