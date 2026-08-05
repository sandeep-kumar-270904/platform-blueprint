const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const QuoteRequest = require('./models/QuoteRequest');
const QuoteResponse = require('./models/QuoteResponse');
const RepairRequest = require('./models/RepairRequest');
const RepairProvider = require('./models/RepairProvider');
const User = require('./models/User');

const runTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/platform-blueprint');
    console.log('Connected to DB');

    // 1. Get a mock user
    const user = await User.findOne();
    if (!user) {
      console.log('No user found');
      process.exit(1);
    }

    // 2. Clear old data for test
    await QuoteRequest.deleteMany({});
    await QuoteResponse.deleteMany({});
    
    // 3. Create a Quote Request
    const category = 'plumbing';
    const issueDescription = 'Test Plumbing Issue';
    const budgetRange = '$50 - $150';
    const isUrgent = true;

    // Finding providers manually
    let query = { isActive: { $ne: false }, category };
    query.basePrice = { $gte: 50, $lte: 150 };

    const matchedProviders = await RepairProvider.find(query).limit(2);
    
    console.log(`Found ${matchedProviders.length} providers for quote.`);

    const quoteRequest = await QuoteRequest.create({
      userId: user._id,
      category,
      issueDescription,
      budgetRange,
      isUrgent,
      status: 'Open',
      quotesReceivedCount: matchedProviders.length
    });
    console.log(`Created Quote Request: ${quoteRequest._id}`);

    // 4. Create Quote Responses
    const responses = [];
    for (const provider of matchedProviders) {
      const resp = await QuoteResponse.create({
        quoteRequestId: quoteRequest._id,
        providerId: provider._id,
        priceEstimate: '$100',
        estimatedTimeframe: 'Tomorrow',
        note: 'I can do this!',
        status: 'Pending'
      });
      responses.push(resp);
    }
    console.log(`Created ${responses.length} Quote Responses`);

    if (responses.length < 2) {
      console.log('Need at least 2 providers to test atomic acceptance properly. Skipping atomic test.');
      process.exit(0);
    }

    // 5. Atomic Acceptance Test (Concurrent)
    const acceptQuote = async (quoteId) => {
      const session = await mongoose.startSession();
      try {
        let result = null;
        await session.withTransaction(async () => {
          const qr = await QuoteResponse.findById(quoteId).session(session);
          const req = await QuoteRequest.findById(qr.quoteRequestId).session(session);
          
          if (req.status !== 'Open') {
            throw new Error('Not open');
          }
          if (qr.status !== 'Pending') {
            throw new Error('Not pending');
          }

          qr.status = 'Accepted';
          await qr.save({ session });

          const others = await QuoteResponse.find({ 
            quoteRequestId: req._id, 
            _id: { $ne: qr._id } 
          }).session(session);

          for (const o of others) {
            o.status = 'Declined-by-user';
            await o.save({ session });
          }

          req.status = 'Accepted';
          await req.save({ session });
          result = 'Success';
        });
        session.endSession();
        return result;
      } catch (err) {
        session.endSession();
        return 'Failed: ' + err.message;
      }
    };

    console.log('Starting concurrent acceptances...');
    const results = await Promise.all([
      acceptQuote(responses[0]._id),
      acceptQuote(responses[1]._id)
    ]);

    console.log('Results of concurrent acceptance:', results);

    // Verify final state
    const finalReq = await QuoteRequest.findById(quoteRequest._id);
    const finalResp1 = await QuoteResponse.findById(responses[0]._id);
    const finalResp2 = await QuoteResponse.findById(responses[1]._id);

    console.log('Final Request Status:', finalReq.status);
    console.log('Final Response 1 Status:', finalResp1.status);
    console.log('Final Response 2 Status:', finalResp2.status);

    if (results.includes('Success') && results.some(r => r.includes('Failed'))) {
      console.log('✅ Transaction atomicity works! Only one quote was accepted.');
    } else {
      console.log('❌ Transaction atomicity failed!');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runTests();
