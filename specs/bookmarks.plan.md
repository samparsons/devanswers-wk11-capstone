# Implementation Plan — Bookmark Questions

Context: builds the feature defined in [`bookmarks.spec.md`](./bookmarks.spec.md). Nothing for
this feature exists yet. Built bottom-up so each layer is testable before the next.

## Steps

1. **Model** — `models/User.js`: add `savedQuestions: [{ type: ObjectId, ref: "Question" }]`
   (defaults to `[]`).

2. **Service** — `services/bookmarkService.js` (new):
   - `saveQuestionService(questionId, userId)`: 404 if `Question.findById` is null; else
     `User.findByIdAndUpdate(userId, { $addToSet: { savedQuestions: questionId } })`; return
     `{ questionId, isSaved: true }`.
   - `unsaveQuestionService(questionId, userId)`: `$pull`; return `{ questionId, isSaved: false }`.
   - `getSavedQuestionsService(userId)`: load user, populate `savedQuestions` with
     `author`(name) + `tags`, then map to add `answerCount` via `Answer.countDocuments`
     (mirror `getAllQuestionsService`). Filter out nulls (deleted questions).

3. **Controller** — `controllers/bookmarkController.js` (new): `saveQuestion`, `unsaveQuestion`,
   `getSavedQuestions` — thin; read `req.params.id` / `req.user.id`; return
   `{ success, message, data }`.

4. **Routes** — `routes/questions.js`: import controller + `authenticate`; add **before**
   `router.get("/:id", ...)`:
   ```js
   router.get("/saved", authenticate, getSavedQuestions);
   ```
   and with the other protected routes:
   ```js
   router.post("/:id/save", authenticate, saveQuestion);
   router.delete("/:id/save", authenticate, unsaveQuestion);
   ```

5. **Backend tests** — `tests/integration/bookmarks.test.js`: save→appears in GET; unsave→gone;
   idempotent double-save; 401 without token; 404 saving missing question; per-user isolation.
   `tests/unit/services/bookmarkService.test.js`: service logic with mocked models.

6. **FE config** — `config/config.js`: `QUESTION_API.SAVE = (id) => \`/questions/${id}/save\``,
   `QUESTION_API.GET_SAVED = "/questions/saved"`.

7. **FE service** — `services/questionService.js`: `saveQuestion(id, token)` (POST),
   `unsaveQuestion(id, token)` (DELETE), `getSavedQuestions(token)` (GET) — return `.data.data`.

8. **Redux** — `userSlice.js`: add `savedQuestionIds: []`; thunks `fetchSavedQuestions`,
   `saveQuestion`, `unsaveQuestion`. Toggle thunks update `savedQuestionIds` **optimistically**
   in the reducer and revert on `rejected`. `questionSlice.js`: `savedQuestions: []` populated by
   a `fetchSavedQuestions` (for the profile list). (Single thunk can update both via
   cross-slice `extraReducers` or dispatch; keep IDs in user, list in question.)

9. **Component** — `components/Shared/BookmarkButton.jsx`: props `{ questionId }`; `useSelector`
   for `userInfo` + `savedQuestionIds`; render `FaBookmark` (saved) / `FaRegBookmark` (unsaved);
   gate anonymous like `VoteButtons`; onClick dispatch save/unsave.

10. **Placement** — add `<BookmarkButton questionId={...}>` to `QuestionCard.jsx` (stats column)
    and `QuestionContent.jsx` (near vote area).

11. **Profile** — `pages/Profile/Profile.jsx`: dispatch `fetchSavedQuestions` on mount; render a
    "Saved Questions" section with `<QuestionList questions={savedQuestions} />` or the empty state.

12. **App load** — `App.jsx`: if authenticated, dispatch `fetchSavedQuestions` once on mount so
    icons hydrate to saved state.

13. **FE tests** — MSW handlers for save/unsave/saved in `tests/mocks/handlers.js`;
    `BookmarkButton` unit test (saved vs unsaved render, anonymous gating); integration thunk test
    (save → id present); profile empty-state test.

## Test strategy
- Maps to acceptance criteria 1–6 via backend integration; 7–10 via FE unit/integration; full
  flow via E2E (Phase 4): toggle persists across reload, anonymous gated.

## Verification
- `cd devanswers-backend && npm test`; `cd devanswers-frontend && npm test` — all green incl.
  pre-existing suites.
- Manual: run app, log in, bookmark from feed + detail, see it on profile, unsave, reload →
  state persists. Postman: hit the three endpoints with/without token (key in backend `.env`).

## Risks / rollback
- **Route capture** if `/saved` placed after `/:id` → mitigated by step 4 ordering; covered by a
  test that `GET /saved` returns a list, not a single doc / cast error.
- Cross-slice state for saved IDs could drift; keep a single source of truth (`savedQuestionIds`)
  and derive UI from it. Rollback = revert the feature branch; no destructive migrations.
