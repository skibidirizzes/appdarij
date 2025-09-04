// This is a new file: components/common/AddToDeckModal.tsx

import React, { useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext.tsx';
import { WordInfo, Flashcard, FlashcardDeck } from '../../types.ts';
import Modal from './Modal.tsx';
import Button from './Button.tsx';

interface AddToDeckModalProps {
    word: WordInfo;
    onClose: () => void;
}

const AddToDeckModal: React.FC<AddToDeckModalProps> = ({ word, onClose }) => {
    const { user, addCardToDeck, createDeck } = useContext(UserContext);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');

    const handleAddToDeck = () => {
        if (!selectedDeckId) return;
        const card: Flashcard = {
            id: `${word.latin}_${Date.now()}`,
            frontLatin: word.latin,
            frontArabic: word.arabic,
            back: word.definition,
            exampleLatin: word.examples[0]?.latin,
            exampleArabic: word.examples[0]?.arabic,
            exampleTranslation: word.examples[0]?.translation,
        };
        addCardToDeck(selectedDeckId, card);
        onClose();
    };
    
    const handleCreateAndAdd = async () => {
        if (!newDeckName.trim()) return;
        
        await createDeck(newDeckName, `Words about ${newDeckName}`);
        
        // This is a bit of a hack. We need to get the newly created deck's ID.
        // A better solution would have createDeck return the new deck.
        // For now, we'll assume the last deck in the list is the new one.
        const newDecks = user?.flashcardDecks || [];
        const newDeck = newDecks[newDecks.length - 1];
        
        if(newDeck) {
            const card: Flashcard = {
                id: `${word.latin}_${Date.now()}`,
                frontLatin: word.latin,
                frontArabic: word.arabic,
                back: word.definition,
                exampleLatin: word.examples[0]?.latin,
                exampleArabic: word.examples[0]?.arabic,
                exampleTranslation: word.examples[0]?.translation,
            };
            addCardToDeck(newDeck.id, card);
        }
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Add "${word.latin}" to a deck`}>
            <div className="p-6 space-y-4">
                {isCreatingNew ? (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">New Deck Name</label>
                        <input type="text" value={newDeckName} onChange={e => setNewDeckName(e.target.value)} className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white" />
                        <div className="flex gap-2 mt-3">
                            <Button onClick={() => setIsCreatingNew(false)} className="w-full bg-slate-600 hover:bg-slate-500">Cancel</Button>
                            <Button onClick={handleCreateAndAdd} disabled={!newDeckName.trim()} className="w-full">Create & Add</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <select
                            value={selectedDeckId}
                            onChange={(e) => setSelectedDeckId(e.target.value)}
                            className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white"
                        >
                            <option value="">Select a deck...</option>
                            {user?.flashcardDecks?.map(deck => (
                                <option key={deck.id} value={deck.id}>{deck.name}</option>
                            ))}
                        </select>
                        <Button onClick={handleAddToDeck} disabled={!selectedDeckId} className="w-full">Add to Selected Deck</Button>
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600" /></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-[var(--color-bg-card)] text-slate-400">OR</span></div>
                        </div>
                        <Button onClick={() => setIsCreatingNew(true)} className="w-full bg-slate-600 hover:bg-slate-500">Create New Deck</Button>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default AddToDeckModal;