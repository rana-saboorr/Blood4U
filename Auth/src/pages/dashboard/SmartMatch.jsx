import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BLOOD_COMPATIBILITY } from '../../features/data/dataSlice';
import { Zap, MapPin, Clock, Heart, Star, MessageSquare, Shield, Brain, Send, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';

const BADGE_CONFIG = {
  Gold:   { icon: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-900/50' },
  Silver: { icon: '🥈', color: 'text-gray-500',   bg: 'bg-gray-50 dark:bg-gray-900/20',   border: 'border-gray-200 dark:border-gray-700' },
  Bronze: { icon: '🥉', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-900/50' },
};

// Rest period: donors who donated within last 90 days are not eligible
const isResting = (lastDonation) => {
  if (!lastDonation) return false;
  const daysSince = (Date.now() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < 90;
};

// Match score computation
const computeMatchScore = (donor, bloodGroup, city) => {
  let score = 0;
  if (!donor.available) return -1;
  if (isResting(donor.lastDonation)) return -1;

  const compatibles = BLOOD_COMPATIBILITY[bloodGroup] || [];
  if (!compatibles.includes(donor.bloodGroup)) return -1;

  // Exact group match = +50
  if (donor.bloodGroup === bloodGroup) score += 50;
  // O- is universal = +20
  if (donor.bloodGroup === 'O-') score += 20;
  // Same city = +30
  if (donor.city.toLowerCase() === city.toLowerCase()) score += 30;
  // Available = +20 (already checked)
  score += 20;
  // Closer distance = higher score
  score += Math.max(0, 20 - donor.distance * 2);
  // Donate count badge bonus
  if (donor.badge === 'Gold') score += 15;
  else if (donor.badge === 'Silver') score += 8;

  return score;
};

export default function SmartMatch() {
  const { donors } = useSelector(state => state.data);
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('match'); // 'match' or 'ai'

  // Heuristic Match State
  const [bloodGroup, setBloodGroup] = useState('');
  const [city, setCity] = useState('');
  const [matched, setMatched] = useState(null);
  const [searched, setSearched] = useState(false);

  // Gemini AI Chatbot State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am your AI Blood Assistant, powered by Gemini 1.5. I have access to real-time compatibility schemas and active donors on this platform. How can I help you today?"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  // Heuristic Search Handler
  const handleSearch = () => {
    if (!bloodGroup || !city.trim()) return;
    setSearched(true);

    const scored = donors
      .map(d => ({ ...d, score: computeMatchScore(d, bloodGroup, city) }))
      .filter(d => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setMatched(scored);
  };

  // Quick prompt triggers
  const handleQuickPrompt = (promptText) => {
    setUserInput(promptText);
    sendAiMessage(promptText);
  };

  // Gemini API Caller
  const sendAiMessage = async (overrideInput) => {
    const textToSend = overrideInput || userInput;
    if (!textToSend.trim()) return;

    setUserInput('');
    setAiError(null);
    setChatMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsAiLoading(true);

    // Format donor data for Gemini's situational awareness
    const contextDonors = donors.map(d => ({
      name: d.name,
      bloodGroup: d.bloodGroup,
      city: d.city,
      available: d.available,
      resting: isResting(d.lastDonation),
      badge: d.badge,
      type: d.paid ? 'Paid' : 'Volunteer',
      distance: d.distance
    }));

    const systemPrompt = `You are Blood4U AI, a professional medical coordinator assistant for the Blood4U platform.
Here is the real-time data of active donors on our platform:
${JSON.stringify(contextDonors)}

Use this data to answer questions. If the user asks for compatible donors, matching donors, or donors in a specific city, analyze the above list and present the best matches in a highly professional, structured, bulleted layout (listing Name, Blood Group, City, Badge status, and Donation type). If no donors fit, politely suggest matching options.

Always enforce and explain medical compatibility rules if asked:
- A+ receives from A+, A-, O+, O-.
- A- receives from A-, O-.
- B+ receives from B+, B-, O+, O-.
- B- receives from B-, O-.
- AB+ receives from anyone (Universal recipient).
- AB- receives from A-, B-, AB-, O-.
- O+ receives from O+, O-.
- O- receives from O- (Universal donor).

Keep your response helpful, reassuring, and medical-grade professional. Always output in clean Markdown format with standard headings and spacing. Prevent unsafe or toxic queries politely.`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCqU68BInhm4puwLd4mfLwlg5RDUcvnbbA';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt + "\n\nUser Question: " + textToSend
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP ${response.status} failed to connect to Gemini API.`);
      }

      const data = await response.json();
      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to formulate a response. Please try again.";

      setChatMessages(prev => [...prev, { role: 'assistant', text: aiReply }]);
    } catch (error) {
      console.error("Gemini API Error: ", error);
      setAiError(error.message || "An unexpected error occurred during AI processing.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Title Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl flex items-center justify-center">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Match & AI Assistant</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Discover donors via traditional medical compatibility score or ask our Gemini AI coordinator.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700/50 self-start sm:self-auto shadow-sm">
            <button
              onClick={() => setActiveTab('match')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'match' ? 'bg-white dark:bg-zinc-900 text-red-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'}`}
            >
              <Zap size={14} /> Heuristic Matching
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'ai' ? 'bg-white dark:bg-zinc-900 text-red-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'}`}
            >
              <Brain size={14} /> Gemini AI Advisor
            </button>
          </div>
        </div>
      </motion.div>

      {/* RENDER TAB 1: HEURISTIC SMART MATCHING */}
      <AnimatePresence mode="wait">
        {activeTab === 'match' && (
          <motion.div
            key="match-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search Input Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Input Compatibility Parameters</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Required Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm outline-none transition-colors focus:border-red-500"
                  >
                    <option value="">Select Blood Group</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} className="dark:bg-zinc-900" value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Islamabad"
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm outline-none transition-colors focus:border-red-500"
                  />
                </div>
                <Button onClick={handleSearch} className="flex items-center gap-2 justify-center shadow-lg shadow-red-500/10 py-3 text-sm">
                  <Zap size={16} /> Compute Matches
                </Button>
              </div>

              {bloodGroup && (
                <div className="mt-4 p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 rounded-xl">
                  <p className="text-xs text-red-800 dark:text-red-400">
                    💡 <strong>{bloodGroup}</strong> matches compatible donors: <span className="font-bold">{(BLOOD_COMPATIBILITY[bloodGroup] || []).join(', ')}</span>.
                  </p>
                </div>
              )}
            </div>

            {/* Results Grid */}
            {searched && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    🎯 Highly Ranked Donors ({matched?.length || 0})
                  </h3>
                  <span className="text-xs text-gray-400">Based on distance, history, and city alignment</span>
                </div>

                {matched?.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-300 dark:border-zinc-700">
                    <Heart className="mx-auto text-gray-300 mb-4 animate-pulse" size={48} />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Compatible Donors Available</h3>
                    <p className="text-sm text-gray-500 mt-1">Try another nearby city or ask the Gemini AI Advisor below for compatibility advice.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matched.map((donor, i) => {
                      const badge = BADGE_CONFIG[donor.badge] || BADGE_CONFIG.Bronze;
                      const isExact = donor.bloodGroup === bloodGroup;
                      return (
                        <div
                          key={donor.id}
                          className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-all hover:scale-[1.005] ${i === 0 ? 'border-red-300 dark:border-red-900/50 ring-1 ring-red-100 dark:ring-red-950/20' : 'border-gray-200 dark:border-zinc-800'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                              <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold border-2 ${isExact ? 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-700' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700'}`}>
                                <span className="text-base leading-none">{donor.bloodGroup}</span>
                                <span className="text-[9px] mt-0.5 font-medium opacity-65">Group</span>
                              </div>
                              {i === 0 && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">#1</div>}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-gray-900 dark:text-white">{donor.name}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.bg} ${badge.border} ${badge.color}`}>
                                  {badge.icon} {donor.badge}
                                </span>
                                {donor.online && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1"><MapPin size={12} /> {donor.city}</span>
                                <span className="flex items-center gap-1"><Clock size={12} /> ~{donor.distance || 0} km away</span>
                                <span className={`flex items-center gap-1 font-bold ${donor.paid ? 'text-amber-600' : 'text-green-600'}`}>
                                  {donor.paid ? '💰 Paid' : '❤️ Volunteer'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 min-w-[150px] w-full md:w-auto">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, si) => (
                                <Star key={si} size={12} className={si < Math.round(donor.score / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-zinc-700'} />
                              ))}
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">{donor.score} pts</span>
                            </div>
                            <Button
                              onClick={() => navigate('/dashboard/chat', { state: { selectedDonor: donor } })}
                              className="w-full md:w-auto flex items-center gap-2 justify-center text-xs py-2 px-4 bg-zinc-950 dark:bg-white dark:text-zinc-900 hover:scale-105 active:scale-95"
                            >
                              <MessageSquare size={14} /> Message Donor
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* How it works info boxes */}
            {!searched && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Shield, title: 'Medical Protocols', desc: 'Strict transfusion chart mapping allows search only for scientifically compatible donors.' },
                  { icon: MapPin, title: 'Locality & Distance', desc: 'Prioritizes available donors within the target patient city to minimize logistics stress.' },
                  { icon: Clock, title: 'Mandatory Rest Rules', desc: 'Enforces safe rest period buffers (90 days since donation) automatically.' },
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-150 dark:border-zinc-800/80 text-center">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <item.icon size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER TAB 2: GEMINI AI BLOOD ADVISOR CHATBOT */}
      <AnimatePresence mode="wait">
        {activeTab === 'ai' && (
          <motion.div
            key="ai-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-[calc(100vh-16rem)] min-h-[450px] bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden"
          >
            
            {/* AI Advisor Chat Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Brain size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    Gemini Coordinator Assistant
                    <span className="text-[10px] bg-green-150 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40 px-2 py-0.5 rounded-full font-bold">Realtime Context</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">Understands current platform donors and medical protocols</p>
                </div>
              </div>

              <button
                onClick={() => setChatMessages([{
                  role: 'assistant',
                  text: "Hello! I am your AI Blood Assistant, powered by Gemini 1.5. I have access to real-time compatibility schemas and active donors on this platform. How can I help you today?"
                }])}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                title="Reset Conversation"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            {/* Quick Action Prompt suggestions */}
            <div className="p-3 bg-gray-50/50 dark:bg-zinc-800/20 border-b border-gray-150 dark:border-zinc-800/50 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
              <button 
                onClick={() => handleQuickPrompt("Show me active compatible donors for B+ blood group")}
                className="px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-red-55 border border-gray-200 dark:border-zinc-700 rounded-full text-[11px] font-medium text-gray-600 dark:text-gray-300 shrink-0 shadow-xs hover:border-red-400"
              >
                💡 B+ compatibility
              </button>
              <button 
                onClick={() => handleQuickPrompt("What are the criteria to become a blood donor?")}
                className="px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-red-55 border border-gray-200 dark:border-zinc-700 rounded-full text-[11px] font-medium text-gray-600 dark:text-gray-300 shrink-0 shadow-xs hover:border-red-400"
              >
                🏥 Donation Criteria
              </button>
              <button 
                onClick={() => handleQuickPrompt("Can an AB- recipient get blood from O+?")}
                className="px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-red-55 border border-gray-200 dark:border-zinc-700 rounded-full text-[11px] font-medium text-gray-600 dark:text-gray-300 shrink-0 shadow-xs hover:border-red-400"
              >
                🩸 AB- Recipient Compatibility
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/40 dark:bg-zinc-900/20">
              {chatMessages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-xs ${isUser ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-white rounded-tl-none border border-gray-150 dark:border-zinc-700/60 leading-relaxed'}`}>
                      <p className="whitespace-pre-line text-xs leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
                    <span className="flex gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    AI Coordinator is scanning donor database...
                  </div>
                </div>
              )}

              {aiError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <div>
                    <span className="font-bold">Error:</span> {aiError}
                    <button 
                      onClick={() => sendAiMessage()} 
                      className="ml-2 font-bold underline hover:text-red-800"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); sendAiMessage(); }} 
              className="p-4 border-t border-gray-200 dark:border-zinc-800 flex gap-3 bg-white dark:bg-zinc-900 shrink-0"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask about donor matches, compatibility, or eligibility criteria..."
                className="flex-1 bg-gray-50 dark:bg-zinc-800 rounded-full px-5 py-3 text-xs text-gray-800 dark:text-white outline-none border border-gray-200 dark:border-zinc-700/50 focus:border-purple-400"
                disabled={isAiLoading}
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isAiLoading}
                className="w-11 h-11 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all active:scale-95 shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
