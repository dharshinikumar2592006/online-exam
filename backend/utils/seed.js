const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const { connectDB, disconnectDB } = require('../config/db');
const { DFA_STATES } = require('../dfa/states');

dotenv.config();

const seedData = async () => {
  try {
    console.log('Seeding initial system data...');
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Exam.deleteMany({}),
      ExamSession.deleteMany({})
    ]);

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@exam.com',
      password: 'admin123',
      role: 'admin',
      currentGlobalDfaState: DFA_STATES.S1
    });

    // 2. Create Students
    const student = await User.create({
      name: 'John Student',
      email: 'student@exam.com',
      password: 'student123',
      role: 'student',
      currentGlobalDfaState: DFA_STATES.S1
    });

    const student2 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@exam.com',
      password: 'student123',
      role: 'student',
      currentGlobalDfaState: DFA_STATES.S1
    });

    console.log('Created users:');
    console.log('  Admin:   admin@exam.com   / admin123');
    console.log('  Student: student@exam.com / student123');
    console.log('  Student: alice@exam.com   / student123');

    // 3. Create Exam 1: Automata Theory & Formal Languages
    const automataExam = await Exam.create({
      title: 'Automata Theory & Formal Languages Examination',
      description: 'Comprehensive assessment on Deterministic Finite Automata (DFA), Non-deterministic Finite Automata (NFA), Regular Expressions, and Formal Language Grammars.',
      category: 'Theoretical Computer Science',
      durationMinutes: 10,
      passingMarks: 6,
      totalMarks: 10,
      isActive: true,
      createdBy: admin._id,
      instructions: [
        'Each question has exactly one correct choice.',
        'You have 10 minutes to complete the examination.',
        'Anti-cheating monitor is active. 3 tab switches will transition your state to S6 (BLOCKED).',
        'When time expires, the system triggers DFA state S5 (AUTO_SUBMITTED).',
        'You may navigate freely across questions and mark questions for review.'
      ],
      questions: [
        {
          questionText: 'Which 5-tuple formally defines a Deterministic Finite Automaton (DFA)?',
          options: [
            'M = (Q, Sigma, delta, q0, F)',
            'M = (V, Sigma, R, S, P)',
            'M = (Q, Sigma, Gamma, delta, q0, z0, F)',
            'M = (S, A, T, R, gamma)'
          ],
          correctOption: 0,
          marks: 2,
          explanation: 'A formal DFA is defined as a 5-tuple M = (Q, Sigma, delta, q0, F) where Q is a finite set of states, Sigma is the alphabet, delta is the transition function Q x Sigma -> Q, q0 is the initial state, and F is the set of accepting states.'
        },
        {
          questionText: 'In a DFA, what is the output of the transition function delta for any given state q in Q and input symbol a in Sigma?',
          options: [
            'A set of zero or more states in the power set P(Q)',
            'Exactly one unique state in Q',
            'An empty string lambda or epsilon',
            'A pushdown stack alphabet symbol'
          ],
          correctOption: 1,
          marks: 2,
          explanation: 'In a Deterministic Finite Automaton, the transition function is deterministic: delta: Q x Sigma -> Q, meaning for every state and input symbol, there is exactly one designated next state.'
        },
        {
          questionText: 'What is a dead or trap state in finite automata?',
          options: [
            'An accepting final state where the string is accepted immediately',
            'A non-accepting state from which no path leads to any accepting state',
            'The initial start state q0 before reading any input symbols',
            'A state with non-deterministic epsilon transitions'
          ],
          correctOption: 1,
          marks: 2,
          explanation: 'A dead or trap state (like S6 BLOCKED in this examination system) is a non-accepting state where any incoming transition gets trapped, preventing the automaton from reaching an accepting state.'
        },
        {
          questionText: 'Which class of languages is recognized by Deterministic Finite Automata?',
          options: [
            'Context-free languages',
            'Regular languages',
            'Context-sensitive languages',
            'Recursively enumerable languages'
          ],
          correctOption: 1,
          marks: 2,
          explanation: 'According to Kleenes theorem and the Chomsky hierarchy, finite automata (both DFA and NFA) recognize precisely the class of Regular Languages.'
        },
        {
          questionText: 'In this examination systems DFA, which two states represent the final accepting states (F)?',
          options: [
            'S0 (NOT_LOGGED_IN) and S1 (AUTHENTICATED)',
            'S2 (EXAM_ACCESS_GRANTED) and S3 (EXAM_IN_PROGRESS)',
            'S4 (SUBMITTED) and S5 (AUTO_SUBMITTED)',
            'S3 (EXAM_IN_PROGRESS) and S6 (BLOCKED)'
          ],
          correctOption: 2,
          marks: 2,
          explanation: 'In this exam DFA specification, the set of accepting final states F = {S4, S5}, where S4 corresponds to a student-initiated manual submission and S5 corresponds to an automated timeout submission.'
        }
      ]
    });

    // 4. Create Exam 2: Full-Stack Web Development (MERN Stack)
    const webExam = await Exam.create({
      title: 'Full-Stack Web Development & MERN Architecture',
      description: 'Evaluate your knowledge in modern JavaScript, React hooks, Express REST APIs, MongoDB data modeling, and JWT authentication flows.',
      category: 'Software Engineering',
      durationMinutes: 15,
      passingMarks: 6,
      totalMarks: 10,
      isActive: true,
      createdBy: admin._id,
      instructions: [
        'Answer all multiple choice questions.',
        'Keep window maximized during the test.',
        'Anti-tampering verification monitors session integrity.'
      ],
      questions: [
        {
          questionText: 'What is the role of Express.js middleware in a Node.js REST API pipeline?',
          options: [
            'Functions that have access to req, res, and the next middleware function to inspect or mutate requests',
            'A compiler that translates JSX into JavaScript in the browser',
            'A relational database indexing algorithm',
            'A CSS preprocessor for responsive design'
          ],
          correctOption: 0,
          marks: 2,
          explanation: 'Middleware functions execute during the request-response lifecycle, having access to req, res, and next(), ideal for authentication and DFA state verification.'
        },
        {
          questionText: 'Which header is standard for delivering a JSON Web Token (JWT) in authenticated HTTP requests?',
          options: [
            'Content-Type: application/jwt',
            'Authorization: Bearer <token>',
            'X-Authentication-Token: <token>',
            'Accept-Credentials: true'
          ],
          correctOption: 1,
          marks: 2,
          explanation: 'The standard HTTP authorization convention uses the Authorization header with the Bearer scheme.'
        },
        {
          questionText: 'Why is Vite faster than traditional webpack-based bundlers during development?',
          options: [
            'It skips all JavaScript execution and runs native C++',
            'It serves source code over native ESM in the browser, compiling modules on-demand with esbuild',
            'It replaces React with static HTML pages',
            'It bypasses the Node.js runtime'
          ],
          correctOption: 1,
          marks: 2,
          explanation: 'Vite uses native ES modules (ESM) in the browser during dev and pre-bundles dependencies with esbuild, resulting in near-instant hot module replacement (HMR).'
        },
        {
          questionText: 'In MongoDB with Mongoose, what is a Schema Index primarily used for?',
          options: [
            'To encrypt all document fields using AES-256',
            'To speed up document search queries and enforce field uniqueness',
            'To convert documents into SQL relational tables',
            'To send WebSocket notifications to connected clients'
          ],
          correctOption: 1,
          marks: 2,
          explanation: 'Indexes optimize query performance by allowing MongoDB to quickly traverse ordered references rather than performing collection scans.'
        },
        {
          questionText: 'Which React hook is designed to manage side effects such as countdown timers and network subscriptions?',
          options: [
            'useState',
            'useEffect',
            'useMemo',
            'useRef'
          ],
          correctOption: 1,
          marks: 2,
          explanation: 'useEffect handles side effects, timers, intervals, and event listeners in React functional components, including cleanup on unmount.'
        }
      ]
    });

    console.log('Created sample exams:');
    console.log(`  1. ${automataExam.title} (5 Questions, 10 Marks)`);
    console.log(`  2. ${webExam.title} (5 Questions, 10 Marks)`);
    console.log('Seeding completed successfully!');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
