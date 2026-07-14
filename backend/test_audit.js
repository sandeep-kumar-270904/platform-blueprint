const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const College = require('./models/College');
const Event = require('./models/Event');
const Review = require('./models/Review');
const EventRegistration = require('./models/EventRegistration');
const EventFeedback = require('./models/EventFeedback');
const User = require('./models/User');

const connectDB = require('./db');

async function runAudit() {
  try {
    console.log("Connecting to MongoDB via app db module...");
    await connectDB();
    console.log("Connected.");
    
    console.log("Seeding Database so we can test logic...");
    const seedEvents = require('./seedEvents');
    await seedEvents();

    console.log("\n=================================");
    console.log("1 & 2. TRACING ONE COLLEGE");
    console.log("=================================");
    const college = await College.findOne({ draft: { $ne: true } }).lean();
    if (!college) {
      console.log("❌ No college found in DB.");
    } else {
      console.log(`✅ Found College: ${college.name} (${college._id})`);
      console.log(`Fields present:`, Object.keys(college));
      console.log(`Key data: location=${college.location}, type=${college.type}, fees=${college.fees}`);
      console.log(`Rating stats in DB: averageRating=${college.averageRating}, totalReviews=${college.totalReviews}`);
      
      const reviews = await Review.find({ collegeId: college._id, status: 'public' }).lean();
      console.log(`Actual public reviews count in DB: ${reviews.length}`);
      const expectedAvg = reviews.length ? (reviews.reduce((a,c)=>a+c.rating,0)/reviews.length) : 0;
      console.log(`Calculated average from actual reviews: ${expectedAvg}`);
      if (expectedAvg === college.averageRating && reviews.length === college.totalReviews) {
        console.log("✅ Aggregation perfectly matches.");
      } else {
        console.log("❌ Aggregation mismatch!");
      }
    }

    console.log("\n=================================");
    console.log("1 & 3. TRACING ONE EVENT");
    console.log("=================================");
    const event = await Event.findOne({ status: 'approved' }).lean();
    if (!event) {
      console.log("❌ No approved event found in DB.");
    } else {
      console.log(`✅ Found Event: ${event.title} (${event._id})`);
      console.log(`Fields present:`, Object.keys(event));
      console.log(`Key data: type=${event.type}, location=${event.location}`);
      
      const regs = await EventRegistration.find({ eventId: event._id }).lean();
      console.log(`Actual registrations in DB: ${regs.length}`);
      console.log(`Event model 'registrationCount' field: ${event.registrationCount !== undefined ? event.registrationCount : 'NOT STORED IN DB (Calculated on fly)'}`);
    }

    console.log("\n=================================");
    console.log("4 & 5. WRITE ACTIONS & RECALCULATIONS");
    console.log("=================================");
    const user = await User.findOne().lean();
    if (!user) throw new Error("No user found.");
    console.log(`Testing with user: ${user.username} (${user._id})`);

    console.log(`\n--- Submitting Review ---`);
    const newReview = new Review({
      collegeId: college._id,
      userId: user._id,
      rating: 4,
      content: "Automated test review content.",
      status: 'public'
    });
    await newReview.save();
    console.log(`✅ Review saved to DB: ${newReview._id}`);
    
    const collegeAfter = await College.findById(college._id).lean();
    console.log(`College average after review save: ${collegeAfter.averageRating}, total: ${collegeAfter.totalReviews}`);
    if (collegeAfter.totalReviews === college.totalReviews) {
      console.log(`❌ College stats did NOT automatically update via Mongoose hooks (this means the API endpoint handles the aggregation manually).`);
    } else {
      console.log(`✅ College stats updated automatically!`);
    }
    
    await Review.findByIdAndDelete(newReview._id);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

runAudit();
