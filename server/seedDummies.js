import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { COMPAT_QUESTIONS } from './config/compatQuestions.js';
import { BRANCHES, YEARS, INTENTS, INTEREST_TAGS, PROMPT_BANK } from './config/appData.js';

dotenv.config();

const DUMMY_COUNT = 100;

const FEMALE_PROFILES = [
  { name: 'Ananya Sharma' }, { name: 'Priya Patel' }, { name: 'Kavya Iyer' }, { name: 'Meera Nair' },
  { name: 'Zara Khan' }, { name: 'Sneha Rao' }, { name: 'Nandini Das' }, { name: 'Ishita Kapoor' },
  { name: 'Rhea Chatterjee' }, { name: 'Tanvi Shah' }, { name: 'Aisha Sheikh' }, { name: 'Diya Menon' },
  { name: 'Riya Pillai' }, { name: 'Shruti Deshpande' }, { name: 'Pooja Kulkarni' }, { name: 'Sanjana Reddy' },
  { name: 'Isha Verma' }, { name: 'Mahika Joshi' }, { name: 'Anjali Gupta' }, { name: 'Trisha Bose' },
  { name: 'Sanya Malhotra' }, { name: 'Nikita Bansal' }, { name: 'Aditi Thakur' }, { name: 'Shreya Apte' },
  { name: 'Vaishnavi Rao' }, { name: 'Harshita Singh' }, { name: 'Tanya Chopra' }, { name: 'Divya Nair' },
  { name: 'Mrunal Desai' }, { name: 'Sakshi Jain' }, { name: 'Ritika Sharma' }, { name: 'Pia Mehta' },
  { name: 'Vidhi Agrawal' }, { name: 'Netra Kulkarni' }, { name: 'Chaitra Hegde' }, { name: 'Lavanya Iyer' },
  { name: 'Gauri Patil' }, { name: 'Simran Kaur' }, { name: 'Mehak Kapoor' }, { name: 'Rupali Das' },
  { name: 'Jhanvi Shah' }, { name: 'Bhavna Trivedi' }, { name: 'Nisha Kumari' }, { name: 'Aradhana Mishra' },
  { name: 'Shivani Dubey' }, { name: 'Pallavi Banerjee' }, { name: 'Kirti Aggarwal' }, { name: 'Swati Naik' },
  { name: 'Pranita Sahu' }, { name: 'Ekta Goyal' },
];

const MALE_PROFILES = [
  { name: 'Rohan Mehta' }, { name: 'Aarav Kumar' }, { name: 'Kabir Singh' }, { name: 'Arjun Gupta' },
  { name: 'Dev Joshi' }, { name: 'Aditya Verma' }, { name: 'Vihaan Malhotra' }, { name: 'Shaurya Bhatia' },
  { name: 'Pranav Reddy' }, { name: 'Dhruv Choudhary' }, { name: 'Ishaan Desai' }, { name: 'Rishabh Jain' },
  { name: 'Karan Malhotra' }, { name: 'Siddharth Rao' }, { name: 'Yash Thakur' }, { name: 'Omkar Pawar' },
  { name: 'Vedant Kulkarni' }, { name: 'Harsh Vardhan' }, { name: 'Kunal Bansal' }, { name: 'Nikhil Sharma' },
  { name: 'Aryan Kapoor' }, { name: 'Tushar Mehta' }, { name: 'Manav Goyal' }, { name: 'Sarthak Jain' },
  { name: 'Ayush Srivastava' }, { name: 'Varun Nair' }, { name: 'Raghav Iyer' }, { name: 'Kartik Menon' },
  { name: 'Abhinav Gupta' }, { name: 'Sahil Chopra' }, { name: 'Aditya Shukla' }, { name: 'Rahul Pillai' },
  { name: 'Priyansh Agrawal' }, { name: 'Shivam Dubey' }, { name: 'Deepak Bhatt' }, { name: 'Tarun Bhatia' },
  { name: 'Naman Sahu' }, { name: 'Jeet Banerjee' }, { name: 'Karan Patel' }, { name: 'Arnav Kulkarni' },
  { name: 'Ritvik Singh' }, { name: 'Uday Shankar' }, { name: 'Mohit Deshpande' }, { name: 'Parth Trivedi' },
  { name: 'Gaurav Naik' }, { name: 'Harsh Agarwal' }, { name: 'Yuvraj Singh' }, { name: 'Aniket Bose' },
  { name: 'Shubham Tiwari' }, { name: 'Rohan Kulkarni' },
];

