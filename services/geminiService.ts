import { GoogleGenAI, Type, Chat, Content } from "@google/genai";
import { Quiz, LearningTopic, Mistake, WordInfo, RootAnalysis, QuizQuestion, UserAnswer, WordHistoryEntry, SentenceFormationQuestion, WritingQuestion, SpeakingQuestion, DialectTranslation, PronunciationFeedback } from '../types.ts';
import { QUIZ_LENGTH } from '../constants.ts';

// --- MOCK DATA ---
const mockQuiz: Quiz = [
    {
        id: 'mock-mc-1',
        type: 'multiple-choice',
        question: "How do you say 'good morning' in Darija?",
        options: [
            { latin: 'Masa l-khir', arabic: 'مساء الخير' },
            { latin: 'Sbah l-khir', arabic: 'صباح الخير' },
            { latin: 'Laila sa\'ida', arabic: 'ليلة سعيدة' },
            { latin: 'Shukran', arabic: 'شكرا' }
        ],
        correctAnswerIndex: 1,
        explanation: {
            latin: "'Sbah l-khir' means 'Good morning'. 'Masa l-khir' is 'Good evening'.",
            arabic: "'صباح الخير' تعني 'Good morning'. 'مساء الخير' هي 'Good evening'."
        },
        targetWord: { latin: 'Sbah l-khir', arabic: 'صباح الخير' }
    },
    {
        id: 'mock-wr-1',
        type: 'writing',
        question: "Translate 'I want water' to Darija.",
        correctAnswer: { latin: 'Bghit lma', arabic: 'بغيت الماء' },
        explanation: {
            latin: "'Bghit' means 'I want' and 'lma' means 'the water'.",
            arabic: "'بغيت' تعني 'I want' و 'الماء' تعني 'the water'."
        },
        targetWord: { latin: 'Bghit', arabic: 'بغيت' }
    },
    {
        id: 'mock-sp-1',
        type: 'speaking',
        question: "Say 'How are you?'",
        correctAnswer: { latin: 'Kif dayr?', arabic: 'كيف داير؟' },
        explanation: {
            latin: "'Kif dayr?' is a common way to ask 'How are you?' to a male. For a female, you would say 'Kif dayra?'.",
            arabic: "'كيف داير؟' هي طريقة شائعة لسؤال 'كيف حالك؟' لرجل. للمرأة، تقول 'كيف دايرة؟'."
        },
        targetWord: { latin: 'Kif dayr?', arabic: 'كيف داير؟' }
    },
    {
        id: 'mock-sf-1',
        type: 'sentence-formation',
        question: "Form the sentence: 'This food is delicious.'",
        wordBank: ['bnina', 'l-makla', 'hadi'],
        correctSentence: ['hadi', 'l-makla', 'bnina'],
        explanation: {
            latin: "In Darija, adjectives usually come after the noun. 'hadi l-makla' means 'this food', and 'bnina' is the feminine adjective for 'delicious' that agrees with 'makla'.",
            arabic: "في الدارجة، الصفات تأتي عادة بعد الاسم. 'هادي الماكلة' تعني 'this food'، و'بنينة' هي الصفة المؤنثة لكلمة 'delicious' التي تتوافق مع 'ماكلة'."
        }
    }
];

const mockWordInfo: WordInfo = {
    latin: "Mzyan",
    arabic: "مزيان",
    definition: "Good, nice, okay, fine.",
    examples: [
        { latin: "Kif dayr? Mzyan, shukran.", arabic: "كيف داير؟ مزيان، شكرا.", translation: "How are you? Good, thank you." },
        { latin: "Had l-makla mzyana.", arabic: "هاد الماكلة مزيانة.", translation: "This food is good." },
        { latin: "Kullshi mzyan.", arabic: "كلشي مزيان.", translation: "Everything is fine." }
    ]
};

const mockRecommendedWords: WordInfo[] = [
    { latin: "Bghit", arabic: "بغيت", definition: "I want", examples: [{ latin: "Bghit wahd l-qahwa.", arabic: "بغيت واحد القهوة.", translation: "I want one coffee."}] },
    { latin: "Fin?", arabic: "فين؟", definition: "Where?", examples: [{ latin: "Fin l-toilet?", arabic: "فين الطواليط؟", translation: "Where is the toilet?"}] },
    { latin: "Shukran", arabic: "شكراً", definition: "Thank you", examples: [{ latin: "Shukran bzaf.", arabic: "شكراً بزاف.", translation: "Thank you very much."}] },
    { latin: "Safi", arabic: "صافي", definition: "Okay, enough, that's it", examples: [{ latin: "Safi, bghit nemshi.", arabic: "صافي، بغيت نمشي.", translation: "Okay, I want to go."}] },
];


