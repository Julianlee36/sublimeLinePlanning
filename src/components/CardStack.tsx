import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers } from 'react-icons/fa';

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
                  filter: 'blur(1.5px)',
                  opacity: 0.4 - i * 0.15,
                  background: getGradient(offset),
                  borderRadius: 24,
                  height: CARD_HEIGHT,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                }}
              />
            ))}
            {/* Top card */}
            <div
              className="absolute left-0 right-0 shadow-xl transition-transform rounded-3xl flex items-center px-6"
              style={{
                top: 0,
                zIndex: 3,
                background: getGradient(0),
                height: CARD_HEIGHT,
                borderRadius: 24,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                color: 'white',
                fontWeight: 700,
                fontSize: 22,
                cursor: 'pointer',
                letterSpacing: 0.2,
              }}
            >
              <FaUsers className="mr-4 text-2xl opacity-80" />
              <span className="truncate text-lg md:text-2xl font-bold tracking-tight">{cards[0].title}</span>
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
            className="flex flex-col gap-5"
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
                whileHover={{ scale: 1.03, boxShadow: '0 12px 32px rgba(0,0,0,0.22)' }}
                whileTap={{ scale: 0.98 }}
                className={`w-full rounded-3xl shadow-xl cursor-pointer transition-all flex items-center px-6 py-4 md:py-6 ${selectedId === card.id ? 'ring-4 ring-white/80' : ''}`}
                style={{
                  background: getGradient(idx),
                  minHeight: CARD_HEIGHT,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 20,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                }}
                onClick={() => handleCardClick(card.id)}
                tabIndex={0}
                role="button"
                aria-label={`Select ${card.title}`}
                onKeyDown={(e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && handleCardClick(card.id)}
              >
                <FaUsers className="mr-4 text-2xl opacity-90" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-lg md:text-2xl font-bold tracking-tight">{card.title}</div>
                  {card.description && (
                    <div className="text-sm font-normal opacity-90 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{card.description}</div>
                  )}
                </div>
                <span className="ml-4 text-2xl opacity-90">{selectedId === card.id ? '✔' : ''}</span>
              </motion.div>
            ))}
            {/* Collapse button */}
            <button
              className="mt-2 w-full rounded-2xl px-6 py-3 font-semibold bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg hover:from-gray-800 hover:to-black transition text-lg"
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