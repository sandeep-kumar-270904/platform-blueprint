const JobAlert = require('../models/JobAlert');
const CompanyFollow = require('../models/CompanyFollow');
const User = require('../models/User');
const { createNotification } = require('./notificationService');

async function processInstantJobAlerts(job) {
  try {
    // 1. Find all active instant alerts
    const alerts = await JobAlert.find({ active: true, frequency: 'instant' });

    for (const alert of alerts) {
      // Check if job matches criteria
      const c = alert.criteria;
      if (c.location && job.location && !job.location.toLowerCase().includes(c.location.toLowerCase())) continue;
      if (c.workMode && job.workMode !== c.workMode) continue;
      if (c.jobType && job.jobType !== c.jobType) continue;
      if (c.experienceLevel && job.experienceLevel !== c.experienceLevel) continue;
      if (c.minSalary && job.salary?.max && job.salary.max < c.minSalary) continue;
      
      // Keywords check against title, description, or skills
      if (c.keywords) {
        const keyword = c.keywords.toLowerCase();
        const titleMatch = job.title?.toLowerCase().includes(keyword);
        const descMatch = job.description?.toLowerCase().includes(keyword);
        const skillMatch = job.skills?.some(s => s.toLowerCase().includes(keyword));
        if (!titleMatch && !descMatch && !skillMatch) continue;
      }

      // Check user preferences
      const user = await User.findById(alert.user).select('notificationPreferences');
      if (!user) continue;

      const inApp = user.notificationPreferences?.jobAlerts?.inApp !== false;
      const email = user.notificationPreferences?.jobAlerts?.email !== false;

      if (!inApp && !email) continue;
      
      let channel = 'both';
      if (inApp && !email) channel = 'in_app';
      if (!inApp && email) channel = 'email';

      // It matched! Send notification
      await createNotification({
        userId: alert.user,
        type: 'job_alert_match',
        message: `New job match for alert "${alert.name}": ${job.title} at ${job.company?.name || 'a company'}`,
        relatedJob: job._id,
        actionUrl: `/jobs/${job._id}`,
        channel,
        emailData: { jobTitle: job.title }
      });

      alert.lastNotifiedAt = new Date();
      await alert.save();
    }
  } catch (err) {
    console.error('Error in processInstantJobAlerts:', err);
  }
}

async function processCompanyFollowers(job) {
  try {
    if (!job.company || !job.company.name) return;

    const follows = await CompanyFollow.find({ companyName: job.company.name });
    
    for (const follow of follows) {
      const user = await User.findById(follow.user).select('notificationPreferences');
      if (!user) continue;

      const inApp = user.notificationPreferences?.companyUpdates?.inApp !== false;
      const email = user.notificationPreferences?.companyUpdates?.email !== false;

      if (!inApp && !email) continue;
      
      let channel = 'both';
      if (inApp && !email) channel = 'in_app';
      if (!inApp && email) channel = 'email';

      await createNotification({
        userId: follow.user,
        type: 'company_new_job',
        message: `${job.company.name} posted a new job: ${job.title}`,
        relatedJob: job._id,
        actionUrl: `/jobs/${job._id}`,
        channel,
        emailData: { jobTitle: job.title, companyName: job.company.name }
      });
    }
  } catch (err) {
    console.error('Error in processCompanyFollowers:', err);
  }
}

async function onJobPublished(job) {
  // Fire and forget
  processInstantJobAlerts(job).catch(console.error);
  processCompanyFollowers(job).catch(console.error);
}

module.exports = {
  onJobPublished,
  processInstantJobAlerts,
  processCompanyFollowers
};
