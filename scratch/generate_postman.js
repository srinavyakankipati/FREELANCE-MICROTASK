const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    _postman_id: 'taskforge-platform-api-v1',
    name: 'TaskForge API Collection (Full 72 APIs)',
    description: 'Comprehensive Postman collection covering all 12 modules, authentication, escrow, real-time messaging, disputes, search, skill assessments, and admin moderation.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000', type: 'string' },
    { key: 'token', value: '', type: 'string' },
    { key: 'taskId', value: '661fa1000000000000000001', type: 'string' },
    { key: 'milestoneId', value: '661fa2000000000000000001', type: 'string' },
    { key: 'workspaceId', value: '661fa3000000000000000001', type: 'string' },
    { key: 'disputeId', value: '661fa4000000000000000001', type: 'string' },
    { key: 'notificationId', value: '661fa5000000000000000001', type: 'string' },
    { key: 'fileId', value: '661fa6000000000000000001', type: 'string' },
    { key: 'userId', value: '661fa7000000000000000001', type: 'string' },
    { key: 'testId', value: '661fa8000000000000000001', type: 'string' },
    { key: 'applicationId', value: '661fa9000000000000000001', type: 'string' },
    { key: 'portfolioItemId', value: '661faa000000000000000001', type: 'string' }
  ],
  item: []
};

function makeReq({ name, method = 'GET', path: p, body = null, auth = true, query = [], tests = null, formData = null }) {
  const urlParts = p.split('/').filter(Boolean);
  const reqObj = {
    name,
    request: {
      method,
      header: [
        { key: 'Accept', value: 'application/json', type: 'text' }
      ],
      url: {
        raw: `{{baseUrl}}${p}${query.length ? '?' + query.map(q => `${q.key}=${encodeURIComponent(q.value)}`).join('&') : ''}`,
        host: ['{{baseUrl}}'],
        path: urlParts,
        query: query.map(q => ({ key: q.key, value: q.value, description: q.description || '' }))
      }
    }
  };

  if (auth) {
    reqObj.request.auth = {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{token}}', type: 'string' }]
    };
  }

  if (body) {
    reqObj.request.header.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
    reqObj.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2)
    };
  } else if (formData) {
    reqObj.request.body = {
      mode: 'formdata',
      formdata: formData
    };
  }

  if (tests) {
    reqObj.event = [
      {
        listen: 'test',
        script: {
          exec: tests,
          type: 'text/javascript'
        }
      }
    ];
  }

  return reqObj;
}

const loginTestScript = [
  'const res = pm.response.json();',
  'if (res.token) {',
  '    pm.environment.set("token", res.token);',
  '    console.log("Token stored in environment: " + res.token.substring(0, 15) + "...");',
  '}'
];

// 1. Health
collection.item.push({
  name: '01. System Health',
  item: [
    makeReq({
      name: 'Server Health & Status',
      method: 'GET',
      path: '/api/health',
      auth: false
    })
  ]
});

