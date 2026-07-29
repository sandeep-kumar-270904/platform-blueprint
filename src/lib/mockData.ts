// Mock data for the application

export interface Note {
  id: string;
  title: string;
  subject: string;
  branch: string;
  semester: number;
  tags: string[];
  contentUrl: string;
  uploaderId: string;
  uploaderName: string;
  rating: number;
  views: number;
  downloads: number;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: "hackathon" | "competition" | "workshop" | "seminar";
  date: string;
  deadline: string;
  venue: string;
  mode: "online" | "offline" | "hybrid";
  registrations: number;
  capacity: number;
  organizer: string;
  tags: string[];
  prize?: string;
  featured: boolean;
}

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  views: number;
  replies: number;
  upvotes: number;
  isPinned: boolean;
  isSolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockNotes: Note[] = [
  {
    id: "note_1",
    title: "Cryptography — Hashing Algorithms",
    subject: "Cryptography",
    branch: "Computer Science",
    semester: 5,
    tags: ["hashing", "security", "algorithms", "crypto"],
    contentUrl: "/uploads/crypto-hashing.pdf",
    uploaderId: "user_123",
    uploaderName: "Priya Sharma",
    rating: 4.8,
    views: 1243,
    downloads: 567,
    createdAt: "2025-10-15T10:00:00Z",
    description: "This document provides a brief overview of the SHA and MD5 hashing algorithms",
  },
  {
    id: "note_2",
    title: "Data Structures - Tree Traversal Techniques",
    subject: "Data Structures",
    branch: "Computer Science",
    semester: 3,
    tags: ["trees", "traversal", "dfs", "bfs"],
    contentUrl: "/uploads/ds-trees.pdf",
    uploaderId: "user_234",
    uploaderName: "Rahul Verma",
    rating: 4.6,
    views: 987,
    downloads: 432,
    createdAt: "2025-10-20T14:30:00Z",
  },
  {
    id: "note_3",
    title: "Database Management - Normalization Complete Guide",
    subject: "Database Systems",
    branch: "IT",
    semester: 4,
    tags: ["normalization", "dbms", "sql"],
    contentUrl: "/uploads/dbms-normalization.pdf",
    uploaderId: "user_345",
    uploaderName: "Anita Roy",
    rating: 4.9,
    views: 1567,
    downloads: 789,
    createdAt: "2025-09-25T09:15:00Z",
  },
  {
    id: "note_4",
    title: "Computer Networks - TCP/IP Protocol Stack",
    subject: "Computer Networks",
    branch: "Computer Science",
    semester: 5,
    tags: ["tcp", "ip", "protocols", "networking"],
    contentUrl: "/uploads/cn-tcpip.pdf",
    uploaderId: "user_456",
    uploaderName: "Vikram Singh",
    rating: 4.7,
    views: 876,
    downloads: 345,
    createdAt: "2025-11-01T11:20:00Z",
  },
  {
    id: "note_5",
    title: "Software Engineering - Design Patterns",
    subject: "Software Engineering",
    branch: "IT",
    semester: 6,
    tags: ["design-patterns", "oop", "architecture"],
    contentUrl: "/uploads/se-patterns.pdf",
    uploaderId: "user_567",
    uploaderName: "Sneha Patel",
    rating: 4.8,
    views: 1098,
    downloads: 543,
    createdAt: "2025-10-28T16:45:00Z",
  },
  {
    id: "note_6",
    title: "Machine Learning - Supervised Learning Algorithms",
    subject: "Machine Learning",
    branch: "Computer Science",
    semester: 7,
    tags: ["ml", "supervised", "classification", "regression"],
    contentUrl: "/uploads/ml-supervised.pdf",
    uploaderId: "user_678",
    uploaderName: "Arjun Mehta",
    rating: 4.9,
    views: 2134,
    downloads: 987,
    createdAt: "2025-11-05T13:00:00Z",
  },
];

