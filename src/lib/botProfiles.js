// Client-side bot profile generator
// Generates 300+ fake user profiles that populate rooms and online users list

const FEMALE_NAMES = [
    'Aarohi', 'Ananya', 'Avni', 'Diya', 'Isha', 'Kavya', 'Meera', 'Nisha', 'Priya', 'Riya',
    'Saanvi', 'Tara', 'Zara', 'Anika', 'Kiara', 'Myra', 'Pihu', 'Sara', 'Shreya', 'Tanvi',
    'Aditi', 'Bhavna', 'Chaitra', 'Deepika', 'Esha', 'Fatima', 'Gauri', 'Hina', 'Ishita', 'Jiya',
    'Khushi', 'Lavanya', 'Mahi', 'Neha', 'Ojaswi', 'Pallavi', 'Radhika', 'Sakshi', 'Trisha', 'Uma',
    'Vaani', 'Warina', 'Yashika', 'Zoya', 'Aisha', 'Bella', 'Chloe', 'Diana', 'Elena', 'Fiona',
    'Gemma', 'Hannah', 'Iris', 'Jade', 'Kylie', 'Luna', 'Maya', 'Nora', 'Olivia', 'Piper',
    'Quinn', 'Rose', 'Stella', 'Tessa', 'Uma', 'Violet', 'Willow', 'Xena', 'Yasmin', 'Zoe',
    'Aaliya', 'Bhumi', 'Charvi', 'Divya', 'Ekta', 'Falguni', 'Garima', 'Hema', 'Indira', 'Juhi',
    'Kamini', 'Lata', 'Manisha', 'Namrata', 'Pooja', 'Rekha', 'Sonal', 'Tanu', 'Urvi', 'Vidya',
    'Swati', 'Simran', 'Sonali', 'Suhani', 'Sneha', 'Shruti', 'Shagun', 'Ridhi', 'Nikita', 'Madhuri',
    'Lily', 'Emma', 'Sophia', 'Ava', 'Mia', 'Isabella', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
    'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Avery', 'Ella', 'Scarlett', 'Grace', 'Victoria', 'Riley',
    'Aria', 'Layla', 'Nora', 'Zoey', 'Penelope', 'Lily', 'Aurora', 'Chloe', 'Ellie', 'Hazel',
    'Lucy', 'Anna', 'Leah', 'Savannah', 'Audrey', 'Brooklyn', 'Bella', 'Claire', 'Skylar', 'Paisley',
    'Everly', 'Naomi', 'Eliana', 'Caroline', 'Kennedy', 'Kinsley', 'Delilah', 'Morgan', 'Sydney', 'Piper',
];

const MALE_NAMES = [
    'Aarav', 'Arjun', 'Dev', 'Harsh', 'Ishaan', 'Kabir', 'Lakshay', 'Mohit', 'Nikhil', 'Om',
    'Pranav', 'Rahul', 'Sahil', 'Tanmay', 'Utkarsh', 'Varun', 'Yash', 'Zubin', 'Aditya', 'Bharat',
    'Chirag', 'Daksh', 'Gaurav', 'Kunal', 'Manav', 'Naveen', 'Piyush', 'Rajat', 'Shivam', 'Tushar',
    'Vikram', 'Abhinav', 'Dhruv', 'Karan', 'Ritesh', 'Saurabh', 'Vivek', 'Ajay', 'Deepak', 'Hemant',
    'James', 'Liam', 'Noah', 'Oliver', 'Ethan', 'Lucas', 'Mason', 'Logan', 'Alex', 'Jake',
    'Ryan', 'Tyler', 'Max', 'Leo', 'Sam', 'Dylan', 'Chris', 'Mike', 'Tom', 'Dan',
];

const BOT_STATUSES = [
    'Just chilling ✌️', 'Looking for friends 💫', 'Bored af 😴', 'Netflix & chat 🍿',
    'New here! Say hi 👋', 'Music lover 🎵', 'Night owl 🦉', 'Coffee addict ☕',
    'Anime fan 🎌', 'Gamer girl 🎮', 'Photography 📸', 'Travel lover ✈️',
    'Bookworm 📚', 'Foodie 🍕', 'Gym rat 💪', 'Artist 🎨', 'Coding 💻',
    'Dancing 💃', 'K-pop stan 🇰🇷', 'Dog lover 🐕', 'Cat person 🐱',
    'Beach vibes 🏖️', 'Mountain lover 🏔️', 'Insomniac 🌙', 'Dreamer ✨',
    'Ready to mingle 💕', 'Just vibing 🌊', 'Ask me anything 💭', 'DM open 📩',
    'Feeling adventurous 🌟', 'Movie buff 🎬', 'Singing 🎤', 'Poetry 📝',
];

function generateBots(count = 320) {
    const bots = [];
    const usedNames = new Set();

    for (let i = 0; i < count; i++) {
        // 70% female, 30% male
        const isFemale = Math.random() < 0.7;
        const namePool = isFemale ? FEMALE_NAMES : MALE_NAMES;
        let name = namePool[Math.floor(Math.random() * namePool.length)];

        // Add a number suffix if the name is taken
        if (usedNames.has(name)) {
            name = `${name}${Math.floor(Math.random() * 99) + 1}`;
        }
        usedNames.add(name);

        const age = Math.floor(Math.random() * 12) + 18; // 18-29
        const gender = isFemale ? 'female' : 'male';

        bots.push({
            guestId: `bot_${i}_${Math.random().toString(36).substring(2, 8)}`,
            name,
            gender,
            age,
            isBot: true,
            status: BOT_STATUSES[Math.floor(Math.random() * BOT_STATUSES.length)],
            online: true,
        });
    }

    return bots;
}

// Generate once and cache
let cachedBots = null;

export function getBotProfiles() {
    if (!cachedBots) {
        cachedBots = generateBots(320);
    }
    return cachedBots;
}

// Get a random subset of bots for a specific room
export function getBotsForRoom(roomId, count = 8) {
    const allBots = getBotProfiles();
    // Use roomId as a seed for consistent assignment
    let hash = 0;
    for (let i = 0; i < roomId.length; i++) {
        hash = ((hash << 5) - hash) + roomId.charCodeAt(i);
        hash |= 0;
    }
    const startIdx = Math.abs(hash) % (allBots.length - count);
    return allBots.slice(startIdx, startIdx + count);
}

// Auto-reply system for bots
const AUTO_REPLIES = [
    'Hey! How are you? 😊', 'That\'s interesting!', 'Haha nice one 😂',
    'Tell me more about yourself', 'Where are you from?', 'What\'s up?',
    'I love chatting here! 💬', 'Anyone wanna be friends?',
    'This app is so cool 🔥', 'What are your hobbies?',
    'I\'m bored, entertain me 😜', 'Good vibes only ✨',
    'Lol that\'s funny', 'Same here!', 'Really? Tell me more',
    'That\'s amazing 🤩', 'Hmmm interesting...', 'What do you think?',
    'I agree with that!', 'Nah, I don\'t think so 🤔',
    'Let\'s be friends! 🤝', 'Anyone from India? 🇮🇳',
    'What music do you listen to? 🎵', 'Just joined, hi everyone! 👋',
    'Who wants to play a game? 🎮', 'Share your favorite movie! 🎬',
];

export function getRandomBotReply() {
    return AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
}
