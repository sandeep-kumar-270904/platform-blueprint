const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const College = require('./backend/models/College');

const BASE_URL = 'http://localhost:5000/api';

async function testPhase123() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/college_insights');
    
    // 1. Setup users and college
    const student = await User.findOne({ email: 'student_test123@example.com' });
    const admin = await User.findOne({ email: 'admin_test123@example.com' });
    const college = await College.findOne({});

    if (!student || !admin || !college) {
      console.error('Test data missing. Please ensure setup_test_user.cjs ran.');
      process.exit(1);
    }

    const studentToken = student.generateAuthToken();
    const adminToken = admin.generateAuthToken();

    console.log('--- TESTING REVIEW RATING LOGIC ---');
    const reviewPayload = {
      title: "Great academics, average hostel",
      reviewText: "The academics are solid but the hostel is lacking.",
      rating: 5, // Attempt to maliciously set overallRating to 5
      wouldRecommend: true,
      categoryRatings: {
        academics: 4,
        placements: 3,
        faculty: 4,
        infrastructure: 3,
        hostel: 2,
        campusLife: 3,
        valueForMoney: 4 // Average = 23 / 7 = 3.28 -> 3.3
      }
    };

    const reviewRes = await axios.post(`${BASE_URL}/colleges/${college._id}/reviews`, reviewPayload, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    if (reviewRes.status === 201) {
      const computedRating = reviewRes.data.review.overallRating;
      if (computedRating === 3.3) {
        console.log('PASS: Review rating computed correctly as 3.3 (ignored the malicious 5)');
      } else {
        console.log(`FAIL: Review rating computed as ${computedRating}, expected 3.3`);
      }
    } else {
      console.log('FAIL: Review submission failed', reviewRes.status);
    }

    console.log('\n--- TESTING ANONYMOUS POSTING ---');
    const postPayload = {
      content: "Does anyone have past papers for DS?",
      category: "question",
      isAnonymous: true
    };
    
    const postRes = await axios.post(`${BASE_URL}/community-feed`, postPayload, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const postId = postRes.data._id;

    // Fetch feed as student
    const feedRes = await axios.get(`${BASE_URL}/community/posts`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    const thePost = feedRes.data.find(p => p._id === postId);
    if (thePost) {
      if (thePost.author._id === "anonymous" && thePost.author.username === "anonymous") {
        console.log('PASS: Author successfully masked in regular feed');
      } else {
        console.log('FAIL: Author not masked in regular feed:', thePost.author);
      }
    } else {
      console.log('FAIL: Post not found in feed');
    }

    console.log('\n--- TESTING ADMIN AUDIT ENDPOINT ---');
    const auditRes = await axios.get(`${BASE_URL}/admin/community/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const auditedPost = auditRes.data.posts.find(p => p._id === postId);
    if (auditedPost) {
      if (auditedPost.user_id && auditedPost.user_id._id === student._id.toString()) {
        console.log(`PASS: Audit endpoint revealed true author: ${auditedPost.user_id.username}`);
      } else {
        console.log('FAIL: Audit endpoint did not reveal true author:', auditedPost.user_id);
      }
    } else {
      console.log('FAIL: Post not found in audit feed');
    }

    // Cleanup
    await mongoose.connection.collection('communityposts').deleteOne({ _id: new mongoose.Types.ObjectId(postId) });
    await mongoose.connection.collection('reviews').deleteOne({ _id: new mongoose.Types.ObjectId(reviewRes.data.review._id) });

  } catch (err) {
    console.error('Test error:', err.response ? err.response.data : err);
  } finally {
    await mongoose.disconnect();
  }
}

testPhase123();
