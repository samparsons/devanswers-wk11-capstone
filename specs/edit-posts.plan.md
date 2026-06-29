# Implementation Plan — Edit Your Own Questions and Answers

Context: builds the feature in [`edit-posts.spec.md`](./edit-posts.spec.md). The backend update
endpoints already exist with author/admin auth; this plan adds edit-tracking + validation and the
entire frontend. Built bottom-up.

## Steps

1. **Models** — `models/Question.js` and `models/Answer.js`: add
   `isEdited: { type: Boolean, default: false }` and `editedAt: { type: Date, default: null }`.

2. **Service: questions** — `services/questionService.js` `updateQuestionService`:
   - Add blank guard: trim `title`/`description`; if either empty → `createAppError(..., 400)`.
   - Include `isEdited: true, editedAt: new Date()` in the `findByIdAndUpdate` payload.
   - Return populated (`author` name, `tags`) so the FE gets a full object.

3. **Service: answers** — `services/answerService.js` `updateAnswerService`:
   - Blank guard on `answerText` → 400.
   - Set `answer.isEdited = true; answer.editedAt = new Date();` before save.
   - Keep the existing populated re-fetch on return.

4. **Backend tests** — extend `tests/integration/questions.test.js` + `answers.test.js`:
   author edit sets `isEdited/editedAt`; non-author → 403; unauthenticated → 401; missing → 404;
   blank → 400; created-but-unedited → `isEdited=false`.

5. **FE service** — `services/questionService.js`: `updateQuestion(id, { title, description, tags }, token)`
   (PUT, uses existing `QUESTION_API.UPDATE`). `services/answerService.js`:
   `updateAnswer(answerId, answerText, token)` (PUT, existing `ANSWER_API.UPDATE`). Return `.data.data`.

6. **Redux** — `reducers/questionSlice.js`: thunks `editQuestion`, `editAnswer`. On `fulfilled`,
   update in place: replace `currentQuestion` (and matching entry in `questions[]`); for answers,
   replace the answer within `currentQuestion.answers`.

7. **Question editor** — `components/Question/QuestionContent.jsx`:
   - Compute `isAuthor = currentQuestion.author?._id === userInfo?.userId`.
   - Render pencil (`FaPencilAlt`/`FaEdit`) only if `isAuthor`.
   - Local `isEditing` toggles an inline form pre-filled with title, description, and tags
     (joined `, `). Save dispatches `editQuestion`; Cancel resets and exits. Client guard blocks
     empty title/description.
   - Render an **"edited"** indicator (e.g. `edited {timeAgo(editedAt)}`) when `isEdited`.

8. **Answer editor** — `components/Answer/AnswerList.jsx`:
   - Per answer, `isAuthor = answer.author?._id === userInfo?.userId`; pencil only if author.
   - Inline `<textarea>` pre-filled with `answerText`; Save → `editAnswer`; Cancel; empty guard.
   - Per-answer "edited" indicator when `isEdited`.

9. **Scope guard** — confirm no edit affordance leaks into `QuestionCard`/`QuestionList`
   (feed/list). Editing lives only on the detail page components.

10. **FE tests** — MSW PUT handlers (return body with `isEdited/editedAt`); add `isEdited/editedAt`
    to `tests/mocks/mockData.js`; unit tests: pencil shows for author, absent for non-author;
    integration thunk test: edit updates state + indicator.

## Test strategy
- Backend integration covers criteria 1–6; FE unit/integration covers 7–10; E2E (Phase 4):
  author edits own question/answer and sees "edited"; non-author sees no pencil.

## Verification
- `npm test` in both packages (incl. pre-existing). Manual: log in as author, edit a question
  and an answer on the detail page, confirm instant update + "edited" label; log in as another
  user, confirm no pencil and that a direct `PUT` is rejected (Postman, 403).

## Risks / rollback
- Forgetting to populate the question return → FE loses author/tags; covered by asserting shape
  in a test. Inline form state bugs (stale prefilled values) → reset local state on open/cancel.
  Rollback = revert the feature branch; the additive model fields are backward-compatible
  (`isEdited` defaults false on existing docs).