const HOSTELS = [
  'Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5', 'Hostel 6',
  'Hostel 7', 'Hostel 8', 'Hostel 9', 'Hostel 10', 'Hostel 11', 'Hostel 12',
  'Hostel 13', 'Hostel 14', 'Hostel 15',
];

const PHOTO_IDS = {
  Female: [
    'photo-1494790108377-be9c29b29330', 'photo-1438761681033-6461ffad8d80',
    'photo-1544005313-94ddf0286df2', 'photo-1529626455594-4ff0802cfb7e',
    'photo-1531746020798-e6953c6e8e04', 'photo-1534528741775-53994a69daeb',
    'photo-1524504388940-b1c1722653e1', 'photo-1517841905240-472988babdf9',
    'photo-1548142813-c348350df52b', 'photo-1531123897727-8f129e1688ce',
    'photo-1517365830460-955ce3ccd263', 'photo-1508214751196-bcfd4ca60f91',
    'photo-1488426862026-3ee34a7d66df', 'photo-1531746790731-6c087fecd65a',
    'photo-1554151228-14d9def656e4', 'photo-1546961329-78bef0414d7c',
  ],
  Male: [
    'photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e',
    'photo-1506794778202-cad84cf45f1d', 'photo-1539571696357-5a69c17a67c6',
    'photo-1519085360753-af0119f7cbe7', 'photo-1521119989659-a83eee488004',
    'photo-1504257432389-52343af06ae3', 'photo-1472099645785-5658abf4ff4e',
    'photo-1492562080023-ab3db95bfbce', 'photo-1527980965255-d3b416303d12',
    'photo-1531384441138-2736e62e0919', 'photo-1509347528160-9a9e33742cdb',
    'photo-1522075469751-3a6694fb2f61', 'photo-1520975954732-35dd22299614',
    'photo-1519345182560-3f2917c472ef', 'photo-1518806118471-f28b20a1d79d',
  ],
};

const BIOS = [
  'CSE junta. Fueled by filter coffee, hostel raids, and 3AM assignment chaos. Looking for someone to share playlists and canteen runs with.',
  'I spend my weekends between the library, the gym, and late-night chai at the canteen. Come find me when you need a study break.',
  'Math & Computing, but my real specialisation is overthinking text messages. Soft spot for monsoon walks and doodles in lecture margins.',
  'Photography nerd who shoots everything from sunrises at the lake to street dogs near the hostel gate. Let\'s explore campus together.',
  'Engineer by day, meme curator by night. I bring the snacks, you bring the conversation.',
  'I can\'t grow a plant to save my life, but I make great tea. Enthusiastic badminton player, certified foodie, terrible dancer, great company.',
  'Third-year mech guy who can talk about F1, metal, and machine design for hours. Bonus points if you can beat me at chess.',
  'I write poetry nobody reads and code everyone uses. Looking for someone to debate the best canteen dish with.',
  'Aerospace nerd. If you can sit through my 20-minute explanation of why planes fly, we\'re basically soulmates.',
  'Civil engineering, but my real passion is complaining about the weather while walking everywhere.',
  'Ask me about my hostel wing\'s legendary midnight Maggi sessions. I collect good stories and better playlists.',
  'Chemistry + startup dreams. I\'ll pitch you a business idea over chai if you promise to laugh at my bad jokes.',
  'Textile tech with an eye for fashion. Equal parts streetwear obsessive and museum wanderer.',
  'I\'ll race you to the next lecture and lose on purpose so we can walk and talk.',
  'Late-night library regular. My love language is sharing notes and good book recommendations.',
  'Gamer and AI/ML enthusiast. I carry a deck of cards everywhere and can shuffle mid-conversation.',
  'I run (jog, honestly) every morning. Looking for a workout buddy or someone to share breakfast with after.',
  'Physics freak who thinks everything is more fun with equations. And ice cream. Mostly ice cream.',
  'Metal head with a soft playlist for the right person. My hostel room has more posters than furniture.',
  'I make playlists for every mood and food for every occasion. Come hungry, leave happy.',
];

