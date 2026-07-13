const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateStudyPlan = async (subjects, examDate, hoursPerDay) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const prompt = `
You are a smart study planner AI. Generate a detailed weekly study plan for a student.

Student Information:
- Subjects: ${subjects.map(s => `${s.name} (difficulty: ${s.difficulty})`).join(', ')}
- Exam Date: ${examDate}
- Available study hours per day: ${hoursPerDay} hours
- Today's date: ${new Date().toDateString()}

Generate a 7-day study plan. For each day provide:
1. Day name and date
2. List of study sessions with subject, topic to study, and duration
3. A short motivational tip for that day

Return ONLY a JSON object in this exact format, no extra text:
{
  "plan": [
    {
      "day": "Monday",
      "date": "2024-01-15",
      "sessions": [
        {
          "subject": "Mathematics",
          "topic": "Calculus - Integration",
          "duration": "1 hour",
          "priority": "high"
        }
      ],
      "tip": "Start with the hardest subject when your mind is fresh!"
    }
  ],
  "summary": "Brief overall strategy summary",
  "totalDays": 7
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
};

const generateWeeklyReport = async (studyData) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const prompt = `
You are a study coach AI. Based on this student's weekly study data, generate a personal weekly review report.

Study Data:
- Habits completed this week: ${studyData.habitsCompleted}/42 total possible
- Assignments completed: ${studyData.assignmentsCompleted}
- Assignments pending: ${studyData.assignmentsPending}
- Study streak: ${studyData.streak} days
- XP earned: ${studyData.xp}
- Subjects being studied: ${studyData.subjects?.join(', ') || 'Not specified'}

Return ONLY a JSON object in this exact format:
{
  "greeting": "Personalized greeting",
  "summary": "2-3 sentence summary of their week",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "nextWeekFocus": ["focus 1", "focus 2", "focus 3"],
  "motivationalMessage": "An inspiring message to end the report"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
};

const chatWithAssistant = async (messages, userSubjects = []) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const systemContext = `You are StudyMate AI, a helpful study assistant for students.
You can:
- Explain concepts clearly and simply
- Summarise notes or topics
- Generate practice quiz questions
- Give study tips and techniques
- Help with any academic subject

The student is currently studying: ${userSubjects.length > 0 ? userSubjects.join(', ') : 'various subjects'}.
Keep responses concise, friendly, and educational. Use bullet points and structure where helpful.`;

    const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: systemContext }] },
            { role: 'model', parts: [{ text: "Understood! I'm ready to help you study." }] },
            ...history
        ]
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    return result.response.text();
};

module.exports = { generateStudyPlan, generateWeeklyReport, chatWithAssistant };