// 2. Auth & Roles
collection.item.push({
  name: '02. Authentication & Roles',
  item: [
    makeReq({
      name: 'Register Client / Poster',
      method: 'POST',
      path: '/api/auth/register',
      auth: false,
      body: {
        name: 'Jordan Belfort',
        email: 'jordan.client@brokerage.io',
        password: 'password123',
        role: 'client',
        bio: 'FinTech Founder hiring high-velocity UI and React engineers.',
        professionalTitle: 'Managing Director'
      },
      tests: loginTestScript
    }),
    makeReq({
      name: 'Register Freelancer',
      method: 'POST',
      path: '/api/auth/register',
      auth: false,
      body: {
        name: 'Sofia Ramirez',
        email: 'sofia.dev@freelancer.io',
        password: 'password123',
        role: 'freelancer',
        bio: 'Full Stack engineer specializing in React, Node, and MongoDB.',
        professionalTitle: 'Full-Stack Software Engineer',
        skills: ['React', 'Node.js', 'MongoDB', 'JavaScript']
      },
      tests: loginTestScript
    }),
    makeReq({
      name: 'Login as Client (Alex Vance)',
      method: 'POST',
      path: '/api/auth/login',
      auth: false,
      body: {
        email: 'alex.poster@techcorp.io',
        password: 'password123'
      },
      tests: loginTestScript
    }),
    makeReq({
      name: 'Login as Freelancer (Elena Rostova)',
      method: 'POST',
      path: '/api/auth/login',
      auth: false,
      body: {
        email: 'elena.dev@freelancer.io',
        password: 'password123'
      },
      tests: loginTestScript
    }),
    makeReq({
      name: 'Login as Admin',
      method: 'POST',
      path: '/api/auth/login',
      auth: false,
      body: {
        email: 'admin@taskforge.io',
        password: 'password123'
      },
      tests: loginTestScript
    }),
    makeReq({
      name: 'Get Current Authenticated User (Me)',
      method: 'GET',
      path: '/api/auth/me',
      auth: true
    }),
    makeReq({
      name: 'Admin-Only Route Check',
      method: 'GET',
      path: '/api/auth/admin-demo',
      auth: true
    }),
    makeReq({
      name: 'Freelancer / Admin Route Check',
      method: 'GET',
      path: '/api/auth/freelancer-demo',
      auth: true
    })
  ]
});

// 3. Tasks
collection.item.push({
  name: '03. Tasks Marketplace',
  item: [
    makeReq({
      name: 'Get All Task Categories with Counts',
      method: 'GET',
      path: '/api/tasks/categories',
      auth: false
    }),
    makeReq({
      name: 'Browse All Tasks (Feed)',
      method: 'GET',
      path: '/api/tasks',
      auth: false,
      query: [
        { key: 'page', value: '1' },
        { key: 'limit', value: '10' },
        { key: 'category', value: 'Web Development' },
        { key: 'status', value: 'open' }
      ]
    }),
    makeReq({
      name: 'Create New Task (Client Only)',
      method: 'POST',
      path: '/api/tasks',
      auth: true,
      body: {
        title: 'Build Dark Mode Dashboard with Animated Charts',
        description: 'Need a responsive React dashboard with Lucide icons, glassmorphism cards, and Chart.js or Recharts widgets.',
        category: 'Web Development',
        skills: ['React', 'CSS', 'JavaScript'],
        budget: 350,
        deadline: '2026-11-15T00:00:00.000Z'
      }
    }),
    makeReq({
      name: 'Get My Tasks (Posted or Assigned)',
      method: 'GET',
      path: '/api/tasks/my-tasks',
      auth: true
    }),
    makeReq({
      name: 'Get Single Task Details',
      method: 'GET',
      path: '/api/tasks/{{taskId}}',
      auth: false
    }),
    makeReq({
      name: 'Update Task (Poster Only)',
      method: 'PUT',
      path: '/api/tasks/{{taskId}}',
      auth: true,
      body: {
        title: 'Build Dark Mode Dashboard with Animated Charts (Updated)',
        budget: 400,
        deadline: '2026-11-20T00:00:00.000Z'
      }
    }),
    makeReq({
      name: 'Delete Task (Poster Only)',
      method: 'DELETE',
      path: '/api/tasks/{{taskId}}',
      auth: true
    })
  ]
});

