const Course = require('../models/Course');
const Team = require('../models/Team');
const User = require('../models/User');
const SkillGapLog = require('../models/SkillGapLog');
const teamMatchService = require('./teamMatchService');
const teamMatchExplainer = require('./teamMatchExplainer');

// Curated list of real, authoritative learning resources for top ~30 skills in Team Hunt
const CURATED_COURSE_CATALOG = [
  // React / Frontend
  {
    title: "React Official Documentation: Learn React",
    description: "The official interactive guide to learning React, from components to hooks and state management.",
    provider: "React Docs",
    externalUrl: "https://react.dev/learn",
    category: "Frontend",
    level: "Beginner",
    tags: ["react", "reactjs", "react.js", "frontend", "ui", "javascript", "web"]
  },
  {
    title: "freeCodeCamp Frontend Development Libraries Certification",
    description: "Learn styling and interactive frontend libraries including React, Redux, Bootstrap, and Sass.",
    provider: "freeCodeCamp",
    externalUrl: "https://www.freecodecamp.org/learn/front-end-development-libraries/",
    category: "Frontend",
    level: "Intermediate",
    tags: ["react", "redux", "bootstrap", "frontend", "libraries", "javascript"]
  },
  // JavaScript / TypeScript
  {
    title: "MDN Web Docs: JavaScript Guide",
    description: "Comprehensive, authoritative guide for JavaScript syntax, DOM manipulation, and asynchronous programming.",
    provider: "MDN Web Docs",
    externalUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    category: "Programming",
    level: "Beginner",
    tags: ["javascript", "js", "web", "frontend", "scripting"]
  },
  {
    title: "TypeScript Official Handbook",
    description: "Learn static typing, interfaces, generics, and modern TypeScript development from the official docs.",
    provider: "TypeScript",
    externalUrl: "https://www.typescriptlang.org/docs/handbook/intro.html",
    category: "Programming",
    level: "Intermediate",
    tags: ["typescript", "ts", "javascript", "frontend", "backend", "types"]
  },
  {
    title: "Total TypeScript Beginner's Guide",
    description: "An interactive, hands-on tutorial designed to help beginners master TypeScript fundamentals cleanly.",
    provider: "Total TypeScript",
    externalUrl: "https://www.totaltypescript.com/tutorials/beginners-typescript",
    category: "Programming",
    level: "Beginner",
    tags: ["typescript", "ts", "javascript"]
  },
  // Node.js / Backend / Express
  {
    title: "Node.js Official Learn Guide",
    description: "Get started with asynchronous event-driven JavaScript runtime, HTTP servers, and file systems.",
    provider: "Node.js",
    externalUrl: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",
    category: "Backend",
    level: "Beginner",
    tags: ["node", "nodejs", "node.js", "backend", "javascript", "server"]
  },
  {
    title: "freeCodeCamp Back End Development and APIs",
    description: "Learn Node.js, Express, npm, and how to build scalable RESTful microservices.",
    provider: "freeCodeCamp",
    externalUrl: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    category: "Backend",
    level: "Intermediate",
    tags: ["node", "nodejs", "express", "backend", "api", "rest"]
  },
  {
    title: "Express.js Official Guide",
    description: "The fast, unopinionated, minimalist web framework guide for Node.js routing and middleware.",
    provider: "Express",
    externalUrl: "https://expressjs.com/en/guide/routing.html",
    category: "Backend",
    level: "Beginner",
    tags: ["express", "expressjs", "node", "backend", "api"]
  },
  // Python / Machine Learning / Data Science
  {
    title: "Python Official Tutorial",
    description: "The definitive introduction to Python data types, control flow, functions, and modules.",
    provider: "Python.org",
    externalUrl: "https://docs.python.org/3/tutorial/index.html",
    category: "Programming",
    level: "Beginner",
    tags: ["python", "scripting", "backend", "data science", "ml", "ai"]
  },
  {
    title: "freeCodeCamp Scientific Computing with Python",
    description: "Learn data structures, algorithms, and computing principles using modern Python.",
    provider: "freeCodeCamp",
    externalUrl: "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
    category: "Data Science",
    level: "Beginner",
    tags: ["python", "data science", "algorithms", "scientific", "ml"]
  },
  // Databases (MongoDB, SQL, PostgreSQL)
  {
    title: "MongoDB University: MongoDB Basics",
    description: "Free official training on NoSQL document databases, indexing, aggregation pipelines, and CRUD.",
    provider: "MongoDB University",
    externalUrl: "https://learn.mongodb.com/",
    category: "Database",
    level: "Beginner",
    tags: ["mongodb", "mongo", "nosql", "database", "backend"]
  },
  {
    title: "freeCodeCamp Relational Database Certification",
    description: "Learn SQL, Bash, Git, and PostgreSQL by building interactive real-world database projects.",
    provider: "freeCodeCamp",
    externalUrl: "https://www.freecodecamp.org/learn/relational-database/",
    category: "Database",
    level: "Beginner",
    tags: ["sql", "postgresql", "postgres", "database", "relational", "backend"]
  },
  {
    title: "PostgreSQL Official Tutorial",
    description: "Master relational schema design, complex SQL queries, and data integrity with PostgreSQL.",
    provider: "PostgreSQL",
    externalUrl: "https://www.postgresql.org/docs/current/tutorial.html",
    category: "Database",
    level: "Beginner",
    tags: ["sql", "postgresql", "postgres", "database"]
  },
  // Version Control / Git
  {
    title: "Pro Git Book (Official Free Guide)",
    description: "The authoritative book on Git version control, branching workflows, merging, and distributed collaboration.",
    provider: "Git SCM",
    externalUrl: "https://git-scm.com/book/en/v2",
    category: "DevOps",
    level: "Beginner",
    tags: ["git", "github", "version control", "collaboration", "devops"]
  },
  {
    title: "GitHub Skills Interactive Tutorials",
    description: "Learn Git and GitHub through practical, hands-on repository challenges and branching simulations.",
    provider: "GitHub",
    externalUrl: "https://skills.github.com/",
    category: "DevOps",
    level: "Beginner",
    tags: ["git", "github", "collaboration", "pull requests"]
  },
  // DevOps / Docker / Kubernetes / Cloud / AWS
  {
    title: "Docker Official Get Started Guide",
    description: "Learn containerization, Dockerfiles, volume mounting, and multi-container orchestration with Compose.",
    provider: "Docker Docs",
    externalUrl: "https://docs.docker.com/get-started/",
    category: "DevOps",
    level: "Beginner",
    tags: ["docker", "containers", "devops", "deploy", "microservices"]
  },
  {
    title: "Kubernetes Basics Tutorial",
    description: "Interactive tutorial on deploying, scaling, and managing containerized applications on Kubernetes clusters.",
    provider: "Kubernetes",
    externalUrl: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
    category: "DevOps",
    level: "Intermediate",
    tags: ["kubernetes", "k8s", "docker", "devops", "cloud", "orchestration"]
  },
  {
    title: "AWS Skill Builder: Cloud Essentials",
    description: "Official free training covering AWS cloud architecture, compute (EC2), storage (S3), and security fundamentals.",
    provider: "AWS",
    externalUrl: "https://explore.skillbuilder.aws/learn",
    category: "Cloud",
    level: "Beginner",
    tags: ["aws", "cloud", "amazon web services", "devops", "infrastructure"]
  },
  // UI/UX / Design / Figma / HTML / CSS / Tailwind
  {
    title: "Figma Learn: Getting Started with Figma",
    description: "Official tutorials on user interface design, wireframing, interactive prototyping, and design systems.",
    provider: "Figma Learn",
    externalUrl: "https://help.figma.com/hc/en-us/categories/360002051613-Get-started",
    category: "Design",
    level: "Beginner",
    tags: ["figma", "ui", "ux", "ui/ux", "design", "prototyping"]
  },
  {
    title: "Google UX Design Professional Certificate Overview",
    description: "Learn empathy mapping, wireframing, user research, and interface prototyping from Google designers.",
    provider: "Google Grow",
    externalUrl: "https://grow.google/certificates/ux-design/",
    category: "Design",
    level: "Beginner",
    tags: ["ux", "ui", "ui/ux", "design", "user research"]
  },
  {
    title: "Tailwind CSS Official Core Concepts Guide",
    description: "Master utility-first CSS styling, responsive layout design, and modern dark mode implementation.",
    provider: "Tailwind CSS",
    externalUrl: "https://tailwindcss.com/docs/utility-first",
    category: "Frontend",
    level: "Beginner",
    tags: ["tailwind", "tailwindcss", "css", "styling", "frontend", "ui"]
  },
  {
    title: "MDN Web Docs: Learn Styling with CSS",
    description: "The definitive guide to CSS selectors, Flexbox, CSS Grid layouts, and responsive web design.",
    provider: "MDN Web Docs",
    externalUrl: "https://developer.mozilla.org/en-US/docs/Learn/CSS",
    category: "Frontend",
    level: "Beginner",
    tags: ["css", "html", "frontend", "styling", "web", "ui"]
  },
  // Java / Spring Boot / C++
  {
    title: "Oracle Official Java Tutorials",
    description: "Practical guide for Java programming, object-oriented principles, collections, and concurrency.",
    provider: "Oracle",
    externalUrl: "https://docs.oracle.com/javase/tutorial/",
    category: "Programming",
    level: "Beginner",
    tags: ["java", "oop", "backend", "programming"]
  },
  {
    title: "Spring Boot Official Guides",
    description: "Build enterprise-grade Java web applications, REST APIs, and microservices with Spring Boot.",
    provider: "Spring",
    externalUrl: "https://spring.io/guides",
    category: "Backend",
    level: "Intermediate",
    tags: ["spring", "springboot", "java", "backend", "api"]
  },
  {
    title: "LearnCpp.com Free C++ Tutorial",
    description: "Comprehensive, step-by-step tutorial covering modern C++ programming from absolute beginner to advanced.",
    provider: "LearnCpp",
    externalUrl: "https://www.learncpp.com/",
    category: "Programming",
    level: "Beginner",
    tags: ["c++", "cpp", "systems", "algorithms", "dsa"]
  },
  // Next.js / Vue / Angular / GraphQL
  {
    title: "Next.js Official Learn Course",
    description: "Learn server-side rendering, routing, data fetching, and full-stack React development from Vercel.",
    provider: "Vercel",
    externalUrl: "https://nextjs.org/learn",
    category: "Frontend",
    level: "Intermediate",
    tags: ["nextjs", "next.js", "react", "frontend", "fullstack", "ssr"]
  },
  {
    title: "Vue.js Official Essentials Guide",
    description: "Get started with progressive JavaScript framework components, directives, and Pinia state management.",
    provider: "Vue.js",
    externalUrl: "https://vuejs.org/guide/introduction.html",
    category: "Frontend",
    level: "Beginner",
    tags: ["vue", "vuejs", "frontend", "javascript"]
  },
  {
    title: "GraphQL Official Learn Guide",
    description: "Understand schemas, queries, mutations, and resolvers for efficient API data communication.",
    provider: "GraphQL",
    externalUrl: "https://graphql.org/learn/",
    category: "Backend",
    level: "Intermediate",
    tags: ["graphql", "api", "backend", "query", "rest"]
  },
  // Mobile (React Native, Flutter, Android, iOS)
  {
    title: "React Native Official Environment Setup & Guide",
    description: "Build native mobile apps for iOS and Android using React and JavaScript.",
    provider: "React Native",
    externalUrl: "https://reactnative.dev/docs/getting-started",
    category: "Mobile",
    level: "Intermediate",
    tags: ["react native", "mobile", "ios", "android", "react", "javascript"]
  },
  {
    title: "Flutter Official Get Started Guide",
    description: "Build cross-platform mobile, web, and desktop apps from a single Dart codebase.",
    provider: "Flutter",
    externalUrl: "https://docs.flutter.dev/get-started/install",
    category: "Mobile",
    level: "Beginner",
    tags: ["flutter", "dart", "mobile", "ios", "android"]
  },
  {
    title: "Android Developers Kotlin Basics",
    description: "Official Google training for creating modern Android applications using Kotlin.",
    provider: "Google Android",
    externalUrl: "https://developer.android.com/courses",
    category: "Mobile",
    level: "Beginner",
    tags: ["android", "kotlin", "mobile", "java", "app"]
  },
  // DSA / Data Structures & Algorithms
  {
    title: "NeetCode DSA Roadmap and Practice",
    description: "Structured roadmap covering data structures, algorithmic patterns, and coding interview preparation.",
    provider: "NeetCode",
    externalUrl: "https://neetcode.io/roadmap",
    category: "Data Science",
    level: "Intermediate",
    tags: ["dsa", "algorithms", "data structures", "problem solving", "coding", "interview"]
  }
];

