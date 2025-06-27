
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FloatingEmojis from '@/components/FloatingEmojis';
import ConversionResult from '@/components/ConversionResult';

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversionResult, setConversionResult] = useState<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    convertedAmount: number;
    fromSymbol: string;
    toSymbol: string;
  } | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Currency symbols mapping
  const currencySymbols: { [key: string]: string } = {
    USD: '💵', EUR: '💶', GBP: '💷', JPY: '💴', CAD: '🍁', AUD: '🇦🇺',
    CHF: '🇨🇭', CNY: '🇨🇳', INR: '🇮🇳', KRW: '🇰🇷', BRL: '🇧🇷',
    MXN: '🇲🇽', RUB: '🇷🇺', ZAR: '🇿🇦', SGD: '🇸🇬', NZD: '🇳🇿'
  };

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        console.log('Speech recognized:', speechResult);
        parseAndConvert(speechResult);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error("😅 Oops! Didn't catch that. Please try again!");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      setTranscript('');
      setConversionResult(null);
      recognitionRef.current.start();
      toast.info("🎤 Listening... Say something like 'Convert 100 dollars to euros'");
    }
  };

  const parseAndConvert = async (text: string) => {
    setIsConverting(true);
    
    try {
      // Parse the speech input using regex
      const patterns = [
        /convert\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)/i,
        /(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)/i,
        /(\d+(?:\.\d+)?)\s+(\w+)\s+in\s+(\w+)/i
      ];

      let match = null;
      for (const pattern of patterns) {
        match = text.match(pattern);
        if (match) break;
      }

      if (!match) {
        throw new Error('Could not parse currency conversion request');
      }

      const amount = parseFloat(match[1]);
      const fromCurrency = normalizeCurrency(match[2]);
      const toCurrency = normalizeCurrency(match[3]);

      console.log('Parsed:', { amount, fromCurrency, toCurrency });

      // Fetch exchange rate
      const response = await fetch(`https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Invalid currency conversion');
      }

      const result = {
        amount,
        fromCurrency,
        toCurrency,
        convertedAmount: Math.round(data.result * 100) / 100,
        fromSymbol: currencySymbols[fromCurrency] || '💰',
        toSymbol: currencySymbols[toCurrency] || '💰'
      };

      setConversionResult(result);
      
      // Speak the result
      const resultText = `${amount} ${fromCurrency} equals ${result.convertedAmount} ${toCurrency}`;
      speakResult(resultText);
      
      toast.success("✅ Conversion complete!");
      
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error("😅 Oops! Couldn't convert that. Please try again!");
    } finally {
      setIsConverting(false);
    }
  };

  const normalizeCurrency = (currency: string): string => {
    const currencyMap: { [key: string]: string } = {
      'dollar': 'USD', 'dollars': 'USD', 'usd': 'USD',
      'euro': 'EUR', 'euros': 'EUR', 'eur': 'EUR',
      'pound': 'GBP', 'pounds': 'GBP', 'gbp': 'GBP',
      'yen': 'JPY', 'jpy': 'JPY',
      'canadian': 'CAD', 'cad': 'CAD',
      'australian': 'AUD', 'aud': 'AUD',
      'swiss': 'CHF', 'chf': 'CHF',
      'yuan': 'CNY', 'cny': 'CNY',
      'rupee': 'INR', 'rupees': 'INR', 'inr': 'INR',
      'won': 'KRW', 'krw': 'KRW'
    };
    
    const normalized = currency.toLowerCase();
    return currencyMap[normalized] || currency.toUpperCase();
  };

  const speakResult = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900' 
        : 'bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600'
    }`}>
      <FloatingEmojis isActive={isListening || isConverting} />
      
      {/* Dark Mode Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <Button
          onClick={toggleDarkMode}
          variant="outline"
          size="icon"
          className={`rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 ${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
              : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
          }`}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        {/* Title */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-white'
          }`}>
            🎧 VoiceCurrency
          </h1>
          <p className={`text-xl md:text-2xl transition-colors duration-300 ${
            isDarkMode ? 'text-white/80' : 'text-white/90'
          }`}>
            Talk & Convert! 💸
          </p>
        </div>

        {/* Main Mic Button */}
        <div className="relative mb-12">
          <Button
            onClick={startListening}
            disabled={isListening || isConverting}
            className={`
              relative w-32 h-32 md:w-40 md:h-40 rounded-full 
              bg-gradient-to-r from-pink-500 to-purple-600 
              hover:from-pink-600 hover:to-purple-700
              border-4 border-white/30 backdrop-blur-md
              transition-all duration-300 hover:scale-110
              shadow-2xl hover:shadow-pink-500/25
              ${isListening ? 'animate-pulse scale-110' : ''}
              ${isConverting ? 'animate-spin' : ''}
            `}
          >
            <Mic className="w-12 h-12 md:w-16 md:h-16 text-white" />
            
            {/* Ripple effect when listening */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-pink-400 animate-ping" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping animation-delay-200" />
              </>
            )}
          </Button>
          
          {/* Status text */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
            <p className={`text-lg font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-white/80' : 'text-white'
            }`}>
              {isListening ? '🎤 Listening...' : 
               isConverting ? '⚡ Converting...' : 
               '🎙️ Click to speak'}
            </p>
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className={`mb-8 p-4 rounded-2xl backdrop-blur-md transition-all duration-300 ${
            isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-white/20 border border-white/30'
          }`}>
            <p className={`text-center font-medium ${
              isDarkMode ? 'text-white/90' : 'text-white'
            }`}>
              You said: "{transcript}"
            </p>
          </div>
        )}

        {/* Conversion Result */}
        {conversionResult && (
          <ConversionResult result={conversionResult} isDarkMode={isDarkMode} />
        )}

        {/* Instructions */}
        <div className={`text-center mt-12 max-w-md transition-colors duration-300 ${
          isDarkMode ? 'text-white/70' : 'text-white/80'
        }`}>
          <p className="text-sm mb-2">
            💡 Try saying things like:
          </p>
          <div className="space-y-1 text-xs">
            <p>"Convert 100 dollars to euros"</p>
            <p>"50 pounds to yen"</p>
            <p>"25 euros in canadian dollars"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
