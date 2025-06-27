import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sun, Moon, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Currency symbols mapping
  const currencySymbols: { [key: string]: string } = {
    USD: '💵', EUR: '💶', GBP: '💷', JPY: '💴', CAD: '🍁', AUD: '🇦🇺',
    CHF: '🇨🇭', CNY: '🇨🇳', INR: '🇮🇳', KRW: '🇰🇷', BRL: '🇧🇷',
    MXN: '🇲🇽', RUB: '🇷🇺', ZAR: '🇿🇦', SGD: '🇸🇬', NZD: '🇳🇿'
  };

  const popularCurrencies = [
    { code: 'USD', name: 'US Dollar', emoji: '💵' },
    { code: 'EUR', name: 'Euro', emoji: '💶' },
    { code: 'GBP', name: 'British Pound', emoji: '💷' },
    { code: 'JPY', name: 'Japanese Yen', emoji: '💴' },
    { code: 'CAD', name: 'Canadian Dollar', emoji: '🍁' },
    { code: 'AUD', name: 'Australian Dollar', emoji: '🇦🇺' },
    { code: 'CHF', name: 'Swiss Franc', emoji: '🇨🇭' },
    { code: 'CNY', name: 'Chinese Yuan', emoji: '🇨🇳' },
    { code: 'INR', name: 'Indian Rupee', emoji: '🇮🇳' },
    { code: 'KRW', name: 'Korean Won', emoji: '🇰🇷' }
  ];

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

  const handleManualConvert = async () => {
    if (!manualAmount || isNaN(parseFloat(manualAmount))) {
      toast.error("😅 Please enter a valid amount!");
      return;
    }

    const amount = parseFloat(manualAmount);
    await convertCurrency(amount, fromCurrency, toCurrency);
  };

  const convertCurrency = async (amount: number, from: string, to: string) => {
    setIsConverting(true);
    
    try {
      console.log('Converting:', { amount, from, to });

      // Fetch exchange rate
      const response = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Invalid currency conversion');
      }

      const result = {
        amount,
        fromCurrency: from,
        toCurrency: to,
        convertedAmount: Math.round(data.result * 100) / 100,
        fromSymbol: currencySymbols[from] || '💰',
        toSymbol: currencySymbols[to] || '💰'
      };

      setConversionResult(result);
      
      // Speak the result
      const resultText = `${amount} ${from} equals ${result.convertedAmount} ${to}`;
      speakResult(resultText);
      
      toast.success("✅ Conversion complete!");
      
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error("😅 Oops! Couldn't convert that. Please try again!");
    } finally {
      setIsConverting(false);
    }
  };

  const parseAndConvert = async (text: string) => {
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

      await convertCurrency(amount, fromCurrency, toCurrency);
      
    } catch (error) {
      console.error('Parsing error:', error);
      toast.error("😅 Oops! Couldn't understand that. Please try again!");
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

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900' 
        : 'bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600'
    }`}>
      {/* Background Animated Emojis */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-20 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            {['💰', '💸', '🪙', '🌍', '💵', '💶', '💷', '💴', '📈', '💎', '🎯', '⚡', '🚀', '🎊', '✨'][Math.floor(Math.random() * 15)]}
          </div>
        ))}
      </div>

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

      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen relative z-10">
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

        {/* Mode Toggle Buttons */}
        <div className={`flex gap-4 mb-8 p-2 rounded-2xl backdrop-blur-md transition-all duration-300 ${
          isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-white/20 border border-white/30'
        }`}>
          <Button
            onClick={() => setShowManualInput(false)}
            className={`px-6 py-3 rounded-xl transition-all duration-300 ${
              !showManualInput 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
                : 'bg-transparent text-white/70 hover:text-white'
            }`}
          >
            🎤 Voice Mode
          </Button>
          <Button
            onClick={() => setShowManualInput(true)}
            className={`px-6 py-3 rounded-xl transition-all duration-300 ${
              showManualInput 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
                : 'bg-transparent text-white/70 hover:text-white'
            }`}
          >
            ⌨️ Manual Mode
          </Button>
        </div>

        {!showManualInput ? (
          /* Voice Mode */
          <>
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
          </>
        ) : (
          /* Manual Mode */
          <div className={`w-full max-w-md p-8 rounded-3xl backdrop-blur-md transition-all duration-500 animate-scale-in ${
            isDarkMode 
              ? 'bg-white/10 border border-white/20 shadow-2xl shadow-purple-500/20' 
              : 'bg-white/20 border border-white/30 shadow-2xl shadow-pink-500/20'
          }`}>
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-white/80' : 'text-white/90'
                }`}>
                  💰 Amount
                </label>
                <Input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className={`w-full text-lg ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' 
                      : 'bg-white/20 border-white/30 text-white placeholder:text-white/60'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white/80' : 'text-white/90'
                  }`}>
                    From
                  </label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className={`w-full p-3 rounded-lg text-sm ${
                      isDarkMode 
                        ? 'bg-white/10 border border-white/20 text-white' 
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    {popularCurrencies.map(currency => (
                      <option key={currency.code} value={currency.code} className="text-black">
                        {currency.emoji} {currency.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white/80' : 'text-white/90'
                  }`}>
                    To
                  </label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className={`w-full p-3 rounded-lg text-sm ${
                      isDarkMode 
                        ? 'bg-white/10 border border-white/20 text-white' 
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    {popularCurrencies.map(currency => (
                      <option key={currency.code} value={currency.code} className="text-black">
                        {currency.emoji} {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={swapCurrencies}
                  variant="outline"
                  size="icon"
                  className={`flex-shrink-0 ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                      : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                  }`}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={handleManualConvert}
                  disabled={isConverting}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-300 hover:shadow-lg"
                >
                  {isConverting ? '⚡ Converting...' : '🚀 Convert Now!'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className={`mt-8 p-4 rounded-2xl backdrop-blur-md transition-all duration-300 ${
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
          <div className="mt-8">
            <ConversionResult result={conversionResult} isDarkMode={isDarkMode} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
