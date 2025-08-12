import { User } from '@/contexts/AuthContext'
import { Topic, Content, Question } from '@/types'

export const seedUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@demo.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Ana Silva',
    email: 'student@demo.com',
    role: 'student',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'João Santos',
    email: 'joao@demo.com',
    role: 'student',
    createdAt: new Date().toISOString()
  }
]

export const seedTopics: Topic[] = [
  {
    id: '1',
    name: 'Present Simple',
    description: 'Learn the basics of present simple tense',
    levelMin: 'A1',
    levelMax: 'A2',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Past Continuous',
    description: 'Master the past continuous tense',
    levelMin: 'A2',
    levelMax: 'B1',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Reading Skills',
    description: 'Improve your reading comprehension',
    levelMin: 'B1',
    levelMax: 'C1',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Listening Skills',
    description: 'Enhance your listening abilities',
    levelMin: 'A2',
    levelMax: 'B2',
    isActive: true,
    createdAt: new Date().toISOString()
  }
]

export const seedContents: Content[] = [
  {
    id: '1',
    topicId: '1',
    title: 'Introduction to Present Simple',
    bodyHtml: '<h3>Present Simple Tense</h3><p>The present simple tense is used to describe habits, routines, and general truths.</p><p><strong>Examples:</strong></p><ul><li>I work every day.</li><li>She likes coffee.</li><li>The sun rises in the east.</li></ul>',
    estimatedTimeMin: 15,
    tags: ['grammar', 'basic'],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    topicId: '2',
    title: 'Past Continuous Formation',
    bodyHtml: '<h3>Past Continuous Tense</h3><p>The past continuous tense describes actions that were ongoing in the past.</p><p><strong>Structure:</strong> Subject + was/were + verb-ing</p><p><strong>Examples:</strong></p><ul><li>I was reading a book.</li><li>They were playing football.</li></ul>',
    estimatedTimeMin: 20,
    tags: ['grammar', 'intermediate'],
    isPublished: true,
    createdAt: new Date().toISOString()
  }
]

export const seedQuestions: Question[] = [
  {
    id: '1',
    topicId: '1',
    title: 'Present Simple - Basic Usage',
    stemHtml: '<p>Choose the correct form of the verb:</p><p>"She _____ to school every day."</p>',
    optionA: 'go',
    optionB: 'goes',
    optionC: 'going',
    optionD: 'went',
    optionE: 'gone',
    correctOption: 'B',
    commentHtml: '<p><strong>Correct Answer: B) goes</strong></p><p>In present simple, we add "-s" or "-es" to the verb when the subject is third person singular (he, she, it).</p><p>Examples: He works, She studies, It runs</p>',
    difficulty: 'A1',
    tags: ['present-simple', 'verb-forms'],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    topicId: '1',
    title: 'Present Simple - Negative Form',
    stemHtml: '<p>Complete the negative sentence:</p><p>"I _____ like vegetables."</p>',
    optionA: "don't",
    optionB: "doesn't",
    optionC: 'not',
    optionD: "didn't",
    optionE: 'never',
    correctOption: 'A',
    commentHtml: '<p><strong>Correct Answer: A) don\'t</strong></p><p>For negative sentences in present simple:</p><ul><li>I/You/We/They + don\'t + base verb</li><li>He/She/It + doesn\'t + base verb</li></ul>',
    difficulty: 'A1',
    tags: ['present-simple', 'negative'],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    topicId: '2',
    title: 'Past Continuous - When to Use',
    stemHtml: '<p>Which sentence correctly uses past continuous?</p>',
    optionA: 'I was go to the store.',
    optionB: 'I was going to the store when it started raining.',
    optionC: 'I went to the store.',
    optionD: 'I will go to the store.',
    optionE: 'I go to the store.',
    correctOption: 'B',
    commentHtml: '<p><strong>Correct Answer: B) I was going to the store when it started raining.</strong></p><p>Past continuous is used for:</p><ul><li>Actions in progress in the past</li><li>Background actions interrupted by another event</li><li>Structure: was/were + verb-ing</li></ul>',
    difficulty: 'A2',
    tags: ['past-continuous', 'usage'],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    topicId: '3',
    title: 'Reading Comprehension - Main Idea',
    stemHtml: '<p>Read the text and choose the main idea:</p><blockquote>"Technology has revolutionized education. Online learning platforms allow students to access courses from anywhere in the world. Virtual classrooms provide interactive experiences that were impossible before."</blockquote>',
    optionA: 'Students can travel the world.',
    optionB: 'Technology has changed how we learn.',
    optionC: 'Virtual classrooms are impossible.',
    optionD: 'Online platforms are expensive.',
    optionE: 'Education is not important.',
    correctOption: 'B',
    commentHtml: '<p><strong>Correct Answer: B) Technology has changed how we learn.</strong></p><p>When identifying the main idea:</p><ul><li>Look for the central topic discussed throughout the text</li><li>Identify what the author wants to communicate</li><li>Avoid details and focus on the overall message</li></ul>',
    difficulty: 'B1',
    tags: ['reading', 'main-idea'],
    isPublished: true,
    createdAt: new Date().toISOString()
  }
]