const mockChat = {
    sendMessage: async (payload?: { message: string }) => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        let responseContent = {
            latin: "Ana Fatima, l-modarrisa dyalek l-youm. Labas?",
            arabic: "أنا فاطمة، المدرسة ديالك اليوم. لاباس؟",
            english: "I'm Fatima, your teacher for today. Are you okay?"
        };

        if(payload?.message && payload.message.toLowerCase().includes('shukran')) {
             responseContent = {
                latin: "L'afu! Bghiti nhedro 3la shi 7aja khra?",
                arabic: "العفو! بغيتي نهضروا على شي حاجة أخرى؟",
                english: "You're welcome! Do you want to talk about something else?"
            };
        }

        return {
            text: JSON.stringify(responseContent)
        };
    }
};

// --- AI Initialization with Diagnostics ---

// This will be exported so the UI can react to it.
export let aiInitializationError: string | null = null;
let ai: GoogleGenAI | null = null;

try {
    // This structure follows the user's setup constraints.
    // In a browser, `process` is undefined, which will cause a ReferenceError.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not found.");
    }
    ai = new GoogleGenAI({ apiKey });
    console.log("Gemini AI Initialized Successfully.");
} catch (e) {
    // This catch will handle both the `process` is not defined error and our thrown error.
    aiInitializationError = `AI features could not be initialized. The application is running in a browser environment where 'process.env.API_KEY' is not available. Please ensure your development server is configured to expose environment variables to the client-side code. The application will now use mock data.`;
    console.error("AI Initialization Failed:", e.message);
}

const quizOptionSchema = {
    type: Type.OBJECT,
    properties: {
        latin: { type: Type.STRING, description: "The option in Latin script (transliteration)." },
        arabic: { type: Type.STRING, description: "The option in Arabic script." },
    },
    required: ["latin", "arabic"],
};

const explanationSchema = {
    type: Type.OBJECT,
    properties: {
        latin: { type: Type.STRING, description: "The explanation in English but with Darija words in Latin script." },
        arabic: { type: Type.STRING, description: "The explanation in Arabic, explaining the Darija terms." },
    },
    required: ["latin", "arabic"],
};

const quizQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        id: {
            type: Type.STRING,
            description: "A unique identifier for this question, like a short hash of the question text.",
        },
        type: {
          type: Type.STRING,
          description: "The type of question: 'multiple-choice', 'writing', 'speaking', or 'sentence-formation'.",
          enum: ['multiple-choice', 'writing', 'speaking', 'sentence-formation']
        },
        question: {
            type: Type.STRING,
            description: "The question for the user, in English. For 'writing' or 'sentence-formation', it should ask the user to translate something. For 'speaking' it should ask the user to say something."
        },
        explanation: {
            type: Type.OBJECT,
            description: "An object containing 'latin' and 'arabic' versions of the friendly, detailed explanation of the correct answer. Explain the meaning of the correct phrase and also briefly explain what the incorrect options mean (if any). Provide some cultural or grammatical context if relevant.",
            properties: explanationSchema.properties,
        },
        targetWord: {
            type: quizOptionSchema.type,
            description: "The primary vocabulary word or phrase this question is testing. Required for 'Vocabulary' topic questions.",
            properties: quizOptionSchema.properties,
        },
        
        // For multiple-choice
        options: {
            type: Type.ARRAY,
            description: "An array of 4 objects, each containing 'latin' and 'arabic' strings for the options. Only for 'multiple-choice' type.",
            items: quizOptionSchema,
        },
        correctAnswerIndex: {
            type: Type.INTEGER,
            description: "The 0-based index of the correct answer in the options array. Only for 'multiple-choice' type.",
        },

        // For writing and speaking
        correctAnswer: {
          type: quizOptionSchema.type,
          description: "The correct answer phrase. Used for 'writing' and 'speaking' questions.",
          properties: quizOptionSchema.properties,
        },

        // For sentence-formation
        wordBank: {
            type: Type.ARRAY,
            description: "An array of strings (in Latin script) representing the word 'tiles' the user can choose from. This should be a shuffled version of the correctSentence words. For 'sentence-formation' type only.",
            items: { type: Type.STRING },
        },
        correctSentence: {
            type: Type.ARRAY,
            description: "An array of strings representing the words of the sentence in the correct order. For 'sentence-formation' type only.",
            items: { type: Type.STRING },
        }
    },
    required: ["id", "type", "question", "explanation"]
};