// 4. Skill Tests
collection.item.push({
  name: '04. Skill Assessments & Badges',
  item: [
    makeReq({
      name: 'List Available Skill Tests',
      method: 'GET',
      path: '/api/skill-tests',
      auth: true
    }),
    makeReq({
      name: 'Get My Test Results & Earned Badges',
      method: 'GET',
      path: '/api/skill-tests/my-results',
      auth: true
    }),
    makeReq({
      name: 'Get Test Questions (Answers Hidden)',
      method: 'GET',
      path: '/api/skill-tests/{{testId}}',
      auth: false
    }),
    makeReq({
      name: 'Submit Skill Test Answers (Auto-Score & Badge Award)',
      method: 'POST',
      path: '/api/skill-tests/{{testId}}/submit',
      auth: true,
      body: {
        answers: [
          { questionIndex: 0, selectedOption: 1 },
          { questionIndex: 1, selectedOption: 0 },
          { questionIndex: 2, selectedOption: 1 },
          { questionIndex: 3, selectedOption: 1 },
          { questionIndex: 4, selectedOption: 1 }
        ]
      }
    }),
    makeReq({
      name: 'Create Skill Test (Admin Only)',
      method: 'POST',
      path: '/api/skill-tests',
      auth: true,
      body: {
        skill: 'TypeScript Advanced Types',
        category: 'Web Development',
        description: 'Assess mapped types, conditional infer keyword, and generic constraints.',
        durationMinutes: 15,
        passingScore: 75,
        questions: [
          {
            question: 'What does the `infer` keyword do inside a conditional type?',
            options: [
              'Declares a runtime type cast',
              'Introduces a type variable to be deduced within the true branch',
              'Exports the type to global scope',
              'Suppresses compiler strict null checks'
            ],
            correctIndex: 1
          }
        ]
      }
    }),
    makeReq({
      name: 'Update Skill Test (Admin Only)',
      method: 'PUT',
      path: '/api/skill-tests/{{testId}}',
      auth: true,
      body: {
        durationMinutes: 20,
        passingScore: 80
      }
    })
  ]
});

// 5. User Profile & Portfolio
collection.item.push({
  name: '05. Profiles & Portfolios',
  item: [
    makeReq({
      name: 'Get Public Freelancer Profile',
      method: 'GET',
      path: '/api/users/profile/{{userId}}',
      auth: false
    }),
    makeReq({
      name: 'Update My Profile',
      method: 'PUT',
      path: '/api/users/profile',
      auth: true,
      body: {
        bio: 'Senior Full Stack Specialist delivering high-performance SaaS platforms.',
        professionalTitle: 'Lead Full-Stack Engineer',
        hourlyRate: 65,
        location: 'Berlin, Germany',
        skills: ['React', 'Node.js', 'MongoDB', 'Docker', 'GraphQL']
      }
    }),
    makeReq({
      name: 'Add Portfolio Project',
      method: 'POST',
      path: '/api/users/portfolio',
      auth: true,
      body: {
        title: 'Crypto Liquidity Analytics Dashboard',
        description: 'Real-time WebSocket market ticker with order book depth charts.',
        projectUrl: 'https://github.com/example/crypto-analytics',
        imageUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=600',
        tags: ['React', 'WebSocket', 'FinTech']
      }
    }),
    makeReq({
      name: 'Delete Portfolio Item',
      method: 'DELETE',
      path: '/api/users/portfolio/{{portfolioItemId}}',
      auth: true
    })
  ]
});

// 6. Reviews & Ratings
collection.item.push({
  name: '06. Reviews & Reputation',
  item: [
    makeReq({
      name: 'Submit Task Review (Recalculates Rating)',
      method: 'POST',
      path: '/api/reviews',
      auth: true,
      body: {
        task: '{{taskId}}',
        rating: 5,
        comment: 'Outstanding delivery! The code was clean, robust, and submitted 2 days ahead of schedule.'
      }
    }),
    makeReq({
      name: 'Get User Reviews & Rating Breakdown',
      method: 'GET',
      path: '/api/reviews/user/{{userId}}',
      auth: false
    })
  ]
});

// 7. Search & Discovery Engine
collection.item.push({
  name: '07. Search & Discovery',
  item: [
    makeReq({
      name: 'Search Tasks (Full Filters & Pagination)',
      method: 'GET',
      path: '/api/search/tasks',
      auth: false,
      query: [
        { key: 'query', value: 'React' },
        { key: 'category', value: 'Web Development' },
        { key: 'minBudget', value: '100' },
        { key: 'maxBudget', value: '1000' },
        { key: 'sort', value: 'newest' },
        { key: 'page', value: '1' },
        { key: 'limit', value: '10' }
      ]
    }),
    makeReq({
      name: 'Search Freelancers (Filters & Badges)',
      method: 'GET',
      path: '/api/search/freelancers',
      auth: false,
      query: [
        { key: 'query', value: 'Elena' },
        { key: 'minRating', value: '4.5' },
        { key: 'verifiedOnly', value: 'true' },
        { key: 'page', value: '1' },
        { key: 'limit', value: '10' }
      ]
    }),
    makeReq({
      name: 'Skill Suggestions Autocomplete',
      method: 'GET',
      path: '/api/search/skills',
      auth: false,
      query: [{ key: 'q', value: 'Rea' }]
    }),
    makeReq({
      name: 'Get Trending Categories Analytics',
      method: 'GET',
      path: '/api/search/trending-categories',
      auth: false
    }),
    makeReq({
      name: 'Get Recommended Tasks (Personalized Search)',
      method: 'GET',
      path: '/api/search/recommended-tasks',
      auth: true
    })
  ]
});

