
import React, { useEffect, useState } from 'react';

interface FloatingEmojisProps {
  isActive: boolean;
}

const FloatingEmojis: React.FC<FloatingEmojisProps> = ({ isActive }) => {
  const [emojis, setEmojis] = useState<Array<{
    id: number;
    emoji: string;
    x: number;
    y: number;
    delay: number;
  }>>([]);

  const emojiList = ['💰', '💸', '🪙', '🌍', '💵', '💶', '💷', '💴'];

  useEffect(() => {
    if (isActive) {
      const newEmojis = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        emoji: emojiList[Math.floor(Math.random() * emojiList.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      }));
      setEmojis(newEmojis);
    } else {
      setEmojis([]);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute text-2xl md:text-4xl animate-bounce"
          style={{
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
            animationDelay: `${emoji.delay}s`,
            animationDuration: '2s'
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
};

export default FloatingEmojis;