const fullQuizSchema = {
    type: Type.OBJECT,
    properties: {
        quiz: {
            type: Type.ARRAY,
            description: `An array of quiz questions.`,
            items: quizQuestionSchema,
        }
    },
    required: ["quiz"],
};

const systemInstruction = `You are a friendly and encouraging language tutor specializing in Moroccan Darija. Your goal is to create content in a specific JSON format. Your tone should be encouraging and informative. For all Darija content, you MUST provide both a Latin script transliteration and the corresponding Arabic script version. It is absolutely critical that you follow the response schema.

- CRITICAL RULE: The question type determines which properties are allowed. Do NOT mix properties from different types.
- A question with type 'multiple-choice' MUST contain 'options' (an array of 4 choices) and 'correctAnswerIndex'. It MUST NOT contain 'correctAnswer', 'wordBank', or 'correctSentence'.
- A question with type 'writing' or 'speaking' MUST contain 'correctAnswer'. It MUST NOT contain 'options', 'correctAnswerIndex', 'wordBank', or 'correctSentence'.
- A question with type 'sentence-formation' MUST contain BOTH 'wordBank' AND 'correctSentence'. It MUST NOT contain 'options', 'correctAnswerIndex', or 'correctAnswer'.
    - 'correctSentence' is an array of strings in Latin script in the correct order. Example: ["hadi", "l-makla", "bnina"].
    - 'wordBank' is an array of the same strings from 'correctSentence', but shuffled. Example: ["bnina", "l-makla", "hadi"].
- CRITICAL RULE: For questions on 'Vocabulary', 'Numbers', or 'Spaced Repetition' topics, you MUST include the 'targetWord' property.
- Every question must have a unique 'id' field.
- FINAL CHECK: Before outputting the JSON, double-check that every 'sentence-formation' question includes BOTH a 'wordBank' and a 'correctSentence' array. This is the most common error and must be avoided.
Adhere strictly to these rules.`;

async function handleApiCall(prompt: string, schema: object, isQuizCall?: boolean) {
    if (!ai) throw new Error("AI services are disabled.");

    const config: any = {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: systemInstruction,
    };

    if (isQuizCall) {
        // For complex quiz generation, allow the model to think to ensure a complete and high-quality response.
        // Omitting thinkingConfig uses the default (enabled) behavior.
    } else {
        // For faster responses on simpler, single-object tasks, disable thinking.
        config.thinkingConfig = { thinkingBudget: 0 };
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: config,
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
          throw new Error("API returned an empty response.");
        }

        const parsed = JSON.parse(jsonText);
        
        if (isQuizCall) {
            if (!parsed.quiz || !Array.isArray(parsed.quiz) || parsed.quiz.length === 0) {
                throw new Error("Received malformed data from the API: quiz array is missing or empty.");
            }
             // Validate that each question has the required fields based on its type
            const validatedQuiz = parsed.quiz.map((q: any) => {
                if (!q.id) {
                    throw new Error(`Malformed question: missing 'id' field: ${JSON.stringify(q)}`);
                }

                // Final validation
                if (q.type === 'multiple-choice' && (q.options === undefined || q.correctAnswerIndex === undefined)) {
                    throw new Error(`Malformed 'multiple-choice' question: ${JSON.stringify(q)}`);
                }
                if ((q.type === 'writing' || q.type === 'speaking') && q.correctAnswer === undefined) {
                     throw new Error(`Malformed '${q.type}' question: ${JSON.stringify(q)}`);
                }
                if (q.type === 'sentence-formation' && (q.wordBank === undefined || q.correctSentence === undefined || !Array.isArray(q.correctSentence))) {
                     throw new Error(`Malformed 'sentence-formation' question: ${JSON.stringify(q)}`);
                }
                return q;
            });
            return { quiz: validatedQuiz };
        }

        return parsed;

    } catch (error) {
        console.error("Error communicating with AI:", error);
        if (error instanceof SyntaxError) { // Catches JSON.parse errors
             throw new Error("The AI returned a malformed or incomplete response. This can happen occasionally. Please try generating again.");
        }
        if (error instanceof Error) {
            const errorMessage = (error as any).message || '';
            if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
                throw new Error("You've made too many requests in a short period. The AI needs a break! Please wait a moment and try again.");
            }
            // Make my custom validation errors more user-friendly
            if (errorMessage.startsWith("Malformed")) {
                throw new Error("The AI returned a malformed response. This can happen occasionally. Please try generating again.");
            }
        }
        throw new Error("Failed to communicate with the AI. This could be a network issue or an API problem. Please try again.");
    }
}