// 8. Matching & Bidding
collection.item.push({
  name: '08. Matching & Applications',
  item: [
    makeReq({
      name: 'Get Top Freelancer Matches for Task',
      method: 'GET',
      path: '/api/matching/tasks/{{taskId}}/matches',
      auth: true
    }),
    makeReq({
      name: 'Get Recommended Tasks for Freelancer',
      method: 'GET',
      path: '/api/matching/recommended-tasks',
      auth: true
    }),
    makeReq({
      name: 'Freelancer Applies / Bids on Task',
      method: 'POST',
      path: '/api/matching/tasks/{{taskId}}/apply',
      auth: true,
      body: {
        bidAmount: 280,
        coverLetter: 'I have extensive experience with this stack and can complete the requirements with full test coverage.',
        estimatedDays: 4
      }
    }),
    makeReq({
      name: 'Client Invites Freelancer to Task',
      method: 'POST',
      path: '/api/matching/tasks/{{taskId}}/invite/{{userId}}',
      auth: true,
      body: {
        message: 'Your profile matches our requirements perfectly. Please review our task and submit your proposal!'
      }
    }),
    makeReq({
      name: 'Client Accepts Applicant Proposal',
      method: 'PATCH',
      path: '/api/matching/tasks/{{taskId}}/accept/{{applicationId}}',
      auth: true
    }),
    makeReq({
      name: 'Get All Applications for Task (Client View)',
      method: 'GET',
      path: '/api/matching/tasks/{{taskId}}/applications',
      auth: true
    }),
    makeReq({
      name: 'Get My Submitted Applications (Freelancer View)',
      method: 'GET',
      path: '/api/matching/my-applications',
      auth: true
    })
  ]
});

// 9. Milestones & Escrow
collection.item.push({
  name: '09. Milestones & Escrow Payments',
  item: [
    makeReq({
      name: 'Define Task Milestones',
      method: 'POST',
      path: '/api/milestones/tasks/{{taskId}}/define',
      auth: true,
      body: {
        milestones: [
          {
            title: 'Design Mockup & Wireframe Approval',
            description: 'Figma interactive component designs and responsive layout preview.',
            amount: 150,
            order: 1
          },
          {
            title: 'Frontend Implementation & Integration',
            description: 'React components with API state integration and unit tests.',
            amount: 200,
            order: 2
          }
        ]
      }
    }),
    makeReq({
      name: 'Fund Milestone into Escrow',
      method: 'POST',
      path: '/api/milestones/{{milestoneId}}/fund',
      auth: true,
      body: {
        paymentMethod: 'simulated_card'
      }
    }),
    makeReq({
      name: 'Freelancer Submits Milestone Work',
      method: 'POST',
      path: '/api/milestones/{{milestoneId}}/submit',
      auth: true,
      body: {
        deliverableNotes: 'Milestone 1 completed. All responsive wireframes and components have been implemented.',
        deliverableLink: 'https://github.com/elena-dev/task-deliverable-m1'
      }
    }),
    makeReq({
      name: 'Client Approves & Releases Escrow Payment',
      method: 'POST',
      path: '/api/milestones/{{milestoneId}}/release',
      auth: true,
      body: {
        notes: 'Deliverable looks fantastic! Released $150 to freelancer.'
      }
    }),
    makeReq({
      name: 'Client Requests Milestone Revision',
      method: 'POST',
      path: '/api/milestones/{{milestoneId}}/request-revision',
      auth: true,
      body: {
        revisionReason: 'Please tweak the mobile breakpoint at 480px and update the contrast ratio on secondary buttons.'
      }
    }),
    makeReq({
      name: 'Refund Milestone Escrow (Admin / Cancellation)',
      method: 'POST',
      path: '/api/milestones/{{milestoneId}}/refund',
      auth: true,
      body: {
        reason: 'Client requested cancellation prior to commencement.'
      }
    }),
    makeReq({
      name: 'Get Task Escrow Status & Audit Trail',
      method: 'GET',
      path: '/api/milestones/tasks/{{taskId}}/escrow',
      auth: true
    }),
    makeReq({
      name: 'Get All Milestones for Task',
      method: 'GET',
      path: '/api/milestones/tasks/{{taskId}}',
      auth: true
    }),
    makeReq({
      name: 'Get Single Milestone Details',
      method: 'GET',
      path: '/api/milestones/{{milestoneId}}',
      auth: true
    })
  ]
});

