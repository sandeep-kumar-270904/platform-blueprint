const ScholarshipBuddy = require('../models/ScholarshipBuddy');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const notificationService = require('../services/notificationService');

exports.getMyBuddy = async (req, res) => {
    try {
        const buddy = await ScholarshipBuddy.findOne({
            $or: [{ user1: req.user.id }, { user2: req.user.id }],
            status: { $in: ['looking', 'matched'] }
        }).populate('user1', 'name').populate('user2', 'name');

        if (!buddy) {
            return res.json(null);
        }

        // If matched, compute aggregate progress (applications this week)
        let partnerProgress = null;
        if (buddy.status === 'matched') {
            const partnerId = buddy.user1._id.toString() === req.user.id ? buddy.user2._id : buddy.user1._id;
            
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const recentAppsCount = await ScholarshipApplication.countDocuments({
                userId: partnerId,
                status: 'submitted',
                updatedAt: { $gte: oneWeekAgo }
            });
            
            partnerProgress = {
                recentAppsSubmitted: recentAppsCount
            };
        }

        res.json({
            buddy,
            partnerProgress
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching buddy' });
    }
};

exports.matchBuddy = async (req, res) => {
    try {
        // Check if already in a pair
        const existing = await ScholarshipBuddy.findOne({
            $or: [{ user1: req.user.id }, { user2: req.user.id }],
            status: { $in: ['looking', 'matched'] }
        });
        if (existing) {
            return res.status(400).json({ message: 'Already opted in or matched' });
        }

        // Look for someone else who is 'looking'
        const potentialBuddy = await ScholarshipBuddy.findOne({
            status: 'looking',
            user1: { $ne: req.user.id }
        });

        if (potentialBuddy) {
            // Match them
            potentialBuddy.user2 = req.user.id;
            potentialBuddy.status = 'matched';
            potentialBuddy.matchedAt = new Date();
            await potentialBuddy.save();
            
            await notificationService.createNotification({
                userId: potentialBuddy.user1,
                type: 'system',
                message: 'You have been matched with an application buddy!'
            });
            await notificationService.createNotification({
                userId: req.user.id,
                type: 'system',
                message: 'You have been matched with an application buddy!'
            });

            return res.json(potentialBuddy);
        } else {
            // Create a looking record
            const newBuddy = await ScholarshipBuddy.create({
                user1: req.user.id,
                status: 'looking'
            });
            return res.json(newBuddy);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error matching buddy' });
    }
};

exports.endBuddy = async (req, res) => {
    try {
        const buddy = await ScholarshipBuddy.findOne({
            $or: [{ user1: req.user.id }, { user2: req.user.id }],
            status: 'matched'
        });
        
        if (!buddy) return res.status(404).json({ message: 'No active pair found' });
        
        buddy.status = 'ended';
        buddy.endedAt = new Date();
        await buddy.save();

        const partnerId = buddy.user1.toString() === req.user.id ? buddy.user2 : buddy.user1;
        await notificationService.createNotification({
            userId: partnerId,
            type: 'system',
            message: 'Your buddy has ended the pairing. You can opt-in again to find a new buddy.'
        });

        res.json({ message: 'Pairing ended' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error ending buddy' });
    }
};
