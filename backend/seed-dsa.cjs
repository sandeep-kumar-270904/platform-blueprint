const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DSAProblem = require('./models/DSAProblem');

dotenv.config();

const problems = [
  { title: "Two Sum", difficulty: "Easy", topic: "Arrays", companies: ["Google", "Amazon", "Facebook"], link: "https://leetcode.com/problems/two-sum/" },
  { title: "Best Time to Buy and Sell Stock", difficulty: "Easy", topic: "Arrays", companies: ["Amazon", "Microsoft"], link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
  { title: "Contains Duplicate", difficulty: "Easy", topic: "Arrays", companies: ["Google", "Apple"], link: "https://leetcode.com/problems/contains-duplicate/" },
  { title: "Product of Array Except Self", difficulty: "Medium", topic: "Arrays", companies: ["Facebook", "Amazon"], link: "https://leetcode.com/problems/product-of-array-except-self/" },
  { title: "Maximum Subarray", difficulty: "Medium", topic: "Arrays", companies: ["Microsoft", "LinkedIn"], link: "https://leetcode.com/problems/maximum-subarray/" },
  { title: "Climbing Stairs", difficulty: "Easy", topic: "DP", companies: ["Amazon", "Google"], link: "https://leetcode.com/problems/climbing-stairs/" },
  { title: "Coin Change", difficulty: "Medium", topic: "DP", companies: ["Amazon", "Microsoft"], link: "https://leetcode.com/problems/coin-change/" },
  { title: "Longest Increasing Subsequence", difficulty: "Medium", topic: "DP", companies: ["Google", "Facebook"], link: "https://leetcode.com/problems/longest-increasing-subsequence/" },
  { title: "Word Break", difficulty: "Medium", topic: "DP", companies: ["Amazon", "Facebook"], link: "https://leetcode.com/problems/word-break/" },
  { title: "Number of Islands", difficulty: "Medium", topic: "Graphs", companies: ["Amazon", "Google", "Facebook"], link: "https://leetcode.com/problems/number-of-islands/" },
  { title: "Clone Graph", difficulty: "Medium", topic: "Graphs", companies: ["Facebook", "Amazon"], link: "https://leetcode.com/problems/clone-graph/" },
  { title: "Course Schedule", difficulty: "Medium", topic: "Graphs", companies: ["Google", "Amazon"], link: "https://leetcode.com/problems/course-schedule/" },
  { title: "Alien Dictionary", difficulty: "Hard", topic: "Graphs", companies: ["Facebook", "Google"], link: "https://leetcode.com/problems/alien-dictionary/" },
  { title: "Invert Binary Tree", difficulty: "Easy", topic: "Trees", companies: ["Google"], link: "https://leetcode.com/problems/invert-binary-tree/" },
  { title: "Maximum Depth of Binary Tree", difficulty: "Easy", topic: "Trees", companies: ["Amazon", "Microsoft"], link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
  { title: "Binary Tree Level Order Traversal", difficulty: "Medium", topic: "Trees", companies: ["Facebook", "Amazon"], link: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
  { title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", topic: "Trees", companies: ["Google", "Amazon"], link: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/" }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studenthub');
    console.log('Connected to DB');
    await DSAProblem.deleteMany({});
    await DSAProblem.insertMany(problems);
    console.log('Seeded DSA problems');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

seed();
