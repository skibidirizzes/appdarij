import { LearningTopic, Achievement, AchievementID, Quest, Sticker, StickerID, Story, UserProfile } from "./types.ts";
import { TranslationKey } from "./localization/translations.ts";

// --- DEVELOPMENT FLAG ---
// This now automatically disables AI services if the API key is not provided in the environment.
// The app will fall back to mock data, preventing crashes on deployment.
export const ENABLE_AI_SERVICES = typeof process !== 'undefined' && !!process.env?.API_KEY;

// This API key is included directly as requested by the user.
// In a production environment, this should be handled via secure environment variables.
export const ELEVENLABS_API_KEY = "sk_6fbfb0fcb94235b0bada5b63a9d843bcdff14442558d0970";
export const ELEVENLABS_VOICE_ID = "OfGMGmhShO8iL9jCkXy8";

export const LOCAL_STORAGE_KEY = 'darijaMasterUser';
export const GLOBAL_USERS_KEY = 'darijaMasterAllUsers';
export const OFFLINE_QUEUE_KEY = 'darijaMasterOfflineQueue';
export const POINTS_PER_CORRECT_ANSWER = 10;
export const XP_PER_DAILY_LOGIN = 5;
export const XP_PER_REVIEW_QUIZ = 20;
export const XP_PER_FIRST_CONVO = 30;
export const QUIZ_LENGTH = 10;
export const LEVELS = Array.from({ length: 50 }, (_, i) => i + 1);
export const WRITING_SIMILARITY_THRESHOLD = 0.8;
export const SPACED_REPETITION_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days

export const LEARNING_TOPICS: { name: LearningTopic; nameKey: TranslationKey; descriptionKey: TranslationKey; key: 'vocabulary' | 'grammar' | 'phrases' | 'numbers' }[] = [
    { name: 'Vocabulary', nameKey: 'topic_vocabulary_name', descriptionKey: 'topic_vocabulary_description', key: 'vocabulary' },
    { name: 'Grammar', nameKey: 'topic_grammar_name', descriptionKey: 'topic_grammar_description', key: 'grammar' },
    { name: 'Common Phrases', nameKey: 'topic_phrases_name', descriptionKey: 'topic_phrases_description', key: 'phrases' },
    { name: 'Numbers', nameKey: 'topic_numbers_name', descriptionKey: 'topic_numbers_description', key: 'numbers' },
];

export const AVAILABLE_QUESTS: Quest[] = [
    { id: 'complete_3_grammar', type: 'complete_quiz', targetTopic: 'Grammar', targetValue: 3, xpReward: 50, descriptionKey: 'quest_complete_3_grammar' },
    { id: 'complete_5_any', type: 'complete_quiz', targetValue: 5, xpReward: 50, descriptionKey: 'quest_complete_5_any' },
    { id: 'perfect_phrases', type: 'perfect_score', targetTopic: 'Common Phrases', targetValue: 1, xpReward: 75, descriptionKey: 'quest_perfect_phrases' },
    { id: 'perfect_any', type: 'perfect_score', targetValue: 2, xpReward: 100, descriptionKey: 'quest_perfect_any' },
    { id: 'learn_15_words', type: 'learn_words', targetValue: 15, xpReward: 60, descriptionKey: 'quest_learn_15_words' },
];

export const STICKERS: Record<StickerID, Sticker & { criteria: (user: UserProfile) => boolean }> = {
    mint_tea_master: {
        id: 'mint_tea_master',
        name: 'Mint Tea Master',
        icon: '🫖',
        description: 'Completed 5 quizzes in the "Common Phrases" category.',
        criteria: (user) => {
             const progress = user.progress['Common Phrases'];
             if (!progress) return false;
             return Object.values(progress).reduce((acc, level) => acc + level.completedCount, 0) >= 5;
        },
    },
    souk_navigator: {
        id: 'souk_navigator',
        name: 'Souk Navigator',
        icon: '🏺',
        description: 'Learned over 25 words in the "Vocabulary" category.',
        criteria: (user) => (user.progress['Vocabulary']?.['5']?.completedCount || 0) >= 1, // Simplified for demo
    },
    grammar_guardian: {
        id: 'grammar_guardian',
        name: 'Grammar Guardian',
        icon: '🏛️',
        description: 'Achieved a perfect score on 3 grammar quizzes.',
        criteria: (user) => {
            const progress = user.progress['Grammar'];
            if (!progress) return false;
            const perfectScores = Object.values(progress).filter((level) => level.highScore === QUIZ_LENGTH).length;
            return perfectScores >= 3;
        },
    },
};

