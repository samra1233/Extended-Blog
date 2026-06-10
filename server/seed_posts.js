/**
 * seed_posts.js - Populate MongoDB Atlas with 5 high-quality blog posts.
 *
 * Run from the server/ directory:
 *   node seed_posts.js
 *
 * Requires MONGO_URI in .env
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

// Inline schemas to avoid circular imports when run standalone
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [] },
    coverImage: { type: String, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

const SEED_AUTHOR = {
    name: 'Alex Rivera',
    email: 'alex.rivera.seed@blogapp.internal',
    password: process.env.SEED_PASSWORD || 'SeedPass!' + Date.now(),
    bio: 'Senior software engineer writing about architecture, systems thinking, and the craft of building scalable products.',
    role: 'admin',
};

const POST1_CONTENT = [
    'Software architecture is the discipline of making decisions that are hard to reverse. Every choice about how components talk to each other, where business logic lives, and how data flows through a system becomes load-bearing structural design the moment it meets production traffic. Yet most teams treat architecture as an afterthought — something to bolt on once the MVP ships. That approach works exactly once, and only under forgiving conditions.',
    '',
    'WHY ARCHITECTURE DECISIONS COMPOUND',
    '',
    'The compounding nature of architectural debt is poorly understood. A monolith that begins as a well-factored single service will quietly accumulate coupling as teams grow. A query that runs in 80ms against 10,000 records will take 8 seconds against 1,000,000 without an index — and much worse without the right data model entirely.',
    '',
    'The key insight is that architecture is not about drawing boxes. It is about controlling coupling and preserving optionality. Every tight coupling between two modules is a tacit decision that they must evolve together forever. Optionality — the ability to swap, upgrade, or scale one component without touching others — is what makes a system genuinely resilient.',
    '',
    'LAYERED ARCHITECTURE VS. HEXAGONAL ARCHITECTURE',
    '',
    'The classic layered architecture (Presentation to Business Logic to Data Access) is a good starting point, but it struggles with two common failure modes. First, the dependency direction is ambiguous: does the business layer import from the data layer, or does the data layer implement interfaces defined by the business layer? Second, testing becomes painful without inversion of control — your unit tests drag in database drivers.',
    '',
    'Hexagonal architecture, also called ports-and-adapters, solves both problems by making the domain the center of the universe. The domain defines ports — abstract interfaces representing what it needs from the outside world (persist a post, send an email, fetch a user). Adapters are concrete implementations that plug into those ports. Your MongoDB repository, your email sender, your REST controller — all adapters. The domain never imports from them; it only knows about its own interfaces.',
    '',
    'This means your domain is testable in pure isolation. You write a fake adapter that stores data in memory and swap it during tests. The real MongoDB adapter only runs in integration tests. The productivity gain is substantial: unit tests run in milliseconds, not seconds.',
    '',
    'EVENT-DRIVEN ARCHITECTURE FOR DECOUPLED GROWTH',
    '',
    'When multiple services need to react to the same business event, synchronous HTTP calls create a web of hard dependencies. Service A calls Service B calls Service C. If C is slow, B blocks, and A times out. You have turned a distributed system into a distributed monolith with extra failure modes.',
    '',
    'Event-driven architecture decouples producers from consumers through a message bus. When a user publishes a post, the Post Service emits a PostPublished event. The Email Service, Analytics Service, and Search Indexer each subscribe and react independently. Each consumer can fail, restart, and retry without affecting the others. Adding a new consumer requires zero changes to the Post Service.',
    '',
    'The tradeoff is complexity: debugging flows across events is harder than tracing a synchronous call stack. Investing in distributed tracing from day one pays dividends when things go wrong in production.',
    '',
    'THE CAP THEOREM IN PRACTICE',
    '',
    'Brewer\'s CAP theorem states that a distributed data store can only guarantee two of three properties: Consistency, Availability, and Partition Tolerance. Because network partitions are not optional in a real distributed system (packets get lost; data centers lose connectivity), the practical choice is between Consistency and Availability during a partition.',
    '',
    'For most web applications, the correct choice is eventual consistency with availability — your MongoDB replica set will serve reads from secondary nodes even if the primary is unreachable, possibly returning slightly stale data. This is a conscious product decision masquerading as an infrastructure configuration. Making that decision explicit, documenting it, and designing UI states that tolerate stale reads is the architectural work that matters.',
    '',
    'SCALING PATTERNS YOU SHOULD KNOW',
    '',
    'Database Read Replicas: Write to a primary, read from one or more replicas. Works well when reads dramatically outnumber writes, which is true for most content-heavy applications. Add a caching layer like Redis in front of replicas for hot data.',
    '',
    'CQRS (Command Query Responsibility Segregation): Separate the model used for writes from the model used for reads. Commands (create post, like post) go through a domain model with rich validation. Queries (list posts by tag, get trending) go through a flat read model optimized for display. This allows each side to scale independently.',
    '',
    'Event Sourcing: Instead of storing current state, store every event that led to that state. The current state is a projection. You gain a complete audit log, time-travel debugging, and the ability to replay events through new projections.',
    '',
    'Horizontal Sharding: Partition data across multiple database nodes by a shard key (e.g., user ID). Each node owns a subset of records. Correctly choosing the shard key is famously difficult — the wrong choice creates hot spots and uneven distribution.',
    '',
    'PRACTICAL ADVICE FOR TEAMS',
    '',
    'Start with the simplest architecture that can handle 10x your current load. Optimize for developer cognitive overhead before optimizing for theoretical throughput. A system that your team can understand, debug, and modify confidently is healthier than an elegant distributed system that no one can reason about under pressure.',
    '',
    'Document your architectural decisions using Architecture Decision Records (ADRs). For each major choice — database engine, service boundaries, authentication mechanism — write a short document explaining the context, the options considered, the decision, and the consequences.',
    '',
    'Finally: measure before you optimize. Premature architectural complexity is just as expensive as premature optimization. Profile your application, understand where the actual bottlenecks are, and make targeted decisions. Scalability work done in response to real data is almost always better than scalability work done in anticipation of hypothetical load.',
].join('\n');

const POST2_CONTENT = [
    'Developer productivity is not primarily a function of how fast individuals type or how many hours they work. It is a function of how well the system around them — tools, processes, team structure, feedback loops — removes friction and amplifies leverage. This distinction matters enormously for anyone responsible for shipping software at scale.',
    '',
    'THE LEVERAGE PROBLEM',
    '',
    'Most productivity improvement efforts target individual behavior: time management techniques, IDE shortcuts, deep work schedules. These interventions have a ceiling. A developer who is twice as efficient by individual metrics but sits in a broken deployment pipeline, waits fifteen minutes for test feedback, or spends afternoons in status meetings is not twice as productive as their less efficient peer. The environment is the constraint.',
    '',
    'Systems thinking is the practice of identifying and addressing environment-level constraints rather than local optimizations. It asks: what is the limiting factor in the overall throughput of value delivery? Where do things wait? Where do things fail repeatedly? Where is coordination overhead concentrated?',
    '',
    'THE DORA METRICS FRAMEWORK',
    '',
    'Google\'s DevOps Research and Assessment (DORA) project identified four key metrics that correlate strongly with organizational performance in software delivery.',
    '',
    'Deployment Frequency: How often does your team deploy to production? High performers deploy multiple times per day. Low performers deploy monthly or quarterly. Frequency is a proxy for feedback loop speed and risk per deployment.',
    '',
    'Lead Time for Changes: How long from a code commit to running in production? Short lead times mean faster iteration and earlier discovery of integration issues.',
    '',
    'Change Failure Rate: What percentage of changes cause a production incident or require a rollback? High failure rates indicate insufficient testing, poor observability, or rushed deployments.',
    '',
    'Mean Time to Recovery: When something breaks, how quickly is it restored? This measures resilience and the effectiveness of your incident response.',
    '',
    'These metrics form a system. Teams that work on deployment frequency naturally improve lead time. Teams that improve lead time surface change failure rates more clearly. Better observability reduces mean time to recovery.',
    '',
    'FEEDBACK LOOP LATENCY',
    '',
    'The most pernicious productivity killer in software development is slow feedback. When a developer makes a change, the time until they know whether it broke something determines how much productive momentum they maintain. A two-second test run preserves flow state. A twenty-minute CI pipeline forces context switching.',
    '',
    'The principle to optimize for is: make bad decisions fail fast and cheap. This applies at every level. Type errors at compile time rather than runtime. Test failures locally before pushing rather than after CI runs. Feature rejection from user testing after a two-week sprint rather than after a six-month build.',
    '',
    'Investment in local development environment quality is dramatically undervalued. Engineers who struggle with unreliable local databases, inconsistent environment configurations, or slow hot-reloading spend significant portions of their days fighting the tools rather than building product. Platform engineering teams that treat internal developer experience as a product consistently produce leverage that dwarfs the cost of their own team.',
    '',
    'MANAGING COGNITIVE LOAD',
    '',
    'Working memory research observes that humans can hold roughly seven chunks of information simultaneously. Modern software systems regularly require developers to hold hundreds of interdependent concepts: the data model, the business rules, the API contract, the deployment configuration, the observability dashboard. The gap between what can be held in memory and what the system requires is bridged by documentation, code clarity, and modular design — or it collapses into error.',
    '',
    'Team topology is an architectural decision as much as a technical one. Conway\'s Law is not just an observation — it is a design tool. If you want a modular system, organize your teams so that each owns a coherent piece of the domain with minimal dependencies on other teams for daily work. Cross-team dependencies create coordination overhead that compounds with team size.',
    '',
    'THE ON-CALL TAX',
    '',
    'Production incidents are not just operational problems; they are productivity costs charged in advance against future engineering cycles. Each time a developer spends an afternoon debugging a production alert, they lose not just those hours but the context and momentum they would have otherwise maintained.',
    '',
    'Sustainable on-call practices are a productivity investment. Runbooks that allow any engineer on the team to resolve the most common incidents without waking up the domain expert. Postmortems that add permanent preventive measures rather than producing a list of action items that no one tracks. Alert thresholds calibrated to reflect genuine user impact rather than server internals.',
    '',
    'MEASURING WHAT MATTERS',
    '',
    'Velocity is the most commonly tracked productivity metric in software engineering and among the least informative. Story points represent a team\'s internal effort estimation and do not translate between teams or over time. Tracking velocity as a performance signal creates perverse incentives: inflated estimates, avoided refactoring, deferred testing.',
    '',
    'Better leading indicators include: pull request cycle time (how long from PR opened to merged), test coverage trends (not as a target, but as a health signal), deployment failure rates, and developer satisfaction scores from periodic surveys. These measure the health of your delivery system, not the behavior of individuals within it.',
    '',
    'Productivity in software is ultimately about throughput of value — features that solve real user problems, shipped reliably, with confidence in their correctness. Building the system that produces that outcome is the real work of engineering leadership.',
].join('\n');

const POST3_CONTENT = [
    'Redux became the de facto standard for React state management in 2015 and shaped an entire generation of front-end architecture. Its deterministic state transitions, time-travel debugging, and clear separation of concerns were genuine innovations. A decade later, the landscape has fragmented significantly — and for good reasons. Understanding why requires understanding what Redux was actually solving, and whether those problems still apply to your application.',
    '',
    'WHAT REDUX ACTUALLY SOLVED',
    '',
    'Redux conquered three concrete problems that plagued early React applications.',
    '',
    'Prop drilling: passing data through many layers of components that do not themselves use it, just to get it to a deeply nested child. Redux made data globally accessible without threading it through the component tree.',
    '',
    'Shared mutable state bugs: when the same data is modified from multiple places without coordination, race conditions and stale data cause subtle, hard-to-reproduce bugs. Redux\'s single store and pure reducer functions made state mutations predictable and auditable.',
    '',
    'Debugging across time: the Redux DevTools feature, which lets developers replay sequences of actions, was a genuine breakthrough for debugging complex interaction flows.',
    '',
    'THE COST REDUX ADDED',
    '',
    'Every pattern is also a burden. Redux added substantial boilerplate: actions, action creators, reducers, selectors, and middleware for every piece of async behavior. The mental model required understanding the entire data flow — dispatch, middleware, reducer, store, selector, component — before modifying even a simple piece of state.',
    '',
    'For applications with genuinely complex, shared, cross-cutting state, this overhead is justified. For a settings panel that only one screen uses, it is not. The community gradually learned to distinguish between global state (user authentication, shopping cart, active theme) and local state (whether a dropdown is open, current form input values) and to manage each category differently.',
    '',
    'REACT QUERY AND THE SERVER STATE REVELATION',
    '',
    'Tanner Linsley\'s React Query reframed a foundational question: what percentage of state in a typical React application is actually server state in disguise?',
    '',
    'Server state is data that lives on the server and must be synchronized with the client. It has its own lifecycle: it becomes stale, it needs to be refreshed, multiple components often need the same data simultaneously, and mutations need to be reflected back to the server. Redux was routinely used to manage server state, but it was not designed for it. Developers wrote custom cache invalidation logic, loading and error states, polling intervals, and optimistic updates — all by hand, for every endpoint.',
    '',
    'React Query treats server state as a first-class concern with cache management, background refetching, deduplication of duplicate requests, infinite scroll pagination, and optimistic updates built in. A common pattern is to keep React Query for server state entirely separately from a thin client-side state manager for UI state. The result is dramatically simpler code and more responsive UIs.',
    '',
    'ZUSTAND: SIMPLICITY WITHOUT SACRIFICE',
    '',
    'Zustand approaches global client state with a minimal API that removes Redux\'s ceremony without removing its core value proposition. A Zustand store is a single function call. State and actions live together. There are no actions, reducers, or dispatchers — just state and functions that modify it.',
    '',
    'Zustand uses React\'s useSyncExternalStore under the hood, ensuring that components re-render only when the specific slice of state they subscribe to changes. Performance characteristics are good out of the box.',
    '',
    'JOTAI AND RECOIL: ATOMIC STATE',
    '',
    'Facebook\'s Recoil and Daishi Kato\'s Jotai take an atomized approach: instead of one store, state is composed of many small independent atoms. Components subscribe to exactly the atoms they need. The dependency graph is computed automatically — derived state (selectors) re-compute only when their dependencies change.',
    '',
    'Atom-based state is particularly well-suited to applications with many independently-updating pieces of state: form fields, table row selection, real-time collaboration cursors. The granularity of subscriptions can produce measurably better performance than a single store, because fewer components re-render for any given state change.',
    '',
    'CONTEXT API: WHEN IS IT ENOUGH?',
    '',
    'React\'s built-in Context API is often the right answer and often misused as a poor substitute for Redux when something more capable is needed. The critical limitation: every component that consumes a context re-renders whenever any part of that context changes. Without careful memoization and value splitting, a global context with many unrelated values can cause cascading re-renders that visibly impact performance.',
    '',
    'Context API is excellent for: application theme, current authenticated user, locale/language. It is poorly suited for: frequently-changing values, large objects with many fields consumed by many components, high-frequency events like mouse position or scroll depth.',
    '',
    'CHOOSING THE RIGHT TOOL',
    '',
    'The correct state management approach depends on what kind of state you have.',
    '',
    'Server state (data from APIs): React Query or SWR. These tools were built for this and handle caching, synchronization, and error states better than hand-rolled Redux logic.',
    '',
    'Global UI state (auth, theme, modal stack): Zustand or Jotai. Minimal API, excellent performance, easy to test.',
    '',
    'Complex domain state with rich business logic: Redux Toolkit. The boilerplate has been dramatically reduced, the Immer integration makes immutable updates ergonomic, and RTK Query handles data fetching.',
    '',
    'Truly local state: React\'s useState and useReducer. Do not reach for a global store for state that is only ever needed by one component or one subtree.',
    '',
    'The anti-pattern to avoid is choosing a single solution and applying it to every category of state. Successful front-end architectures use multiple tools and apply each where it is actually well-suited. The result is code that is simpler, faster, and easier to maintain than a system that forces everything through one abstraction.',
].join('\n');

const POST4_CONTENT = [
    'Ward Cunningham coined the term "technical debt" in 1992 as a communication tool — a way to explain to non-technical stakeholders why shipping code quickly now would require extra work later. The metaphor has since been stretched, abused, and made to cover every category of code quality problem. That stretching has made the concept less useful, not more. If everything is technical debt, nothing is.',
    '',
    'This article argues for treating technical debt not as a metaphor but as a concrete engineering concept with measurable properties, deliberate acquisition patterns, and a defined repayment process.',
    '',
    'THE ORIGINAL DEFINITION AND WHAT IT ACTUALLY MEANS',
    '',
    'Cunningham\'s original framing was specific: technical debt is the cost incurred when you ship code that does not fully embody your current understanding of the problem. The "interest" on this debt is the extra effort required to work around the gap between what you built and what you now know.',
    '',
    'This distinguishes deliberate technical debt — a conscious tradeoff made with full awareness of the implications — from accidental technical debt, which is what happens when developers simply do not know better. These are fundamentally different problems with fundamentally different solutions.',
    '',
    'Deliberate debt is a financing decision. A startup choosing to skip database connection pooling to ship an MVP faster is taking out a loan against its future engineering time. If the product succeeds, they will pay it back during a scale-up phase. If the product fails, the debt is irrelevant. This is a legitimate business decision.',
    '',
    'Accidental debt is a skills and knowledge problem. A junior developer who does not know that N+1 queries will destroy performance at scale is not making a tradeoff — they just do not have the information to make the decision at all. The solution is code review, mentorship, and better tooling, not "we should prioritize debt repayment."',
    '',
    'CATEGORIES OF DEBT THAT ACTUALLY MATTER',
    '',
    'Not all code quality problems compound at the same rate. Distinguishing high-interest debt from low-interest debt allows teams to prioritize rationally rather than trying to fix everything or fix nothing.',
    '',
    'High-interest debt: Problems in heavily-trafficked, frequently-modified code paths. A tangled authentication module that every new feature must touch. A core data model with incorrect assumptions baked in. A build system that is slow and fragile. These accumulate interest rapidly because every developer who works in those areas pays the overhead daily.',
    '',
    'Low-interest debt: Messy code in a stable module that has not been modified in two years and is unlikely to change. Inconsistent naming in a utility library that works correctly. Sub-optimal SQL queries against a table that receives 100 rows per month. These are aesthetically unpleasant but economically irrelevant unless the module needs to change.',
    '',
    'Non-debt quality problems: Missing tests for new code. Security vulnerabilities. Deprecated dependencies with known CVEs. These are often lumped under "technical debt" but are more accurately categorized as risks or defects. They do not fit the debt metaphor well because they do not have a principal-plus-interest repayment structure — they have a consequence structure.',
    '',
    'VISUALIZING AND MEASURING DEBT',
    '',
    'What gets measured gets managed. Teams that treat technical debt as a vague aesthetic concern will perpetually defer it in favor of features. Teams that make it concrete — trackable, estimable, prioritizable — can actually make rational tradeoffs.',
    '',
    'Static analysis tools can identify and track code-level debt indicators over time: cyclomatic complexity, code duplication, coupling metrics, file churn rates. The most useful signal is often churn combined with complexity: files that change frequently and are complex warrant attention, because developers pay the complexity tax on every single modification.',
    '',
    'Architectural debt is harder to measure but often more consequential. It must be identified through structured technical review: services that have accumulated too many responsibilities, data models that have grown misaligned with the actual domain, integration patterns that have become synchronization bottlenecks.',
    '',
    'REPAYING DEBT STRATEGICALLY',
    '',
    'The most effective approach to technical debt is the Boy Scout Rule applied with strategic awareness: leave the code a little better than you found it, in the areas you had to touch anyway. This amortizes repayment across feature work rather than requiring dedicated refactoring sprints that are difficult to justify to product stakeholders.',
    '',
    'For high-priority debt that cannot be amortized, the strangler fig pattern is often the safest approach: build the new, correct implementation alongside the old one, progressively route traffic to the new implementation, and delete the old implementation once migration is complete. This avoids the "big rewrite" failure mode, where a complete rewrite of a large system takes far longer than estimated and leaves the team maintaining two systems in parallel indefinitely.',
    '',
    'Technical debt sprints — dedicated periods where a team focuses entirely on quality improvement — work when: the debt is specific and bounded, the team has clear acceptance criteria for what "paid off" means, and leadership genuinely commits to not inserting feature work during that period. They fail when: the debt is too large and vague, the team loses momentum without visible feature progress, or the sprint is cut short when a business priority arrives.',
    '',
    'THE ORGANIZATIONAL DIMENSION',
    '',
    'Technical debt accumulates in organizations as much as in codebases. A culture that consistently rewards feature velocity over quality creates conditions where debt spirals out of control. Engineers who raise quality concerns are overruled. Shortcuts become the norm because they are never visibly penalized until the system is so fragile that delivery grinds to a halt.',
    '',
    'The counterweight is making quality costs visible to decision-makers. When proposing a feature build that will require working in a heavily-indebted module, make the overhead explicit: "This will take three weeks instead of one because of the existing complexity in this area. For reference, here is the same feature in a module we refactored last quarter — that took five days." Over time, this data builds the organizational case for investing in quality as a prerequisite for delivery speed.',
    '',
    'Technical debt is real. It compounds. It can be measured, prioritized, and strategically repaid. Treating it as a vague, perpetually-deferred concern is the most expensive approach of all.',
].join('\n');

const POST5_CONTENT = [
    'Most backend services start on a single server. This is correct. A single server is easy to understand, easy to deploy, easy to debug, and cheap to operate. The engineering challenge is knowing when that single server has become a constraint, understanding what options exist at each stage of growth, and making the transition to each new scale level without catastrophic disruption.',
    '',
    'STAGE 1: THE VERTICAL SCALING CEILING',
    '',
    'The first response to a slow server is to make it bigger — more CPU cores, more RAM, faster disks. This is vertical scaling, and it works until it does not. Cloud providers offer increasingly powerful instance types, but the largest instances are expensive and the scaling ceiling is still real. More importantly, a single server is a single point of failure. When it goes down, your entire service goes down.',
    '',
    'Vertical scaling is the right first step when you cannot distinguish between a temporary traffic spike and sustained growth. Scaling horizontally before you need to is expensive in engineering time and operational complexity. The common mistake is the opposite: under-provisioning and watching a service collapse under load because scaling was deferred to avoid complexity.',
    '',
    'STAGE 2: ADDING A LOAD BALANCER',
    '',
    'The first architectural step beyond a single server is placing a load balancer in front of multiple identical application servers. The load balancer distributes incoming requests across the pool, removing the single-point-of-failure problem and allowing horizontal scaling — adding more application servers as demand grows.',
    '',
    'This step introduces the first significant architectural constraint: application servers must be stateless. If Server A handles a user\'s login and stores their session in memory, Server B will not have that session when it handles their next request. This forces the team to externalize session storage (Redis, database-backed sessions) and to eliminate any local file system dependencies.',
    '',
    'API design decisions made at this stage are difficult to reverse. APIs that rely on server-side session state will break under a load balancer unless redesigned. APIs that pass all necessary state in each request — stateless REST, JWTs for authentication — scale naturally.',
    '',
    'STAGE 3: DATABASE BOTTLENECKS',
    '',
    'Once application servers scale horizontally, the database becomes the bottleneck. A single database instance serves all application servers, and it will saturate as query volume grows. The standard progression includes several options.',
    '',
    'Read replicas: Route read queries to one or more replica nodes; write queries go to the primary. Works well when reads greatly outnumber writes (common for content-heavy applications like blogs). The tradeoff is replication lag — replicas may serve data that is milliseconds stale. Applications must handle this: after a write, a subsequent read from a replica may not yet reflect the write.',
    '',
    'Query optimization and indexing: Before adding infrastructure, ensure the database is being queried efficiently. A missing index on a high-cardinality column can cause a query that should take 5ms to take 5 seconds. EXPLAIN ANALYZE in PostgreSQL or the explain() method in MongoDB are indispensable. This work is often orders of magnitude cheaper than infrastructure changes.',
    '',
    'Caching layers: Redis or Memcached cache frequently-read, rarely-changing data (post listings, user profiles, tag counts) closer to the application server. A well-designed cache can reduce database load by 80 to 90 percent for read-heavy workloads. The critical discipline is cache invalidation: stale cache entries cause bugs that are subtle and difficult to reproduce.',
    '',
    'Connection pooling: Each database connection consumes memory and file descriptors on both the application and database sides. At scale, a connection pool prevents connection exhaustion. Applications should never open a new database connection per request.',
    '',
    'STAGE 4: SERVICE DECOMPOSITION',
    '',
    'When the application monolith becomes a delivery bottleneck — multiple teams competing to deploy to a single codebase, or a single component requiring resources disproportionate to the rest — decomposing into services becomes viable.',
    '',
    'The critical word is viable, not necessary. Microservices introduce distributed systems problems that must be managed: network latency and timeouts between services, the need for distributed tracing, more complex deployment pipelines, and the difficulty of cross-service transactions. For a five-person engineering team, these overhead costs usually outweigh the benefits of service autonomy.',
    '',
    'When decomposing, prefer cutting along domain boundaries (a Post Service, a User Service, a Notification Service) rather than along technical concerns (a Read Service, a Write Service). Domain-based boundaries mean each service owns its data completely and can evolve independently. Technical-layer boundaries create data-sharing problems that require synchronization mechanisms that replicate the coupling you were trying to eliminate.',
    '',
    'STAGE 5: ASYNCHRONOUS PROCESSING',
    '',
    'Not all work needs to happen in the critical path of an HTTP request. Sending a welcome email, generating thumbnail images, rebuilding a search index, processing a payment webhook — these operations can be deferred to background workers without degrading the user experience.',
    '',
    'A queue-based architecture allows the application to enqueue work and return a response immediately. Worker processes consume tasks from the queue at their own pace and can be scaled independently of the web servers. If a spike of uploads arrives, image processing jobs queue up and are processed over the following minutes without the web tier slowing down.',
    '',
    'Idempotency is essential for queue consumers: if a job fails halfway through and is retried, re-running it should produce the same outcome as if it succeeded the first time. Operations that are not naturally idempotent (e.g., charging a payment card) require explicit deduplication logic.',
    '',
    'OBSERVABILITY: THE PREREQUISITE FOR ALL OF THE ABOVE',
    '',
    'Every stage of scaling requires observability to make rational decisions. Without metrics, you are guessing which component is the bottleneck. Without distributed tracing, you cannot follow a slow request through three services to find where the latency is. Without structured logging, you cannot correlate a user complaint with a backend event.',
    '',
    'Instrument early. OpenTelemetry provides a vendor-neutral standard for traces, metrics, and logs that integrates with most backend frameworks. The investment in observability infrastructure pays compound returns: every optimization decision is faster and more confident when you can measure what is actually happening.',
    '',
    'The overarching principle of backend scalability is: do not add complexity prematurely, but do not avoid complexity when you genuinely need it. The goal is a system that is as simple as possible while reliably handling the actual load it faces — not the hypothetical load it might someday face.',
].join('\n');

const POSTS = [
    {
        title: 'Designing Software Architecture That Actually Scales',
        slug: 'designing-software-architecture-that-scales',
        tags: ['software-architecture', 'scalability', 'system-design', 'engineering'],
        views: 42,
        createdAt: new Date('2025-10-01T09:00:00Z'),
        content: POST1_CONTENT,
    },
    {
        title: 'A Systems Thinking Approach to Developer Productivity',
        slug: 'systems-thinking-developer-productivity',
        tags: ['productivity', 'systems-thinking', 'engineering-culture', 'team-dynamics'],
        views: 31,
        createdAt: new Date('2025-10-12T10:30:00Z'),
        content: POST2_CONTENT,
    },
    {
        title: 'State Management in Modern Web Applications: Beyond Redux',
        slug: 'state-management-modern-web-apps-beyond-redux',
        tags: ['state-management', 'react', 'frontend', 'javascript', 'web-development'],
        views: 58,
        createdAt: new Date('2025-10-24T08:00:00Z'),
        content: POST3_CONTENT,
    },
    {
        title: 'Technical Debt Is Not a Metaphor',
        slug: 'technical-debt-is-not-a-metaphor',
        tags: ['technical-debt', 'software-engineering', 'refactoring', 'code-quality'],
        views: 27,
        createdAt: new Date('2025-11-05T12:00:00Z'),
        content: POST4_CONTENT,
    },
    {
        title: 'Backend Scalability: From a Single Server to Distributed Systems',
        slug: 'backend-scalability-single-server-to-distributed',
        tags: ['backend', 'scalability', 'api-design', 'distributed-systems', 'devops'],
        views: 45,
        createdAt: new Date('2025-11-18T14:00:00Z'),
        content: POST5_CONTENT,
    },
];

async function verifyPosts() {
    const posts = await Post.find({ status: 'published' }).populate('author', 'name');
    console.log('\n--- VERIFICATION ---');
    console.log('Posts in collection: ' + posts.length);

    const issues = [];
    const slugSet = new Set();

    for (const post of posts) {
        const wordCount = post.content.trim().split(/\s+/).length;

        if (!post.title) issues.push('Missing title: ' + post._id);
        if (!post.slug) issues.push('Missing slug: ' + post._id);
        if (slugSet.has(post.slug)) issues.push('Duplicate slug: ' + post.slug);
        if (!post.content || wordCount < 800) issues.push('Content too short (' + wordCount + ' words): ' + post._id);
        if (!post.author) issues.push('Missing author: ' + post._id);
        if (!post.tags || post.tags.length < 2) issues.push('Insufficient tags: ' + post._id);
        if (post.status !== 'published') issues.push('Not published: ' + post._id);

        slugSet.add(post.slug);

        const authorName = post.author ? post.author.name : 'N/A';
        console.log('  [OK] "' + post.title + '" | words: ' + wordCount + ' | tags: ' + post.tags.length + ' | author: ' + authorName);
    }

    if (issues.length > 0) {
        console.error('\nValidation issues:');
        issues.forEach(i => console.error('  - ' + i));
        process.exit(1);
    } else {
        console.log('\nAll posts passed validation!');
    }

    if (posts.length !== 5) {
        console.error('Expected exactly 5 posts, found ' + posts.length);
        process.exit(1);
    }

    console.log('\nSUCCESS: 5 complete, validated blog posts are in MongoDB Atlas.');
}

async function seed() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI is not set in .env. Aborting.');
        process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected to: ' + mongoose.connection.host);

    // Step 1: Find or create seed author
    let author = await User.findOne({ email: SEED_AUTHOR.email });

    if (!author) {
        console.log('Creating seed author...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(SEED_AUTHOR.password, salt);
        author = await User.create({ ...SEED_AUTHOR, password: hashedPassword });
        console.log('Seed author created: ' + author.name + ' (' + author._id + ')');
    } else {
        console.log('Seed author already exists: ' + author.name + ' (' + author._id + ')');
    }

    // Step 2: Check current posts
    const existingCount = await Post.countDocuments();
    console.log('Existing posts in collection: ' + existingCount);

    if (existingCount > 0) {
        const existingPosts = await Post.find({}).select('title content status');
        const allComplete = existingPosts.every(p =>
            p.content && p.content.trim().split(/\s+/).length >= 800 && p.status === 'published'
        );

        if (allComplete && existingCount >= 5) {
            console.log('Found ' + existingCount + ' complete posts already. Running verification...');
            await verifyPosts();
            await mongoose.disconnect();
            console.log('Done.');
            return;
        }

        console.log('Clearing existing posts (incomplete or insufficient data)...');
        await Post.deleteMany({});
        console.log('Cleared.');
    }

    // Step 3: Insert 5 posts
    console.log('\nInserting 5 blog posts...');

    const postDocs = POSTS.map(p => ({
        title: p.title,
        slug: p.slug,
        content: p.content,
        author: author._id,
        tags: p.tags,
        views: p.views,
        status: 'published',
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
    }));

    const inserted = await Post.insertMany(postDocs);
    console.log('Inserted ' + inserted.length + ' posts.');

    // Step 4: Verify
    await verifyPosts();

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
}

seed().catch(err => {
    console.error('Seed script error:', err);
    process.exit(1);
});
