// Run with: node src/scripts/seedQuestions.js
// Populates the question bank so Boss Battle has something to fight with.
require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');

const questions = [
    // Math
    { subject: 'Math', difficulty: 'easy', questionText: 'What is 12 + 15?', options: ['25', '27', '29', '31'], correctIndex: 1, explanation: '12 + 15 = 27' },
    { subject: 'Math', difficulty: 'easy', questionText: 'What is 9 x 7?', options: ['56', '63', '72', '81'], correctIndex: 1, explanation: '9 x 7 = 63' },
    { subject: 'Math', difficulty: 'medium', questionText: 'What is the value of x in 2x + 5 = 17?', options: ['4', '5', '6', '7'], correctIndex: 2, explanation: '2x = 12, so x = 6' },
    { subject: 'Math', difficulty: 'medium', questionText: 'What is the area of a rectangle 8cm by 5cm?', options: ['13 cm²', '26 cm²', '40 cm²', '45 cm²'], correctIndex: 2, explanation: 'Area = length x width = 8 x 5 = 40' },
    { subject: 'Math', difficulty: 'hard', questionText: 'What is the derivative of x²?', options: ['x', '2x', 'x²', '2x²'], correctIndex: 1, explanation: 'd/dx(x²) = 2x' },
    { subject: 'Math', difficulty: 'hard', questionText: 'What is √144?', options: ['10', '11', '12', '14'], correctIndex: 2, explanation: '12 x 12 = 144' },

    // Science
    { subject: 'Science', difficulty: 'easy', questionText: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctIndex: 1, explanation: 'Mars appears red due to iron oxide on its surface.' },
    { subject: 'Science', difficulty: 'easy', questionText: 'What gas do plants absorb from the air?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctIndex: 2, explanation: 'Plants use CO2 for photosynthesis.' },
    { subject: 'Science', difficulty: 'medium', questionText: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Body'], correctIndex: 2, explanation: 'Mitochondria produce ATP, the cell\'s energy currency.' },
    { subject: 'Science', difficulty: 'medium', questionText: 'What is the chemical symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctIndex: 2, explanation: 'Au comes from the Latin "aurum".' },
    { subject: 'Science', difficulty: 'hard', questionText: 'What particle has a negative charge?', options: ['Proton', 'Neutron', 'Electron', 'Photon'], correctIndex: 2, explanation: 'Electrons carry a negative charge.' },
    { subject: 'Science', difficulty: 'hard', questionText: 'What is Newton\'s second law of motion?', options: ['F = ma', 'E = mc²', 'V = IR', 'P = mv'], correctIndex: 0, explanation: 'Force equals mass times acceleration.' },

    // History
    { subject: 'History', difficulty: 'easy', questionText: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctIndex: 2, explanation: 'WWII ended in 1945.' },
    { subject: 'History', difficulty: 'medium', questionText: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Abraham Lincoln'], correctIndex: 1, explanation: 'George Washington served 1789-1797.' },
    { subject: 'History', difficulty: 'hard', questionText: 'The Magna Carta was signed in which year?', options: ['1066', '1215', '1348', '1492'], correctIndex: 1, explanation: 'Signed in 1215 in England.' },

    // English
    { subject: 'English', difficulty: 'easy', questionText: 'What is the plural of "child"?', options: ['Childs', 'Childes', 'Children', 'Childrens'], correctIndex: 2, explanation: '"Children" is the irregular plural form.' },
    { subject: 'English', difficulty: 'medium', questionText: 'Which word is a synonym for "happy"?', options: ['Somber', 'Joyful', 'Furious', 'Weary'], correctIndex: 1, explanation: '"Joyful" means happy or delighted.' },
    { subject: 'English', difficulty: 'hard', questionText: 'Identify the figure of speech: "The wind whispered through the trees."', options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'], correctIndex: 2, explanation: 'Giving human traits (whispering) to wind is personification.' },

    // Computer Science
    { subject: 'Computer Science', difficulty: 'easy', questionText: 'What does CPU stand for?', options: ['Central Process Unit', 'Central Processing Unit', 'Computer Personal Unit', 'Central Processor Utility'], correctIndex: 1, explanation: 'CPU = Central Processing Unit.' },
    { subject: 'Computer Science', difficulty: 'medium', questionText: 'What data structure uses FIFO (First In First Out)?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correctIndex: 1, explanation: 'A Queue processes elements in the order they arrive.' },
    { subject: 'Computer Science', difficulty: 'hard', questionText: 'What is the time complexity of binary search?', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctIndex: 2, explanation: 'Binary search halves the search space each step: O(log n).' },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        await Question.deleteMany({});
        console.log('Cleared existing questions');

        await Question.insertMany(questions);
        console.log(`Seeded ${questions.length} questions across ${[...new Set(questions.map(q => q.subject))].length} subjects`);

        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();