const PROMPT_ANSWERS = [
  'My go-to answer is always "two truths and a lie" and I never lie. That\'s the lie.',
  'Honestly? Late-night Maggi and a good conversation.',
  'I once fell asleep in the library and woke up to my friends\' group photo as my wallpaper.',
  'The best way to my heart is through the canteen\'s chai and a well-timed meme.',
  'I\'m weirdly good at parallel parking, balancing plates, and remembering song lyrics.',
  'My 3AM thoughts usually go like — should I study now or start my assignment at 6AM like a genius?',
  'I collect movie tickets like some people collect stamps. It\'s a problem.',
  'My biggest flex is that I survived a semester with zero alarms and zero missed submissions.',
  'I\'ll fall for you if you get my references without me having to explain them.',
  'The most impulsive thing I\'ve done is sign up for a hackathon at 2AM. No regrets.',
  'One thing I can\'t live without is my noise-cancelling headphones. And chai.',
  'I\'m basically a professional at overthinking a text that just said "ok".',
  'My hidden talent is making the perfect cup of chai under pressure.',
  'If I could change one campus rule, it\'d be the chai stall closing time.',
  'I finally understand why people say the monsoon makes everything better here.',
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, min, max) => {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const buildPhotos = (gender) => {
  const pool = PHOTO_IDS[gender];
  const start = Math.floor(Math.random() * pool.length);
  const photos = [];
  for (let i = 0; i < 5; i++) {
    const id = pool[(start + i) % pool.length];
    photos.push(`https://images.unsplash.com/${id}?w=600&auto=format&fit=crop&q=80`);
  }
  return photos;
};

const buildPrompts = () => {
  const questions = getRandomSubset(PROMPT_BANK, 3, 4);
  return questions.map((question) => ({
    question,
    answer: getRandom(PROMPT_ANSWERS),
  }));
};

const buildCompatAnswers = () =>
  COMPAT_QUESTIONS.map((q) => ({
    question: q.id,
    answer: getRandom(q.options).key,
  }));

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGO_URI / MONGODB_URI not found in .env file!');

    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB Atlas...');

    const existingUser = await User.findOne({});
    const targetCollegeCode = existingUser ? existingUser.collegeCode : 'iitb';
    console.log(`🎯 Targeting collegeCode: "${targetCollegeCode}" so they show up in your deck!`);

    await User.deleteMany({ email: { $regex: 'dummy.*@.*\\.ac\\.in' } });
    console.log('🧹 Cleared old dummy accounts...');

    const allProfiles = [
      ...FEMALE_PROFILES.map((p) => ({ ...p, gender: 'Female' })),
      ...MALE_PROFILES.map((p) => ({ ...p, gender: 'Male' })),
    ].slice(0, DUMMY_COUNT);

    const dummyUsers = allProfiles.map((item, index) => {
      const isMale = item.gender === 'Male';
      const age = 18 + Math.floor(Math.random() * 7); // 18-24
      const hoursAgo = Math.floor(Math.random() * 72); // recency variety

      return {
        name: item.name,
        email: `dummy.${item.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}.${index}@campus.ac.in`,
        college: 'IIT Bombay',
        collegeCode: targetCollegeCode,
        gender: item.gender,
        interestedIn: isMale ? ['Female'] : ['Male'],
        age,
        ageRange: { min: 18, max: 30 },
        photos: buildPhotos(item.gender),
        bio: getRandom(BIOS),
        branch: getRandom(BRANCHES),
        year: getRandom(YEARS),
        hostel: getRandom(HOSTELS),
        pronouns: isMale ? 'he/him' : 'she/her',
        interests: getRandomSubset(INTEREST_TAGS, 3, 5),
        intent: getRandomSubset(INTENTS, 1, 3),
        prompts: buildPrompts(),
        compatAnswers: buildCompatAnswers(),
        isOnboarded: true,
        isVerified: true,
        isGhost: false,
        isDeleted: false,
        suspended: false,
        lastActive: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      };
    });

    const created = await User.insertMany(dummyUsers);
    console.log(`✅ Successfully inserted ${created.length} rich dummy profiles!`);
    console.log('🚀 Go refresh your web app — your Discover deck is now full!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dummies:', error);
    process.exit(1);
  }
};

seedDatabase();