export const STORY_LEVELS: Story[] = [
    {
        title: "The Lost Camel",
        levelUnlock: 10,
        paragraphs: [
            {
                latin: "F wa7d lmdina smitha Marrakech, kan wa7d r-rajel smito Ali. Ali kan 3ando jmel zwin bzaf, smito Zitoune.",
                arabic: "فواحد المدينة سميتها مراكش، كان واحد الراجل سميتو علي. علي كان عندو جمل زوين بزاف، سميتو زيتون.",
                translation: "In a city named Marrakech, there was a man named Ali. Ali had a very beautiful camel, named Zitoune."
            },
            {
                latin: "Wa7d nhar, Ali msha l-suq, o Zitoune tb3o. Walakin f-suq, kan fih bzaf d-nass, o Zitoune tleff.",
                arabic: "واحد نهار، علي مشا للسوق، و زيتون تبعو. ولكن فالسوق، كان فيه بزاف دالناس، و زيتون تلف.",
                translation: "One day, Ali went to the market, and Zitoune followed him. But in the market, there were many people, and Zitoune got lost."
            },
            {
                latin: "Ali bda kayqelleb 3la Zitoune f-kullshi blassa. Sewwel l-khddar, sewwel l-gezzar, walu. 7ta wa7d ma shafo.",
                arabic: "علي بدا كيقلب على زيتون فكلشي بلاصة. سوّل الخضار، سوّل الڭزار، والو. حتى واحد ماشافو.",
                translation: "Ali started looking for Zitoune everywhere. He asked the vegetable seller, he asked the butcher, nothing. No one saw him."
            },
            {
                latin: "F l-akhir, Ali msha l Jamae El Fna. O temma, lqa Zitoune kayakul t-tmer m3a wa7d l-bent sghira.",
                arabic: "فالأخير، علي مشا لجامع الفنا. و تما، لقا زيتون كياكل التمر مع واحد البنت صغيرة.",
                translation: "Finally, Ali went to Jamae El Fna. And there, he found Zitoune eating dates with a little girl."
            },
            {
                latin: "Ali fer7an bzaf, o shker l-bent. O men dak nhar, Ali o Zitoune ma 3awdush tferqo.",
                arabic: "علي فرحان بزاف، و شكر البنت. و من داك نهار، علي و زيتون ماعاودوش تفرقو.",
                translation: "Ali was very happy, and he thanked the girl. And from that day on, Ali and Zitoune were never separated again."
            }
        ]
    }
];

export const DARIJA_TIPS: string[] = [
    "In Darija, 'bghit' means 'I want'. You can use it for almost anything, like 'bghit lma' (I want water).",
    "Many Darija nouns are masculine or feminine. Often, nouns ending in 'a' are feminine, like 'tebla' (table).",
    "To say 'thank you', you say 'shukran'. To say 'you're welcome', you can say 'la shukran ala wajib' or simply 'العفو' (l'afu).",
    "'Fin?' means 'Where?'. 'Fin mashi?' means 'Where are you going?'.",
    "Numbers can be tricky! 'Wa7ed' (1), 'jouj' (2), 'tlata' (3). But 'jouj d nass' means 'two people'.",
    "The word 'dyal' is used for possession. 'Lktab dyali' means 'my book' (the book of me).",
    "To make a verb negative, you often wrap it with 'ma-' and '-sh'. 'Kanbghi' (I like) becomes 'makanbgish' (I don't like).",
    "Transliteration from Arabic to Latin script isn't an exact science! 'Hello' could be 'salam', 'salem', or 'slm'. The app is designed to understand these small differences.",
    "The present tense often starts with 'ka-'. For example, 'I eat' is 'kanakul' (ka-nakul).",
    "For the future tense, use 'ghadi' or just 'gha-' before the verb. 'Gha-nakul' means 'I will eat'.",
    "'Hada' means 'this' (masculine), and 'hadi' means 'this' (feminine). 'Hadak' and 'hadik' mean 'that'.",
    "Adjectives usually come after the noun and agree in gender. 'A big book' is 'ktab kbir', but 'a big car' is 'tomobil kbira'.",
    "Darija often omits the verb 'to be' in the present tense. You'd say 'Ana mzyan' for 'I am good'.",
    "The numbers 3, 7, and 9 in transliteration represent Arabic letters: 3 = 'ع' (Ayn), 7 = 'ح' (Ha), and 9 = 'ق' (Qaf).",
    "'Safi' is a super versatile word. It can mean 'okay', 'enough', 'that's it', or 'deal'."
];

