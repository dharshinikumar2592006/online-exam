const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const { connectDB, disconnectDB } = require('../config/db');
const { DFA_STATES } = require('../dfa/states');
const ExamSession = require('../models/ExamSession');

let server;
let baseUrl;

// Helper to make HTTP requests
const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

test('Full Integration Test: End-to-End DFA Lifecycle & Examination API', async (t) => {
  // Connect to DB first
  await connectDB();
  await ExamSession.deleteMany({});

  // Start server on an ephemeral port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  let studentToken = null;
  let adminToken = null;
  let testExamId = null;

  await t.test('1. System Health Check', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'online');
    assert.ok(res.body.dfaEngine.includes('Deterministic Finite Automata'));
  });

  await t.test('2. DFA Specification Endpoint', async () => {
    const res = await request('/api/dfa/spec');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.formalTuple, 'M = (Q, Sigma, delta, q0, F)');
    assert.equal(res.body.data.initialState, 'NOT_LOGGED_IN');
    assert.deepEqual(res.body.data.acceptingStates, ['SUBMITTED', 'AUTO_SUBMITTED']);
  });

  await t.test('3. Student Login (DFA: S0 -> S1)', async () => {
    const res = await request('/api/auth/login', 'POST', {
      email: 'student@exam.com',
      password: 'student123'
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'student');
    assert.equal(res.body.dfa.currentState, 'AUTHENTICATED');
    studentToken = res.body.token;
  });

  await t.test('4. Admin Login (DFA: S0 -> S1)', async () => {
    const res = await request('/api/auth/login', 'POST', {
      email: 'admin@exam.com',
      password: 'admin123'
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'admin');
    adminToken = res.body.token;
  });

  await t.test('5. Student lists available exams', async () => {
    const res = await request('/api/exams', 'GET', null, studentToken);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 1, 'Should return seeded exams');
    testExamId = res.body.data[0]._id;
  });

  await t.test('6. Student requests exam access (DFA: S1 -> S2)', async () => {
    const res = await request(`/api/dfa/access/${testExamId}`, 'POST', null, studentToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.dfa.previousState, 'AUTHENTICATED');
    assert.equal(res.body.dfa.currentState, 'EXAM_ACCESS_GRANTED');
  });

  await t.test('7. Student starts exam (DFA: S2 -> S3)', async () => {
    const res = await request(`/api/dfa/start/${testExamId}`, 'POST', null, studentToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.dfa.previousState, 'EXAM_ACCESS_GRANTED');
    assert.equal(res.body.dfa.currentState, 'EXAM_IN_PROGRESS');
    assert.ok(res.body.questions.length > 0);
  });

  await t.test('8. Student saves answers (DFA: S3 -> S3 self-loop)', async () => {
    const res = await request(`/api/dfa/answer/${testExamId}`, 'POST', {
      questionIndex: 0,
      selectedOption: 0
    }, studentToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.currentState, 'EXAM_IN_PROGRESS');
  });

  await t.test('9. Student manually submits exam (DFA: S3 -> S4)', async () => {
    const res = await request(`/api/dfa/submit/${testExamId}`, 'POST', null, studentToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.dfa.previousState, 'EXAM_IN_PROGRESS');
    assert.equal(res.body.dfa.currentState, 'SUBMITTED');
    assert.ok(res.body.results.score >= 0);
  });

  await t.test('10. Student retrieves result & DFA audit trail in S4', async () => {
    const res = await request(`/api/dfa/result/${testExamId}`, 'GET', null, studentToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.results.currentState, 'SUBMITTED');
    assert.ok(res.body.dfaAuditTrail.length >= 4, 'Audit trail must record transitions');
  });

  await t.test('11. Illegal transition: cannot answer in state S4', async () => {
    const res = await request(`/api/dfa/answer/${testExamId}`, 'POST', {
      questionIndex: 1,
      selectedOption: 1
    }, studentToken);
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'INVALID_DFA_STATE');
  });

  await t.test('12. Admin overview & DFA statistics', async () => {
    const res = await request('/api/admin/overview', 'GET', null, adminToken);
    assert.equal(res.status, 200);
    assert.ok(res.body.stats.totalStudents >= 2);
    assert.ok(res.body.stats.dfaStateDistribution.SUBMITTED >= 1);
  });

  // Cleanup
  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
});
