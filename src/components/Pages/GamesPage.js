'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';

// ==================== TRUTH OR DARE ====================
const TRUTHS = [
    "What's the most embarrassing thing you've ever done?",
    "Have you ever had a crush on a friend's partner?",
    "What's the biggest lie you've ever told?",
    "What's your most controversial opinion?",
    "Have you ever stalked someone on social media?",
    "What's the weirdest dream you've ever had?",
    "What's the most childish thing you still do?",
    "Have you ever pretended to be sick to skip something?",
    "What's your guilty pleasure that nobody knows about?",
    "If you could read anyone's mind, whose would you read?",
    "What's the most embarrassing thing in your search history?",
    "Have you ever sent a text to the wrong person?",
    "What's the craziest thing you've done for love?",
    "What's the most expensive thing you've broken?",
    "Have you ever lied during a job interview?",
    "What's your biggest fear that you've never told anyone?",
    "Have you ever cheated on a test?",
    "What's the most awkward date you've been on?",
    "What's something you do when nobody's watching?",
    "If you had to delete one app, which would it be?"
];

const DARES = [
    "Post an embarrassing selfie in the chat",
    "Type with your eyes closed for the next 2 messages",
    "Send a voice message singing your favorite song",
    "Change your display name to something silly for 10 minutes",
    "Share the last photo in your gallery",
    "Type everything in CAPS for the next 5 messages",
    "Share your most recent emoji combination",
    "Send a poem about the person above you",
    "Use only movie quotes for the next 3 messages",
    "Share your favorite meme",
    "Let the group choose your profile name for 1 hour",
    "Describe your day using only emojis",
    "Share a fun fact nobody would guess about you",
    "Type your next message backwards",
    "Share the last song you listened to"
];

function TruthOrDare() {
    const [result, setResult] = useState(null);
    const [spinning, setSpinning] = useState(false);

    const spin = (type) => {
        setSpinning(true);
        const pool = type === 'truth' ? TRUTHS : DARES;
        setTimeout(() => {
            setResult({ type, text: pool[Math.floor(Math.random() * pool.length)] });
            setSpinning(false);
        }, 1000);
    };

    return (
        <div className="text-center">
            <div className="mb-6">
                <div className="text-6xl mb-4 animate-bounce-in">{result?.type === 'truth' ? '🤔' : result?.type === 'dare' ? '😈' : '🎯'}</div>
                {result && !spinning && (
                    <div className="glass rounded-2xl p-5 mb-6 animate-slide-up">
                        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: result.type === 'truth' ? '#3b82f6' : '#ef4444' }}>
                            {result.type}
                        </div>
                        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{result.text}</p>
                    </div>
                )}
                {spinning && (
                    <div className="flex justify-center py-8"><div className="w-10 h-10 rounded-full border-3 border-[var(--accent)] border-t-transparent animate-spin" /></div>
                )}
            </div>
            <div className="flex gap-3 justify-center">
                <button onClick={() => spin('truth')} disabled={spinning} className="px-8 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                    🔵 Truth
                </button>
                <button onClick={() => spin('dare')} disabled={spinning} className="px-8 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                    🔴 Dare
                </button>
            </div>
        </div>
    );
}

// ==================== WOULD YOU RATHER ====================
const WOULD_YOU_RATHER = [
    ["Be able to fly", "Be able to read minds"],
    ["Live without music", "Live without movies"],
    ["Have unlimited money", "Have unlimited time"],
    ["Be famous but alone", "Be unknown but have great friends"],
    ["Travel to the past", "Travel to the future"],
    ["Always speak the truth", "Always lie"],
    ["Have super strength", "Have super speed"],
    ["Live in the mountains", "Live on a beach"],
    ["Never use social media again", "Never watch TV again"],
    ["Be able to talk to animals", "Speak every human language"],
    ["Have free WiFi everywhere", "Have free food everywhere"],
    ["Be the funniest person alive", "Be the smartest person alive"],
    ["Live without AC", "Live without heating"],
    ["Have 3 wishes now", "Have 1 wish granted every year"],
    ["Know when you'll die", "Know how you'll die"],
];

