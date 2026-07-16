const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const { createNotification } = require('./notificationService');
const User = require('../models/User');

const createJobApplication = async ({ jobId, applicantId, applyMode, resumeUrl, coverLetter, screeningAnswers, io }) => {
  const job = await Job.findById(jobId);
  if (!job) {
    const error = new Error('Job not found');
    error.status = 404;
    throw error;
  }

  // Ensure job is published
  if (job.status !== 'published') {
    const error = new Error('This job is not currently accepting applications');
    error.status = 400;
    throw error;
  }

  const actualApplyMode = applyMode || job.applyMode;

  if (actualApplyMode === 'in-app' && job.applyMode !== 'in-app') {
    const error = new Error('This job does not support in-app applications');
    error.status = 400;
    throw error;
  }

  // Check duplicate
  const existing = await JobApplication.findOne({ job: job._id, applicant: applicantId });
  if (existing) {
    const error = new Error('You have already applied to this job');
    error.status = 409;
    error.code = 11000;
    throw error;
  }

  if (job.applyMode === 'in-app' && !resumeUrl) {
    const error = new Error('Resume is required for in-app applications');
    error.status = 400;
    throw error;
  }

  const application = new JobApplication({
    job: job._id,
    applicant: applicantId,
    applyMode: job.applyMode,
    resumeUrl: job.applyMode === 'in-app' ? resumeUrl : undefined,
    coverLetter,
    screeningAnswers,
    status: 'applied',
    statusHistory: [{
      status: 'applied',
      changedAt: new Date(),
      changedBy: applicantId,
      note: applyMode === 'easy' ? 'Easy Apply submitted' : 'Application submitted'
    }]
  });

  await application.save();

  // Increment counter
  await Job.findByIdAndUpdate(job._id, { $inc: { applicantCount: 1 } });

  // Create notification for applicant
  await createNotification({
    userId: applicantId,
    type: 'application_submitted',
    message: `Your application for ${job.title} at ${job.company.name} was successfully submitted.`,
    relatedJob: job._id,
    relatedApplication: application._id,
    actionUrl: '/applications',
    channel: 'in_app',
    emailData: { jobTitle: job.title }
  }, io);

  // Create notification for recruiter
  const applicantUser = await User.findById(applicantId).select('full_name username');
  await createNotification({
    userId: job.postedBy,
    type: 'new_applicant',
    message: `New applicant for ${job.title}${applyMode === 'easy' ? ' (Easy Apply)' : ''}`,
    relatedJob: job._id,
    relatedApplication: application._id,
    actionUrl: `/recruiter/jobs/${job._id}/applicants`,
    channel: 'both',
    emailData: { jobTitle: job.title, applicantName: applicantUser?.full_name || applicantUser?.username || 'Someone' }
  }, io);

  return { application, job };
};

/**
 * Single source of truth for updating job application status.
 */
async function updateApplicationStatus({ applicationId, newStatus, changedBy, note, io }) {
  // 1. Validate the application exists
  const application = await JobApplication.findById(applicationId).populate('job');
  if (!application) {
    throw new Error('Application not found');
  }

  const oldStatus = application.status;

  // 2. Push to statusHistory
  application.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy,
    note
  });

  // 3. Set status on the document
  application.status = newStatus;

  // 4. Save
  await application.save();

  // 5. Emit socket event 'application:statusChanged' to the applicant's user room
  if (io) {
    io.to(`user:${application.applicant}`).emit('application:statusChanged', {
      applicationId: application._id,
      jobTitle: application.job.title,
      oldStatus,
      newStatus
    });

    // 6. Emit socket event 'dashboard:applicationUpdated' to the job's recruiter room
    io.to(`recruiter:${application.job.postedBy}`).emit('dashboard:applicationUpdated', {
      jobId: application.job._id,
      applicationId: application._id,
      newStatus
    });
  }

  // 7. Create a Notification document for the applicant
  await createNotification({
    userId: application.applicant,
    type: 'application_status_changed',
    message: `Your application for ${application.job.title} is now: ${newStatus}`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
    actionUrl: '/applications',
    channel: 'both',
    emailData: { jobTitle: application.job.title, newStatus }
  }, io);

  // 8. Return the updated application
  return application;
}

/**
 * Handles an applicant withdrawing their own application.
 */
async function withdrawApplication({ applicationId, applicantId, io }) {
  const application = await JobApplication.findOne({ _id: applicationId, applicant: applicantId }).populate('job');
  if (!application) {
    throw new Error('Application not found or unauthorized');
  }

  const oldStatus = application.status;
  const newStatus = 'withdrawn';

  application.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: applicantId,
    note: 'Applicant withdrew application'
  });

  application.status = newStatus;
  await application.save();

  if (io) {
    io.to(`recruiter:${application.job.postedBy}`).emit('dashboard:applicationUpdated', {
      jobId: application.job._id,
      applicationId: application._id,
      newStatus
    });
    // Can optionally emit back to the user room, though they triggered it.
    io.to(`user:${application.applicant}`).emit('application:statusChanged', {
      applicationId: application._id,
      jobTitle: application.job.title,
      oldStatus,
      newStatus
    });
  }

  return application;
}

module.exports = {
  updateApplicationStatus,
  withdrawApplication,
  createJobApplication
};
