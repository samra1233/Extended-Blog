import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import validateObjectId from '../utils/validateId.js';

const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.json({ users, page, pages: Math.ceil(total / limit), total });
});

const deleteUser = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, res, 'user ID');
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot delete your own admin account');
  }

  const userPosts = await Post.find({ author: user._id }).select('_id');
  const postIds = userPosts.map((p) => p._id);
  await Comment.deleteMany({ $or: [{ author: user._id }, { post: { $in: postIds } }] });
  await Post.deleteMany({ author: user._id });
  await user.deleteOne();

  res.json({ message: 'User and all associated content deleted' });
});

const getAdminPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find()
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(),
  ]);

  res.json({ posts, page, pages: Math.ceil(total / limit), total });
});

const getAdminStats = asyncHandler(async (req, res) => {
  const [userCount, postCount, commentCount, topViewed, topLiked] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Comment.countDocuments(),
    Post.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(5)
      .populate('author', 'name')
      .select('title views likes slug _id'),
    Post.find({ status: 'published' })
      .sort({ 'likes': -1 })
      .limit(5)
      .populate('author', 'name')
      .select('title views likes slug _id'),
  ]);

  res.json({ userCount, postCount, commentCount, topViewed, topLiked });
});

const setUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('Role must be "user" or "admin"');
  }

  validateObjectId(req.params.id, res, 'user ID');
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();

  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
});