export async function generateQuiz(topic: LearningTopic, level: number, wordToReview?: WordInfo, wordsForSpacedRepetition?: WordHistoryEntry[], subCategory?: string): Promise<Quiz> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock quiz. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        return Promise.resolve(mockQuiz.slice(0, QUIZ_LENGTH));
    }

    let topicSpecifics = "";
    if (topic === 'Vocabulary' && subCategory) {
        topicSpecifics = `The user has chosen the sub-category "${subCategory}". All vocabulary MUST relate to this theme.`;
    } else if (topic === 'Numbers') {
        if (level <= 5) topicSpecifics = "Focus on numbers 1-10 (reading, writing, and simple questions).";
        else if (level <= 15) topicSpecifics = "Focus on numbers 11-100.";
        else if (level <= 30) topicSpecifics = "Focus on numbers 100-1000s, including combinations.";
        else topicSpecifics = "Focus on large numbers (thousands, millions), ordinals, and simple fractions.";
    }
    
    let specialInstructions = "";
    if (wordToReview) {
        specialInstructions += `CRITICAL: The very first question of the quiz MUST test the user on the word "${wordToReview.latin}" which means "${wordToReview.definition}". This is a follow-up from the 'Word of the Day'.`;
    }
    if (topic === 'Spaced Repetition' && wordsForSpacedRepetition) {
        const words = wordsForSpacedRepetition.map(w => `"${w.latin}"`).join(', ');
        topicSpecifics = `This is a 'Spaced Repetition' quiz. The user has previously learned these words but may be forgetting them. Create questions specifically targeting these words: ${words}.`;
    }
    
    const prompt = `Generate a new quiz with exactly ${QUIZ_LENGTH} questions for a user learning Moroccan Darija.
- Topic: "${topic}"
- Sub-Category: "${subCategory || 'General'}"
- Difficulty Level: ${level} out of 50 (where 1 is absolute beginner and 50 is near-fluent). Adjust the complexity of vocabulary, grammar, and sentence structure accordingly.
- Topic Specifics: ${topicSpecifics || 'N/A'}
- Special Instructions: ${specialInstructions || 'N/A'}
- Question Types: Create a varied mix of 'multiple-choice', 'writing', 'speaking', and 'sentence-formation' questions. Ensure there is a good variety, including at least one 'speaking' question for pronunciation practice and at least two 'sentence-formation' questions.
- For multiple-choice questions, ensure the incorrect options are plausible but clearly distinct from the correct one.
- ABSOLUTELY CRITICAL RULE for 'sentence-formation' questions: You MUST provide BOTH a 'wordBank' (an array of shuffled words) AND a 'correctSentence' (an array of the same words in the correct order). For example, if the correct sentence is 'hadi l-makla bnina', the \`correctSentence\` field must be \`["hadi", "l-makla", "bnina"]\` and the \`wordBank\` could be \`["bnina", "l-makla", "hadi"]\`. Failure to provide BOTH fields is a critical error.
- For all Darija content, you must provide both the Latin transliteration and the Arabic script.
- Each question object must have a unique 'id' field.
- If the topic is 'Vocabulary' or 'Numbers', each question MUST have a 'targetWord' field containing the primary word/number being tested.`;
    
    const schema = { ...fullQuizSchema };
    const requiredFields = (schema.properties.quiz.items as any).required;
    if (topic === 'Vocabulary' || topic === 'Numbers' || topic === 'Spaced Repetition') {
        if (!requiredFields.includes("targetWord")) {
            requiredFields.push("targetWord");
        }
    }

    const result = await handleApiCall(prompt, schema, true);
    return result.quiz;
}