// 10. Workspace & Chat
collection.item.push({
  name: '10. Workspaces, Real-Time Chat & Deliverables',
  item: [
    makeReq({
      name: 'Get or Auto-Create Workspace for Task',
      method: 'GET',
      path: '/api/workspaces/task/{{taskId}}',
      auth: true
    }),
    makeReq({
      name: 'Send Real-Time Chat Message',
      method: 'POST',
      path: '/api/workspaces/{{workspaceId}}/messages',
      auth: true,
      body: {
        text: 'Hello! I have started work on the milestone and will share the preview link tomorrow.'
      }
    }),
    makeReq({
      name: 'Get Chat History (Paginated)',
      method: 'GET',
      path: '/api/workspaces/{{workspaceId}}/messages',
      auth: true,
      query: [
        { key: 'page', value: '1' },
        { key: 'limit', value: '30' }
      ]
    }),
    makeReq({
      name: 'Upload Workspace Deliverable File',
      method: 'POST',
      path: '/api/workspaces/{{workspaceId}}/files',
      auth: true,
      formData: [
        { key: 'description', value: 'Final compressed deliverables archive and source assets', type: 'text' },
        { key: 'file', description: 'Upload zip/pdf/image', type: 'file' }
      ]
    }),
    makeReq({
      name: 'List Workspace Shared Files',
      method: 'GET',
      path: '/api/workspaces/{{workspaceId}}/files',
      auth: true
    }),
    makeReq({
      name: 'Download Workspace File Deliverable',
      method: 'GET',
      path: '/api/workspaces/files/{{fileId}}/download',
      auth: true
    }),
    makeReq({
      name: 'Delete Workspace File',
      method: 'DELETE',
      path: '/api/workspaces/files/{{fileId}}',
      auth: true
    }),
    makeReq({
      name: 'Mark Workspace Messages Read',
      method: 'PATCH',
      path: '/api/workspaces/{{workspaceId}}/messages/read',
      auth: true
    })
  ]
});

// 11. Notifications
collection.item.push({
  name: '11. Notifications',
  item: [
    makeReq({
      name: 'List Notifications',
      method: 'GET',
      path: '/api/notifications',
      auth: true,
      query: [
        { key: 'page', value: '1' },
        { key: 'limit', value: '20' }
      ]
    }),
    makeReq({
      name: 'Get Unread Notification Count',
      method: 'GET',
      path: '/api/notifications/unread-count',
      auth: true
    }),
    makeReq({
      name: 'Mark All Notifications Read',
      method: 'PATCH',
      path: '/api/notifications/read-all',
      auth: true
    }),
    makeReq({
      name: 'Mark Single Notification Read',
      method: 'PATCH',
      path: '/api/notifications/{{notificationId}}/read',
      auth: true
    }),
    makeReq({
      name: 'Delete Notification',
      method: 'DELETE',
      path: '/api/notifications/{{notificationId}}',
      auth: true
    })
  ]
});

