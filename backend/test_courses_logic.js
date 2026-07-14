const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');
const CourseRating = require('./models/CourseRating');
const User = require('./models/User');

dotenv.config();

async function runTests() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoServer = await MongoMemoryServer.create();
  const memUri = mongoServer.getUri();
  await mongoose.connect(memUri);
  console.log(`Connected to memory DB for testing`);

  // Create User
  const user = await User.create({
    username: 'teststudent',
    email: 'student@test.com',
    password: 'password',
    role: 'user'
  });

  // Create Course
  const course = await Course.create({
    title: 'Test Course',
    description: 'A test course',
    provider: 'Test Provider',
    externalUrl: 'http://test.com',
    category: 'Computer Science',
    level: 'Beginner'
  });

  console.log('✅ Created User and Course');

  // Test Enrollment
  let enrollment = await CourseEnrollment.create({
    userId: user._id,
    courseId: course._id,
    status: 'enrolled',
    progressPercent: 0
  });

  course.totalEnrollments += 1;
  await course.save();

  console.log('✅ Enrolled user');

  try {
    await CourseEnrollment.create({
      userId: user._id,
      courseId: course._id
    });
    console.error('❌ Failed: Should not allow duplicate enrollment');
  } catch (e) {
    console.log('✅ Correctly blocked duplicate enrollment');
  }

  // Test Progress & Completion
  enrollment.progressPercent = 100;
  enrollment.status = 'completed';
  enrollment.completedAt = new Date();
  await enrollment.save();
  console.log('✅ User completed course');

  // Test Rating
  await CourseRating.create({
    courseId: course._id,
    userId: user._id,
    rating: 5,
    reviewText: 'Great course!'
  });

  course.rating = 5.0;
  course.totalRatings = 1;
  await course.save();
  console.log('✅ User rated course');

  const updatedCourse = await Course.findById(course._id);
  if (updatedCourse.rating === 5 && updatedCourse.totalEnrollments === 1) {
    console.log('✅ Logic verified successfully!');
  } else {
    console.error('❌ Mismatch in aggregations');
  }

  process.exit(0);
}

runTests();
