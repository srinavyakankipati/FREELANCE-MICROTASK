const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../src/models/User');
const { Task } = require('../src/models/Task');
const SkillTest = require('../src/models/SkillTest');
const TestResult = require('../src/models/TestResult');
const Application = require('../src/models/Application');
const Milestone = require('../src/models/Milestone');
const Escrow = require('../src/models/Escrow');
const Workspace = require('../src/models/Workspace');
const Message = require('../src/models/Message');
const File = require('../src/models/File');
const Dispute = require('../src/models/Dispute');
const Notification = require('../src/models/Notification');
const Review = require('../src/models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freelance-micro-task';

async function seedDatabase() {
  console.log('🌱 Connecting to database for seeding...');
  await mongoose.connect(MONGO_URI);
  console.log(`✅ MongoDB Connected to: ${mongoose.connection.host}`);

  try {
    console.log('🧹 Purging existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Task.deleteMany({}),
      SkillTest.deleteMany({}),
      TestResult.deleteMany({}),
      Application.deleteMany({}),
      Milestone.deleteMany({}),
      Escrow.deleteMany({}),
      Workspace.deleteMany({}),
      Message.deleteMany({}),
      File.deleteMany({}),
      Dispute.deleteMany({}),
      Notification.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('✅ Collections purged clean.');

    // =========================================================================
    // 1. SEED USERS
    // =========================================================================
    console.log('\n👤 Seeding platform users...');

    // Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@taskforge.io',
      password: 'password123',
      role: 'admin',
      bio: 'Head of platform safety, policy enforcement, and escrow dispute arbitration.',
      professionalTitle: 'Platform Administrator',
    });

    // Clients / Posters
    const clientAlex = await User.create({
      name: 'Alex Vance',
      email: 'alex.poster@techcorp.io',
      password: 'password123',
      role: 'client',
      bio: 'VP of Product at TechCorp. Fast-paced web apps and rapid micro-deliverables.',
      professionalTitle: 'Product Director',
      location: 'San Francisco, CA',
    });

    const clientSarah = await User.create({
      name: 'Sarah Chen',
      email: 'sarah.client@designstudio.co',
      password: 'password123',
      role: 'client',
      bio: 'Founder at PixelBloom Studio. Hiring UI/UX designers and creative frontenders.',
      professionalTitle: 'Creative Director',
      location: 'New York, NY',
    });

    const clientDavid = await User.create({
      name: 'David Miller',
      email: 'david.founder@nextgen.ai',
      password: 'password123',
      role: 'client',
      bio: 'Startup Founder building AI data ingestion microservices.',
      professionalTitle: 'AI Tech Lead',
      location: 'Austin, TX',
    });

    // Freelancers
    const flElena = await User.create({
      name: 'Elena Rostova',
      email: 'elena.dev@freelancer.io',
      password: 'password123',
      role: 'freelancer',
      bio: 'Senior Full-Stack Engineer specializing in React, Next.js, and Node.js microservices. 7+ years of experience delivering pixel-perfect web apps.',
      professionalTitle: 'Senior Full-Stack Developer',
      skills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'CSS', 'REST APIs', 'MongoDB'],
      badges: ['Newcomer', 'Verified: React Frontend Development', 'Verified: Node.js & Express Backend'],
      rating: 4.95,
      reviewCount: 14,
      completedTaskCount: 18,
      hourlyRate: 65,
      location: 'Berlin, Germany',
      portfolio: [
        {
          title: 'Fintech Analytics SaaS',
          description: 'High-throughput trading dashboard with real-time websocket visualizers.',
          tags: ['React', 'WebSocket', 'Tailwind', 'Chart.js'],
        },
        {
          title: 'Decentralized Micro-Invoice Vault',
          description: 'Automated milestone escrow contracts with PDF generation and webhooks.',
          tags: ['Node.js', 'Express', 'MongoDB'],
        },
      ],
    });

    const flMarcus = await User.create({
      name: 'Marcus Brody',
      email: 'marcus.fullstack@freelancer.io',
      password: 'password123',
      role: 'freelancer',
      bio: 'DevOps & Backend Architect with deep expertise in Python, Docker, Kubernetes, and AWS infrastructure automation.',
      professionalTitle: 'Cloud & DevOps Specialist',
      skills: ['Python', 'Docker', 'AWS', 'DevOps', 'CI/CD', 'Linux', 'PostgreSQL'],
      badges: ['Newcomer', 'Verified: Python & Machine Learning'],
      rating: 4.88,
      reviewCount: 9,
      completedTaskCount: 12,
      hourlyRate: 75,
      location: 'Toronto, Canada',
      portfolio: [
        {
          title: 'Zero-Downtime Microservices Pipeline',
          description: 'Kubernetes cluster deployment with ArgoCD and automated canary releases.',
          tags: ['Docker', 'Kubernetes', 'CI/CD'],
        },
      ],
    });

    const flPriya = await User.create({
      name: 'Priya Sharma',
      email: 'priya.uiux@freelancer.io',
      password: 'password123',
      role: 'freelancer',
      bio: 'Product Designer obsessed with human-centered UX, glassmorphism, responsive systems, and design tokens.',
      professionalTitle: 'Lead Product & UI/UX Designer',
      skills: ['UI/UX', 'Figma', 'Wireframing', 'Prototyping', 'Design Systems', 'CSS'],
      badges: ['Newcomer', 'Verified: UI/UX & Design Systems'],
      rating: 5.0,
      reviewCount: 11,
      completedTaskCount: 15,
      hourlyRate: 55,
      location: 'London, UK',
      portfolio: [
        {
          title: 'Mobile Banking Experience 2.0',
          description: 'Complete cross-platform design kit with micro-interactions and dark mode.',
          tags: ['Figma', 'Mobile UI', 'Prototyping'],
        },
      ],
    });

    const flLiam = await User.create({
      name: 'Liam Vance',
      email: 'liam.python@freelancer.io',
      password: 'password123',
      role: 'freelancer',
      bio: 'Data Engineer & Python Specialist focusing on FastAPI pipelines, ETL workflows, and embeddings.',
      professionalTitle: 'Data Engineer & AI Specialist',
      skills: ['Python', 'FastAPI', 'Pandas', 'Data Science', 'Machine Learning', 'SQL'],
      badges: ['Newcomer', 'Verified: Python & Machine Learning'],
      rating: 4.8,
      reviewCount: 6,
      completedTaskCount: 8,
      hourlyRate: 60,
      location: 'Seattle, WA',
    });

    console.log('✅ Users seeded: 1 Admin, 3 Clients, 4 Freelancers');

    // =========================================================================
    // 2. SEED SKILL TESTS
    // =========================================================================
    console.log('\n📝 Seeding skill tests & assessments...');

    const reactTest = await SkillTest.create({
      skill: 'React Frontend Development',
      category: 'Web Development',
      description: 'Validate your expertise in React 18/19, component lifecycles, hooks, and virtual DOM reconciliation.',
      durationMinutes: 10,
      passingScore: 70,
      questions: [
        {
          question: 'What is the primary benefit of the React `useMemo` hook?',
          options: [
            'To trigger a re-render whenever state changes',
            'To memoize the result of an expensive calculation and avoid unnecessary recomputation',
            'To run asynchronous fetch calls after DOM mount',
            'To directly mutate state without re-rendering',
          ],
          correctIndex: 1,
        },
        {
          question: 'In React, why must hooks never be invoked conditionally or inside nested loops?',
          options: [
            'Because React relies on the call order of hooks across renders to maintain internal state',
            'Because JavaScript syntax forbids calling functions inside if statements',
            'Because conditional hooks cause immediate memory leaks in the V8 engine',
            'Because JSX cannot parse hooks inside conditionals',
          ],
          correctIndex: 0,
        },
        {
          question: 'Which prop pattern avoids unnecessary re-renders in memoized child components when passing functions?',
          options: [
            'Defining the function inline inside JSX',
            'Wrapping the handler in `useCallback` with stable dependencies',
            'Using `useState` to store the function body',
            'Passing the function through a global window variable',
          ],
          correctIndex: 1,
        },
        {
          question: 'What happens when two state updater calls are executed back-to-back in a single React event handler?',
          options: [
            'React triggers two sequential synchronous DOM reflows',
            'React automatically batches the updates into a single re-render',
            'The second updater overrides and cancels the first one',
            'An error is thrown unless wrapped in `flushSync`',
          ],
          correctIndex: 1,
        },
        {
          question: 'What is the correct way to handle uncontrolled inputs in React?',
          options: [
            'By passing `value` and `onChange` to the input element',
            'By attaching a `ref` via `useRef()` and reading `ref.current.value` on submission',
            'By querying `document.getElementById` directly',
            'Uncontrolled inputs are not allowed in React',
          ],
          correctIndex: 1,
        },
      ],
      createdBy: admin._id,
    });

    const nodeTest = await SkillTest.create({
      skill: 'Node.js & Express Backend',
      category: 'Backend Development',
      description: 'Assess event loop mechanics, Express middleware pipelines, JWT auth, and asynchronous error boundaries.',
      durationMinutes: 10,
      passingScore: 70,
      questions: [
        {
          question: 'In Express.js, what is the required signature for an error-handling middleware function?',
          options: [
            '(req, res, next)',
            '(err, req, res, next)',
            '(err, res)',
            '(req, res, err)',
          ],
          correctIndex: 1,
        },
        {
          question: 'Which Node.js event loop phase executes `setImmediate()` callbacks?',
          options: [
            'Timers phase',
            'Poll phase',
            'Check phase',
            'Close callbacks phase',
          ],
          correctIndex: 2,
        },
        {
          question: 'Why should CPU-intensive cryptographic operations (e.g., bcrypt) be executed asynchronously or in worker threads?',
          options: [
            'Because synchronous operations block the single Node.js event loop thread, freezing all incoming HTTP requests',
            'Because Node.js does not allow synchronous functions',
            'Because async bcrypt runs faster on GPU',
            'To avoid memory allocation errors',
          ],
          correctIndex: 0,
        },
        {
          question: 'What does `process.nextTick()` do relative to the event loop?',
          options: [
            'Schedules a callback to run after the next complete event loop iteration',
            'Runs immediately after the current operation finishes, before the event loop advances to the next phase',
            'Queues the callback to run only when idle',
            'Runs on a background worker thread',
          ],
          correctIndex: 1,
        },
      ],
      createdBy: admin._id,
    });

    const uiuxTest = await SkillTest.create({
      skill: 'UI/UX & Design Systems',
      category: 'UI/UX Design',
      description: 'Demonstrate competency in visual hierarchy, WCAG contrast standards, responsive grid layouts, and design tokens.',
      durationMinutes: 10,
      passingScore: 70,
      questions: [
        {
          question: 'What is the minimum WCAG 2.1 Level AA contrast ratio required for normal body text?',
          options: ['3:1', '4.5:1', '7:1', '2:1'],
          correctIndex: 1,
        },
        {
          question: 'What is the key principle of responsive fluid typography using `clamp()`?',
          options: [
            'It forces font size to strictly match screen height',
            'It sets a minimum, ideal fluid scalable value, and a maximum boundary in a single rule',
            'It swaps CSS stylesheets on every resize event',
            'It disables font antialiasing on mobile displays',
          ],
          correctIndex: 1,
        },
        {
          question: 'In design systems, what are "design tokens"?',
          options: [
            'Cryptographic coins used to buy Figma licenses',
            'Semantic, platform-agnostic variables storing visual design attributes like colors, spacing, and typography',
            'Reusable vector icons rendered as SVGs',
            'Component screenshots saved in the style guide',
          ],
          correctIndex: 1,
        },
      ],
      createdBy: admin._id,
    });

    const pythonTest = await SkillTest.create({
      skill: 'Python & Machine Learning',
      category: 'Data Science & Analytics',
      description: 'Evaluate mastery of Pythonic idioms, vectorization with NumPy, Pandas data structures, and ML pipelines.',
      durationMinutes: 10,
      passingScore: 70,
      questions: [
        {
          question: 'Why is vectorization in NumPy orders of magnitude faster than standard Python loops?',
          options: [
            'Because NumPy compiles code to JavaScript',
            'Because NumPy executes operations on contiguous blocks of C-level memory with SIMD hardware instructions',
            'Because Python loops are asynchronous',
            'Because NumPy automatically spawns multi-process daemons',
          ],
          correctIndex: 1,
        },
        {
          question: 'In Python, what is the primary role of a generator function using `yield`?',
          options: [
            'To return all elements simultaneously as an immutable tuple',
            'To lazily produce values one at a time on demand, minimizing memory footprint for large datasets',
            'To run code on a separate thread',
            'To enforce strict type checking',
          ],
          correctIndex: 1,
        },
      ],
      createdBy: admin._id,
    });

    console.log('✅ Skill tests seeded: React, Node.js, UI/UX, Python');

    // =========================================================================
    // 3. SEED TEST RESULTS
    // =========================================================================
    console.log('\n🏆 Awarding verified skill badges to freelancers...');

    await TestResult.create([
      {
        user: flElena._id,
        skillTest: reactTest._id,
        skillName: reactTest.skill,
        score: 100,
        correctCount: 5,
        totalQuestions: 5,
        passed: true,
        badgeAwarded: true,
      },
      {
        user: flElena._id,
        skillTest: nodeTest._id,
        skillName: nodeTest.skill,
        score: 100,
        correctCount: 4,
        totalQuestions: 4,
        passed: true,
        badgeAwarded: true,
      },
      {
        user: flPriya._id,
        skillTest: uiuxTest._id,
        skillName: uiuxTest.skill,
        score: 100,
        correctCount: 3,
        totalQuestions: 3,
        passed: true,
        badgeAwarded: true,
      },
      {
        user: flMarcus._id,
        skillTest: pythonTest._id,
        skillName: pythonTest.skill,
        score: 100,
        correctCount: 2,
        totalQuestions: 2,
        passed: true,
        badgeAwarded: true,
      },
      {
        user: flLiam._id,
        skillTest: pythonTest._id,
        skillName: pythonTest.skill,
        score: 100,
        correctCount: 2,
        totalQuestions: 2,
        passed: true,
        badgeAwarded: true,
      },
    ]);
    console.log('✅ Test results stored and linked.');

    // =========================================================================
    // 4. SEED TASKS & ESCROWS & MILESTONES
    // =========================================================================
    console.log('\n💼 Seeding marketplace tasks, contracts & escrows...');

    // Task 1: In-Progress task with Elena (Funded Escrow, Milestones, Workspace)
    const task1 = await Task.create({
      title: 'Build Animated SaaS Marketing Landing Page in React',
      description: 'Looking for a verified React developer to implement a responsive, modern dark-mode landing page with smooth scroll animations, interactive pricing calculator, and testimonial carousels.',
      category: 'Web Development',
      skills: ['React', 'CSS', 'JavaScript', 'TypeScript'],
      budget: 350,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      poster: clientAlex._id,
      assignedFreelancer: flElena._id,
      status: 'in-progress',
    });

    const m1_t1 = await Milestone.create({
      task: task1._id,
      title: 'Hero Section, Navigation & Design Tokens',
      description: 'Implement navbar, hero typography, glowing accents, and responsive layout structure.',
      amount: 150,
      status: 'released',
      order: 1,
      fundedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      releasedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    const m2_t1 = await Milestone.create({
      task: task1._id,
      title: 'Interactive Pricing Tier & Animations',
      description: 'Annual/monthly billing toggle, dynamic slider, and SVG animations.',
      amount: 200,
      status: 'funded',
      order: 2,
      fundedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    await Escrow.create({
      task: task1._id,
      poster: clientAlex._id,
      freelancer: flElena._id,
      totalBudget: 350,
      fundedBalance: 200, // $200 currently held
      releasedAmount: 150, // $150 released
      status: 'active',
    });

    // Workspace & Chat for Task 1
    const ws1 = await Workspace.create({
      task: task1._id,
      poster: clientAlex._id,
      freelancer: flElena._id,
      status: 'active',
    });

    await Message.create([
      {
        workspace: ws1._id,
        task: task1._id,
        sender: clientAlex._id,
        content: 'Hi Elena! Welcome aboard. Milestone 1 has been funded in escrow. Excited to see your work on the hero section!',
        readBy: [{ user: clientAlex._id }, { user: flElena._id }],
      },
      {
        workspace: ws1._id,
        task: task1._id,
        sender: flElena._id,
        content: 'Thanks Alex! I reviewed the Figma specs. Starting on the CSS design tokens and responsive grid layout now.',
        readBy: [{ user: clientAlex._id }, { user: flElena._id }],
      },
      {
        workspace: ws1._id,
        task: task1._id,
        sender: flElena._id,
        content: 'Milestone 1 is ready! The hero section is responsive down to 320px with 60fps animations.',
        readBy: [{ user: clientAlex._id }, { user: flElena._id }],
      },
      {
        workspace: ws1._id,
        task: task1._id,
        sender: clientAlex._id,
        content: 'Looks phenomenal! Milestone 1 approved and released. Milestone 2 ($200) is now funded in escrow.',
        readBy: [{ user: clientAlex._id }, { user: flElena._id }],
      },
    ]);

    // Task 2: Open Task with multiple applicants
    const task2 = await Task.create({
      title: 'Design High-Converting Mobile App UI in Figma',
      description: 'Need a creative UI/UX designer to craft a sleek 8-screen mobile app onboarding and transaction flow for an on-demand delivery app.',
      category: 'UI/UX Design',
      skills: ['UI/UX', 'Figma', 'Wireframing', 'Prototyping'],
      budget: 280,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      poster: clientSarah._id,
      status: 'open',
    });

    await Application.create([
      {
        task: task2._id,
        freelancer: flPriya._id,
        bidAmount: 280,
        message: 'Hi Sarah, as a verified UI/UX designer on TaskForge with a 5.0 rating, I have designed 15+ mobile banking and delivery apps in Figma. Happy to deliver responsive interactive prototypes.',
        status: 'pending',
        matchScore: 0.95,
      },
      {
        task: task2._id,
        freelancer: flElena._id,
        bidAmount: 260,
        message: 'Hi! I specialize in full-stack implementation and have strong Figma workflow skills to provide design tokens that translate directly to React Native code.',
        status: 'pending',
        matchScore: 0.75,
      },
    ]);

    // Update applicants array on task2
    task2.applicants = [flPriya._id, flElena._id];
    await task2.save();

    // Task 3: Assigned Task with Liam
    const task3 = await Task.create({
      title: 'FastAPI Data Pipeline & Sentiment Analysis Microservice',
      description: 'Build a containerized Python FastAPI service that ingests streaming customer reviews, parses text with Pandas, and scores sentiment with batch processing.',
      category: 'Data Science & Analytics',
      skills: ['Python', 'FastAPI', 'Pandas', 'Data Science'],
      budget: 400,
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      poster: clientDavid._id,
      assignedFreelancer: flLiam._id,
      status: 'assigned',
    });

    await Milestone.create({
      task: task3._id,
      title: 'API Endpoints & Batch Ingestion Architecture',
      description: 'FastAPI schema validation and asynchronous review queue processing.',
      amount: 400,
      status: 'pending',
      order: 1,
    });

    await Escrow.create({
      task: task3._id,
      poster: clientDavid._id,
      freelancer: flLiam._id,
      totalBudget: 400,
      fundedBalance: 0,
      releasedAmount: 0,
      status: 'pending',
    });

    await Workspace.create({
      task: task3._id,
      poster: clientDavid._id,
      freelancer: flLiam._id,
      status: 'active',
    });

    // Task 4: Completed Task with Review & Escrow Released
    const task4 = await Task.create({
      title: 'Dockerize Microservices & CI/CD GitHub Actions Pipeline',
      description: 'Multi-stage Dockerfiles for Node.js API and React frontend with GitHub Actions automated test & deploy pipeline.',
      category: 'DevOps & Cloud',
      skills: ['Docker', 'DevOps', 'CI/CD', 'Linux'],
      budget: 220,
      deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      poster: clientAlex._id,
      assignedFreelancer: flMarcus._id,
      status: 'completed',
    });

    const m1_t4 = await Milestone.create({
      task: task4._id,
      title: 'Multi-Stage Dockerfiles & Docker Compose',
      amount: 100,
      status: 'released',
      order: 1,
      releasedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    const m2_t4 = await Milestone.create({
      task: task4._id,
      title: 'GitHub Actions Matrix Testing & Deploy Workflow',
      amount: 120,
      status: 'released',
      order: 2,
      releasedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    await Escrow.create({
      task: task4._id,
      poster: clientAlex._id,
      freelancer: flMarcus._id,
      totalBudget: 220,
      fundedBalance: 0,
      releasedAmount: 220,
      status: 'completed',
    });

    // Review for Task 4
    await Review.create({
      task: task4._id,
      reviewer: clientAlex._id,
      reviewee: flMarcus._id,
      rating: 5,
      comment: 'Marcus delivered phenomenal Docker configurations. Build times dropped by 65% and the CI/CD pipeline runs flawlessly!',
    });

    // Task 5: Dispute Task (Under Review by Admin)
    const task5 = await Task.create({
      title: 'Stripe Webhook Gateway Timeout Debugging',
      description: 'Fix idempotent webhook handling and resolve 504 gateway timeout issues during peak subscription renewal batches.',
      category: 'Web Development',
      skills: ['Node.js', 'Express', 'JavaScript'],
      budget: 180,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      poster: clientSarah._id,
      assignedFreelancer: flMarcus._id,
      status: 'in-progress',
    });

    const m1_t5 = await Milestone.create({
      task: task5._id,
      title: 'Webhook Queue & Redis Deduplication',
      amount: 180,
      status: 'disputed',
      order: 1,
      fundedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    await Escrow.create({
      task: task5._id,
      poster: clientSarah._id,
      freelancer: flMarcus._id,
      totalBudget: 180,
      fundedBalance: 180,
      releasedAmount: 0,
      status: 'disputed',
    });

    const ws5 = await Workspace.create({
      task: task5._id,
      poster: clientSarah._id,
      freelancer: flMarcus._id,
      status: 'active',
    });

    await Message.create([
      {
        workspace: ws5._id,
        task: task5._id,
        sender: clientSarah._id,
        content: 'Hi Marcus, the webhook handler is still failing on retries with 504 timeouts in staging.',
        readBy: [{ user: clientSarah._id }],
      },
      {
        workspace: ws5._id,
        task: task5._id,
        sender: flMarcus._id,
        content: 'I provided the Redis lock code, but your database connection pool is maxing out because connections are not being returned.',
        readBy: [{ user: flMarcus._id }],
      },
    ]);

    await Dispute.create({
      task: task5._id,
      milestone: m1_t5._id,
      raisedBy: clientSarah._id,
      reason: 'Deliverable does not prevent timeout under high concurrent load as agreed in the task specifications.',
      status: 'under-review',
      evidence: [
        {
          uploadedBy: clientSarah._id,
          fileName: 'error_dump_stripe_timeout.log',
          description: 'Server error log dump showing connection pool exhaustion and 504 status codes on Stripe webhook calls.',
          uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    // Task 6 & 7: Open tasks
    await Task.create({
      title: 'Brand Identity, Logo & Social Asset Kit',
      description: 'Looking for a minimalist tech brand logo, color palette tokens, and Twitter/LinkedIn header mockups.',
      category: 'Graphic & Visual Design',
      skills: ['UI/UX', 'Figma'],
      budget: 200,
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      poster: clientAlex._id,
      status: 'open',
    });

    await Task.create({
      title: 'React Native Cross-Platform Fitness Tracker Screen',
      description: 'Implement step counting graph, heart rate gauge, and workout summary cards with offline AsyncStorage support.',
      category: 'Mobile Apps',
      skills: ['React', 'JavaScript', 'TypeScript'],
      budget: 320,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      poster: clientDavid._id,
      status: 'open',
    });

    console.log('✅ Tasks, Milestones, Workspaces & Disputes seeded successfully.');

    // =========================================================================
    // 5. SEED NOTIFICATIONS
    // =========================================================================
    console.log('\n🔔 Seeding notifications...');

    await Notification.create([
      {
        recipient: flElena._id,
        type: 'milestone_funded',
        title: 'Milestone Funded in Escrow',
        message: 'Alex Vance deposited $200 into escrow for "Interactive Pricing Tier & Animations".',
        link: `/tasks/${task1._id}`,
        read: false,
      },
      {
        recipient: clientSarah._id,
        type: 'new_applicant',
        title: 'New Proposal Received',
        message: 'Priya Sharma applied to "Design High-Converting Mobile App UI in Figma".',
        link: `/tasks/${task2._id}/applications`,
        read: false,
      },
      {
        recipient: flMarcus._id,
        type: 'dispute_update',
        title: 'Milestone Frozen in Dispute',
        message: 'A dispute has been filed on Milestone 1 for "Stripe Webhook Gateway Timeout Debugging". Milestone is under administrative review.',
        link: `/disputes`,
        read: false,
      },
      {
        recipient: clientAlex._id,
        type: 'milestone_submitted',
        title: 'Deliverable Submitted',
        message: 'Elena Rostova submitted work for Milestone 1 on "Build Animated SaaS Marketing Landing Page".',
        link: `/tasks/${task1._id}`,
        read: true,
      },
    ]);
    console.log('✅ Notifications seeded.');

    console.log('\n======================================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🚀');
    console.log('======================================================\n');
    console.log('Available Login Credentials (all passwords: "password123"):');
    console.log('👑 Admin:');
    console.log('   - admin@taskforge.io');
    console.log('🏢 Clients / Posters:');
    console.log('   - alex.poster@techcorp.io');
    console.log('   - sarah.client@designstudio.co');
    console.log('   - david.founder@nextgen.ai');
    console.log('💻 Freelancers (Verified Skill Badges):');
    console.log('   - elena.dev@freelancer.io (React, Node.js - 4.95 Rating)');
    console.log('   - marcus.fullstack@freelancer.io (Python, DevOps - 4.88 Rating)');
    console.log('   - priya.uiux@freelancer.io (UI/UX, Figma - 5.0 Rating)');
    console.log('   - liam.python@freelancer.io (Python, FastAPI, Pandas - 4.8 Rating)');
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();