// 12. Disputes
collection.item.push({
  name: '12. Disputes & Arbitration',
  item: [
    makeReq({
      name: 'Raise Dispute (Freezes Milestone Escrow)',
      method: 'POST',
      path: '/api/disputes',
      auth: true,
      formData: [
        { key: 'taskId', value: '{{taskId}}', type: 'text' },
        { key: 'milestoneId', value: '{{milestoneId}}', type: 'text' },
        { key: 'reason', value: 'Deliverable fails basic validation specifications agreed in contract.', type: 'text' },
        { key: 'description', value: 'Attached server error dump showing failure to withstand high concurrency.', type: 'text' },
        { key: 'file', description: 'Evidence attachment', type: 'file' }
      ]
    }),
    makeReq({
      name: 'Submit Additional Evidence to Dispute',
      method: 'POST',
      path: '/api/disputes/{{disputeId}}/evidence',
      auth: true,
      formData: [
        { key: 'description', value: 'Additional load testing results and reproduction script', type: 'text' },
        { key: 'file', description: 'Evidence attachment', type: 'file' }
      ]
    }),
    makeReq({
      name: 'List My Disputes',
      method: 'GET',
      path: '/api/disputes/my',
      auth: true
    }),
    makeReq({
      name: 'Get Dispute Details & Evidence History',
      method: 'GET',
      path: '/api/disputes/{{disputeId}}',
      auth: true
    }),
    makeReq({
      name: 'Admin Resolve Dispute (Release / Refund / Split)',
      method: 'PATCH',
      path: '/api/disputes/{{disputeId}}/resolve',
      auth: true,
      body: {
        resolution: 'split',
        clientShare: 50,
        freelancerShare: 50,
        notes: 'Arbitration outcome: Partial deliverable accepted. Escrow split equally 50/50.'
      }
    })
  ]
});

// 13. Admin Management
collection.item.push({
  name: '13. Admin Management & Moderation',
  item: [
    makeReq({
      name: 'Get Platform Analytics & Stats',
      method: 'GET',
      path: '/api/admin/stats',
      auth: true
    }),
    makeReq({
      name: 'List Platform Users (Filters & Search)',
      method: 'GET',
      path: '/api/admin/users',
      auth: true,
      query: [
        { key: 'search', value: 'alex' },
        { key: 'role', value: 'all' },
        { key: 'status', value: 'all' },
        { key: 'page', value: '1' },
        { key: 'limit', value: '10' }
      ]
    }),
    makeReq({
      name: 'Toggle Block / Suspend User',
      method: 'PATCH',
      path: '/api/admin/users/{{userId}}/block',
      auth: true
    }),
    makeReq({
      name: 'List All Platform Tasks for Moderation',
      method: 'GET',
      path: '/api/admin/tasks',
      auth: true,
      query: [
        { key: 'search', value: 'SaaS' },
        { key: 'category', value: 'all' },
        { key: 'status', value: 'all' },
        { key: 'page', value: '1' },
        { key: 'limit', value: '10' }
      ]
    }),
    makeReq({
      name: 'Moderate / Edit Task',
      method: 'PATCH',
      path: '/api/admin/tasks/{{taskId}}/moderate',
      auth: true,
      body: {
        title: 'Build Animated SaaS Marketing Landing Page (Moderated)',
        category: 'Web Development',
        budget: 350,
        status: 'open'
      }
    }),
    makeReq({
      name: 'Delete Inappropriate Task',
      method: 'DELETE',
      path: '/api/admin/tasks/{{taskId}}',
      auth: true
    }),
    makeReq({
      name: 'List All Disputes (Admin View)',
      method: 'GET',
      path: '/api/admin/disputes',
      auth: true,
      query: [
        { key: 'status', value: 'all' },
        { key: 'page', value: '1' },
        { key: 'limit', value: '10' }
      ]
    })
  ]
});

const outputPath = path.join(__dirname, '..', 'TaskForge_Postman_Collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf8');

// Count total requests
let totalRequests = 0;
collection.item.forEach(folder => {
  totalRequests += folder.item.length;
});

console.log(`✅ Generated Postman collection with ${totalRequests} API requests.`);
console.log(`Saved to: ${outputPath}`);
