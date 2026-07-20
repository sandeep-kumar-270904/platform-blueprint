const fs = require('fs');
const path = require('path');

function searchFiles(dir, regex, ignore = ['node_modules', '.git', 'dist']) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    
    if (fs.statSync(dir).isFile()) {
        const content = fs.readFileSync(dir, 'utf8');
        if (regex.test(content)) {
            results.push(dir);
        }
        return results;
    }
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (ignore.includes(file)) continue;
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(searchFiles(fullPath, regex, ignore));
        } else {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (regex.test(content)) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

const p = (name, regex, dirs=['./backend', './src']) => {
    let found = [];
    for (const dir of dirs) {
        found = found.concat(searchFiles(dir, regex));
    }
    console.log(name + ":", found.length > 0 ? "YES" : "NO", found.length > 0 ? found[0] : "");
}

console.log("--- PHASE 1 ---");
p("Models (Scholarship, Saved, App)", /mongoose\.model\('(Scholarship|SavedScholarship|ScholarshipApplication)'/);
p("Search & Filters", /req\.query\.(amount|deadline|academicLevel|major)/);
p("Results list/grid with empty states", /empty/i, ['./src/pages/Scholarships.tsx']);
p("Pagination", /req\.query\.page/);
p("Scholarship Detail View", /ScholarshipDetails/i);
p("Save/bookmark", /save/i, ['./src/pages/ScholarshipDetails.tsx', './backend/controllers/scholarshipController.js']);
p("Report/flag", /report|flag/i, ['./backend/models/Scholarship.js', './src']);
p("Multi-step apply", /step|wizard/i, ['./src/pages/ScholarshipApply.tsx', './src/pages/Scholarships.tsx', './src/components/scholarships']);
p("Resume Builder integration", /resume/i, ['./src/pages/ScholarshipApply.tsx', './backend/controllers/scholarshipController.js']);
p("External-link click tracking", /external|click|status/i, ['./backend/models/ScholarshipApplication.js', './backend/controllers/scholarshipController.js']);
p("Org submission flow", /submit/i, ['./src/pages/ScholarshipSubmit.tsx']);
p("Admin review queue", /review|pending/i, ['./src/pages/admin/AdminScholarships.tsx']);
p("Matched for you", /match/i, ['./backend/controllers/scholarshipController.js']);
p("Gemini match explanation", /gemini.*match/i, ['./backend/controllers/scholarshipController.js', './backend/services/geminiService.js']);
p("Admin dashboard tab", /AdminScholarships/i, ['./src/App.tsx']);

console.log("--- PHASE 2 ---");
p("Dashboard sorted by deadline urgency", /sort.*deadline/i, ['./src/pages/MyScholarships.tsx', './backend/controllers/scholarshipController.js']);
p("Calendar view", /calendar/i, ['./src/pages/MyScholarships.tsx', './src/components/scholarships']);
p("Deadline reminders (configurable)", /reminder.*deadline/i, ['./backend/services/cronService.js']);
p("Recurring-scholarship logic", /recurring/i, ['./backend/services/cronService.js', './backend/models/Scholarship.js']);
p("Weekly digest", /weekly.*digest/i, ['./backend/services/cronService.js']);
p("Recommendation letter integration", /recommendation/i, ['./backend/models/ScholarshipApplication.js']);
p("Financial aid calculator", /calculator/i, ['./src/components/scholarships', './src/pages/Scholarships.tsx']);
p("Real amounts for suggestions", /amount/i, ['./backend/services/geminiService.js', './backend/controllers/scholarshipController.js']);
p("Admin funnel view", /funnel/i, ['./backend/controllers/scholarshipController.js', './src/pages/admin/AdminScholarships.tsx']);
p("Category/tag breakdown", /breakdown/i, ['./backend/controllers/scholarshipController.js']);
p("Submission source breakdown", /source.*breakdown/i, ['./backend/controllers/scholarshipController.js']);
p("Expiring-soon flagging", /expiring|stale/i, ['./backend/controllers/scholarshipController.js']);

console.log("--- PHASE 3 ---");
p("ScholarshipReview model", /mongoose\.model\('ScholarshipReview'/);
p("Real-application-only enforcement", /ScholarshipApplication\.findOne/i, ['./backend/controllers/scholarshipReviewController.js']);
p("Average rating + tips", /rating|tips/i, ['./src/pages/ScholarshipDetails.tsx', './backend/models/ScholarshipReview.js']);
p("Report/flag on reviews", /report|flag/i, ['./backend/models/ScholarshipReview.js']);
p("EssayResponse bank model", /mongoose\.model\('EssayResponse'/);
p("Essay reuse flow", /reuse/i, ['./src/pages/ScholarshipApply.tsx', './src/components/scholarships']);
p("Gemini-assisted adaptation", /adapt|gemini/i, ['./backend/controllers/essayController.js', './src/pages/ScholarshipApply.tsx']);
p("Institution-exclusive flagging", /exclusivity/i, ['./backend/models/Scholarship.js', './src/pages/Scholarships.tsx']);
p("Institution dashboard", /InstitutionDashboard/i, ['./src/pages/institution/']);
p("Trusted fast-path", /trust|fast/i, ['./backend/controllers/scholarshipController.js']);
p("Diversity opt-in filters", /diversity|accessibility/i, ['./backend/models/Scholarship.js', './src/pages/Scholarships.tsx']);
p("Need-based sort mode", /need-based/i, ['./backend/controllers/scholarshipController.js']);

console.log("--- PHASE 4 ---");
p("ScholarshipCircle model", /mongoose\.model\('ScholarshipCircle'/);
p("Aggregate-only visibility", /aggregate/i, ['./backend/models/ScholarshipCircle.js']);
p("Explicit content sharing", /share/i, ['./backend/models/ScholarshipCircle.js']);
p("Shared deadline calendar", /shared.*calendar/i, ['./src/components/scholarships', './backend/controllers/scholarshipCircleController.js']);
p("Cross-linking learning path", /learning-path/i, ['./backend/models/Scholarship.js']);
p("Employer-sponsored", /linkedJobId/i, ['./backend/models/Scholarship.js', './src/pages/ScholarshipSubmit.tsx']);
p("Opt-in award-to-hiring", /consent/i, ['./backend/models/ScholarshipApplication.js']);
p("Personal analytics dashboard", /analytics/i, ['./src/pages/MyScholarships.tsx']);
p("Funding-secured tracker", /secured/i, ['./src/pages/MyScholarships.tsx']);
p("Where to focus gap suggestion", /gap/i, ['./src/pages/MyScholarships.tsx']);

console.log("--- PHASE 5 ---");
p("Persistent coach chat", /coach/i, ['./src/components/scholarships', './backend/controllers/scholarshipChatController.js']);
p("Batch application mode", /batch/i, ['./src/pages/Scholarships.tsx', './backend/controllers/scholarshipController.js']);
p("AwardeeStory model", /mongoose\.model\('AwardeeStory'/);
p("Admin review anonymity", /anonymity/i, ['./backend/models/AwardeeStory.js']);
p("Micro-scholarship flag", /subtype/i, ['./backend/models/Scholarship.js']);
p("Simplified single-step form", /single-step/i, ['./src/pages/ScholarshipApply.tsx']);

console.log("--- PHASE 6 ---");
p("Unified My Funding", /Unified|Funding/i, ['./src/pages/MyScholarships.tsx']);
p("stackingRules field", /stackingRules/i, ['./backend/models/Scholarship.js']);
p("Gemini stacking strategy", /stacking.*strategy/i, ['./backend/services/geminiService.js']);
p("providerVerification field", /providerVerification/i, ['./backend/models/Scholarship.js']);
p("Scam-pattern flagging", /scam/i, ['./backend/controllers/scholarshipController.js']);
p("Prioritized review queue", /prioritized/i, ['./backend/controllers/scholarshipController.js']);
p("Auto-archive recurring", /archive/i, ['./backend/services/cronService.js']);
p("Past cycles view", /past.*cycles/i, ['./src/pages/MyScholarships.tsx']);

console.log("--- PHASE 7 ---");
p("Bulk-aid allocation dashboard", /bulk-aid/i, ['./src/pages/institution']);
p("Portfolio optimizer", /optimizer/i, ['./src/pages/MyScholarships.tsx', './backend/services/geminiService.js']);
p("Multilingual search/display", /multilingual/i, ['./src/pages/Scholarships.tsx']);
p("renewalRequirements field", /renewalRequirements/i, ['./backend/models/Scholarship.js']);
p("ComplianceCheck model", /mongoose\.model\('ComplianceCheck'/);
p("Compliance reminder notifications", /compliance/i, ['./backend/services/cronService.js']);
p("Admin verify/at-risk actions", /at-risk/i, ['./backend/controllers/complianceController.js']);

console.log("--- PHASE 8 ---");
p("Notification preference audit", /notificationPreferences.*scholarship/i, ['./backend/models/User.js']);
p("Admin dashboard completeness", /completeness/i, ['./src/pages/admin/AdminScholarships.tsx']);
p("Cross-phase ban enforcement", /banned/i, ['./backend/controllers/scholarshipController.js']);
p("Indexes on models", /index\(/i, ['./backend/models/Scholarship.js', './backend/models/ScholarshipApplication.js']);
p("Financial-privacy re-verification", /privacy/i, ['./backend/controllers/scholarshipController.js']);
p("File upload validation", /upload.*valid/i, ['./backend/controllers/scholarshipController.js']);
p("Gemini rate-limit", /rate.*limit/i, ['./backend/services/geminiService.js']);

console.log("--- PHASE 9 ---");
p("Community Trust indicator", /Community.*Trust/i, ['./backend/models/Scholarship.js']);
p("Alt funding resource section", /Alternative.*Funding/i, ['./backend/controllers/scholarshipController.js']);
p("1:1 buddy matching", /buddy/i, ['./backend/models/ScholarshipBuddy.js']);
p("Competitiveness indicator", /competitiveness/i, ['./backend/models/Scholarship.js', './src/pages/Scholarships.tsx']);

console.log("--- PHASE 10 ---");
p("SavingsGoal model", /mongoose\.model\('SavingsGoal'/);
p("Milestone notifications", /milestone/i, ['./backend/controllers/scholarshipController.js']);
p("Essay-template sharing", /template/i, ['./backend/models/ScholarshipTemplate.js']);
p("Near you regional section", /regional/i, ['./src/pages/Scholarships.tsx']);
p("Applicant-provider feedback", /feedback/i, ['./backend/models/ApplicantFeedback.js']);

console.log("--- PHASE 11 ---");
p("ScholarshipDataSource model", /mongoose\.model\('ScholarshipDataSource'/);
p("Scheduled sync job", /apiSyncJob/i, ['./backend/jobs']);
p("Staleness flagging", /stale/i, ['./backend/models/ScholarshipDataSource.js']);
p("Open user submission with source URL", /sourceUrl/i, ['./src/pages/ScholarshipSubmit.tsx']);
p("Lightweight review UI", /unverified_submission/i, ['./src/pages/admin/AdminScholarships.tsx']);
p("Submission rate limiting", /rateLimit/i, ['./backend/routes/scholarships.js']);
p("Per-user accuracy tracking", /scholarshipSubmissionStats/i, ['./backend/models/User.js']);
p("Automatic deadline expiry", /expired/i, ['./backend/services/cronService.js']);
