import { User, Topic, Question, Content } from '@/types'

export const sampleUsers: User[] = [
  {
    id: 'admin-1',
    name: 'System Administrator',
    email: 'admin@eduplatform.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    id: 'admin-2',
    name: 'Professor Carlos',
    email: 'carlos@eduplatform.com',
    password: 'prof2024',
    role: 'admin',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'admin-3',
    name: 'Dra. Helena Santos',
    email: 'helena@eduplatform.com',
    password: 'helena456',
    role: 'admin',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'student-1',
    name: 'Ana Silva',
    email: 'ana@example.com',
    password: 'student123',
    role: 'student',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'student-2',
    name: 'João Santos',
    email: 'joao@example.com',
    password: 'student123',
    role: 'student',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'student-3',
    name: 'Maria Costa',
    email: 'maria@example.com',
    password: 'student123',
    role: 'student',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date().toISOString()
  }
]

export const sampleTopics: Topic[] = [
  {
    id: 'topic-1',
    name: 'Present Simple',
    description: 'Learn the basics of present simple tense in English',
    levelMin: 'A1',
    levelMax: 'A2',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-2',
    name: 'Past Continuous',
    description: 'Master the past continuous tense and its usage',
    levelMin: 'A2',
    levelMax: 'B1',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-3',
    name: 'Reading Comprehension',
    description: 'Develop your reading skills with various text types',
    levelMin: 'B1',
    levelMax: 'C1',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-4',
    name: 'Vocabulary Building',
    description: 'Expand your vocabulary with essential words and phrases',
    levelMin: 'A1',
    levelMax: 'B2',
    isActive: true,
    createdAt: new Date().toISOString()
  }
]

export const sampleContents: Content[] = [
  {
    id: 'content-1',
    topicId: 'topic-1',
    title: 'Introduction to Present Simple',
    bodyHtml: `
      <h3>What is Present Simple?</h3>
      <p>The present simple tense is used to describe habits, general truths, and repeated actions.</p>
      
      <h4>Formation:</h4>
      <ul>
        <li><strong>Positive:</strong> Subject + base verb (+ s/es for 3rd person singular)</li>
        <li><strong>Negative:</strong> Subject + don't/doesn't + base verb</li>
        <li><strong>Question:</strong> Do/Does + subject + base verb?</li>
      </ul>
      
      <h4>Examples:</h4>
      <ul>
        <li>I <em>work</em> every day.</li>
        <li>She <em>works</em> in a hospital.</li>
        <li>They <em>don't like</em> coffee.</li>
        <li><em>Do you speak</em> English?</li>
      </ul>
    `,
    mediaUrl: '',
    estTimeMin: 15,
    tags: ['grammar', 'present-simple', 'beginner'],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'content-2',
    topicId: 'topic-2',
    title: 'Understanding Past Continuous',
    bodyHtml: `
      <h3>Past Continuous Tense</h3>
      <p>The past continuous tense describes actions that were ongoing at a specific point in the past.</p>
      
      <h4>Formation:</h4>
      <p><strong>Subject + was/were + verb + -ing</strong></p>
      
      <h4>Usage:</h4>
      <ol>
        <li>Actions in progress at a specific time: <em>I was studying at 8 PM.</em></li>
        <li>Background actions: <em>While I was cooking, the phone rang.</em></li>
        <li>Interrupted actions: <em>I was watching TV when she arrived.</em></li>
      </ol>
      
      <h4>Time Expressions:</h4>
      <p>while, when, at 8 o'clock, all day, yesterday morning</p>
    `,
    mediaUrl: '',
    estTimeMin: 20,
    tags: ['grammar', 'past-continuous', 'intermediate'],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'content-3',
    topicId: 'topic-3',
    title: 'Reading Strategies',
    bodyHtml: `
      <h3>Effective Reading Strategies</h3>
      <p>Improve your reading comprehension with these proven techniques:</p>
      
      <h4>Before Reading:</h4>
      <ul>
        <li>Preview the text (title, headings, images)</li>
        <li>Predict what the text will be about</li>
        <li>Activate prior knowledge</li>
      </ul>
      
      <h4>During Reading:</h4>
      <ul>
        <li>Read actively - ask questions</li>
        <li>Look for main ideas and supporting details</li>
        <li>Use context clues for unknown words</li>
        <li>Take notes or highlight key points</li>
      </ul>
      
      <h4>After Reading:</h4>
      <ul>
        <li>Summarize the main points</li>
        <li>Reflect on what you learned</li>
        <li>Connect to personal experience</li>
      </ul>
    `,
    mediaUrl: '',
    estTimeMin: 10,
    tags: ['reading', 'strategies', 'skills'],
    isPublished: true,
    createdAt: new Date().toISOString()
  }
]