export async function analyzeMistakes(mistakes: Mistake[]): Promise<string> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock mistake analysis. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve("This is mock feedback. You are doing great, but pay attention to verb conjugations and noun genders!");
    }
    if (!ai) throw new Error("AI services are disabled.");

    const formattedMistakes = mistakes.map(m => {
        let correctAnswerText = '';
        if (m.question.type === 'multiple-choice') {
            correctAnswerText = m.question.options[m.question.correctAnswerIndex].latin;
        } else if (m.question.type === 'sentence-formation') {
            correctAnswerText = (m.question as SentenceFormationQuestion).correctSentence.join(' ');
        } else {
            correctAnswerText = (m.question as WritingQuestion | SpeakingQuestion).correctAnswer.latin;
        }
        return `- Question: "${m.question.question}"\n  - Your Answer: "${m.userAnswer}"\n  - Correct Answer: "${correctAnswerText}"`;
    }).join('\n');

    const prompt = `A user has made the following mistakes while learning Moroccan Darija. Analyze these mistakes and provide a summary of their common error patterns. Give them encouraging and actionable feedback on what to focus on. Keep the summary concise (2-4 sentences).

Here are the mistakes:
${formattedMistakes}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.5,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing mistakes:", error);
        if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429'))) {
             throw new Error("You've made too many requests in a short period. The AI needs a break! Please wait a moment and try again.");
        }
        throw new Error("Failed to get analysis from the AI.");
    }
}

export async function getMistakeExplanation(question: QuizQuestion, userAnswer: UserAnswer): Promise<string> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock explanation. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve("This is a mock explanation. The correct answer is right because it's not wrong!");
    }
    if (!ai) throw new Error("AI services are disabled.");

    const correctAnswer = question.type === 'multiple-choice' 
        ? question.options[question.correctAnswerIndex].latin 
        : question.type === 'sentence-formation'
        ? question.correctSentence.join(' ')
        : question.correctAnswer.latin;

    const prompt = `A user learning Moroccan Darija was asked the question: "${question.question}".
    They answered "${Array.isArray(userAnswer) ? userAnswer.join(' ') : userAnswer}".
    The correct answer is "${correctAnswer}".

    Please provide a concise, friendly explanation (1-2 sentences) about why their answer was incorrect. Focus on the specific error they made. For example, if it was a grammar mistake, explain the grammar rule they missed. If it was a vocabulary mistake, clarify the meaning of the word they used versus the correct one.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting mistake explanation:", error);
        throw new Error("Failed to get explanation from the AI.");
    }
}

const wordInfoSchema = {
    type: Type.OBJECT,
    properties: {
        latin: { type: Type.STRING },
        arabic: { type: Type.STRING },
        definition: { type: Type.STRING, description: "A simple definition of the word in English." },
        examples: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    latin: { type: Type.STRING },
                    arabic: { type: Type.STRING },
                    translation: { type: Type.STRING, description: "The English translation of the example sentence." }
                },
                required: ["latin", "arabic", "translation"]
            }
        }
    },
    required: ["latin", "arabic", "definition", "examples"]
};

export async function getWordInfo(word: string): Promise<WordInfo> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock word info. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve(mockWordInfo);
    }
    const prompt = `Provide detailed information for the English word "${word}" in Moroccan Darija. I need its translation, a simple definition, and three diverse example sentences (easy, medium, hard) with their English translations.`;
    return handleApiCall(prompt, wordInfoSchema);
}

export async function getWordOfTheDay(language: 'en' | 'nl' = 'en'): Promise<WordInfo> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock word of the day. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve({
            latin: "Shukran",
            arabic: "شكرا",
            definition: "Thank you. A fundamental expression of gratitude.",
            examples: [
                { latin: "Shukran bzaf!", arabic: "شكرا بزاف!", translation: "Thank you very much!" }
            ]
        });
    }
    const langName = language === 'nl' ? 'Dutch' : 'English';
    const prompt = `Provide one interesting and common Moroccan Darija word that a beginner can learn. The definition and example translation should be in ${langName}. The word itself should not be a basic greeting like 'salam'. Provide its definition and one diverse example sentence with its ${langName} translation.`;
    return handleApiCall(prompt, wordInfoSchema);
}

const recommendedWordsSchema = {
    type: Type.OBJECT,
    properties: {
        words: {
            type: Type.ARRAY,
            description: `An array of 4 word info objects.`,
            items: wordInfoSchema,
        }
    },
    required: ["words"],
};