export const mockEvents: Event[] = [
  {
    id: "event_1",
    title: "HackInnovate 2025",
    description: "36-hour hackathon focusing on sustainable technology and social impact solutions",
    type: "hackathon",
    date: "2025-12-15T09:00:00Z",
    deadline: "2025-12-10T23:59:59Z",
    venue: "Tech Innovation Center",
    mode: "hybrid",
    registrations: 234,
    capacity: 500,
    organizer: "Tech Student Society",
    tags: ["coding", "innovation", "sustainability"],
    prize: "₹50,000",
    featured: true,
  },
  {
    id: "event_2",
    title: "AI/ML Workshop Series",
    description: "Comprehensive workshop series covering fundamentals to advanced AI concepts",
    type: "workshop",
    date: "2025-11-20T14:00:00Z",
    deadline: "2025-11-18T23:59:59Z",
    venue: "Online",
    mode: "online",
    registrations: 567,
    capacity: 1000,
    organizer: "AI Research Club",
    tags: ["ai", "machine-learning", "python"],
    featured: true,
  },
  {
    id: "event_3",
    title: "Code Battle Championship",
    description: "Competitive programming competition with exciting challenges",
    type: "competition",
    date: "2025-11-25T10:00:00Z",
    deadline: "2025-11-22T23:59:59Z",
    venue: "Computer Lab Block A",
    mode: "offline",
    registrations: 156,
    capacity: 200,
    organizer: "Coding Club",
    tags: ["competitive-programming", "algorithms", "dsa"],
    prize: "₹25,000",
    featured: false,
  },
  {
    id: "event_4",
    title: "Startup Pitch Day",
    description: "Present your startup ideas to industry experts and investors",
    type: "competition",
    date: "2025-12-01T15:00:00Z",
    deadline: "2025-11-28T23:59:59Z",
    venue: "Auditorium",
    mode: "offline",
    registrations: 45,
    capacity: 50,
    organizer: "Entrepreneurship Cell",
    tags: ["startup", "business", "pitching"],
    prize: "₹75,000 + Incubation",
    featured: true,
  },
];

export const mockThreads: ForumThread[] = [
  {
    id: "thread_1",
    title: "How to prepare for placement season in final year?",
    content: "Looking for advice on how to structure my preparation for campus placements...",
    author: "Rahul K",
    authorAvatar: "/avatars/user1.jpg",
    category: "Career",
    tags: ["placements", "advice", "career"],
    views: 1234,
    replies: 23,
    upvotes: 45,
    isPinned: true,
    isSolved: false,
    createdAt: "2025-11-10T09:00:00Z",
    updatedAt: "2025-11-12T14:30:00Z",
  },
  {
    id: "thread_2",
    title: "Best resources for learning React in 2025?",
    content: "I want to learn React for my project. What are the best free resources?",
    author: "Priya S",
    authorAvatar: "/avatars/user2.jpg",
    category: "Learning",
    tags: ["react", "javascript", "web-development"],
    views: 876,
    replies: 15,
    upvotes: 32,
    isPinned: false,
    isSolved: true,
    createdAt: "2025-11-11T11:20:00Z",
    updatedAt: "2025-11-13T16:45:00Z",
  },
  {
    id: "thread_3",
    title: "Anyone interested in forming a study group for DBMS?",
    content: "Looking for 3-4 students to study DBMS together. Mid-sem is approaching...",
    author: "Ankit M",
    authorAvatar: "/avatars/user3.jpg",
    category: "Study Groups",
    tags: ["dbms", "study-group", "collaboration"],
    views: 543,
    replies: 8,
    upvotes: 18,
    isPinned: false,
    isSolved: false,
    createdAt: "2025-11-12T08:15:00Z",
    updatedAt: "2025-11-13T10:30:00Z",
  },
  {
    id: "thread_4",
    title: "Segmentation fault in C program - need help debugging",
    content: "Getting segfault when trying to allocate dynamic memory. Here's my code...",
    author: "Sneha P",
    authorAvatar: "/avatars/user4.jpg",
    category: "Technical",
    tags: ["c-programming", "debugging", "help"],
    views: 234,
    replies: 12,
    upvotes: 9,
    isPinned: false,
    isSolved: true,
    createdAt: "2025-11-13T13:45:00Z",
    updatedAt: "2025-11-13T18:20:00Z",
  },
];
