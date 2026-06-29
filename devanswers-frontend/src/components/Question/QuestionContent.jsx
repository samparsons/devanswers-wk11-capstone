import { useState } from 'react';
import { Card, Row, Col, Badge, Form, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaUser, FaClock, FaPencilAlt } from 'react-icons/fa';
import { voteQuestion, editQuestion } from '../../reducers/questionSlice';
import { formatDate, getRelativeTime } from '../../utils/timeFormat';
import VoteButtons from '../Shared/VoteButtons';
import BookmarkButton from '../Shared/BookmarkButton';
import './QuestionContent.css';

const QuestionContent = ({ question }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.userInfo);
  const isAuthor = !!userInfo && question.author?._id === userInfo.userId;

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', tags: '' });
  const [error, setError] = useState('');

  const startEditing = () => {
    setForm({
      title: question.title || '',
      description: question.description || '',
      tags: (question.tags || []).map((t) => t.name || t).join(', '),
    });
    setError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError('');
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description cannot be empty.');
      return;
    }
    try {
      await dispatch(
        editQuestion({
          questionId: question._id,
          title: form.title.trim(),
          description: form.description.trim(),
          tags: form.tags,
        }),
      ).unwrap();
      setIsEditing(false);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save changes.');
    }
  };

  return (
    <>
      {/* Question Header */}
      <Card className="mb-4 qcontent-header-card">
        <Card.Body className="p-3 p-sm-4">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <Card.Title as="h2" className="mb-3 qcontent-title">
              {question.title}
            </Card.Title>
            {isAuthor && !isEditing && (
              <Button
                variant="link"
                className="p-0 qcontent-edit-btn"
                onClick={startEditing}
                aria-label="Edit question"
                title="Edit question"
              >
                <FaPencilAlt />
              </Button>
            )}
          </div>
          <div className="d-flex flex-wrap gap-3 gap-sm-4 qcontent-meta">
            <span className="d-flex align-items-center gap-2">
              <FaClock />
              Asked {formatDate(question.createdAt)}
            </span>
            {question.isEdited && (
              <span className="qcontent-edited-indicator">
                edited {getRelativeTime(question.editedAt)}
              </span>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Question Content */}
      <Card className="mb-4 qcontent-body-card">
        <Card.Body className="p-3 p-sm-4">
          <Row>
            {/* Voting Controls */}
            <Col xs="auto" className="d-flex flex-column align-items-center pe-3 pe-sm-4">
              <VoteButtons
                voteCount={question.voteCount}
                authorId={question.author?._id}
                onVote={(voteType) => dispatch(voteQuestion({ question, voteType }))}
                variant="outline-secondary"
                upClassName="mb-2 qcontent-vote-btn"
                downClassName="mt-2 qcontent-vote-btn"
                countClassName="qcontent-vote-count"
                upIconClassName="qcontent-icon-up"
                downIconClassName="qcontent-icon-down"
                itemType="question"
              />
              <BookmarkButton
                questionId={question._id}
                variant="outline-secondary"
                className="mt-3 qcontent-bookmark-btn"
              />
            </Col>

            {/* Main Content */}
            <Col>
              {isEditing ? (
                <Form onSubmit={handleSave} className="qcontent-edit-form">
                  {error && <div className="text-danger mb-2">{error}</div>}
                  <Form.Group className="mb-3" controlId="qedit-title">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="qedit-description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="qedit-tags">
                    <Form.Label>Tags (comma-separated)</Form.Label>
                    <Form.Control
                      type="text"
                      name="tags"
                      value={form.tags}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <div className="d-flex gap-2">
                    <Button type="submit" variant="primary">
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              ) : (
                <>
                  <div className="mb-4 qcontent-description">
                    {question.description}
                  </div>

                  <div className="mb-4">
                    {question.tags?.map((tag) => (
                      <Badge
                        key={tag._id}
                        className="me-2 mb-2 qcontent-tag-badge"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>

                  <div className="d-flex align-items-center gap-2 qcontent-author-row">
                    <FaUser className="qcontent-icon-sm" />
                    <span>Posted by </span>
                    <strong className="qcontent-author-name">
                      {question.author?.name}
                    </strong>
                  </div>
                </>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};

export default QuestionContent;
