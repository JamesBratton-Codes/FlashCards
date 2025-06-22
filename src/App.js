import React, { useReducer, useEffect } from 'react';
import Flashcard from './components/Flashcard';
import { parseMarkdown } from './utils/markdownParser';
import axios from 'axios';

const initialState = {
  flashcards: [],
  knownCards: [],
  currentCard: null,
  file: null,
  loading: false,
  error: "",
  apiKey: "",
  notes: "",
  isFormatting: false,
  isFlipped: false,
  originalDeck: [],
  firstTryCorrectCount: 0,
  retriedCardIds: new Set(),
  sessionHistory: [],
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'START_FILE_LOAD':
      return { ...state, file: action.payload, loading: true, error: "", flashcards: [], currentCard: null, knownCards: [] };
    case 'FILE_LOAD_SUCCESS':
      return { ...state, notes: action.payload, loading: false };
    case 'FILE_LOAD_FAILURE':
      return { ...state, error: "Failed to read file.", loading: false };
    case 'START_FORMATTING':
      return { ...state, isFormatting: true, error: "" };
    case 'FORMAT_SUCCESS':
      const { parsedCards } = action.payload;
      return {
        ...state,
        originalDeck: parsedCards,
        flashcards: parsedCards,
        currentCard: parsedCards[0] || null,
        notes: '',
        isFlipped: false,
        knownCards: [],
        firstTryCorrectCount: 0,
        retriedCardIds: new Set(),
        sessionHistory: [],
        isFormatting: false,
      };
    case 'FORMAT_FAILURE':
      return { ...state, error: action.payload, isFormatting: false };
    case 'FLIP_CARD':
      return { ...state, isFlipped: !state.isFlipped && true };
    case 'THUMBS_UP':
      const newFirstTryCount = state.retriedCardIds.has(state.currentCard.id) ? state.firstTryCorrectCount : state.firstTryCorrectCount + 1;
      const newKnownCards = [...state.knownCards, state.currentCard];
      const remainingCardsUp = state.flashcards.filter(card => card.id !== state.currentCard.id);
      return {
        ...state,
        firstTryCorrectCount: newFirstTryCount,
        knownCards: newKnownCards,
        flashcards: remainingCardsUp,
        currentCard: remainingCardsUp[0] || null,
        isFlipped: false,
      };
    case 'THUMBS_DOWN':
      const newRetriedIds = new Set(state.retriedCardIds).add(state.currentCard.id);
      const remainingCardsDown = state.flashcards.filter(card => card.id !== state.currentCard.id);
      const newDeck = [...remainingCardsDown, state.currentCard];
      return {
        ...state,
        retriedCardIds: newRetriedIds,
        flashcards: newDeck,
        currentCard: newDeck[0] || null,
        isFlipped: false,
      };
    case 'RESTART_DECK':
      const accuracy = state.originalDeck.length > 0 ? ((state.firstTryCorrectCount / state.originalDeck.length) * 100) : 0;
      const newHistory = [...state.sessionHistory, { attempt: state.sessionHistory.length + 1, accuracy: accuracy.toFixed(0) }];
      return {
        ...state,
        sessionHistory: newHistory,
        flashcards: state.originalDeck,
        knownCards: [],
        currentCard: state.originalDeck[0] || null,
        error: "",
        isFlipped: false,
        firstTryCorrectCount: 0,
        retriedCardIds: new Set(),
      };
    case 'CREATE_NEW_DECK':
      return { ...initialState, apiKey: state.apiKey };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const {
    flashcards, knownCards, currentCard, file, loading, error, apiKey, notes,
    isFormatting, isFlipped, originalDeck, firstTryCorrectCount, sessionHistory
  } = state;

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gpt-api-key');
    if (storedApiKey) {
      dispatch({ type: 'SET_STATE', payload: { apiKey: storedApiKey } });
    }
  }, []);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => dispatch({ type: 'FILE_LOAD_SUCCESS', payload: e.target.result });
    reader.onerror = () => dispatch({ type: 'FILE_LOAD_FAILURE' });
    reader.readAsText(file);
  }, [file]);

  const handleFileChange = (e) => {
    dispatch({ type: 'START_FILE_LOAD', payload: e.target.files[0] });
  };

  const handleApiKeyChange = (e) => {
    const newApiKey = e.target.value;
    localStorage.setItem('gpt-api-key', newApiKey);
    dispatch({ type: 'SET_STATE', payload: { apiKey: newApiKey } });
  };

  const handleNotesChange = (e) => {
    dispatch({ type: 'SET_STATE', payload: { notes: e.target.value } });
  };

  const handleFormatWithAI = async () => {
    if (!apiKey) return dispatch({ type: 'FORMAT_FAILURE', payload: "Please enter your API key." });
    if (!notes) return dispatch({ type: 'FORMAT_FAILURE', payload: "Please enter some notes to format." });
    
    dispatch({ type: 'START_FORMATTING' });

    const prompt = `You are an intelligent assistant that creates flashcards. Take the following notes and convert them into a series of flashcards. Each flashcard must be in the format: Q: [Your Question Here]\nA: [Your Answer Here]\n\nEnsure each Q: and A: pair is separated by a blank line. Do not include any other text or explanation in your response. Notes:\n---\n${notes}`;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      }, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      });

      const formattedContent = response.data.choices[0].message.content.trim();
      const parsedCards = parseMarkdown(formattedContent);
      
      if (parsedCards.length === 0) {
        dispatch({ type: 'FORMAT_FAILURE', payload: "The AI couldn't format the notes into flashcards. Please check the notes or try again." });
      } else {
        dispatch({ type: 'FORMAT_SUCCESS', payload: { parsedCards } });
      }
    } catch (err) {
      console.error(err);
      dispatch({ type: 'FORMAT_FAILURE', payload: "Failed to connect to the AI service. Check your API key and network connection." });
    }
  };

  return (
    <div className="App">
      <h1>Flashcard App</h1>

      {originalDeck.length > 0 && !loading ? (
        <div className="flashcard-view">
          {error && <div style={{ color: 'red', margin: '1em' }}>{error}</div>}
          
          {currentCard && !error ? (
            <>
              <Flashcard card={currentCard} isFlipped={isFlipped} onFlip={() => dispatch({ type: 'FLIP_CARD' })} />
              
              {isFlipped && (
                <div>
                  <button onClick={() => dispatch({ type: 'THUMBS_UP' })}>👍 I knew it</button>
                  <button onClick={() => dispatch({ type: 'THUMBS_DOWN' })}>👎 Didn't know</button>
                </div>
              )}
            </>
          ) : (
            !error && (
              <div className="deck-finished">
                <h2>Finished!</h2>
                <p>
                  Your Accuracy: 
                  {originalDeck.length > 0 ? 
                    ` ${((firstTryCorrectCount / originalDeck.length) * 100).toFixed(0)}%`
                    : ' N/A'
                  }
                  ({firstTryCorrectCount}/{originalDeck.length})
                </p>

                {sessionHistory.length > 0 && (
                    <div className="session-history">
                        <h4>Previous Attempts</h4>
                        <ul>
                            {sessionHistory.map(session => (
                                <li key={session.attempt}>
                                    Attempt {session.attempt}: {session.accuracy}%
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {((firstTryCorrectCount / originalDeck.length) * 100) >= 90 ? (
                    <div>
                        <p>Excellent work!</p>
                        <button onClick={() => dispatch({ type: 'RESTART_DECK' })}>Try Again</button>
                        <button onClick={() => dispatch({ type: 'CREATE_NEW_DECK' })}>Create New Deck</button>
                    </div>
                ) : (
                    <div>
                        <p>You did good, but not quite there. Try again!</p>
                        <button onClick={() => dispatch({ type: 'RESTART_DECK' })}>Try Again</button>
                    </div>
                )}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="creation-view">
          <div className="ai-formatter">
            <h2>Create Flashcards</h2>
            <div className="api-key-input">
              <input
                type="password"
                placeholder="Enter your GPT API Key"
                value={apiKey}
                onChange={handleApiKeyChange}
                style={{ width: '90%', marginBottom: '10px' }}
              />
            </div>
            <textarea
              placeholder="Paste your notes here..."
              value={notes}
              onChange={handleNotesChange}
              rows="10"
              style={{ width: '90%', marginBottom: '10px' }}
            />
            <div className="upload-section" style={{margin: '1em 0'}}>
                <label htmlFor="file-upload" className="custom-file-upload">
                    Upload Notes File
                </label>
                <input id="file-upload" type="file" accept=".md,.txt" onChange={handleFileChange} style={{display: 'none'}} />
                {file && <span style={{marginLeft: '10px'}}>{file.name}</span>}
            </div>
            <button onClick={handleFormatWithAI} disabled={isFormatting || loading}>
              {isFormatting ? 'Formatting...' : (loading ? 'Loading File...' : 'Run')}
            </button>
          </div>
          {loading && <div>Loading...</div>}
          {error && <div style={{ color: 'red', margin: '1em' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

export default App; 