const InterviewSession = require('../models/InterviewSession');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const geminiService = require('../services/geminiService');

exports.startSession = async (req, res) => {
  try {
    const { resumeId, jobId, pastedJobDescription } = req.body;
    
    // Fetch resume
    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    let jobDesc = pastedJobDescription;
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) jobDesc = job.description;
    }

    // Generate grounded questions using Gemini
    // We pass the resume sections and job description
    const resumeContext = JSON.stringify({
      experience: resume.experience,
      projects: resume.projects,
      skills: resume.skills
    });
    
    const questions = await geminiService.generateInterviewQuestions(resumeContext, jobDesc);

    const session = new InterviewSession({
      userId: req.user.id,
      resumeId,
      jobId,
      pastedJobDescription,
      questions: questions.map(q => ({
        question: q.question,
        category: q.category
      })),
      status: 'in_progress'
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Start Interview Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.answerQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const { answer } = req.body;

    const session = await InterviewSession.findById(id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const questionIndex = session.questions.findIndex(q => q._id.toString() === questionId);
    if (questionIndex === -1) return res.status(404).json({ message: 'Question not found' });

    const question = session.questions[questionIndex];
    question.userAnswer = answer;

    // Evaluate answer using Gemini
    const evaluation = await geminiService.evaluateInterviewAnswer(question.question, answer, question.category);
    
    question.aiEvaluation = {
      strengths: evaluation.strengths,
      improvementAreas: evaluation.improvementAreas,
      score: evaluation.score
    };

    // Check if all questions are answered
    const allAnswered = session.questions.every(q => q.userAnswer);
    if (allAnswered) {
      session.status = 'completed';
    }

    await session.save();
    res.json(session);
  } catch (error) {
    console.error('Answer Question Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
