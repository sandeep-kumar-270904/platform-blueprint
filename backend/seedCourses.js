const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');
const CourseRating = require('./models/CourseRating');

dotenv.config();

const courses = [
  {
    title: 'CS50: Introduction to Computer Science',
    description: 'An introduction to the intellectual enterprises of computer science and the art of programming. Covers C, Python, SQL, and JavaScript plus CSS and HTML.',
    provider: 'Harvard / edX',
    externalUrl: 'https://pll.harvard.edu/course/cs50-introduction-computer-science',
    category: 'Computer Science',
    level: 'Beginner',
    duration: '12 weeks',
    price: 0,
    thumbnailImage: 'https://img.youtube.com/vi/8mAITcNt710/maxresdefault.jpg',
    instructor: 'David J. Malan',
    tags: ['C', 'Python', 'SQL', 'Algorithms', 'Basics'],
    syllabus: ['Week 0: Scratch', 'Week 1: C', 'Week 2: Arrays', 'Week 3: Algorithms', 'Week 4: Memory', 'Week 5: Data Structures', 'Week 6: Python', 'Week 7: SQL']
  },
  {
    title: 'Responsive Web Design Certification',
    description: 'In this Responsive Web Design Certification, you\'ll learn the languages that developers use to build webpages: HTML (Hypertext Markup Language) for content, and CSS (Cascading Style Sheets) for design.',
    provider: 'freeCodeCamp',
    externalUrl: 'https://www.freecodecamp.org/learn/responsive-web-design/',
    category: 'Web Development',
    level: 'Beginner',
    duration: '300 hours',
    price: 0,
    thumbnailImage: 'https://design-style-guide.freecodecamp.org/downloads/fcc_primary_large.png',
    instructor: 'freeCodeCamp Community',
    tags: ['HTML', 'CSS', 'Flexbox', 'CSS Grid', 'Responsive Design'],
    syllabus: ['Basic HTML and HTML5', 'Basic CSS', 'Applied Visual Design', 'Applied Accessibility', 'Responsive Web Design Principles', 'CSS Flexbox', 'CSS Grid']
  },
  {
    title: 'Machine Learning Specialization',
    description: 'The Machine Learning Specialization is a foundational online program created in collaboration between DeepLearning.AI and Stanford Online.',
    provider: 'Coursera',
    externalUrl: 'https://www.coursera.org/specializations/machine-learning-introduction',
    category: 'AI/ML',
    level: 'Beginner',
    duration: '2 months',
    price: 0,
    thumbnailImage: 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/0a/8fa7f1b2ce4ec290264421d0543784/ML_logo.png',
    instructor: 'Andrew Ng',
    tags: ['Machine Learning', 'Python', 'Supervised Learning', 'Unsupervised Learning', 'Recommender Systems'],
    syllabus: ['Supervised Machine Learning: Regression and Classification', 'Advanced Learning Algorithms', 'Unsupervised Learning, Recommenders, Reinforcement Learning']
  },
  {
    title: 'JavaScript Algorithms and Data Structures',
    description: 'Learn the fundamentals of JavaScript including variables, arrays, objects, loops, and functions. Once you have the fundamentals down, you\'ll apply that knowledge by creating algorithms to manipulate strings, factorialize numbers, and even calculate the orbit of the International Space Station.',
    provider: 'freeCodeCamp',
    externalUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
    category: 'Programming',
    level: 'Intermediate',
    duration: '300 hours',
    price: 0,
    thumbnailImage: 'https://design-style-guide.freecodecamp.org/downloads/fcc_primary_large.png',
    instructor: 'freeCodeCamp Community',
    tags: ['JavaScript', 'Algorithms', 'Data Structures', 'ES6', 'Functional Programming'],
    syllabus: ['Basic JavaScript', 'ES6', 'Regular Expressions', 'Debugging', 'Basic Data Structures', 'Basic Algorithm Scripting', 'Object Oriented Programming', 'Functional Programming', 'Intermediate Algorithm Scripting']
  },
  {
    title: 'Full Stack Open',
    description: 'Learn React, Redux, Node.js, MongoDB, GraphQL and TypeScript in one go! This course will introduce you to modern JavaScript-based web development.',
    provider: 'University of Helsinki',
    externalUrl: 'https://fullstackopen.com/en/',
    category: 'Web Development',
    level: 'Intermediate',
    duration: '12 weeks',
    price: 0,
    thumbnailImage: 'https://fullstackopen.com/static/76714dbf22f7797d2e05cb6b38c3ee5e/60a5e/helsinki.webp',
    instructor: 'Matti Luukkainen',
    tags: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'GraphQL', 'CI/CD'],
    syllabus: ['Fundamentals of Web apps', 'Introduction to React', 'Communicating with server', 'Programming a server with NodeJS and Express', 'Testing Express servers, user administration', 'Testing React apps', 'State management with Redux', 'React router, custom hooks, styling app with CSS and webpack', 'GraphQL', 'TypeScript', 'React Native', 'CI/CD']
  },
  {
    title: 'The Net Ninja: Vue.js 3 Tutorial for Beginners',
    description: 'A complete guide to Vue 3 for beginners. Learn how to create dynamic, fast, data-driven applications with Vue.',
    provider: 'YouTube',
    externalUrl: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9hYYGbV60Vq3IXYNfDk8At1',
    category: 'Web Development',
    level: 'Beginner',
    duration: '5 hours',
    price: 0,
    thumbnailImage: 'https://img.youtube.com/vi/YrxBCBibVo0/maxresdefault.jpg',
    instructor: 'Shaun Pelling',
    tags: ['Vue.js', 'JavaScript', 'Frontend'],
    syllabus: ['Introduction', 'Vue Apps & Widgets', 'Data Binding', 'Events', 'Conditional Rendering', 'Lists', 'Components', 'Props', 'Vue CLI', 'Composition API']
  },
  {
    title: 'Cybersecurity for Beginners',
    description: 'Learn the fundamentals of cybersecurity, including threats, vulnerabilities, and basic defensive strategies.',
    provider: 'Coursera',
    externalUrl: 'https://www.coursera.org/learn/cybersecurity-for-beginners',
    category: 'Cybersecurity',
    level: 'Beginner',
    duration: '4 weeks',
    price: 0,
    thumbnailImage: 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/83/e2580ce4ce4dcab96d744b76a0d4c8/cybersecurity.jpg',
    instructor: 'Various',
    tags: ['Security', 'Network', 'Threats', 'Defensive'],
    syllabus: ['Introduction to Cybersecurity', 'Cyber Threats', 'Network Security Basics', 'Personal Security']
  },
  {
    title: 'SQL Tutorial - Full Database Course for Beginners',
    description: 'The course is designed for beginners to SQL and database management systems, and will introduce common database management topics.',
    provider: 'YouTube',
    externalUrl: 'https://www.youtube.com/watch?v=HXV3zeJZ1EQ',
    category: 'Database',
    level: 'Beginner',
    duration: '4 hours',
    price: 0,
    thumbnailImage: 'https://img.youtube.com/vi/HXV3zeJZ1EQ/maxresdefault.jpg',
    instructor: 'Mike Dane',
    tags: ['SQL', 'Database', 'MySQL', 'Data Management'],
    syllabus: ['What is a Database?', 'Tables & Keys', 'SQL Basics', 'Creating Tables', 'Inserting Data', 'Queries', 'Functions', 'Joins']
  },
  {
    title: 'Data Analysis with Python',
    description: 'In this Data Analysis with Python Certification, you\'ll learn the fundamentals of data analysis with Python. By the end of this certification, you\'ll know how to read data from sources like CSVs and SQL, and how to use libraries like Numpy, Pandas, Matplotlib, and Seaborn to process and visualize data.',
    provider: 'freeCodeCamp',
    externalUrl: 'https://www.freecodecamp.org/learn/data-analysis-with-python/',
    category: 'Data Science',
    level: 'Intermediate',
    duration: '300 hours',
    price: 0,
    thumbnailImage: 'https://design-style-guide.freecodecamp.org/downloads/fcc_primary_large.png',
    instructor: 'freeCodeCamp Community',
    tags: ['Python', 'Data Analysis', 'Pandas', 'NumPy', 'Matplotlib'],
    syllabus: ['Data Analysis with Python', 'Numpy', 'Pandas', 'Matplotlib', 'Data Analysis Projects']
  },
  {
    title: 'Cloud Computing Concepts',
    description: 'Learn the basic concepts of Cloud Computing, from distributed systems to MapReduce and cloud storage.',
    provider: 'Coursera',
    externalUrl: 'https://www.coursera.org/learn/cloud-computing',
    category: 'Cloud',
    level: 'Intermediate',
    duration: '5 weeks',
    price: 0,
    thumbnailImage: 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/15/8e09f0293011e485e927bdcfda9081/CloudComputingConcepts.jpg',
    instructor: 'Prof. Indranil Gupta',
    tags: ['Cloud', 'Distributed Systems', 'MapReduce', 'NoSQL'],
    syllabus: ['Distributed Systems Basics', 'Gossiping and Membership', 'P2P Systems', 'Key-Value Stores', 'Time and Ordering']
  },
  {
    title: 'Git and GitHub for Beginners - Crash Course',
    description: 'Learn the basics of Git and GitHub in this crash course for beginners.',
    provider: 'YouTube',
    externalUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    category: 'Tools',
    level: 'Beginner',
    duration: '1 hour',
    price: 0,
    thumbnailImage: 'https://img.youtube.com/vi/RGOj5yH7evk/maxresdefault.jpg',
    instructor: 'freeCodeCamp',
    tags: ['Git', 'GitHub', 'Version Control'],
    syllabus: ['What is Version Control?', 'Git Basics', 'GitHub Setup', 'Committing', 'Branching', 'Merging']
  },
  {
    title: 'Effective Communication Skills',
    description: 'Improve your communication skills, both written and verbal, for better professional relationships and presentations.',
    provider: 'Coursera',
    externalUrl: 'https://www.coursera.org/learn/communication-skills',
    category: 'Soft Skills',
    level: 'Beginner',
    duration: '3 weeks',
    price: 0,
    thumbnailImage: 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/39/b011403c9411e680a6b5a3fdf2a514/communication.jpg',
    instructor: 'Multiple Instructors',
    tags: ['Communication', 'Soft Skills', 'Professional Development'],
    syllabus: ['Written Communication', 'Verbal Communication', 'Active Listening', 'Giving and Receiving Feedback']
  },
  {
    title: 'Aptitude & Logical Reasoning Basics',
    description: 'Master the basics of quantitative aptitude and logical reasoning for campus placements and competitive exams.',
    provider: 'Internal',
    externalUrl: 'https://example.com/aptitude',
    category: 'Aptitude',
    level: 'Beginner',
    duration: '20 hours',
    price: 0,
    thumbnailImage: 'https://via.placeholder.com/800x450.png?text=Aptitude+Prep',
    instructor: 'Platform Tutors',
    tags: ['Aptitude', 'Reasoning', 'Placement Prep', 'Math'],
    syllabus: ['Number System', 'Percentages', 'Profit and Loss', 'Time and Work', 'Logical Puzzles', 'Data Interpretation']
  },
  {
    title: 'Advanced React Patterns',
    description: 'Learn advanced design patterns in React to build scalable, reusable, and performant components.',
    provider: 'Frontend Masters',
    externalUrl: 'https://frontendmasters.com/courses/advanced-react-patterns/',
    category: 'Web Development',
    level: 'Advanced',
    duration: '6 hours',
    price: 0,
    thumbnailImage: 'https://frontendmasters.com/static-assets/courses/advanced-react-patterns/poster.webp',
    instructor: 'Kent C. Dodds',
    tags: ['React', 'Patterns', 'Hooks', 'Advanced'],
    syllabus: ['Context API', 'Compound Components', 'Render Props', 'Custom Hooks', 'State Reducer Pattern']
  },
  {
    title: 'Introduction to Artificial Intelligence',
    description: 'Learn the foundational principles of Artificial Intelligence, including search algorithms, knowledge representation, and basic machine learning concepts.',
    provider: 'edX',
    externalUrl: 'https://www.edx.org/course/introduction-to-artificial-intelligence',
    category: 'AI/ML',
    level: 'Beginner',
    duration: '8 weeks',
    price: 0,
    thumbnailImage: 'https://prod-discovery.edx-cdn.org/media/course/image/eb2b5d4f-379f-4318-8ec0-21f476a6d634-cf624faafecf.small.jpg',
    instructor: 'Various',
    tags: ['AI', 'Algorithms', 'Logic', 'Search'],
    syllabus: ['What is AI?', 'Search Algorithms', 'Knowledge Representation', 'Reasoning', 'Basic Machine Learning']
  }
];