export const PHONEME_TIPS: Record<string, { en: string; nl: string; }> = {
    'ق': { en: 'Tip: Deep in the throat, not like "k".', nl: 'Tip: Achter in de keel, geen "k".' },
    'غ': { en: 'Tip: A gargling sound, like a French "r".', nl: 'Tip: Een gorgelend geluid, zoals de Franse "r".' },
    'ح': { en: 'Tip: A strong, breathy "h" from the throat.', nl: 'Tip: Een sterke, hese "h" vanuit de keel.' },
    'ع': { en: 'Tip: A deep, constricted sound in the throat.', nl: 'Tip: Een diep, geknepen geluid in de keel.' },
    'خ': { en: 'Tip: Like the "ch" in Scottish "loch" or German "Bach".', nl: 'Tip: Zoals de "ch" in "Bach".' },
    'ص': { en: 'Tip: An emphatic "s", with a flattened tongue.', nl: 'Tip: Een nadrukkelijke "s", met een platte tong.' },
    'ض': { en: 'Tip: An emphatic "d", with the tongue against the teeth.', nl: 'Tip: Een nadrukkelijke "d", met de tong tegen de tanden.' },
    'ط': { en: 'Tip: An emphatic "t", sharper than English "t".', nl: 'Tip: Een nadrukkelijke "t", scherper dan de Engelse "t".' },
    'ظ': { en: 'Tip: An emphatic "dh" sound.', nl: 'Tip: Een nadrukkelijke "dh"-klank.' },
};

export const ACHIEVEMENTS: Record<AchievementID, Omit<Achievement, 'name' | 'description'>> = {
    first_steps: { id: 'first_steps', icon: '✅' },
    quiz_taker: { id: 'quiz_taker', icon: '🎓' },
    unstoppable: { id: 'unstoppable', icon: '🔥' },
    dedicated_learner: { id: 'dedicated_learner', icon: '📚' },
    darija_pro: { id: 'darija_pro', icon: '🏆' },
    
    topic_starter_vocabulary: { id: 'topic_starter_vocabulary', icon: '📖' },
    topic_starter_grammar: { id: 'topic_starter_grammar', icon: '🏛️' },
    topic_starter_phrases: { id: 'topic_starter_phrases', icon: '🗣️' },
    topic_starter_numbers: { id: 'topic_starter_numbers', icon: '🔢' },
    
    level_5_vocabulary: { id: 'level_5_vocabulary', icon: '🧭' },
    level_5_grammar: { id: 'level_5_grammar', icon: '🛠️' },
    level_5_phrases: { id: 'level_5_phrases', icon: '💬' },
    level_5_numbers: { id: 'level_5_numbers', icon: '🧮' },

    level_10_vocabulary: { id: 'level_10_vocabulary', icon: '💪' },
    level_10_grammar: { id: 'level_10_grammar', icon: '🧠' },
    level_10_phrases: { id: 'level_10_phrases', icon: '🌐' },
    level_10_numbers: { id: 'level_10_numbers', icon: '📈' },

    level_20_vocabulary: { id: 'level_20_vocabulary', icon: '🥇' },
    level_20_grammar: { id: 'level_20_grammar', icon: '🧑‍🏫' },
    level_20_phrases: { id: 'level_20_phrases', icon: '🌟' },
    level_20_numbers: { id: 'level_20_numbers', icon: '🏅' },

    level_30_vocabulary: { id: 'level_30_vocabulary', icon: '✨' },
    level_30_grammar: { id: 'level_30_grammar', icon: '⚖️' },
    level_30_phrases: { id: 'level_30_phrases', icon: '🎉' },
    level_30_numbers: { id: 'level_30_numbers', icon: '🎯' },

    level_40_vocabulary: { id: 'level_40_vocabulary', icon: '💎' },
    level_40_grammar: { id: 'level_40_grammar', icon: '📈' },
    level_40_phrases: { id: 'level_40_phrases', icon: '🚀' },
    level_40_numbers: { id: 'level_40_numbers', icon: '💯' },

    level_50_vocabulary: { id: 'level_50_vocabulary', icon: '🌌' },
    level_50_grammar: { id: 'level_50_grammar', icon: '🎓' },
    level_50_phrases: { id: 'level_50_phrases', icon: '🌍' },
    level_50_numbers: { id: 'level_50_numbers', icon: '👑' },

    perfect_quiz: { id: 'perfect_quiz', icon: '🎯' },
    completionist: { id: 'completionist', icon: '👑' },
    mistake_learner: { id: 'mistake_learner', icon: '💡' },
    chat_initiate: { id: 'chat_initiate', icon: '💬' },
    century_club: { id: 'century_club', icon: '💯' },
};