let isSeeded = false;

class SkillGapAdvisor {
  /**
   * Ensure curated course catalog is seeded into Course collection (reusing StudentHub's existing learning library)
   */
  async ensureCuratedCatalog() {
    if (isSeeded) return;
    try {
      for (const item of CURATED_COURSE_CATALOG) {
        await Course.findOneAndUpdate(
          { externalUrl: item.externalUrl },
          { $set: item },
          { upsert: true, new: true }
        );
      }
      isSeeded = true;
    } catch (err) {
      console.error('[SkillGapAdvisor] Error seeding curated catalog:', err.message || err);
    }
  }

  /**
   * Get personalized skill gap advice and course recommendations for a user against a team.
   * Reuses Phase 3 teamMatchService and Phase 4 teamMatchExplainer.
   * 
   * @param {string} userId 
   * @param {string} teamId 
   * @param {string} triggerSource - e.g. 'low_match_view' or 'application_rejected'
   */
  async getAdviceForUserTeam(userId, teamId, triggerSource = 'low_match_view') {
    await this.ensureCuratedCatalog();

    const team = await Team.findById(teamId);
    const user = await User.findById(userId);

    if (!team || !user) {
      throw new Error('Team or User not found');
    }

    const userSkills = (user.skills || []).map(s => typeof s === 'string' ? s : s.skillName || '').filter(Boolean);
    const requiredSkills = [...(team.requiredSkills || []), ...(team.requiredRoles || [])];

    // Reuse Phase 3 match score service
    const matchResult = teamMatchService.calculateMatchScore(userSkills, requiredSkills);
    const missingSkills = matchResult.missingSkills || [];

    // If there are missing skills, log a SkillGapLog entry with deduplication (not more than once in 7 days per user+team)
    if (missingSkills.length > 0) {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const existingLog = await SkillGapLog.findOne({
          user: userId,
          team: teamId,
          createdAt: { $gte: sevenDaysAgo }
        });

        if (!existingLog) {
          await SkillGapLog.create({
            user: userId,
            team: teamId,
            missingSkills: missingSkills.map(s => s.toLowerCase().trim()),
            triggeredBy: triggerSource
          });
        }
      } catch (logErr) {
        console.error('[SkillGapAdvisor] Error deduplicating log entry:', logErr.message || logErr);
      }
    }

