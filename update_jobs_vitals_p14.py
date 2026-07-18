import os
import re

jobs_path = "backend/routes/jobs.js"
with open(jobs_path, "r", encoding="utf-8") as f:
    content = f.read()

# We need to find the route GET /:id/applications (around line 493)
# It populates 'applicant' and 'resumeSnapshot'. We need to add 'vitals' computation after it.

vitals_logic = """
    // Phase 14: Compute Candidate Vitals
    applications = applications.map(app => {
      let vitals = null;
      if (app.resumeSnapshot) {
        let yoe = 0;
        const exp = app.resumeSnapshot.experience || [];
        exp.forEach(e => {
          if (e.startDate) {
            const start = new Date(e.startDate);
            const end = e.endDate ? new Date(e.endDate) : new Date();
            if (!isNaN(start) && !isNaN(end)) {
              yoe += (end - start) / (1000 * 60 * 60 * 24 * 365);
            }
          }
        });

        const verifiedSkillsCount = (app.applicant?.verifiedSkills || []).length;
        const certsCount = (app.resumeSnapshot.certifications || []).length;
        
        vitals = {
          yearsOfExperience: Math.round(yoe * 10) / 10,
          verifiedSkillsCount,
          certificationsCount: certsCount
        };

        if (app.resumeSnapshot.showAtsScore) {
          vitals.atsScore = app.resumeSnapshot.atsScore?.score || 0;
        }
      }
      return { ...app.toObject(), vitals };
    });
"""

if "// Phase 14: Compute Candidate Vitals" not in content:
    # Find the place where `applications = await JobApplication.find(query)` happens.
    # It looks like:
    # let applications = await JobApplication.find(query)
    #   .populate('applicant', 'full_name username avatar_url email phone skills verifiedSkills degree university')
    #   .populate('resumeSnapshot')
    #   .sort(sortOption);
    
    # We will just insert vitals_logic before `res.json({ applications, total: totalApplications, totalPages: Math.ceil(...) });`

    content = re.sub(
        r'(res\.json\(\{ applications, total: totalApplications, totalPages: Math\.ceil\([^)]+\) \}\);)',
        vitals_logic + r'\n    \1',
        content
    )
    with open(jobs_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated jobs.js for Vitals")
else:
    print("Vitals logic already in jobs.js")