async function seedCourses() {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    try {
      await mongoose.connect(mongoUri, { 
        family: 4,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      console.log('MongoDB Connected for Course Seeding');
    } catch (dbErr) {
      console.warn(`Failed to connect to Atlas (${dbErr.message}). Falling back to in-memory MongoDB...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`MongoDB (In-Memory) Connected: ${mongoose.connection.host}`);
    }

    // Clear existing
    await Course.deleteMany({});
    await CourseEnrollment.deleteMany({});
    await CourseRating.deleteMany({});
    console.log('Cleared existing courses and enrollments');

    // Insert courses
    const inserted = await Course.insertMany(courses);
    console.log(`Successfully inserted ${inserted.length} courses!`);

    // Create Learning Paths
    const LearningPath = require('./models/LearningPath');
    await LearningPath.deleteMany({});
    
    // Path 1: Full-Stack Web Developer
    const fullStackCourses = inserted.filter(c => 
      ['Responsive Web Design Certification', 'JavaScript Algorithms and Data Structures', 'Full Stack Open']
      .includes(c.title)
    );
    
    if (fullStackCourses.length > 0) {
      await LearningPath.create({
        title: 'Full-Stack Web Developer',
        description: 'Master the frontend and backend technologies needed to build complete web applications from scratch.',
        goal: 'Go from zero to job-ready in web development',
        courseIds: fullStackCourses.map(c => c._id),
        estimatedDuration: '6 months',
        level: 'Beginner',
        thumbnailImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
        category: 'Web Development'
      });
    }

    // Path 2: Data Science & AI Foundations
    const aiCourses = inserted.filter(c => 
      ['Data Analysis with Python', 'Machine Learning Specialization', 'Introduction to Artificial Intelligence']
      .includes(c.title)
    );
    
    if (aiCourses.length > 0) {
      await LearningPath.create({
        title: 'Data Science & AI Foundations',
        description: 'Learn to extract insights from data and build foundational machine learning models.',
        goal: 'Become proficient in data manipulation and AI algorithms',
        courseIds: aiCourses.map(c => c._id),
        estimatedDuration: '4 months',
        level: 'Intermediate',
        thumbnailImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=800&auto=format&fit=crop',
        category: 'AI/ML'
      });
    }

    console.log('Successfully inserted Learning Paths!');

    return inserted;
  } catch (error) {
    console.error('Error seeding courses:', error);
    throw error;
  }
}

if (require.main === module) {
  seedCourses().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { courses, seedCourses };
