const mongoose = require('mongoose');
const Event = require('./models/Event');
const EventRegistration = require('./models/EventRegistration');
const User = require('./models/User');

const seedEvents = async () => {
  try {
    // Find a host user (e.g. an admin)
    let hostUser = await User.findOne({ role: 'admin' }) || await User.findOne({});
    if (!hostUser) {
      console.log('No user found. Creating a dummy admin user to act as host...');
      hostUser = new User({
        full_name: 'Admin User',
        email: 'admin@studenthub.com',
        password: 'password123', // Dummy password
        role: 'admin',
        username: 'admin'
      });
      await hostUser.save();
    }
    const hostId = hostUser._id;

    const events = [
      {
        title: 'Global AI Hackathon 2026',
        description: 'Join the biggest virtual AI hackathon of the year. Build innovative solutions using the latest LLMs and win massive prizes.',
        eventType: 'hackathon',
        bannerImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80',
        startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), 
        endDate: new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000), 
        startTime: '09:00',
        endTime: '18:00',
        isVirtual: true,
        venue: 'Discord / Zoom',
        hostedBy: hostId,
        hostName: 'Tech Innovators Club',
        status: 'approved',
        registrationRequired: true,
        registrationDeadline: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000),
        capacity: null,
        teamSize: { min: 2, max: 4 },
        prizes: ['$10,000 Grand Prize', 'Cloud Credits', 'Swag'],
        tags: ['AI', 'Hackathon', 'Global']
      },
      {
        title: 'React Performance Optimization Workshop',
        description: 'A deep dive into measuring and improving React application performance. Perfect for intermediate to advanced developers.',
        eventType: 'workshop',
        bannerImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80',
        startDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
        startTime: '14:00',
        endTime: '16:00',
        isVirtual: false,
        venue: 'Room 304, Engineering Building',
        hostedBy: hostId,
        hostName: 'Frontend Society',
        status: 'approved',
        registrationRequired: true,
        capacity: 50,
        agenda: [
          { time: '14:00', title: 'Introduction', description: 'Why performance matters' },
          { time: '14:30', title: 'React Profiler', description: 'Using dev tools' },
          { time: '15:15', title: 'Memoization', description: 'useMemo & useCallback in depth' }
        ],
        tags: ['React', 'Frontend', 'Workshop']
      },
      {
        title: 'Cybersecurity Capture The Flag',
        description: 'An intense 12-hour CTF competition focusing on web vulnerabilities, cryptography, and reverse engineering.',
        eventType: 'competition',
        bannerImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80',
        startDate: new Date(new Date().getTime() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(new Date().getTime() + 21 * 24 * 60 * 60 * 1000),
        startTime: '08:00',
        endTime: '20:00',
        isVirtual: true,
        venue: 'CTF Platform URL',
        hostedBy: hostId,
        hostName: 'Cyber Sec Club',
        status: 'approved',
        registrationRequired: true,
        capacity: 200,
        teamSize: { min: 1, max: 4 },
        prizes: ['OSEC Voucher', 'HTB VIP Subscriptions'],
        tags: ['Security', 'CTF']
      },
      {
        title: 'Startup Pitch Seminar',
        description: 'Learn how to pitch your ideas to VCs and angel investors from successful founders.',
        eventType: 'seminar',
        bannerImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80',
        startDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
        startTime: '17:00',
        endTime: '19:00',
        isVirtual: false,
        venue: 'Main Auditorium',
        hostedBy: hostId,
        hostName: 'Entrepreneurship Cell',
        status: 'pending_approval',
        registrationRequired: true,
        capacity: 150,
        tags: ['Startup', 'Business']
      },
      {
        title: 'Past Event: Cloud Native Computing',
        description: 'A fantastic seminar on Kubernetes and Docker that already took place.',
        eventType: 'seminar',
        bannerImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&q=80',
        startDate: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '12:00',
        isVirtual: true,
        venue: 'Zoom Link',
        hostedBy: hostId,
        hostName: 'Cloud Club',
        status: 'completed',
        registrationRequired: false,
        tags: ['Cloud', 'DevOps']
      },
      {
        title: 'Web3 dApp Building',
        description: 'Hands-on workshop building your first decentralized app on Ethereum.',
        eventType: 'workshop',
        bannerImage: 'https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&q=80',
        startDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
        startTime: '15:00',
        endTime: '18:00',
        isVirtual: false,
        venue: 'Lab 2',
        hostedBy: hostId,
        hostName: 'Blockchain Society',
        status: 'approved',
        registrationRequired: true,
        registrationDeadline: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
        capacity: 30,
        agenda: [
          { time: '15:00', title: 'Smart Contracts', description: 'Writing Solidity' },
          { time: '16:30', title: 'Web3.js Integration', description: 'Connecting frontend' }
        ],
        tags: ['Web3', 'Blockchain']
      },
      {
        title: 'Data Science Marathon',
        description: 'A 24-hour competition analyzing massive real-world datasets.',
        eventType: 'competition',
        bannerImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80',
        startDate: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(new Date().getTime() + 46 * 24 * 60 * 60 * 1000),
        startTime: '12:00',
        endTime: '12:00',
        isVirtual: false,
        venue: 'Indoor Stadium',
        hostedBy: hostId,
        hostName: 'Data Analytics Club',
        status: 'approved',
        registrationRequired: true,
        capacity: 100,
        teamSize: { min: 2, max: 3 },
        prizes: ['MacBook Air', 'DataCamp Pro'],
        tags: ['Data Science', 'Machine Learning']
      },
      {
        title: 'GameDev Weekend',
        description: 'Create a game from scratch in 48 hours.',
        eventType: 'hackathon',
        bannerImage: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80',
        startDate: new Date(new Date().getTime() + 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(new Date().getTime() + 62 * 24 * 60 * 60 * 1000),
        startTime: '18:00',
        endTime: '18:00',
        isVirtual: false,
        venue: 'Student Center',
        hostedBy: hostId,
        hostName: 'Game Development Group',
        status: 'approved',
        registrationRequired: true,
        capacity: null,
        teamSize: { min: 1, max: 5 },
        prizes: ['Unity Pro License', 'Steam Gift Cards'],
        tags: ['GameDev', 'Hackathon']
      }
    ];

    await Event.insertMany(events);
    console.log(`Successfully seeded ${events.length} events!`);
  } catch (err) {
    console.error('Error seeding events:', err);
  }
};

module.exports = seedEvents;
