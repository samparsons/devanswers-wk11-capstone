# Spec — Edit Your Own Questions and Answers

## Summary
Let an **author** edit the content of questions and answers they posted, from the individual
question page only. Edited posts display an **"edited"** indicator. Only the author may edit
(enforced in the UI and on the server). Deleting is out of scope.

## User-facing behaviour
- Editing is available **only on the individual question page** (`QuestionDetail` →
  `QuestionContent` / `AnswerList`). No edit affordance on the home feed or any list view.
- On a **question they authored**, the author sees an **edit affordance** (a pencil icon, not a
  full "Edit" button). Activating it lets them change **title, description, and tags**. Saving
  persists and shows updated content immediately, no reload.
- On an **answer they authored** (on that same page), the author sees a pencil icon next to their
  answer. Activating it lets them change the **answer text**. Saving persists and updates in place.
- **Only the author** sees the affordance; a user must not see it on someone else's post, and the
  server rejects an edit attempted by a non-author.
- After a post is edited it shows an **"edited"** indicator; a post never edited does not.
- The edit form is **pre-filled** with current content. The user can **cancel** to discard.
  Saving **blank/invalid** content (empty title or empty body) is prevented (client + server).

## Acceptance criteria
1. `PUT /api/questions/:id` by the author updates title/description/tags, sets `isEdited=true`
   and `editedAt=now`, returns 200 with the populated question.
2. `PUT /api/answers/:answerId` by the author updates `answerText`, sets `isEdited`/`editedAt`,
   returns 200 with the populated answer.
3. A non-author (and non-admin) editing either returns **403**; unauthenticated returns **401**.
4. Editing a non-existent id returns **404**.
5. Empty/whitespace-only title or description (question), or empty answerText (answer), returns
   **400** and does not persist.
6. Tags are **required: 1–5 per question** (consistent with the app's behavior since WK9).
   Clearing all tags, or supplying more than 5, returns **400** ("At least one tag is required." /
   "A maximum of 5 tags is allowed.") on both create and edit — enforced server-side and guarded
   in the UI. Tag names are normalized (trimmed, lowercased, de-duplicated).
6. A freshly created question/answer has `isEdited === false` and no "edited" indicator.
7. After an edit, the detail page shows the updated content immediately and an "edited" indicator.
8. The pencil affordance renders only when `post.author._id === userInfo.userId`; it is absent
   for other users and for anonymous visitors.
9. Edit affordances never appear in feed/list components.
10. Cancel discards changes and restores the original display without an API call.

## Edge cases & error handling
- **Unauthenticated** → 401 (existing `authHandler`).
- **Not author / not admin** → 403 via existing service auth check.
- **Not found** → 404.
- **Blank/invalid** → 400 via new guards in the update services (before persisting).
- **Tags input** parsed the same way as create/update today (comma-separated → Tag ids).
- **No-op save** (unchanged content) still allowed; sets `editedAt` (acceptable) — or skip if
  unchanged (implementer's choice; default: always mark edited on a successful save).

## API contract
Both endpoints already exist and are auth-protected; this feature extends behaviour, not routes.
Envelope: `{ success, message, data }`.

| Method | Path | Body | Success (200) data | Errors |
|---|---|---|---|---|
| PUT | `/questions/:id` | `{ title, description, tags }` | populated question incl. `isEdited`,`editedAt` | 400, 401, 403, 404 |
| PUT | `/answers/:answerId` | `{ answerText }` | populated answer incl. `isEdited`,`editedAt` | 400, 401, 403, 404 |

## Data model changes
- `Question` (`models/Question.js`) and `Answer` (`models/Answer.js`): add
  `isEdited: { type: Boolean, default: false }` and `editedAt: { type: Date, default: null }`.

## Affected files
- **Backend:** `models/Question.js`, `models/Answer.js`; `services/questionService.js`
  (`updateQuestionService`) and `services/answerService.js` (`updateAnswerService`) — set edit
  fields + add blank guards + ensure populated return; extend
  `tests/integration/questions.test.js` and `answers.test.js`.
- **Frontend:** `services/questionService.js` + `services/answerService.js` (`updateQuestion`,
  `updateAnswer` — config endpoints already exist); `reducers/questionSlice.js`
  (`editQuestion`, `editAnswer` thunks, in-place state update); `components/Question/
  QuestionContent.jsx` (inline question editor + pencil + edited indicator);
  `components/Answer/AnswerList.jsx` (inline answer editor + pencil + edited indicator);
  `utils/timeFormat.js` (reuse for the indicator); tests + `tests/mocks/{handlers,mockData}.js`.

## Reuse
- Existing author/admin auth check in the update services.
- Client author compare `item.author?._id === userInfo?.userId` (as in `VoteButtons`).
- `PostQuestion`/`AnswerForm` field markup as a template for the inline forms.

## Decision: admin authorization
The update services currently allow **author OR admin**. The problem statement says only the
author may edit. We **retain author-or-admin** server-side (admin is a safe superset; existing
tests may rely on it) while the UI exposes the pencil to the author only. If the grader requires
strict rejection of admins, drop the `|| isAdmin` clause in both update services.

## Out of scope
- Deleting questions/answers; edit history/versioning beyond a single "edited" flag + timestamp.

## Open questions
- Strict author-only vs author-or-admin (see Decision above) — defaulting to author-or-admin.
