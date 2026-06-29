# Spec — Bookmark Questions for Later

## Summary
Let a logged-in user **save (bookmark)** questions they want to return to, toggle that state
from anywhere a question appears, and revisit all saved questions from their **profile**.
Bookmarks are per-user and persist across sessions. Answers cannot be bookmarked (out of scope).

## User-facing behaviour
- Every question — in the list/feed (`QuestionCard`) and on the detail page (`QuestionContent`)
  — shows a **bookmark control**. Its appearance makes the saved state obvious (filled icon =
  saved, outline icon = not saved).
- A logged-in user can save a question and later unsave it; the icon updates **immediately**,
  with no full page reload.
- Bookmarking **requires authentication**. An anonymous visitor cannot save (consistent with
  voting/posting). Attempting it prompts/redirects to login rather than silently failing.
- Saved questions are **per-user**: one user's set never affects another's.
- The profile page has a **"Saved Questions"** section rendered with the existing question-list
  UI (`QuestionList`); from there the user can open a saved question or unsave it.
- When the user has saved nothing, the section shows a friendly **empty state**
  ("No saved questions yet").
- On login / app load with a valid session, the app already knows which questions are saved, so
  bookmark icons render in the correct state right away.

## Acceptance criteria
1. `POST /api/questions/:id/save` with a valid token adds the question to the user's saved set
   and returns 200; calling it again is idempotent (no duplicate).
2. `DELETE /api/questions/:id/save` with a valid token removes it and returns 200; deleting when
   not saved is a no-op 200.
3. `GET /api/questions/saved` returns only the requesting user's saved questions, each shaped
   like the feed (`author`, `tags`, `answerCount`) so `QuestionList` renders them unchanged.
4. All three endpoints return **401** when called without a valid token.
5. `POST /save` on a non-existent question id returns **404**.
6. Saved sets are isolated per user (user A saving does not change user B's `GET /saved`).
7. In the UI, the bookmark icon reflects saved state on the feed and detail page, and toggling
   updates it without reload.
8. The profile "Saved Questions" section lists saved questions via `QuestionList`, supports
   unsave, and shows the empty state when there are none.
9. On app load while authenticated, previously saved questions render as saved without manual action.
10. Anonymous users see the control but are gated to login on click; no save occurs.

## Edge cases & error handling
- **Unauthenticated** → 401 `{ success:false, message }` (existing `authHandler`).
- **Question not found** (save) → 404 via `createAppError("Question not found", 404)`.
- **Double save / double unsave** → idempotent via `$addToSet` / `$pull`.
- **Deleted question still in a saved set** → `GET /saved` simply omits nulls after populate.
- **Optimistic UI**: on API failure the icon reverts to its prior state and surfaces the error.

## API contract
All under `/api`, all require `Authorization: Bearer <token>`. Envelope: `{ success, message, data }`.

| Method | Path | Body | Success (200) data | Errors |
|---|---|---|---|---|
| GET | `/questions/saved` | — | `[ question ]` (author, tags, answerCount) | 401 |
| POST | `/questions/:id/save` | — | `{ questionId, isSaved: true }` | 401, 404 |
| DELETE | `/questions/:id/save` | — | `{ questionId, isSaved: false }` | 401 |

> **Route ordering:** `GET /questions/saved` MUST be registered before `GET /questions/:id`
> in `routes/questions.js`, or `saved` is captured as an `:id`.

## Data model changes
- `User` (`models/User.js`): add
  `savedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", default: [] }]`.
- No change to `Question` (bookmarks are user-centric).

## Affected files
- **Backend:** `models/User.js`; new `services/bookmarkService.js` (or add to `userService.js`);
  new `controllers/bookmarkController.js`; `routes/questions.js`; tests
  `tests/integration/bookmarks.test.js`, `tests/unit/services/bookmarkService.test.js`.
- **Frontend:** `config/config.js` (`QUESTION_API.SAVE`, `QUESTION_API.GET_SAVED`);
  `services/questionService.js` (saveQuestion/unsaveQuestion/getSavedQuestions);
  `reducers/userSlice.js` (`savedQuestionIds` + thunks) and `reducers/questionSlice.js`
  (`savedQuestions` list for profile); new `components/Shared/BookmarkButton.jsx` (mirror
  `VoteButtons.jsx`); `components/Question/QuestionCard.jsx` + `QuestionContent.jsx` (placement);
  `pages/Profile/Profile.jsx` (Saved Questions section); `App.jsx` (fetch on load);
  tests + `tests/mocks/handlers.js`.

## Reuse
- Auth gating pattern from `components/Shared/VoteButtons.jsx`.
- Feed shaping (`answerCount`, populate) from `services/questionService.getAllQuestionsService`.
- Existing list UI `components/Question/QuestionList.jsx` for the profile section.

## Out of scope
- Bookmarking answers; folders/tags/notes on saves; sharing or exporting saved questions.

## Open questions
- None blocking. Endpoint shape chosen to keep `QuestionList` reusable as-is.
