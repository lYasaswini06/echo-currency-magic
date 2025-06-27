
import React from 'react';

interface ConversionResultProps {
  result: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    convertedAmount: number;
    fromSymbol: string;
    toSymbol: string;
  };
  isDarkMode: boolean;
}

const ConversionResult: React.FC<ConversionResultProps> = ({ result, isDarkMode }) => {
  return (
    <div className={`
      p-8 rounded-3xl backdrop-blur-md transition-all duration-500 animate-scale-in
      ${isDarkMode 
        ? 'bg-white/10 border border-white/20 shadow-2xl shadow-purple-500/20' 
        : 'bg-white/20 border border-white/30 shadow-2xl shadow-pink-500/20'
      }
    `}>
      <div className="text-center">
        <div className={`text-3xl md:text-5xl font-bold mb-4 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-white'
        }`}>
          {result.fromSymbol} {result.amount} {result.fromCurrency}
        </div>
        
        <div className={`text-2xl md:text-4xl mb-4 transition-colors duration-300 ${
          isDarkMode ? 'text-white/80' : 'text-white/90'
        }`}>
          =
        </div>
        
        <div className={`text-3xl md:text-5xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-green-400' : 'text-green-300'
        }`}>
          {result.toSymbol} {result.convertedAmount} {result.toCurrency}
        </div>
        
        <div className={`mt-6 text-lg transition-colors duration-300 ${
          isDarkMode ? 'text-white/70' : 'text-white/80'
        }`}>
          💱 Real-time exchange rate
        </div>
      </div>
    </div>
  );
};

export default ConversionResult;