export const sampleQuestions: Question[] = [
  {
    id: 'q1',
    topicId: 'topic-1',
    title: 'Present Simple - Affirmative',
    stemHtml: 'Choose the correct form of the verb in present simple: "She _____ to work every day."',
    optionA: 'go',
    optionB: 'goes',
    optionC: 'going',
    optionD: 'went',
    optionE: 'will go',
    correctOption: 'B',
    commentHtml: 'In present simple, third person singular (he/she/it) takes -s or -es. "She goes" is correct.',
    difficulty: 'A1',
    tags: ['present-simple', 'third-person'],
    isPublished: true,
    createdAt: new Date().toISOString(),
    mediaUrls: []
  },
  {
    id: 'q2',
    topicId: 'topic-1',
    title: 'Present Simple - Negative',
    stemHtml: 'Complete the negative sentence: "They _____ like pizza."',
    optionA: "don't",
    optionB: "doesn't",
    optionC: "not",
    optionD: "no",
    optionE: "aren't",
    correctOption: 'A',
    commentHtml: 'For plural subjects (they), we use "don\'t" + base verb. "They don\'t like pizza" is correct.',
    difficulty: 'A1',
    tags: ['present-simple', 'negative'],
    isPublished: true,
    createdAt: new Date().toISOString(),
    mediaUrls: []
  },
  {
    id: 'q3',
    topicId: 'topic-2',
    title: 'Past Continuous - Formation',
    stemHtml: 'Complete the sentence with past continuous: "At 9 PM last night, I _____ TV."',
    optionA: 'watched',
    optionB: 'was watching',
    optionC: 'watch',
    optionD: 'am watching',
    optionE: 'have watched',
    correctOption: 'B',
    commentHtml: 'Past continuous is formed with was/were + verb-ing. For first person singular: "I was watching".',
    difficulty: 'A2',
    tags: ['past-continuous', 'formation'],
    isPublished: true,
    createdAt: new Date().toISOString(),
    mediaUrls: []
  },
  {
    id: 'q4',
    topicId: 'topic-2',
    title: 'Past Continuous vs Simple Past',
    stemHtml: 'Choose the correct form: "While I _____ dinner, the phone _____."',
    optionA: 'cooked / was ringing',
    optionB: 'was cooking / rang',
    optionC: 'cook / ring',
    optionD: 'was cooking / was ringing',
    optionE: 'cooked / rang',
    correctOption: 'B',
    commentHtml: 'Use past continuous for the ongoing action (was cooking) and simple past for the interrupting action (rang).',
    difficulty: 'B1',
    tags: ['past-continuous', 'simple-past', 'interrupted-actions'],
    isPublished: true,
    createdAt: new Date().toISOString(),
    mediaUrls: []
  },
  {
    id: 'q5',
    topicId: 'topic-3',
    title: 'Reading Comprehension',
    stemHtml: `
      <p>Read the text and answer the question:</p>
      <blockquote>
        "Sarah has been working as a teacher for five years. She loves her job because she enjoys helping students learn and grow. Every morning, she prepares lessons and thinks about how to make them interesting and engaging."
      </blockquote>
      <p>What does Sarah do for a living?</p>
    `,
    optionA: 'She is a student',
    optionB: 'She is a teacher',
    optionC: 'She is a writer',
    optionD: 'She is a manager',
    optionE: 'She is unemployed',
    correctOption: 'B',
    commentHtml: 'The text clearly states "Sarah has been working as a teacher for five years."',
    difficulty: 'A2',
    tags: ['reading-comprehension', 'professions'],
    isPublished: true,
    createdAt: new Date().toISOString(),
    mediaUrls: []
  },
  {
    id: 'q6',
    topicId: 'topic-4',
    title: 'Vocabulary - Synonyms',
    stemHtml: 'Which word is closest in meaning to "enormous"?',
    optionA: 'tiny',
    optionB: 'average',
    optionC: 'huge',
    optionD: 'small',
    optionE: 'medium',
    correctOption: 'C',
    commentHtml: '"Enormous" means very large or huge. "Huge" is the closest synonym among the options.',
    difficulty: 'B1',
    tags: ['vocabulary', 'synonyms', 'adjectives'],
    isPublished: true,
    createdAt: new Date().toISOString(),
    mediaUrls: []
  }
]

export function initializeSampleData() {
  // This function can be called to populate the app with sample data
  return {
    users: sampleUsers,
    topics: sampleTopics,
    contents: sampleContents,
    questions: sampleQuestions,
    attempts: [],
    studyLogs: [],
    platformSettings: {
      siteName: 'EduPlatform',
      siteDescription: 'A comprehensive learning management system',
      allowRegistration: true,
      requireEmailVerification: false,
      maxAttemptsPerQuestion: 3,
      timeoutMinutes: 30,
      showCorrectAnswer: true,
      showExplanation: true,
      allowReview: true,
      defaultDifficulty: 'B1',
      emailNotifications: true,
      theme: 'light'
    }
  }
}