    // Look up 2-3 Course entries per missing skill, preferring beginner/intermediate first
    const resourcesBySkill = [];
    for (const skill of missingSkills) {
      const cleanSkill = skill.toLowerCase().trim();
      // Search courses where tags include cleanSkill or title/description matches
      const matchedCourses = await Course.find({
        $or: [
          { tags: { $in: [cleanSkill] } },
          { title: { $regex: new RegExp(cleanSkill, 'i') } },
          { category: { $regex: new RegExp(cleanSkill, 'i') } }
        ]
      }).sort({ level: 1, totalEnrollments: -1 }).limit(3);

      // Map to frontend-friendly resource objects
      const resources = matchedCourses.map(c => ({
        id: c._id,
        title: c.title,
        url: c.externalUrl,
        type: c.externalUrl && c.externalUrl.includes('youtube') ? 'video' : 'course',
        difficulty: c.level ? c.level.toLowerCase() : 'beginner',
        source: c.provider || 'StudentHub Learning'
      }));

      // If no direct database match found, look up from fallback catalog in memory
      if (resources.length === 0) {
        const catalogMatches = CURATED_COURSE_CATALOG.filter(c => 
          c.tags.includes(cleanSkill) || c.title.toLowerCase().includes(cleanSkill) || c.category.toLowerCase().includes(cleanSkill)
        ).slice(0, 2);
        
        catalogMatches.forEach(c => {
          resources.push({
            id: 'curated_' + Math.random().toString(36).substr(2, 6),
            title: c.title,
            url: c.externalUrl,
            type: 'course',
            difficulty: c.level.toLowerCase(),
            source: c.provider
          });
        });
      }

      resourcesBySkill.push({
        skill: skill,
        resources: resources
      });
    }

