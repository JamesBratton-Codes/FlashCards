import React from 'react';

function Flashcard({ card, isFlipped, onFlip }) {
  return (
    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={onFlip}>
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <h2>{card.question}</h2>
        </div>
        <div className="flashcard-back">
          <div dangerouslySetInnerHTML={{ __html: card.answer }} />
        </div>
      </div>
    </div>
  );
}

export default Flashcard; 