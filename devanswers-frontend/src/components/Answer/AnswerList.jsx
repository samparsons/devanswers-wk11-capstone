import { useState } from 'react';
import { Card, Row, Col, Button, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaUser, FaClock, FaPencilAlt } from 'react-icons/fa';
import { voteAnswer, editAnswer } from '../../reducers/questionSlice';
import { formatDate, getRelativeTime } from '../../utils/timeFormat';
import VoteButtons from '../Shared/VoteButtons';
import { summarizeAnswers } from '../../services/aiService';
import './AnswerList.css';

const AnswerList = ({ answers, question }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.userInfo);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);

  // Inline answer editing: only one answer is edited at a time.
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState('');

  const startEditing = (answer) => {
    setEditingId(answer._id);
    setEditText(answer.answerText);
    setEditError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditError('');
  };

  const handleSaveEdit = async (answerId) => {
    if (!editText.trim()) {
      setEditError('Answer cannot be empty.');
      return;
    }
    try {
      await dispatch(editAnswer({ answerId, answerText: editText.trim() })).unwrap();
      setEditingId(null);
    } catch (err) {
      setEditError(typeof err === 'string' ? err : 'Failed to save changes.');
    }
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    try {
      const data = await summarizeAnswers(question?.title, question?.description, answers, userInfo?.token);
      setSummary(data.summary);
      setSummaryVisible(true);
    } catch (err) {
      alert('Failed to summarize answers. Please try again.');
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <Card className="alist-card">
      <Card.Body className="p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0 alist-title">
            {answers?.length || 0} {answers?.length === 1 ? 'Answer' : 'Answers'}
          </h4>
          {answers?.length >= 3 && !summaryVisible && !!userInfo && (
            <Button
              size="sm"
              variant="outline-secondary"
              className="alist-summarize-btn"
              onClick={handleSummarize}
              disabled={summaryLoading}
            >
              {summaryLoading ? 'Summarizing...' : 'Summarize Answers'}
            </Button>
          )}
        </div>

        {summaryVisible && summary && (
          <div className="alist-summary-banner mb-3">
            <div className="alist-summary-header">
              <span className="alist-summary-label">AI Summary</span>
              <Button
                size="sm"
                variant="link"
                className="alist-summary-dismiss"
                onClick={() => setSummaryVisible(false)}
              >
                Dismiss
              </Button>
            </div>
            <p className="alist-summary-text mb-0">{summary}</p>
          </div>
        )}

        {answers && answers.length > 0 ? (
          answers.map((answer) => (
            <Card
              key={answer._id}
              className="mb-1 alist-answer-card"
            >
              <Card.Body className="p-2">
                <Row>
                  {/* Voting Controls */}
                  <Col xs="auto" className="d-flex flex-column align-items-center align-self-start pe-3">
                    <VoteButtons
                      voteCount={answer.voteCount}
                      authorId={answer.author?._id}
                      onVote={(voteType) => dispatch(voteAnswer({ answer, voteType }))}
                      variant="outline-secondary"
                      upClassName="alist-vote-btn alist-vote-btn-up"
                      downClassName="alist-vote-btn alist-vote-btn-down"
                      countClassName="alist-vote-count"
                      upIconClassName="alist-icon-up"
                      downIconClassName="alist-icon-down"
                      itemType="answer"
                    />
                  </Col>

                  {/* Answer Content */}
                  <Col>
                    {editingId === answer._id ? (
                      <Form
                        className="alist-edit-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveEdit(answer._id);
                        }}
                      >
                        {editError && (
                          <div className="text-danger mb-2">{editError}</div>
                        )}
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="mb-2"
                        />
                        <div className="d-flex gap-2">
                          <Button type="submit" size="sm" variant="primary">
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline-secondary"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </Button>
                        </div>
                      </Form>
                    ) : (
                      <>
                        <div className="mb-2 alist-content">
                          {answer.answerText}
                        </div>
                        <div className="mt-2 d-flex align-items-center gap-2 alist-meta">
                          <FaUser className="alist-icon-sm" />
                          <span>Answered by </span>
                          <strong className="alist-author">{answer.author?.name}</strong>
                          {answer.createdAt && (
                            <>
                              <span className="mx-2">•</span>
                              <FaClock className="alist-icon-sm" />
                              <span>{formatDate(answer.createdAt)}</span>
                            </>
                          )}
                          {answer.isEdited && (
                            <span className="alist-edited-indicator">
                              <span className="mx-2">•</span>
                              edited {getRelativeTime(answer.editedAt)}
                            </span>
                          )}
                          {!!userInfo && answer.author?._id === userInfo.userId && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 ms-2 alist-edit-btn"
                              onClick={() => startEditing(answer)}
                              aria-label="Edit answer"
                              title="Edit answer"
                            >
                              <FaPencilAlt />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="mb-0 alist-meta">No answers yet. Be the first to answer!</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default AnswerList;