const SEED_POSTS_DATA = [
  {
    title: 'Designing Software Architecture That Actually Scales',
    slug: 'designing-software-architecture-that-scales',
    tags: ['software-architecture', 'scalability', 'system-design', 'engineering'],
    views: 42,
    createdAt: new Date('2025-10-01T09:00:00Z'),
    content: [
      'Software architecture is the discipline of making decisions that are hard to reverse. Every choice about how components talk to each other, where business logic lives, and how data flows through a system becomes load-bearing structural design the moment it meets production traffic. Yet most teams treat architecture as an afterthought — something to bolt on once the MVP ships. That approach works exactly once, and only under forgiving conditions.',
      'WHY ARCHITECTURE DECISIONS COMPOUND',
      'The compounding nature of architectural debt is poorly understood. A monolith that begins as a well-factored single service will quietly accumulate coupling as teams grow. A query that runs in 80ms against 10,000 records will take 8 seconds against 1,000,000 without an index — and much worse without the right data model entirely.',
      'The key insight is that architecture is not about drawing boxes. It is about controlling coupling and preserving optionality. Every tight coupling between two modules is a tacit decision that they must evolve together forever. Optionality — the ability to swap, upgrade, or scale one component without touching others — is what makes a system genuinely resilient.',
      'LAYERED ARCHITECTURE VS. HEXAGONAL ARCHITECTURE',
      'The classic layered architecture is a good starting point, but it struggles with two common failure modes. First, the dependency direction is ambiguous. Second, testing becomes painful without inversion of control — your unit tests drag in database drivers.',
      'Hexagonal architecture, also called ports-and-adapters, solves both problems by making the domain the center of the universe. The domain defines ports — abstract interfaces representing what it needs from the outside world. Adapters are concrete implementations that plug into those ports. Your MongoDB repository, your email sender, your REST controller — all adapters. The domain never imports from them; it only knows about its own interfaces.',
      'This means your domain is testable in pure isolation. You write a fake adapter that stores data in memory and swap it during tests. The real MongoDB adapter only runs in integration tests. The productivity gain is substantial: unit tests run in milliseconds, not seconds.',
      'EVENT-DRIVEN ARCHITECTURE FOR DECOUPLED GROWTH',
      'When multiple services need to react to the same business event, synchronous HTTP calls create a web of hard dependencies. Service A calls Service B calls Service C. If C is slow, B blocks, and A times out. You have turned a distributed system into a distributed monolith with extra failure modes.',
      'Event-driven architecture decouples producers from consumers through a message bus. When a user publishes a post, the Post Service emits a PostPublished event. The Email Service, Analytics Service, and Search Indexer each subscribe and react independently. Each consumer can fail, restart, and retry without affecting the others. Adding a new consumer requires zero changes to the Post Service.',
      'The tradeoff is complexity: debugging flows across events is harder than tracing a synchronous call stack. Investing in distributed tracing from day one pays dividends when things go wrong in production.',
      'THE CAP THEOREM IN PRACTICE',
      'For most web applications, the correct choice is eventual consistency with availability — your MongoDB replica set will serve reads from secondary nodes even if the primary is unreachable, possibly returning slightly stale data. This is a conscious product decision masquerading as an infrastructure configuration.',
      'SCALING PATTERNS YOU SHOULD KNOW',
      'Database Read Replicas: Write to a primary, read from one or more replicas. Works well when reads dramatically outnumber writes. Add a caching layer like Redis in front of replicas for hot data.',
      'CQRS (Command Query Responsibility Segregation): Separate the model used for writes from the model used for reads. Commands go through a domain model with rich validation. Queries go through a flat read model optimized for display. This allows each side to scale independently.',
      'Event Sourcing: Instead of storing current state, store every event that led to that state. The current state is a projection. You gain a complete audit log, time-travel debugging, and the ability to replay events through new projections.',
      'Horizontal Sharding: Partition data across multiple database nodes by a shard key. Correctly choosing the shard key is famously difficult — the wrong choice creates hot spots and uneven distribution.',
      'PRACTICAL ADVICE FOR TEAMS',
      'Start with the simplest architecture that can handle 10x your current load. Optimize for developer cognitive overhead before optimizing for theoretical throughput. Document your architectural decisions using Architecture Decision Records (ADRs). For each major choice, write a short document explaining the context, the options considered, the decision, and the consequences.',
      'Finally: measure before you optimize. Premature architectural complexity is just as expensive as premature optimization. Profile your application, understand where the actual bottlenecks are, and make targeted decisions. Scalability work done in response to real data is almost always better than scalability work done in anticipation of hypothetical load.',
    ].join('\n\n'),
  },
  {
    title: 'A Systems Thinking Approach to Developer Productivity',
    slug: 'systems-thinking-developer-productivity',
    tags: ['productivity', 'systems-thinking', 'engineering-culture', 'team-dynamics'],
    views: 31,
    createdAt: new Date('2025-10-12T10:30:00Z'),
    content: [
      'Developer productivity is not primarily a function of how fast individuals type or how many hours they work. It is a function of how well the system around them — tools, processes, team structure, feedback loops — removes friction and amplifies leverage. This distinction matters enormously for anyone responsible for shipping software at scale.',
      'THE LEVERAGE PROBLEM',
      'Most productivity improvement efforts target individual behavior: time management techniques, IDE shortcuts, deep work schedules. These interventions have a ceiling. A developer who is twice as efficient by individual metrics but sits in a broken deployment pipeline, waits fifteen minutes for test feedback, or spends afternoons in status meetings is not twice as productive as their less efficient peer. The environment is the constraint.',
      'Systems thinking is the practice of identifying and addressing environment-level constraints rather than local optimizations. It asks: what is the limiting factor in the overall throughput of value delivery? Where do things wait? Where do things fail repeatedly? Where is coordination overhead concentrated?',
      'THE DORA METRICS FRAMEWORK',
      'The Google DevOps Research and Assessment project identified four key metrics that correlate strongly with organizational performance: Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to Recovery. These metrics form a system. Teams that work on deployment frequency naturally improve lead time. Teams that improve lead time surface change failure rates more clearly. Better observability reduces mean time to recovery.',
      'FEEDBACK LOOP LATENCY',
      'The most pernicious productivity killer in software development is slow feedback. When a developer makes a change, the time until they know whether it broke something determines how much productive momentum they maintain. A two-second test run preserves flow state. A twenty-minute CI pipeline forces context switching.',
      'The principle to optimize for is: make bad decisions fail fast and cheap. Type errors at compile time rather than runtime. Test failures locally before pushing rather than after CI runs. Feature rejection from user testing after a two-week sprint rather than after a six-month build.',
      'Investment in local development environment quality is dramatically undervalued. Engineers who struggle with unreliable local databases, inconsistent environment configurations, or slow hot-reloading spend significant portions of their days fighting the tools rather than building product.',
      'MANAGING COGNITIVE LOAD',
      'Modern software systems regularly require developers to hold hundreds of interdependent concepts: the data model, the business rules, the API contract, the deployment configuration, the observability dashboard. The gap between what can be held in memory and what the system requires is bridged by documentation, code clarity, and modular design — or it collapses into error.',
      'Team topology is an architectural decision as much as a technical one. If you want a modular system, organize your teams so that each owns a coherent piece of the domain with minimal dependencies on other teams for daily work. Cross-team dependencies create coordination overhead that compounds with team size.',
      'THE ON-CALL TAX',
      'Production incidents are not just operational problems; they are productivity costs charged in advance against future engineering cycles. Sustainable on-call practices are a productivity investment: runbooks that allow any engineer to resolve common incidents, postmortems that add permanent preventive measures, alert thresholds calibrated to reflect genuine user impact.',
      'MEASURING WHAT MATTERS',
      'Story points represent a team\'s internal effort estimation and do not translate between teams or over time. Tracking velocity as a performance signal creates perverse incentives: inflated estimates, avoided refactoring, deferred testing. Better leading indicators include pull request cycle time, test coverage trends, deployment failure rates, and developer satisfaction scores. Productivity in software is ultimately about throughput of value — features that solve real user problems, shipped reliably, with confidence in their correctness.',
    ].join('\n\n'),
  },
  {
    title: 'State Management in Modern Web Applications: Beyond Redux',
    slug: 'state-management-modern-web-apps-beyond-redux',
    tags: ['state-management', 'react', 'frontend', 'javascript', 'web-development'],
    views: 58,
    createdAt: new Date('2025-10-24T08:00:00Z'),
    content: [
      'Redux became the de facto standard for React state management in 2015 and shaped an entire generation of front-end architecture. Its deterministic state transitions, time-travel debugging, and clear separation of concerns were genuine innovations. A decade later, the landscape has fragmented significantly — and for good reasons.',
      'WHAT REDUX ACTUALLY SOLVED',
      'Redux conquered three concrete problems: prop drilling (passing data through many layers of components), shared mutable state bugs (race conditions and stale data from uncoordinated mutations), and debugging complexity (the DevTools time-travel feature let developers replay sequences of actions, a genuine breakthrough for debugging complex flows).',
      'THE COST REDUX ADDED',
      'Every pattern is also a burden. Redux added substantial boilerplate: actions, action creators, reducers, selectors, and middleware for every piece of async behavior. The mental model required understanding the entire data flow before modifying even a simple piece of state. For applications with genuinely complex, shared, cross-cutting state, this overhead is justified. For a settings panel that only one screen uses, it is not.',
      'REACT QUERY AND THE SERVER STATE REVELATION',
      'React Query reframed a foundational question: what percentage of state in a typical React application is actually server state in disguise? Server state is data that lives on the server and must be synchronized with the client. It has its own lifecycle: it becomes stale, it needs to be refreshed, multiple components often need the same data simultaneously, and mutations need to be reflected back to the server.',
      'React Query treats server state as a first-class concern with cache management, background refetching, deduplication of duplicate requests, infinite scroll pagination, and optimistic updates built in. A common pattern is to use React Query for server state and a thin client-side state manager for UI state.',
      'ZUSTAND: SIMPLICITY WITHOUT SACRIFICE',
      'Zustand approaches global client state with a minimal API that removes Redux\'s ceremony without removing its core value proposition. A Zustand store is a single function call. State and actions live together. There are no actions, reducers, or dispatchers — just state and functions that modify it. Zustand uses React\'s useSyncExternalStore under the hood, ensuring components re-render only when the specific slice of state they subscribe to changes.',
      'JOTAI AND RECOIL: ATOMIC STATE',
      'Jotai and Recoil take an atomized approach: instead of one store, state is composed of many small independent atoms. Components subscribe to exactly the atoms they need. The dependency graph is computed automatically — derived state re-computes only when dependencies change. Atom-based state is particularly well-suited to applications with many independently-updating pieces of state.',
      'CONTEXT API: WHEN IS IT ENOUGH?',
      'The critical limitation of Context API: every component that consumes a context re-renders whenever any part of that context changes. Context API is excellent for application theme, current authenticated user, and locale. It is poorly suited for frequently-changing values or large objects consumed by many components.',
      'CHOOSING THE RIGHT TOOL',
      'Server state (data from APIs): React Query or SWR. Global UI state: Zustand or Jotai. Complex domain state with rich business logic: Redux Toolkit. Truly local state: useState and useReducer. The anti-pattern to avoid is choosing a single solution and applying it to every category of state. Successful front-end architectures use multiple tools and apply each where it is actually well-suited.',
    ].join('\n\n'),
  },
  {
    title: 'Technical Debt Is Not a Metaphor',
    slug: 'technical-debt-is-not-a-metaphor',
    tags: ['technical-debt', 'software-engineering', 'refactoring', 'code-quality'],
    views: 27,
    createdAt: new Date('2025-11-05T12:00:00Z'),
    content: [
      'Ward Cunningham coined the term "technical debt" in 1992 as a communication tool — a way to explain to non-technical stakeholders why shipping code quickly now would require extra work later. The metaphor has since been stretched, abused, and made to cover every category of code quality problem. If everything is technical debt, nothing is. This article argues for treating technical debt as a concrete engineering concept with measurable properties, deliberate acquisition patterns, and a defined repayment process.',
      'THE ORIGINAL DEFINITION AND WHAT IT ACTUALLY MEANS',
      'Technical debt is the cost incurred when you ship code that does not fully embody your current understanding of the problem. The "interest" on this debt is the extra effort required to work around the gap between what you built and what you now know. This distinguishes deliberate technical debt — a conscious tradeoff made with full awareness — from accidental technical debt, which happens when developers simply do not know better. These are fundamentally different problems with fundamentally different solutions.',
      'Deliberate debt is a financing decision. A startup choosing to skip database connection pooling to ship an MVP faster is taking out a loan against its future engineering time. Accidental debt is a skills and knowledge problem. A junior developer who does not know that N+1 queries will destroy performance at scale is not making a tradeoff — they just do not have the information.',
      'CATEGORIES OF DEBT THAT ACTUALLY MATTER',
      'High-interest debt: Problems in heavily-trafficked, frequently-modified code paths. A tangled authentication module that every new feature must touch. A core data model with incorrect assumptions baked in. These accumulate interest rapidly because every developer who works in those areas pays the overhead daily.',
      'Low-interest debt: Messy code in a stable module that has not been modified in two years. Inconsistent naming in a utility library that works correctly. These are aesthetically unpleasant but economically irrelevant unless the module needs to change.',
      'Non-debt quality problems: Missing tests for new code. Security vulnerabilities. Deprecated dependencies with known CVEs. These are more accurately categorized as risks or defects — they do not fit the debt metaphor because they do not have a principal-plus-interest repayment structure.',
      'VISUALIZING AND MEASURING DEBT',
      'What gets measured gets managed. Static analysis tools can identify and track code-level debt indicators over time: cyclomatic complexity, code duplication, coupling metrics, file churn rates. The most useful signal is churn combined with complexity: files that change frequently and are complex warrant attention, because developers pay the complexity tax on every modification. Architectural debt must be identified through structured technical review.',
      'REPAYING DEBT STRATEGICALLY',
      'The most effective approach is the Boy Scout Rule applied with strategic awareness: leave the code a little better than you found it, in the areas you had to touch anyway. This amortizes repayment across feature work rather than requiring dedicated refactoring sprints. For high-priority debt, the strangler fig pattern is often safest: build the new implementation alongside the old one, progressively migrate traffic, and delete the old one once complete.',
      'THE ORGANIZATIONAL DIMENSION',
      'Technical debt accumulates in organizations as much as in codebases. A culture that consistently rewards feature velocity over quality creates conditions where debt spirals out of control. The counterweight is making quality costs visible to decision-makers. When proposing a feature build that requires working in a heavily-indebted module, make the overhead explicit. Over time, this data builds the organizational case for investing in quality as a prerequisite for delivery speed. Technical debt is real. It compounds. It can be measured, prioritized, and strategically repaid.',
    ].join('\n\n'),
  },
  {
    title: 'Backend Scalability: From a Single Server to Distributed Systems',
    slug: 'backend-scalability-single-server-to-distributed',
    tags: ['backend', 'scalability', 'api-design', 'distributed-systems', 'devops'],
    views: 45,
    createdAt: new Date('2025-11-18T14:00:00Z'),
    content: [
      'Most backend services start on a single server. This is correct. A single server is easy to understand, easy to deploy, easy to debug, and cheap to operate. The engineering challenge is knowing when that single server has become a constraint, understanding what options exist at each stage of growth, and making the transition to each new scale level without catastrophic disruption.',
      'STAGE 1: THE VERTICAL SCALING CEILING',
      'The first response to a slow server is to make it bigger — more CPU cores, more RAM, faster disks. This is vertical scaling, and it works until it does not. The largest instances are expensive and the scaling ceiling is still real. More importantly, a single server is a single point of failure. Vertical scaling is the right first step when you cannot distinguish between a temporary traffic spike and sustained growth.',
      'STAGE 2: ADDING A LOAD BALANCER',
      'The first architectural step beyond a single server is placing a load balancer in front of multiple identical application servers. The load balancer distributes incoming requests across the pool, removing the single-point-of-failure problem and allowing horizontal scaling. This step introduces the first significant architectural constraint: application servers must be stateless. If Server A handles a session and stores it in memory, Server B will not have that session for the next request.',
      'API design decisions made at this stage are difficult to reverse. APIs that rely on server-side session state will break under a load balancer unless redesigned. APIs that pass all necessary state in each request — stateless REST, JWTs for authentication — scale naturally.',
      'STAGE 3: DATABASE BOTTLENECKS',
      'Once application servers scale horizontally, the database becomes the bottleneck. Read replicas route read queries to replica nodes while write queries go to the primary — effective when reads greatly outnumber writes. Query optimization and indexing should be done before adding infrastructure: a missing index on a high-cardinality column can cause a 5ms query to take 5 seconds. Caching layers (Redis, Memcached) reduce database load by 80 to 90 percent for read-heavy workloads. Connection pooling prevents connection exhaustion at scale.',
      'STAGE 4: SERVICE DECOMPOSITION',
      'When the application monolith becomes a delivery bottleneck — multiple teams competing to deploy to a single codebase — decomposing into services becomes viable. The critical word is viable, not necessary. Microservices introduce distributed systems problems: network latency and timeouts, the need for distributed tracing, more complex deployment pipelines, and the difficulty of cross-service transactions. When decomposing, prefer domain boundaries (Post Service, User Service) over technical concerns (Read Service, Write Service).',
      'STAGE 5: ASYNCHRONOUS PROCESSING',
      'Not all work needs to happen in the critical path of an HTTP request. Sending emails, generating thumbnails, rebuilding indexes, processing webhooks — these operations can be deferred to background workers without degrading the user experience. A queue-based architecture allows the application to enqueue work and return a response immediately. Worker processes consume tasks at their own pace and scale independently of web servers. Idempotency is essential for queue consumers: if a job fails and is retried, re-running it should produce the same outcome.',
      'OBSERVABILITY: THE PREREQUISITE FOR ALL OF THE ABOVE',
      'Every stage of scaling requires observability to make rational decisions. Without metrics, you are guessing which component is the bottleneck. Without distributed tracing, you cannot follow a slow request through three services. Without structured logging, you cannot correlate a user complaint with a backend event. Instrument early. The investment in observability infrastructure pays compound returns: every optimization decision is faster and more confident when you can measure what is actually happening. The overarching principle: do not add complexity prematurely, but do not avoid it when you genuinely need it.',
    ].join('\n\n'),
  },
];

