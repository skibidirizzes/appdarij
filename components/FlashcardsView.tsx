// This is a new file: components/FlashcardsView.tsx

import React, { useState, useContext, useMemo } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import { FlashcardDeck, Flashcard } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import Modal from './common/Modal.tsx';
import { FlashcardIcon, PencilIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/index.ts';

// Main View Component
const FlashcardsView: React.FC = () => {
    const { user, createDeck, deleteDeck } = useContext(UserContext);
    const { t } = useTranslations();
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);

    if (activeDeck) {
        return <DeckDetailView deck={activeDeck} onBack={() => setActiveDeck(null)} />;
    }
    
    const decks = user?.flashcardDecks || [];

    return (
        <div className="w-full">
            {isCreateModalOpen && <CreateDeckModal onClose={() => setIsCreateModalOpen(false)} />}

            <div className="text-center mb-8">
                <FlashcardIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">Flashcard Decks</h2>
                <p className="text-primary-300 font-semibold mt-2">Create and study your own custom word lists.</p>
            </div>
            
            <div className="text-center mb-6">
                <Button onClick={() => setIsCreateModalOpen(true)}>Create New Deck</Button>
            </div>

            {decks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map(deck => (
                        <Card key={deck.id} className="p-5 flex flex-col justify-between card-lift-hover">
                            <div>
                                <h3 className="text-xl font-bold text-white truncate">{deck.name}</h3>
                                <p className="text-sm text-slate-400 min-h-[40px]">{deck.description}</p>
                            </div>
                            <div className="flex justify-between items-end mt-4">
                                <span className="text-slate-300 font-semibold">{deck.cards.length} Cards</span>
                                <div className="flex gap-2">
                                    <Button onClick={() => deleteDeck(deck.id)} size="sm" className="bg-red-900/50 hover:bg-red-800/60 !p-2"><XCircleIcon className="w-5 h-5"/></Button>
                                    <Button onClick={() => setActiveDeck(deck)} size="sm">Study</Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-8 text-center text-slate-400">
                    <h3 className="text-xl font-bold text-white">No decks yet!</h3>
                    <p className="mt-2">Click "Create New Deck" to start building your first flashcard set.</p>
                </Card>
            )}
        </div>
    );
};

// Deck Detail / Study View
const DeckDetailView: React.FC<{ deck: FlashcardDeck, onBack: () => void }> = ({ deck, onBack }) => {
    const { removeCardFromDeck } = useContext(UserContext);
    const [isStudyMode, setIsStudyMode] = useState(false);

    if (isStudyMode) {
        return <StudyMode deck={deck} onExit={() => setIsStudyMode(false)} />;
    }

    return (
        <div>
             <Button onClick={onBack} size="sm" className="mb-4 bg-slate-600 hover:bg-slate-500">&larr; Back to Decks</Button>
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white">{deck.name}</h2>
                <p className="text-slate-300">{deck.description}</p>
            </div>
            
            <div className="text-center mb-6">
                <Button onClick={() => setIsStudyMode(true)} disabled={deck.cards.length === 0} size="lg">Study This Deck ({deck.cards.length})</Button>
            </div>

            <div className="space-y-3">
                {deck.cards.map(card => (
                    <Card key={card.id} className="p-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-lg text-white">{card.frontLatin} <span className="font-arabic text-slate-400">({card.frontArabic})</span></p>
                            <p className="text-slate-300">{card.back}</p>
                        </div>
                        <Button onClick={() => removeCardFromDeck(deck.id, card.id)} size="sm" className="bg-red-900/50 hover:bg-red-800/60 !p-2"><XCircleIcon className="w-5 h-5"/></Button>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// Study Mode (Flashcard Player)
const StudyMode: React.FC<{ deck: FlashcardDeck, onExit: () => void }> = ({ deck, onExit }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const card = deck.cards[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev + 1) % deck.cards.length);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev - 1 + deck.cards.length) % deck.cards.length);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col p-4">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <h3 className="text-white font-bold">{deck.name}</h3>
                <Button onClick={onExit} size="sm" className="bg-slate-600 hover:bg-slate-500">Exit Study</Button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div 
                    className="w-full max-w-lg h-72 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative bg-[var(--color-bg-card)] border border-[var(--color-border-card)]"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {!isFlipped ? (
                        <div>
                            <p className="font-bold text-4xl text-white">{card.frontLatin}</p>
                            <p className="font-arabic text-4xl text-slate-300 mt-2">{card.frontArabic}</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <p className="font-bold text-3xl text-primary-300">{card.back}</p>
                            {card.exampleLatin && (
                                <div className="mt-4 pt-4 border-t border-slate-700 text-sm">
                                    <p className="text-slate-200">"{card.exampleLatin}"</p>
                                    <p className="text-slate-400 italic">"{card.exampleTranslation}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                 <p className="mt-4 text-slate-400">Card {currentIndex + 1} of {deck.cards.length}</p>
            </div>
            
            <div className="flex-shrink-0 flex justify-center items-center gap-4">
                <Button onClick={handlePrev} className="!p-4"><ChevronLeftIcon className="w-6 h-6"/></Button>
                <Button onClick={() => setIsFlipped(!isFlipped)} className="w-48 justify-center">Flip Card</Button>
                <Button onClick={handleNext} className="!p-4"><ChevronRightIcon className="w-6 h-6"/></Button>
            </div>
        </div>
    );
}

// Create Deck Modal
const CreateDeckModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { createDeck } = useContext(UserContext);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (name.trim()) {
            createDeck(name, description);
            onClose();
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Create New Flashcard Deck">
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Deck Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white" rows={2} />
                </div>
                <Button onClick={handleSubmit} disabled={!name.trim()} className="w-full justify-center">Create Deck</Button>
            </div>
        </Modal>
    );
};


export default FlashcardsView;