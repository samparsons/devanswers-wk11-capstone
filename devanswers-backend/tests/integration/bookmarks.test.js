import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import '../setup.js';
import app from '../../src/app.js';
import Question from '../../src/models/Question.js';
import Tag from '../../src/models/Tag.js';
import User from '../../src/models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let userA;
let userB;

beforeAll(async () => {
  userA = await createUserAndLogin('alice');
  userB = await createUserAndLogin('bob');
});

async function createUserAndLogin(handle) {
  const email = `${handle}+${Date.now()}@example.com`;
  const password = 'password123';

  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ name: handle, email, password, isAdmin: false });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return { user: userRes.body.data, token: loginRes.body.data.token };
}

async function createQuestion(author) {
  const tag = await new Tag({ name: `tag-${Date.now()}-${Math.random()}` }).save();
  const question = new Question({
    title: 'How to bookmark questions?',
    description: 'I want to save this for later',
    tags: [tag._id],
    author,
    upvotes: [],
    downvotes: [],
    voteCount: 0,
    views: 0,
  });
  await question.save();
  return question;
}

describe('Bookmarks API', () => {
  beforeEach(async () => {
    await Question.deleteMany({});
    await Tag.deleteMany({});
    // Clear any saved sets between tests
    await User.updateMany({}, { $set: { savedQuestions: [] } });
  });

  it('POST /api/questions/:id/save -> saves a question for the user', async () => {
    const question = await createQuestion(userA.user._id);

    const res = await request(app)
      .post(`/api/questions/${question._id}/save`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ isSaved: true });

    const dbUser = await User.findById(userA.user._id);
    expect(dbUser.savedQuestions.map(String)).toContain(String(question._id));
  });

  it('POST /save is idempotent (no duplicate entries)', async () => {
    const question = await createQuestion(userA.user._id);

    await request(app)
      .post(`/api/questions/${question._id}/save`)
      .set('Authorization', `Bearer ${userA.token}`);
    await request(app)
      .post(`/api/questions/${question._id}/save`)
      .set('Authorization', `Bearer ${userA.token}`);

    const dbUser = await User.findById(userA.user._id);
    const matches = dbUser.savedQuestions.filter(
      (q) => String(q) === String(question._id),
    );
    expect(matches).toHaveLength(1);
  });

  it('GET /api/questions/saved -> returns saved questions shaped like the feed', async () => {
    const question = await createQuestion(userA.user._id);
    await request(app)
      .post(`/api/questions/${question._id}/save`)
      .set('Authorization', `Bearer ${userA.token}`);

    const res = await request(app)
      .get('/api/questions/saved')
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    const saved = res.body.data[0];
    expect(saved._id).toBe(String(question._id));
    expect(saved.author).toHaveProperty('name');
    expect(saved).toHaveProperty('answerCount');
  });

  it('DELETE /api/questions/:id/save -> unsaves a question', async () => {
    const question = await createQuestion(userA.user._id);
    await request(app)
      .post(`/api/questions/${question._id}/save`)
      .set('Authorization', `Bearer ${userA.token}`);

    const res = await request(app)
      .delete(`/api/questions/${question._id}/save`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ isSaved: false });

    const dbUser = await User.findById(userA.user._id);
    expect(dbUser.savedQuestions.map(String)).not.toContain(String(question._id));
  });

  it('saved sets are per-user (isolation)', async () => {
    const question = await createQuestion(userA.user._id);
    await request(app)
      .post(`/api/questions/${question._id}/save`)
      .set('Authorization', `Bearer ${userA.token}`);

    const resB = await request(app)
      .get('/api/questions/saved')
      .set('Authorization', `Bearer ${userB.token}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data).toHaveLength(0);
  });

  it('requires authentication (401 without token)', async () => {
    const question = await createQuestion(userA.user._id);

    const saveRes = await request(app).post(`/api/questions/${question._id}/save`);
    expect(saveRes.status).toBe(401);

    const listRes = await request(app).get('/api/questions/saved');
    expect(listRes.status).toBe(401);
  });

  it('returns 404 when saving a non-existent question', async () => {
    const missingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/questions/${missingId}/save`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