const seedPosts = asyncHandler(async (req, res) => {
  const mongoose = (await import('mongoose')).default;

  if (mongoose.connection.readyState !== 1) {
    res.status(503);
    throw new Error('MongoDB is not connected. Seeding requires an active database connection.');
  }

  const SEED_EMAIL = 'alex.rivera.seed@blogapp.internal';
  let author = await User.findOne({ email: SEED_EMAIL });

  if (!author) {
    const bcrypt = (await import('bcryptjs')).default;
    const salt = await bcrypt.genSalt(10);
    const seedPassword = process.env.SEED_PASSWORD || 'SeedPass!' + Date.now();
    const hashedPassword = await bcrypt.hash(seedPassword, salt);
    author = await User.create({
      name: 'Alex Rivera',
      email: SEED_EMAIL,
      password: hashedPassword,
      bio: 'Senior software engineer writing about architecture, systems thinking, and the craft of building scalable products.',
      role: 'admin',
    });
  }

  const existingCount = await Post.countDocuments();
  if (existingCount > 0) {
    const existing = await Post.find({}).select('content status');
    const allComplete = existing.every(p =>
      p.status === 'published' && p.content && p.content.trim().split(/\s+/).length >= 800
    );
    if (allComplete && existingCount >= 5) {
      return res.json({
        message: 'Already seeded. Database contains ' + existingCount + ' complete posts.',
        count: existingCount,
      });
    }
    await Post.deleteMany({});
  }

  const postDocs = SEED_POSTS_DATA.map(p => ({
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

  const finalCount = await Post.countDocuments({ status: 'published' });
  const issues = [];
  const all = await Post.find({ status: 'published' }).populate('author', 'name');
  const slugSet = new Set();

  for (const post of all) {
    const wordCount = post.content.trim().split(/\s+/).length;
    if (!post.title || !post.slug || wordCount < 800 || !post.author || post.tags.length < 2) {
      issues.push('"' + post.title + '" failed validation');
    }
    if (slugSet.has(post.slug)) issues.push('Duplicate slug: ' + post.slug);
    slugSet.add(post.slug);
  }

  if (issues.length > 0) {
    res.status(500);
    throw new Error('Seeded but validation failed: ' + issues.join('; '));
  }

  res.status(201).json({
    message: 'Successfully seeded ' + inserted.length + ' blog posts.',
    count: finalCount,
    posts: all.map(p => ({
      title: p.title,
      slug: p.slug,
      tags: p.tags,
      words: p.content.trim().split(/\s+/).length,
      status: p.status,
      author: p.author?.name,
    })),
  });
});

export { getAllUsers, deleteUser, getAdminPosts, getAdminStats, setUserRole, seedPosts };
