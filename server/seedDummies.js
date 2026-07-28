import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { COMPAT_QUESTIONS } from './config/compatQuestions.js';

dotenv.config();

const dummyNames = [
  { name: 'Ananya Sharma', gender: 'Female', age: 20 },
  { name: 'Rohan Mehta', gender: 'Male', age: 21 },
  { name: 'Priya Patel', gender: 'Female', age: 19 },
  { name: 'Aarav Kumar', gender: 'Male', age: 22 },
  { name: 'Kavya Iyer', gender: 'Female', age: 20 },
  { name: 'Kabir Singh', gender: 'Male', age: 21 },
  { name: 'Meera Nair', gender: 'Female', age: 20 },
  { name: 'Arjun Gupta', gender: 'Male', age: 19 },
  { name: 'Zara Khan', gender: 'Female', age: 21 },
  { name: 'Dev Joshi', gender: 'Male', age: 22 },
  { name: 'Sneha Rao', gender: 'Female', age: 20 },
  { name: 'Aditya Verma', gender: 'Male', age: 21 },
  { name: 'Nandini Das', gender: 'Female', age: 19 },
  { name: 'Vihaan Malhotra', gender: 'Male', age: 20 },
  { name: 'Ishita Kapoor', gender: 'Female', age: 21 },
  { name: 'Shaurya Bhatia', gender: 'Male', age: 22 },
  { name: 'Rhea Chakraborty', gender: 'Female', age: 20 },
  { name: 'Pranav Reddy', gender: 'Male', age: 21 },
  { name: 'Tanvi Shah', gender: 'Female', age: 19 },
  { name: 'Dhruv Choudhary', gender: 'Male', age: 20 }
];

const branches = ['Computer Science', 'Electronics', 'Mechanical', 'Economics', 'Design', 'Physics'];
const hostels = ['Hostel 1', 'Hostel 3', 'Hostel 5', 'Hostel 8', 'Hostel 12', 'Hostel 15'];
const interestsList = ['Photography', 'Indie Music', 'Bouldering', 'Anime', 'Coffee', 'Late Night Drives', 'Reading', 'Coding', 'Badminton', 'Thrash Metal', 'Street Food', 'Poetry'];

const samplePhotos = {
  Female: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80'
  ],
  Male: [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80'
  ]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, size) => [...arr].sort(() => 0.5 - Math.random()).slice(0, size);

const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
      throw new Error('MONGO_URI / MONGODB_URI not found in .env file!');
    }

    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB Atlas...');

    // 1. Find an existing user to match their collegeCode
    const existingUser = await User.findOne({});
    const targetCollegeCode = existingUser ? existingUser.collegeCode : 'IITB';
    console.log(`🎯 Targeting collegeCode: "${targetCollegeCode}" so they show up in your deck!`);

    // 2. Optional: Remove previously generated dummy accounts (tagged with dummy: true)
    await User.deleteMany({ email: { $regex: 'dummy.*@.*\\.ac\\.in' } });
    console.log('🧹 Cleared old dummy accounts...');

    const dummyUsers = dummyNames.map((item, index) => {
      // Randomize compatibility answers as { question, answer } objects matching COMPAT_QUESTIONS
      const compatAnswers = COMPAT_QUESTIONS.map((q) => ({
        question: q.id,
        answer: q.options[Math.floor(Math.random() * q.options.length)].key,
      }));

      return {
        name: item.name,
        email: `dummy.${item.name.toLowerCase().replace(' ', '.')}.${index}@campus.ac.in`,
        password: '$2a$10$YourHashedPasswordHereOrLetPreSaveHookHandleIt', // Standard dummy pass
        collegeCode: targetCollegeCode,
        gender: item.gender,
        interestedIn: [item.gender === 'Male' ? 'Female' : 'Male'], // Straight for testing ease
        age: item.age,
        ageRange: { min: 18, max: 25 },
        photos: samplePhotos[item.gender],
        bio: `Just a ${getRandom(branches)} student trying to survive campus life. Always down for good coffee and spontaneous campus walks.`,
        branch: getRandom(branches),
        year: `3rd Year`,
        hostel: getRandom(hostels),
        pronouns: item.gender === 'Male' ? 'he/him' : 'she/her',
        interests: getRandomSubset(interestsList, 4),
        prompts: [
          { question: 'A shower thought I recently had', answer: 'Why is it called rush hour when nobody is moving?' },
          { question: 'My simple pleasures', answer: 'Maggie at 3 AM after finishing an assignment.' }
        ],
        compatAnswers,
        intent: ['Looking for genuine connections'],
        isOnboarded: true,
        isVerified: true,
        isGhost: false,
        lastActive: new Date()
      };
    });

    // 3. Insert into DB
    const created = await User.insertMany(dummyUsers);
    console.log(`✅ Successfully inserted ${created.length} rich dummy profiles!`);
    console.log(`🚀 Go refresh your web app — your Discover deck is now full!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dummies:', error);
    process.exit(1);
  }
};

seedDatabase();
