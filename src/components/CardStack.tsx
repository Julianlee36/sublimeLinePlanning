import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardData {
  id: string;
  title: string;
  description?: string;
}

interface CardStackProps {
  cards: CardData[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}

const gradients = [
  'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', // blue
  'linear-gradient(135deg, #34d399 0%, #10b981 100%)', // green
  'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', // purple
  'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)', // pink
  'linear-gradient(135deg, #fbbf24 0%, #f59e42 100%)', // yellow/orange
];

const CARD_HEIGHT = 80;
const CARD_GAP = 16;

export const CardStack: React.FC<CardStackProps> = ({ cards, onSelect, selectedId }) => {
  const [expanded, setExpanded] = useState(false);

  // For mobile tap support
  const handleToggle = () => setExpanded((e) => !e);

  // Card click handler
  const handleCardClick = (id: string) => {
    if (onSelect) onSelect(id);
    setExpanded(false);
  };

  // Only show a max of 5 gradients, repeat if more
  const getGradient = (idx: number) => gradients[idx % gradients.length];

  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      {/* Collapsed state: show top card with stack hint */}
      {!expanded && cards.length > 0 && (
        <div
          className="cursor-pointer"
          onClick={handleToggle}
          tabIndex={0}
          role="button"
          aria-label="Expand card stack"
          onKeyDown={(e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && handleToggle()}
        >
          <div className="relative" style={{ height: CARD_HEIGHT + 12 }}>
            {/* Stack hint: show 2-3 offset cards behind */}
            {[2, 1].map((offset, i) => (
              <div
                key={offset}
                className="absolute left-0 right-0"
                style={{
                  top: offset * 8,
                  zIndex: i,
                  filter: 'blur(1px)',
                  opacity: 0.5 - i * 0.2,
                  background: getGradient(offset),
                  borderRadius: 18,
                  height: CARD_HEIGHT,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                }}
              />
            ))}
            {/* Top card */}
            <div
              className="absolute left-0 right-0 shadow-lg transition-transform rounded-2xl"
              style={{
                top: 0,
                zIndex: 3,
                background: getGradient(0),
                height: CARD_HEIGHT,
                borderRadius: 18,
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 1.5rem',
                color: 'white',
                fontWeight: 700,
                fontSize: 22,
                cursor: 'pointer',
              }}
            >
              {cards[0].title}
              <span className="ml-auto text-lg opacity-80">▼</span>
            </div>
          </div>
        </div>
      )}
      {/* Expanded state: show all cards in a vertical stack */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-4"
            style={{ marginTop: 8 }}
          >
            {cards.map((card, idx) => (
              <motion.div
                key={card.id}
                layoutId={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{
                  delay: idx * 0.07,
                  duration: 0.38,
                  ease: 'easeOut',
                }}
                whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-2xl shadow-lg cursor-pointer transition-all ${selectedId === card.id ? 'ring-4 ring-blue-400' : ''}`}
                style={{
                  background: getGradient(idx),
                  height: CARD_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 1.5rem',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 20,
                  marginBottom: idx === cards.length - 1 ? 0 : CARD_GAP,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                }}
                onClick={() => handleCardClick(card.id)}
                tabIndex={0}
                role="button"
                aria-label={`Select ${card.title}`}
                onKeyDown={(e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && handleCardClick(card.id)}
              >
                <div>
                  {card.title}
                  {card.description && (
                    <div className="text-sm font-normal opacity-80 mt-1">{card.description}</div>
                  )}
                </div>
                <span className="ml-auto text-lg opacity-80">{selectedId === card.id ? '✔' : ''}</span>
              </motion.div>
            ))}
            {/* Collapse button */}
            <button
              className="mt-2 text-white bg-gray-700 bg-opacity-80 rounded-xl px-4 py-2 font-semibold hover:bg-gray-800 transition"
              onClick={handleToggle}
              tabIndex={0}
            >
              Collapse ▲
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardStack; 