export async function getRecommendedWords(language: 'en' | 'nl' = 'en'): Promise<WordInfo[]> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock recommended words. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve(mockRecommendedWords);
    }
    const langName = language === 'nl' ? 'Dutch' : 'English';
    const prompt = `Provide 4 interesting and common Moroccan Darija words that a beginner can learn. For each word, provide its definition and one example sentence with its ${langName} translation. The words should be varied and not basic greetings like 'salam' or 'labas'.`;
    
    const result = await handleApiCall(prompt, recommendedWordsSchema);
    return result.words;
}


export async function generateWordQuiz(wordInfo: WordInfo): Promise<Quiz> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock word quiz. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve(mockQuiz);
    }

    const prompt = `Generate a mini-quiz of 5 questions to help a user learn the Moroccan Darija word "${wordInfo.latin} / ${wordInfo.arabic}".
    
The word means: "${wordInfo.definition}".
Here are some examples of its use:
1. ${wordInfo.examples[0].latin} - ${wordInfo.examples[0].translation}

Create varied questions (multiple-choice, writing, sentence-formation) that test the user's understanding of the word's meaning and usage in context. All questions should have "${wordInfo.latin}" as their targetWord.`;

    const result = await handleApiCall(prompt, fullQuizSchema, true);
    return result.quiz;
}

// This schema ensures the AI structures its response correctly, preventing parsing errors.
const chatResponseSchema = {
    type: Type.OBJECT,
    properties: {
        latin: { type: Type.STRING, description: "Your response in Darija, using Latin script." },
        arabic: { type: Type.STRING, description: "Your response in Darija, using Arabic script." },
        english: { type: Type.STRING, description: "A simple English translation of your Darija response. If you are answering a user's question, the answer comes first, then the translation." },
    },
    required: ["latin", "arabic", "english"]
};

export function createChatSession(personality: string, history?: Content[]): Chat {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock chat session. Reason:", aiInitializationError);
        return mockChat as unknown as Chat;
    }
    if (!ai) throw new Error("AI services are disabled.");

    const chatSystemInstruction = `You are a friendly and patient Darija tutor from Morocco. Your name is Fatima. Your goal is to have a simple, encouraging conversation with a language learner to help them practice.

- Main Task: Have a natural, flowing conversation in Moroccan Darija.
- Personality/Dialect: You MUST adopt the following personality: "${personality}". This should influence your vocabulary, tone, and sentence complexity.
- Secondary Task: If the user asks a question in English about Darija (e.g., "what does 'bghit' mean?" or "how do I say 'I am tired'?"), you should detect this. Your response should still be a conversational Darija phrase, but the 'english' part of your JSON response should FIRST answer their question, and THEN provide the translation of your Darija phrase.
- Example user message: "what does 'mzyan' mean?"
- Example AI JSON response:
{
  "latin": "Ah, mzyan. U kif dayr l-youm?",
  "arabic": "اه، مزيان. و كيف داير اليوم؟",
  "english": "'Mzyan' means 'good' or 'fine'. And how is your day?"
}
- Your responses MUST ALWAYS be in the following JSON format and you must not add any text before or after the JSON.
- Keep your Darija responses relatively short and easy for a beginner to understand. Ask questions to keep the conversation going.
- Your first message should introduce yourself and ask how the user is doing.`;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
            systemInstruction: chatSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: chatResponseSchema,
            thinkingConfig: { thinkingBudget: 0 } // For faster, more responsive chat.
        },
    });
    return chat;
}

