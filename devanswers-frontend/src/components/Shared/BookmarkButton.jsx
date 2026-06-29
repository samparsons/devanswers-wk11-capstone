import { Button } from 'react-bootstrap';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { saveQuestion, unsaveQuestion } from '../../reducers/userSlice';

/**
 * Bookmark (save) toggle for a question. Used in the feed (QuestionCard) and on the
 * detail page (QuestionContent). Mirrors VoteButtons: handles the auth guard internally
 * and reflects saved state from the per-user savedQuestionIds in the store.
 */
const BookmarkButton = ({
  questionId,
  variant = 'link',
  className = '',
  iconClassName = '',
  showLabel = false,
}) => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.userInfo);
  const savedQuestionIds = useSelector(
    (state) => state.user.savedQuestionIds,
  );
  const isAuthenticated = !!userInfo;
  const isSaved = (savedQuestionIds || []).includes(questionId);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('You must be logged in to save a question.');
      return;
    }

    if (isSaved) {
      dispatch(unsaveQuestion(questionId));
    } else {
      dispatch(saveQuestion(questionId));
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleToggle}
      className={className}
      aria-pressed={isSaved}
      aria-label={isSaved ? 'Unsave question' : 'Save question'}
      title={isSaved ? 'Unsave question' : 'Save question'}
    >
      {isSaved ? (
        <FaBookmark className={iconClassName} />
      ) : (
        <FaRegBookmark className={iconClassName} />
      )}
      {showLabel && <span className="ms-1">{isSaved ? 'Saved' : 'Save'}</span>}
    </Button>
  );
};

export default BookmarkButton;