function WouldYouRather() {
    const [question, setQuestion] = useState(null);
    const [chosen, setChosen] = useState(null);
    const [votes, setVotes] = useState([0, 0]);

    const nextQuestion = () => {
        setQuestion(WOULD_YOU_RATHER[Math.floor(Math.random() * WOULD_YOU_RATHER.length)]);
        setChosen(null);
        setVotes([Math.floor(Math.random() * 60) + 20, Math.floor(Math.random() * 60) + 20]);
    };

    useEffect(() => { nextQuestion(); }, []);

    const choose = (idx) => {
        setChosen(idx);
        setVotes(prev => {
            const newVotes = [...prev];
            newVotes[idx] += 1;
            return newVotes;
        });
    };

    const totalVotes = votes[0] + votes[1];

    return (
        <div className="text-center">
            <div className="text-5xl mb-6 animate-bounce-in">🤷</div>
            {question && (
                <div className="space-y-3 mb-6">
                    {question.map((option, i) => (
                        <button key={i} onClick={() => !chosen && choose(i)} disabled={chosen !== null}
                            className={`w-full p-4 rounded-xl text-left transition-all duration-300 relative overflow-hidden ${chosen === i ? 'ring-2 ring-[var(--accent)]' : ''}`}
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                            {chosen !== null && (
                                <div className="absolute inset-0 opacity-20 transition-all duration-700"
                                    style={{ background: i === 0 ? '#3b82f6' : '#ef4444', width: `${(votes[i] / totalVotes) * 100}%` }} />
                            )}
                            <div className="relative z-10 flex items-center justify-between">
                                <span className="font-semibold">{option}</span>
                                {chosen !== null && (
                                    <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                                        {Math.round((votes[i] / totalVotes) * 100)}%
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
            <button onClick={nextQuestion} className="btn-glow px-6 py-2.5 rounded-xl text-sm font-semibold">
                Next Question →
            </button>
        </div>
    );
}

// ==================== TRIVIA QUIZ ====================
const TRIVIA = [
    { q: "What is the capital of Australia?", options: ["Sydney", "Canberra", "Melbourne", "Brisbane"], answer: 1 },
    { q: "How many hearts does an octopus have?", options: ["1", "2", "3", "4"], answer: 2 },
    { q: "What year was the first iPhone released?", options: ["2005", "2006", "2007", "2008"], answer: 2 },
    { q: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], answer: 1 },
    { q: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], answer: 2 },
    { q: "In which country was chess invented?", options: ["China", "India", "Persia", "Egypt"], answer: 1 },
    { q: "How many bones do humans have?", options: ["186", "196", "206", "216"], answer: 2 },
    { q: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], answer: 1 },
    { q: "Which gas makes up most of Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: 1 },
    { q: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], answer: 2 },
    { q: "What is the largest ocean?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], answer: 2 },
    { q: "How many continents are there?", options: ["5", "6", "7", "8"], answer: 2 },
    { q: "Which element has the symbol 'Au'?", options: ["Silver", "Gold", "Aluminum", "Argon"], answer: 1 },
    { q: "What is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: 1 },
    { q: "Who painted the Mona Lisa?", options: ["Michelangelo", "Da Vinci", "Raphael", "Picasso"], answer: 1 },
];

function TriviaQuiz() {
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [questions] = useState(() => [...TRIVIA].sort(() => Math.random() - 0.5).slice(0, 10));

    const handleAnswer = (idx) => {
        if (selected !== null) return;
        setSelected(idx);
        if (idx === questions[qIndex].answer) setScore(s => s + 1);
        setTimeout(() => {
            if (qIndex + 1 >= questions.length) { setGameOver(true); }
            else { setQIndex(i => i + 1); setSelected(null); }
        }, 1500);
    };

    const restart = () => { setQIndex(0); setScore(0); setSelected(null); setGameOver(false); };

    if (gameOver) {
        return (
            <div className="text-center animate-bounce-in">
                <div className="text-6xl mb-4">{score >= 8 ? '🏆' : score >= 5 ? '👏' : '😅'}</div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Quiz Complete!</h3>
                <p className="text-lg mb-6" style={{ color: 'var(--accent)' }}>You scored {score}/{questions.length}</p>
                <button onClick={restart} className="btn-glow px-8 py-3 rounded-xl font-semibold">Play Again</button>
            </div>
        );
    }

    const q = questions[qIndex];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Q {qIndex + 1}/{questions.length}</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent)' }}>Score: {score}</span>
            </div>
            <h3 className="text-lg font-bold mb-5" style={{ color: 'var(--text-primary)' }}>{q.q}</h3>
            <div className="space-y-3">
                {q.options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                        className={`w-full p-3.5 rounded-xl text-left text-sm font-medium transition-all duration-200 ${selected === i ? (i === q.answer ? 'ring-2 ring-green-500 bg-green-500/20' : 'ring-2 ring-red-500 bg-red-500/20') : selected !== null && i === q.answer ? 'ring-2 ring-green-500 bg-green-500/20' : 'hover:scale-[1.02]'}`}
                        style={{ background: selected === null ? 'var(--bg-tertiary)' : undefined, color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ==================== EMOJI GUESS ====================
const EMOJI_PUZZLES = [
    { emojis: "🦁👑", answer: "lion king", hint: "Disney movie" },
    { emojis: "🕷️🧑", answer: "spiderman", hint: "Superhero" },
    { emojis: "❄️👸", answer: "frozen", hint: "Disney movie" },
    { emojis: "🧙‍♂️💍", answer: "lord of the rings", hint: "Fantasy epic" },
    { emojis: "🦇🧑", answer: "batman", hint: "Dark superhero" },
    { emojis: "🌊🏄", answer: "surfing", hint: "Water sport" },
    { emojis: "🍕🐢", answer: "ninja turtles", hint: "Cartoon heroes" },
    { emojis: "👻💀🎃", answer: "halloween", hint: "Holiday" },
    { emojis: "🎅🎄", answer: "christmas", hint: "Holiday" },
    { emojis: "🏀🏆", answer: "nba", hint: "Sports league" },
    { emojis: "☕📖", answer: "reading", hint: "Relaxing activity" },
    { emojis: "🎸🤘", answer: "rock music", hint: "Music genre" },
    { emojis: "🚀🌙", answer: "moon landing", hint: "Historic event" },
    { emojis: "🎭😂😢", answer: "drama", hint: "Movie/theater genre" },
    { emojis: "🧟‍♂️🌎", answer: "world war z", hint: "Zombie movie" },
];

function EmojiGuess() {
    const [puzzleIdx, setPuzzleIdx] = useState(0);
    const [guess, setGuess] = useState('');
    const [showHint, setShowHint] = useState(false);
    const [correct, setCorrect] = useState(null);
    const [score, setScore] = useState(0);
    const [puzzles] = useState(() => [...EMOJI_PUZZLES].sort(() => Math.random() - 0.5));

    const checkGuess = () => {
        const isCorrect = guess.toLowerCase().trim() === puzzles[puzzleIdx].answer;
        setCorrect(isCorrect);
        if (isCorrect) setScore(s => s + 1);
        setTimeout(() => {
            if (puzzleIdx + 1 < puzzles.length) {
                setPuzzleIdx(i => i + 1);
                setGuess('');
                setCorrect(null);
                setShowHint(false);
            }
        }, 1500);
    };

    const puzzle = puzzles[puzzleIdx];

    return (
        <div className="text-center">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Puzzle {puzzleIdx + 1}/{puzzles.length}</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent)' }}>Score: {score}</span>
            </div>
            <div className="text-6xl mb-4 animate-bounce-in">{puzzle.emojis}</div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Guess what these emojis represent!</p>
            {showHint && <p className="text-sm mb-3 px-3 py-1.5 rounded-lg inline-block" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent)' }}>💡 Hint: {puzzle.hint}</p>}
            {correct !== null && (
                <div className={`mb-4 text-sm font-bold ${correct ? 'text-green-400' : 'text-red-400'}`}>
                    {correct ? '✅ Correct!' : `❌ The answer was: ${puzzle.answer}`}
                </div>
            )}
            <div className="flex gap-2 mb-3">
                <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkGuess()}
                    placeholder="Your guess..." disabled={correct !== null}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm"
                    style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <button onClick={checkGuess} disabled={!guess.trim() || correct !== null} className="btn-glow px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
                    Check
                </button>
            </div>
            {!showHint && correct === null && (
                <button onClick={() => setShowHint(true)} className="text-xs" style={{ color: 'var(--text-muted)' }}>Need a hint?</button>
            )}
        </div>
    );
}

// ==================== GAMES HUB ====================
const GAMES = [
    { id: 'truth-or-dare', name: 'Truth or Dare', icon: '🎯', desc: 'Spill the truth or take a dare!', color: '#8b5cf6', Component: TruthOrDare },
    { id: 'would-you-rather', name: 'Would You Rather', icon: '🤷', desc: 'Choose between two dilemmas', color: '#3b82f6', Component: WouldYouRather },
    { id: 'trivia', name: 'Trivia Quiz', icon: '🧠', desc: '10 brain-teasing questions', color: '#10b981', Component: TriviaQuiz },
    { id: 'emoji-guess', name: 'Emoji Guess', icon: '😜', desc: 'Guess the word from emojis', color: '#f59e0b', Component: EmojiGuess },
];

export default function GamesPage() {
    const [activeGame, setActiveGame] = useState(null);
    const { user } = useSocket();

    if (activeGame) {
        const game = GAMES.find(g => g.id === activeGame);
        return (
            <div className="h-full overflow-y-auto pb-20 md:pb-4">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    {/* Back Button */}
                    <button onClick={() => setActiveGame(null)}
                        className="flex items-center gap-2 text-sm font-medium mb-6 hover:text-[var(--accent)] transition-colors"
                        style={{ color: 'var(--text-secondary)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        Back to Games
                    </button>

                    <div className="text-center mb-6">
                        <span className="text-4xl">{game.icon}</span>
                        <h2 className="font-display font-bold text-2xl mt-2" style={{ color: 'var(--text-primary)' }}>{game.name}</h2>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <game.Component />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto pb-20 md:pb-4">
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="font-display font-bold text-3xl gradient-text mb-2">Games</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Play fun games while you chat!</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {GAMES.map((game, i) => (
                        <button key={game.id} onClick={() => setActiveGame(game.id)}
                            className="glass rounded-2xl p-6 text-left group hover:scale-[1.02] transition-all duration-300 animate-slide-up"
                            style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="flex items-start gap-4">
                                <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{game.icon}</div>
                                <div>
                                    <h3 className="font-display font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{game.name}</h3>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{game.desc}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                                Play Now →
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