export async function getTopicExplanation(topic: LearningTopic, level: number): Promise<string> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock explanation. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve(`This is a mock explanation for ${topic} at level ${level}. A key concept to remember is to always practice consistently!`);
    }
    if (!ai) throw new Error("AI services are disabled.");

    const prompt = `You are a Moroccan Darija tutor. A student is about to start a quiz. Give them a single, concise, encouraging, and helpful tip (2-3 sentences) related to the upcoming quiz.
- Topic: ${topic}
- Level: ${level} (out of 50)
For example, for Grammar level 4, you could explain possessive pronouns. For Common Phrases level 10, you could explain different ways to say thank you. For Numbers level 1, explain how gender affects numbers 1 and 2. Keep it short, simple, and directly useful for the quiz.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.7,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting topic explanation:", error);
        throw new Error("Failed to get a tip from the AI.");
    }
}

const rootAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        root: { type: Type.STRING, description: "The three-consonant root, formatted like k-t-b." },
        meaning: { type: Type.STRING, description: "The general meaning or concept of the root." },
        relatedWords: {
            type: Type.ARRAY,
            description: "An array of 5-7 related words derived from this root.",
            items: {
                type: Type.OBJECT,
                properties: {
                    latin: { type: Type.STRING },
                    arabic: { type: Type.STRING },
                    english: { type: Type.STRING, description: "The English translation of the word." }
                },
                required: ["latin", "arabic", "english"]
            }
        }
    },
    required: ["root", "meaning", "relatedWords"]
};

export async function getTriliteralRoot(word: string): Promise<RootAnalysis> {
     if (!ai) {
        console.warn("AI Service Disabled, returning mock root analysis. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve({
            root: "k-t-b",
            meaning: "The concept of writing.",
            relatedWords: [
                { latin: "kteb", arabic: "كتب", english: "he wrote" },
                { latin: "ktab", arabic: "كتاب", english: "book" },
                { latin: "maktaba", arabic: "مكتبة", english: "library" },
                { latin: "katib", arabic: "كاتب", english: "writer" },
                { latin: "mektoub", arabic: "مكتوب", english: "written / destiny" }
            ]
        });
    }
    const prompt = `Analyze the Moroccan Darija word "${word}". Identify its triliteral root (3 consonants, formatted like k-t-b). Provide the general meaning of the root, and a list of 5-7 related words derived from this root, with their Latin/Arabic script and English translation.`;
    const result = await handleApiCall(prompt, rootAnalysisSchema);
    return result;
}

const regionalDialectSchema = {
    type: Type.OBJECT,
    properties: {
        translations: {
            type: Type.ARRAY,
            description: "An array of 3 translation objects, one for each specified city.",
            items: {
                type: Type.OBJECT,
                properties: {
                    city: { type: Type.STRING },
                    translation: {
                        type: Type.OBJECT,
                        properties: {
                            latin: { type: Type.STRING },
                            arabic: { type: Type.STRING }
                        },
                        required: ["latin", "arabic"]
                    }
                },
                required: ["city", "translation"]
            }
        }
    },
    required: ["translations"]
};

export async function getRegionalTranslations(phrase: string): Promise<DialectTranslation[]> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock translations. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            { city: 'Casablanca', translation: { latin: `(mock) ${phrase} dial Casa`, arabic: `(mock) ${phrase} لهجة كازا` } },
            { city: 'Fes', translation: { latin: `(mock) ${phrase} dial Fes`, arabic: `(mock) ${phrase} لهجة فاس` } },
            { city: 'Marrakech', translation: { latin: `(mock) ${phrase} dial Marrakech`, arabic: `(mock) ${phrase} لهجة مراكش` } },
        ];
    }
    const prompt = `Translate the phrase "${phrase}" into the regional Moroccan Darija dialects for the cities of Casablanca, Fes, and Marrakech. Provide a distinct translation for each city.`;
    const result = await handleApiCall(prompt, regionalDialectSchema);
    return result.translations;
}


const pronunciationFeedbackSchema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: { type: Type.BOOLEAN, description: "Whether the user's pronunciation is considered correct enough for a learner." },
        feedback: { type: Type.STRING, description: "Brief, encouraging, and constructive feedback (1-3 sentences) on their pronunciation. If correct, just say something encouraging. If incorrect, point out the specific issue." },
    },
    required: ["isCorrect", "feedback"]
};

export async function getPronunciationFeedback(targetWord: {latin: string, arabic: string}, userPronunciation: string): Promise<PronunciationFeedback> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock feedback. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        const isCorrect = userPronunciation.toLowerCase().includes(targetWord.latin.toLowerCase().charAt(0));
        return {
            isCorrect: isCorrect,
            feedback: isCorrect 
                ? `Mock feedback: Correct! Great job!` 
                : `This is mock feedback. You said "${userPronunciation}". The target was "${targetWord.latin}". Try again!`
        };
    }
    const prompt = `A user learning Moroccan Darija was asked to pronounce the word "${targetWord.latin}" (${targetWord.arabic}).
    Using speech-to-text, we transcribed their pronunciation as "${userPronunciation}".
    
    Analyze the transcribed pronunciation against the target word. Consider common learner errors.
    1. Determine if the pronunciation is correct. It doesn't have to be perfect, but should be clearly understandable and correct for a learner's level.
    2. Provide brief, encouraging, and constructive feedback. If it's correct, congratulate them. If it's incorrect, gently point out what they can improve (e.g., "It sounds like you said 's' instead of the emphatic 'ص'. Try making the sound deeper in your throat.").
    
    Return your analysis in the specified JSON format.`;
    
    return handleApiCall(prompt, pronunciationFeedbackSchema);
}


const phonemeExampleSchema = {
    type: Type.OBJECT,
    properties: {
        latin: { type: Type.STRING },
        arabic: { type: Type.STRING },
        definition: { type: Type.STRING, description: "A simple definition or explanation of the word in English." }
    },
    required: ["latin", "arabic", "definition"]
};

export async function getPhonemeExample(phoneme: string): Promise<{ latin: string, arabic: string, definition: string }> {
    if (!ai) {
        console.warn("AI Service Disabled, returning mock phoneme example. Reason:", aiInitializationError);
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockExamples: Record<string, { latin: string; arabic: string; definition: string; }> = {
            'ق': { latin: 'qahwa', arabic: 'قهوة', definition: 'Coffee' },
            'غ': { latin: 'ghzal', arabic: 'غزال', definition: 'Gazelle / beautiful' },
            'ح': { latin: 'henna', arabic: 'حناء', definition: 'Henna' },
            'ع': { latin: 'aayn', arabic: 'عين', definition: 'Eye' },
            'خ': { latin: 'khobz', arabic: 'خبز', definition: 'Bread' },
            'ص': { latin: 'sber', arabic: 'صبر', definition: 'Patience' },
            'ض': { latin: 'drb', arabic: 'ضرب', definition: 'To hit' },
            'ط': { latin: 'tebla', arabic: 'طبلة', definition: 'Table' },
            'ظ': { latin: 'dher', arabic: 'ظهر', definition: 'Back (body part)' },
        };
        const example = mockExamples[phoneme] || { latin: 'qahwa', arabic: 'قهوة', definition: 'Coffee' };
        return {
            latin: `${example.latin} (mock)`,
            arabic: `${example.arabic} (mock)`,
            definition: `${example.definition} (mock)`,
        };
    }
    const prompt = `Provide one common, simple Moroccan Darija word that contains the sound represented by the letter '${phoneme}'. For example, for 'ح', you could provide 'b7al'. For 'ق', you could provide 'qahwa'. Also provide a simple English definition for the word.`;
    return handleApiCall(prompt, phonemeExampleSchema);
}

export async function getTopicImage(topic: LearningTopic): Promise<string> {
    const localStorageKey = `topicImage_${topic.replace(' ', '')}`;
    const cachedImage = localStorage.getItem(localStorageKey);
    if (cachedImage) {
        return cachedImage;
    }
    
    // Fallback for when AI services are disabled or if generation fails
    const fallbackImage = 'https://images.unsplash.com/photo-1558328423-3e3a47936a2d?q=80&w=1974&auto=format&fit=crop';

    if (!ai) {
        console.warn("AI Service Disabled, returning fallback image. Reason:", aiInitializationError);
        return fallbackImage;
    }
    if (!ai) throw new Error("AI services are disabled.");

    let prompt = '';
    switch (topic) {
        case 'Vocabulary':
            prompt = 'A vibrant Moroccan marketplace (souk) with many colorful spices, textiles, and lanterns, in a beautiful digital art style.';
            break;
        case 'Grammar':
            prompt = 'An ancient, intricate Moroccan library or scriptorium with beautiful calligraphy and geometric patterns, in a beautiful digital art style.';
            break;
        case 'Common Phrases':
            prompt = 'Two people having a friendly conversation over mint tea in a traditional Moroccan riad courtyard, in a beautiful digital art style.';
            break;
        case 'Numbers':
            prompt = 'A Moroccan artisan meticulously crafting intricate zellij tile patterns with geometric shapes and numbers, in a beautiful digital art style.';
            break;
        default:
            prompt = 'A beautiful, serene landscape in Morocco with Atlas mountains in the background, digital art.';
    }

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        
        localStorage.setItem(localStorageKey, imageUrl);
        return imageUrl;
    } catch (error) {
        console.error(`Failed to generate image for topic ${topic}:`, error);
        return fallbackImage; // Return fallback on error
    }
}