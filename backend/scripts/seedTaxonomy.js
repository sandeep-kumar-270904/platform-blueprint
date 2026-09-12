const mongoose = require('mongoose');
const TechnologyTaxonomy = require('../models/TechnologyTaxonomy');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const taxonomyData = [
  {
    name: 'Java',
    slug: 'java',
    category: 'Programming Languages',
    topics: [
      { name: 'Core Java', subtopics: ['Basics', 'Control Flow', 'Strings'] },
      { name: 'OOP', subtopics: ['Classes', 'Inheritance', 'Polymorphism', 'Interfaces'] },
      { name: 'Collections', subtopics: ['HashMap', 'ArrayList', 'LinkedList', 'Sets'] },
      { name: 'Advanced', subtopics: ['Multithreading', 'Streams API', 'Exception Handling', 'Generics'] },
      { name: 'Frameworks', subtopics: ['Spring Boot', 'Hibernate'] }
    ]
  },
  {
    name: 'Python',
    slug: 'python',
    category: 'Programming Languages',
    topics: [
      { name: 'Core Python', subtopics: ['Syntax', 'Data Types', 'Functions'] },
      { name: 'Data Structures', subtopics: ['Lists', 'Dictionaries', 'Tuples', 'Sets'] },
      { name: 'OOP', subtopics: ['Classes', 'Inheritance', 'Magic Methods'] },
      { name: 'Frameworks', subtopics: ['Django', 'FastAPI', 'Flask'] }
    ]
  },
  {
    name: 'C++',
    slug: 'cpp',
    category: 'Programming Languages',
    topics: [
      { name: 'Core C++', subtopics: ['Pointers', 'Memory Management', 'STL'] },
      { name: 'OOP', subtopics: ['Classes', 'Virtual Functions', 'Templates'] }
    ]
  },
  {
    name: 'JavaScript',
    slug: 'javascript',
    category: 'Web Development',
    topics: [
      { name: 'Core JS', subtopics: ['Variables', 'Functions', 'Closures', 'Hoisting'] },
      { name: 'ES6+', subtopics: ['Arrow Functions', 'Promises', 'Async/Await', 'Destructuring'] },
      { name: 'DOM', subtopics: ['Event Loop', 'DOM Manipulation', 'Browser APIs'] }
    ]
  },
  {
    name: 'React',
    slug: 'react',
    category: 'Web Development',
    topics: [
      { name: 'Core React', subtopics: ['Components', 'JSX', 'Props', 'State'] },
      { name: 'Hooks', subtopics: ['useState', 'useEffect', 'useContext', 'Custom Hooks'] },
      { name: 'Advanced', subtopics: ['Performance', 'Redux', 'Zustand', 'React Router'] }
    ]
  },
  {
    name: 'Node.js',
    slug: 'nodejs',
    category: 'Backend & Databases',
    topics: [
      { name: 'Core Node', subtopics: ['Event Loop', 'Modules', 'File System'] },
      { name: 'Express.js', subtopics: ['Routing', 'Middleware', 'Error Handling'] },
      { name: 'Architecture', subtopics: ['REST APIs', 'GraphQL', 'WebSockets'] }
    ]
  },
  {
    name: 'SQL',
    slug: 'sql',
    category: 'Backend & Databases',
    topics: [
      { name: 'Basics', subtopics: ['SELECT', 'WHERE', 'ORDER BY'] },
      { name: 'Joins', subtopics: ['INNER JOIN', 'LEFT JOIN', 'Outer Joins'] },
      { name: 'Advanced', subtopics: ['Window Functions', 'CTEs', 'Indexing', 'Optimization'] }
    ]
  },
  {
    name: 'MongoDB',
    slug: 'mongodb',
    category: 'Backend & Databases',
    topics: [
      { name: 'Basics', subtopics: ['CRUD', 'Documents', 'Collections'] },
      { name: 'Advanced', subtopics: ['Aggregation Pipeline', 'Indexing', 'Mongoose'] }
    ]
  },
  {
    name: 'Git',
    slug: 'git',
    category: 'DevOps & Cloud',
    topics: [
      { name: 'Basics', subtopics: ['Commit', 'Push', 'Pull', 'Clone'] },
      { name: 'Branching', subtopics: ['Merge', 'Rebase', 'Checkout'] },
      { name: 'Advanced', subtopics: ['Cherry-pick', 'Stash', 'Reset vs Revert'] }
    ]
  },
  {
    name: 'Docker',
    slug: 'docker',
    category: 'DevOps & Cloud',
    topics: [
      { name: 'Basics', subtopics: ['Containers', 'Images', 'Dockerfile'] },
      { name: 'Advanced', subtopics: ['Docker Compose', 'Volumes', 'Networking'] }
    ]
  },
  {
    name: 'AWS',
    slug: 'aws',
    category: 'DevOps & Cloud',
    topics: [
      { name: 'Compute', subtopics: ['EC2', 'Lambda'] },
      { name: 'Storage', subtopics: ['S3', 'EBS'] },
      { name: 'Networking', subtopics: ['VPC', 'Route53'] },
      { name: 'Databases', subtopics: ['RDS', 'DynamoDB'] }
    ]
  },
  {
    name: 'Data Structures & Algorithms',
    slug: 'dsa',
    category: 'Computer Science / Placement',
    topics: [
      { name: 'Arrays & Strings', subtopics: ['Two Pointers', 'Sliding Window', 'Prefix Sum'] },
      { name: 'Linked Lists', subtopics: ['Reversal', 'Fast & Slow Pointers'] },
      { name: 'Trees', subtopics: ['Binary Trees', 'BST', 'Traversals', 'LCA'] },
      { name: 'Graphs', subtopics: ['BFS', 'DFS', 'Shortest Path', 'Topological Sort'] },
      { name: 'Dynamic Programming', subtopics: ['1D DP', '2D DP', 'Knapsack'] }
    ]
  },
  {
    name: 'System Design',
    slug: 'system-design',
    category: 'Computer Science / Placement',
    topics: [
      { name: 'Core Concepts', subtopics: ['Scalability', 'CAP Theorem', 'Load Balancing', 'Caching'] },
      { name: 'Components', subtopics: ['Message Queues', 'Databases', 'API Gateways'] },
      { name: 'Case Studies', subtopics: ['Design Twitter', 'Design WhatsApp', 'Design Uber'] }
    ]
  }
];

const seedTaxonomy = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studenthub');
    console.log('MongoDB connected...');

    await TechnologyTaxonomy.deleteMany();
    console.log('Cleared existing taxonomies...');

    await TechnologyTaxonomy.insertMany(taxonomyData);
    console.log('Successfully seeded taxonomy data!');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding taxonomy:', err);
    process.exit(1);
  }
};

seedTaxonomy();
