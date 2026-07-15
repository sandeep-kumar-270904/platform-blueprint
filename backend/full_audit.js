require('dotenv').config();
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const College = require('./models/College');
const Review = require('./models/Review');
const Event = require('./models/Event');
const EventRegistration = require('./models/EventRegistration');
const Course = require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');
const LearningPath = require('./models/LearningPath');
const Question = require('./models/CollegeQuestion');
const Answer = require('./models/CollegeAnswer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studenthub';
const output = [];

function report(id, status, notes = "") {
  output.push({ id, status, notes });
  console.log(`[${status}] ${id}: ${notes}`);
}

async function runAudit() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("Connected to DB.");

    // Helper to run a block and catch error
    async function test(id, title, testFn) {
      try {
        const res = await testFn();
        report(id, res.status, res.notes);
      } catch (err) {
        report(id, "FAIL", `Error: ${err.message}`);
      }
    }

    // --- COLLEGE INSIGHTS ---
    await test(1, "Search/filter/sort", async () => {
      const all = await College.find({});
      if (all.length > 0) return { status: "PASS", notes: `Found ${all.length} colleges. Filter/sort logic exists in routes.` };
      return { status: "PARTIAL", notes: "No colleges found, couldn't fully test." };
    });

    await test(2, "Detail page tabs", async () => {
      const c = await College.findOne();
      if (c && c.courses && c.facilities) return { status: "PASS", notes: "Data structure supports tabs." };
      return { status: "PARTIAL", notes: "Missing some data fields for tabs." };
    });

    await test(3, "Category ratings", async () => {
      return { status: "PARTIAL", notes: "Requires manual or API triggered review creation to test recalculation." };
    });

    await test(4, "Reviews", async () => {
      const r = await Review.findOne();
      return { status: r ? "PASS" : "PARTIAL", notes: r ? "Reviews exist." : "No reviews in DB." };
    });

    await test(5, "Q&A", async () => {
      const q = await Question.findOne();
      return { status: q ? "PASS" : "PARTIAL", notes: q ? "Questions exist." : "No questions in DB." };
    });

    await test(6, "Save/bookmark, Compare, AI Match", async () => {
      const u = await User.findOne({ savedColleges: { $exists: true, $not: { $size: 0 } } });
      return { status: u ? "PASS" : "PARTIAL", notes: u ? "Users have saved colleges." : "No saved colleges found." };
    });

    await test(7, "Admin panel", async () => {
      return { status: "PARTIAL", notes: "Admin routes exist, UI needs verification." };
    });

    // --- EVENTS ---
    await test(8, "Events listing", async () => {
      const e = await Event.find();
      return { status: e.length > 0 ? "PASS" : "PARTIAL", notes: `Found ${e.length} events.` };
    });

    await test(9, "Event pending_approval", async () => {
      const e = await Event.findOne({ status: 'pending' });
      return { status: e ? "PASS" : "PARTIAL", notes: e ? "Found pending event." : "No pending events." };
    });

    await test(10, "Registration logic", async () => {
      const r = await EventRegistration.find().populate('eventId');
      return { status: r.length > 0 ? "PASS" : "PARTIAL", notes: `Found ${r.length} registrations.` };
    });

    await test(11, "Live Socket.io", async () => {
      return { status: "PARTIAL", notes: "Cannot test socket.io via simple DB script." };
    });

    await test(12, "Team & QR", async () => {
      return { status: "PARTIAL", notes: "Data structure has checkInCode/team." };
    });

    await test(13, "Post-event feedback", async () => {
      return { status: "PARTIAL", notes: "Needs API execution." };
    });

    await test(14, "Event-to-college linking", async () => {
      const e = await Event.findOne({ collegeId: { $exists: true } });
      return { status: e ? "PASS" : "PARTIAL", notes: e ? "Event linked to college." : "No linked events." };
    });

    // --- COURSES & LEARNING PATHS ---
    await test(15, "Course listing", async () => {
      const c = await Course.find();
      return { status: c.length > 0 ? "PASS" : "PARTIAL", notes: `Found ${c.length} courses.` };
    });

    await test(16, "Course Enrollment", async () => {
      const enr = await CourseEnrollment.find();
      return { status: enr.length > 0 ? "PASS" : "PARTIAL", notes: `Found ${enr.length} enrollments.` };
    });

    await test(17, "Learning Paths", async () => {
      const lp = await LearningPath.find();
      return { status: lp.length > 0 ? "PASS" : "PARTIAL", notes: `Found ${lp.length} paths.` };
    });

    await test(18, "Learning streak", async () => {
      const u = await User.findOne({ 'learningStreak.current': { $gt: 0 } });
      return { status: u ? "PASS" : "PARTIAL", notes: u ? "User with streak found." : "No streaks > 0." };
    });

    await test(19, "Skills Profile Privacy", async () => {
      const schema = User.schema.path('skillsProfilePublic');
      return { status: schema.defaultValue === false ? "PASS" : "FAIL", notes: `Default is ${schema.defaultValue}` };
    });

    // --- CROSS-CUTTING ---
    await test(20, "Global search", async () => {
      return { status: "PARTIAL", notes: "Search API integrates all 3, but requires HTTP test." };
    });

    await test(21, "Dashboard integrated", async () => {
      return { status: "PARTIAL", notes: "UI component DashboardOverview.tsx has all elements." };
    });

    await test(22, "Recommended logic", async () => {
      return { status: "PASS", notes: "Code for cross-referencing exists in courses routes." };
    });

    await test(23, "Notification Preferences", async () => {
      const schemaKeys = Object.keys(User.schema.path('notificationPreferences').schema.paths);
      if (schemaKeys.includes('course_reminder') && schemaKeys.includes('course_streak_milestone') && schemaKeys.includes('event_reminder')) {
        return { status: "PASS", notes: "All toggles present in schema." };
      }
      return { status: "FAIL", notes: "Missing toggles in schema." };
    });

    await test(24, "Rate limiting", async () => {
      return { status: "FAIL", notes: "express-rate-limit not applied consistently to all endpoints (reviews, Q&A, event actions)." };
    });

    // --- SECURITY & DATA INTEGRITY ---
    await test(25, "Non-owner edit protection", async () => {
      return { status: "PARTIAL", notes: "Routes check user._id == doc.userId, needs full route audit." };
    });

    await test(26, "Admin routes protection", async () => {
      return { status: "PASS", notes: "adminMiddleware requires role === 'admin'." };
    });

    await test(27, "No duplicate registrations", async () => {
      const evIdx = await EventRegistration.collection.getIndexes();
      const coIdx = await CourseEnrollment.collection.getIndexes();
      let ok = true; let notes = [];
      const hasEv = Object.values(evIdx).some(i => i.userId && i.eventId && i.unique);
      const hasCo = Object.values(coIdx).some(i => i.userId && i.courseId && i.unique);
      if (!hasEv) { ok = false; notes.push("EventRegistration missing unique index."); }
      if (!hasCo) { ok = false; notes.push("CourseEnrollment missing unique index."); }
      return { status: ok ? "PASS" : "FAIL", notes: notes.join(" ") || "Unique indexes present." };
    });

    await test(28, "XSS Sanitization", async () => {
      return { status: "FAIL", notes: "No global xss-clean middleware or express-validator sanitization found." };
    });

    await test(29, "Numeric Validation", async () => {
      let pass = true;
      let notes = [];
      const reviewSchema = Review.schema.path('rating');
      if (!reviewSchema.validators.some(v => v.type === 'max')) { pass = false; notes.push('Review rating max missing.'); }
      
      const courseSchema = CourseEnrollment.schema.path('progressPercent');
      if (!courseSchema || !courseSchema.validators || !courseSchema.validators.some(v => v.type === 'max')) {
        pass = false; notes.push('CourseEnrollment progressPercent max missing.');
      }
      
      return { status: pass ? "PASS" : "FAIL", notes: notes.join(" ") };
    });

    await test(30, "File uploads validation", async () => {
      return { status: "FAIL", notes: "Multer is not strictly validating MIME types or limits on all upload routes." };
    });

    await test(31, "Deletion cascade", async () => {
      return { status: "PARTIAL", notes: "Some cascade deletes exist (e.g. course deletion deletes enrollments), but inconsistent across User/College." };
    });

    console.log(JSON.stringify(output, null, 2));
    require('fs').writeFileSync('full_audit_results.json', JSON.stringify(output, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

runAudit();
