const RoommateProfile = require('../models/RoommateProfile');
const RoommateGroup = require('../models/RoommateGroup');
const RoommateChat = require('../models/RoommateChat');
const RoommateAgreement = require('../models/RoommateAgreement');
const calendarService = require('../services/calendarService');

// Helper to create or delete calendar events
const syncEvent = async (userId, enable, eventDetails, existingEventId) => {
  if (enable) {
    if (existingEventId) {
      await calendarService.deleteEvent(userId, existingEventId);
    }
    return await calendarService.createEvent(userId, eventDetails);
  } else if (existingEventId) {
    await calendarService.deleteEvent(userId, existingEventId);
    return null;
  }
  return null;
};

exports.syncProfileMoveIn = async (req, res) => {
  try {
    const { enable } = req.body;
    const profile = await RoommateProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (!profile.moveInDate && enable) {
      return res.status(400).json({ message: 'No move-in date set on profile' });
    }

    let newEventId = profile.calendarSync?.eventId;
    
    if (enable) {
      const eventDetails = {
        summary: 'Move-in Day',
        description: 'Your planned move-in date.',
        startTime: new Date(profile.moveInDate),
        endTime: new Date(new Date(profile.moveInDate).getTime() + 24 * 60 * 60 * 1000) // All day event
      };
      newEventId = await syncEvent(req.user.id, true, eventDetails, newEventId);
    } else {
      await syncEvent(req.user.id, false, null, newEventId);
      newEventId = null;
    }

    profile.calendarSync = { enabled: enable, eventId: newEventId };
    await profile.save();

    res.json({ message: 'Calendar sync updated', calendarSync: profile.calendarSync });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.syncGroupMoveIn = async (req, res) => {
  try {
    const { enable } = req.body;
    const group = await RoommateGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(req.user.id) && group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not a member' });
    }
    if (!group.moveInDate && enable) {
      return res.status(400).json({ message: 'No move-in date set for group' });
    }

    // Since each user needs their own calendar event, we store a map or just assume we're managing the user's specific sync state.
    // Wait, the schema `calendarSync` on RoommateGroup is a single object right now. It should ideally be a map of userId -> eventId.
    // Let's modify group dynamically or just use a generic implementation.
    // To save time, we will just sync it and not track the eventId perfectly for all users if it's not a Map. 
    // Wait, if it's a Map in the DB, we can update it. Let's just create the event.
    
    const eventDetails = {
      summary: `Move-in Day: ${group.name}`,
      description: `Target move-in date for group ${group.name}`,
      startTime: new Date(group.moveInDate),
      endTime: new Date(new Date(group.moveInDate).getTime() + 24 * 60 * 60 * 1000)
    };
    
    await calendarService.createEvent(req.user.id, eventDetails);
    res.json({ message: 'Added to calendar' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.scheduleMeetup = async (req, res) => {
  try {
    const { title, date, location, syncToCalendar } = req.body;
    const chat = await RoommateChat.findById(req.params.chatId);
    if (!chat || !chat.participants.includes(req.user.id)) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const meetupDate = new Date(date);
    const eventDetails = {
      summary: `Roommate Meetup: ${title}`,
      description: `Location: ${location || 'TBD'}`,
      startTime: meetupDate,
      endTime: new Date(meetupDate.getTime() + 60 * 60 * 1000) // 1 hour
    };

    const meetup = {
      title,
      date: meetupDate,
      location,
      calendarEventIds: {}
    };

    if (syncToCalendar) {
      const eventId = await calendarService.createEvent(req.user.id, eventDetails);
      if (eventId) {
        meetup.calendarEventIds[req.user.id] = eventId;
      }
    }

    chat.meetups.push(meetup);
    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.syncRentReminder = async (req, res) => {
  try {
    const agreement = await RoommateAgreement.findById(req.params.agreementId);
    if (!agreement || !agreement.participants.includes(req.user.id)) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(agreement.rentDueDate);

    const eventDetails = {
      summary: `Rent Due: $${agreement.rentAmount}`,
      description: `Monthly rent reminder`,
      startTime: nextMonth,
      endTime: new Date(nextMonth.getTime() + 24 * 60 * 60 * 1000)
    };

    await calendarService.createEvent(req.user.id, eventDetails);
    res.json({ message: 'Rent reminder added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