    // Reuse Phase 4 teamMatchExplainer for AI encouraging advice paragraph
    const advisorMessage = await teamMatchExplainer.generateGapAdvice(team, user, missingSkills);

    return {
      matchScore: matchResult.score,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: missingSkills,
      resources: resourcesBySkill,
      advisorMessage: advisorMessage
    };
  }

  /**
   * Aggregate logged-in user's SkillGapLog entries across all teams to reveal real recurring gap patterns.
   * Returns: { trendingSkills: [ { skill, count, percentage, resources: [...] } ], totalLogs: number }
   */
  async getTrendingGaps(userId) {
    await this.ensureCuratedCatalog();

    if (!userId) {
      throw new Error('User ID required');
    }

    const logs = await SkillGapLog.find({ user: userId });
    if (!logs || logs.length === 0) {
      return { trendingSkills: [], totalLogs: 0 };
    }

    const skillCounts = {};
    let totalOccurrences = 0;

    logs.forEach(log => {
      if (log.missingSkills && Array.isArray(log.missingSkills)) {
        log.missingSkills.forEach(skill => {
          const clean = skill.toLowerCase().trim();
          if (clean) {
            skillCounts[clean] = (skillCounts[clean] || 0) + 1;
            totalOccurrences++;
          }
        });
      }
    });

    // Sort descending by count
    const sortedSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 trending skills

    const trendingSkills = [];
    for (const [skill, count] of sortedSkills) {
      const percentage = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;

      // Look up resources from existing Course model
      const matchedCourses = await Course.find({
        $or: [
          { tags: { $in: [skill] } },
          { title: { $regex: new RegExp(skill, 'i') } }
        ]
      }).sort({ level: 1 }).limit(3);

      const resources = matchedCourses.map(c => ({
        id: c._id,
        title: c.title,
        url: c.externalUrl,
        type: 'course',
        difficulty: c.level ? c.level.toLowerCase() : 'beginner',
        source: c.provider || 'StudentHub Learning'
      }));

      trendingSkills.push({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1), // Capitalized for display
        count: count,
        percentage: percentage,
        resources: resources
      });
    }

    return {
      trendingSkills: trendingSkills,
      totalLogs: logs.length
    };
  }
}

module.exports = new SkillGapAdvisor();
