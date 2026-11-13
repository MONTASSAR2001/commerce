/**
 * RawlineAIChatbot.jsx
 * 
 * 1:1 Pixel-Perfect Replica of Target Design (Pic 1)
 * 
 * Features:
 *  - Floating bottom-right circular button with multi-layered gold/amber glowing ring
 *    and the KRONOS folded ribbon [X] logo inside.
 *  - Luxury Chatbot Window with warm golden ambient border glow and rounded-3xl corners.
 *  - Window Header: KRONOS AI with green "• Online" dot, minimize (—) and close (×) controls.
 *  - Hero Section: "Hello! 👋 How can I help you today?" with hooded cyberpunk streetwear avatar.
 *  - 2x2 Quick Action Grid: "Track my order", "Browse drops", "Find a product", "FAQs".
 *  - Message Stream: Bot message with circular logo avatar and timestamp.
 *  - Input Pill: Golden Sparkles icon, "Ask anything..." placeholder, and golden gradient circular send button.
 *  - Bottom Decorative Bar: "KRONOS • STAY FRESH" framed by golden angular corner tabs (◤ and ◢).
 *  - Interactive Product Cards with 1-click "+ BAG" and "3D" fitting lab try-on.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Package,
  Shirt,
  Tag,
  HelpCircle,
  Minus,
  X,
  ShoppingBag,
  Check,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import {
  askKronosGraphRag,
  fetchRagDocuments,
  getOrCreateRagSessionId,
  submitRagFeedback
} from '../lib/kronosGraphRag';
import { fetchPromoCodes } from '../lib/kronosDataService';
import { createTranslator, localizeProductName, buildLocalizedChatbotWelcome } from '../lib/i18nEngine';
import RichChatbotMessage, { CHATBOT_LUXURY_BG_STYLE } from './RichChatbotMessage';
import { KronosLogo, RawlineFoldedLogo } from './KronosLogo';

export { KronosLogo, RawlineFoldedLogo };

export default function RawlineAIChatbot({
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  storeData = null,
  products = [],
  drops = {},
  brandName = 'K',
  faqs = [],
  footer = {},
  stores = [],
  formatPrice = (p) => `${p} DT`,
  addToCart = () => {},
  onOpenFittingLab = () => {},
  onSelectProduct = () => {},
  activeCurrencyCode = 'TND',
  currentCurrency = { symbol: 'DT', rate: 1.0 },
  language = 'en'
}) {
  const activeBrand = brandName || storeData?.brand?.name || 'K';
  const t = createTranslator(language);
  const isRtl = language === 'ar';
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  // Initial bot message
  const [messages, setMessages] = useState([
    {
      id: 'msg-init-1',
      sender: 'bot',
      timestamp: 'LIVE',
      text: buildLocalizedChatbotWelcome(activeBrand, products.length || 56, language)
    }
  ]);

  // Keep greeting banner aligned when brand name, catalog count, or language updates dynamically
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === 'msg-init-1'
          ? {
              ...m,
              text: buildLocalizedChatbotWelcome(activeBrand, products.length || 56, language)
            }
          : m
      )
    );
  }, [activeBrand, products.length, language]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedItemNotice, setAddedItemNotice] = useState(null);
  const [ragDocs, setRagDocs] = useState([]);
  const [promos, setPromos] = useState([]);
  const sessionIdRef = useRef(getOrCreateRagSessionId());

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([fetchRagDocuments(), fetchPromoCodes()]).then(([docs, codeList]) => {
      if (Array.isArray(docs)) setRagDocs(docs);
      if (Array.isArray(codeList)) setPromos(codeList);
    });
  }, [isOpen]);

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  const triggerAddFeedback = (productId, productName) => {
    setAddedItemNotice({ id: productId, name: productName });
    setTimeout(() => setAddedItemNotice(null), 2500);
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputText).trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputText('');
    setIsTyping(true);

    try {
      const mergedStoreData = storeData || {
        brand: { name: activeBrand },
        drops,
        faqs,
        footer,
        stores,
        products,
        currency: { activeCurrency: activeCurrencyCode, rate: currentCurrency?.rate || 1 }
      };

      const ragResult = await askKronosGraphRag({
        query: text,
        channel: 'storefront',
        language,
        storeData: mergedStoreData,
        customDocs: ragDocs,
        promos,
        history: nextHistory,
        sessionId: sessionIdRef.current
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: ragResult.answer,
          productCards: ragResult.subgraph?.recommendedProducts || [],
          ragMeta: {
            logId: ragResult.logId,
            loggedInCloud: ragResult.loggedInCloud,
            modelUsed: ragResult.modelUsed,
            engineMode: ragResult.engineMode,
            latencyMs: ragResult.latencyMs,
            paths: ragResult.subgraph?.traversalPaths || [],
            nodeCount: ragResult.subgraph?.rankedNodes?.length || 0,
            feedback: 0
          }
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text:
            language === 'fr'
              ? 'Nos conseillers rencontrent un léger ralentissement de connexion. Réessayez dans un instant.'
              : language === 'ar'
              ? 'نواجه بطئاً مؤقتاً في الاتصال. يرجى المحاولة مرة أخرى بعد لحظات.'
              : 'Our boutique stylist encountered a brief connection hiccup. Please try again in a moment.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRateMessage = async (msgId, logId, rating) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.ragMeta
          ? { ...m, ragMeta: { ...m.ragMeta, feedback: rating } }
          : m
      )
    );
    if (logId) {
      await submitRagFeedback(logId, rating);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. CHATBOT WINDOW (APPEARS ON CLICK, MATCHES PIC 1)
      ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          style={CHATBOT_LUXURY_BG_STYLE}
          className={`w-[calc(100vw-2rem)] sm:w-[390px] max-w-[420px] h-[min(580px,calc(100dvh-6rem))] mb-3 backdrop-blur-3xl border border-[#C59B27]/55 rounded-[28px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 zoom-in-95 duration-250 select-none ${isRtl ? 'text-right' : 'text-left'}`}
        >
          {/* Header Bar */}
          <div className="px-5 py-3.5 bg-white/[0.03] backdrop-blur-md border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Rounded Logo Badge */}
              <div className="w-8 h-8 rounded-lg bg-[#1C1C24] border border-[#2B2B38] flex items-center justify-center p-1.5 shadow-sm">
                <KronosLogo className="w-5 h-4" />
              </div>
              <div>
                <h4 className="font-azeret font-bold text-xs uppercase tracking-wider text-white">
                  {activeBrand} · {t('nav.aiStylist')}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="font-sans text-[10px] text-[#A0A0A5]">{t('chatbot.online')}</span>
                </div>
              </div>
            </div>

            {/* Window Controls: Minimize & Close */}
            <div className="flex items-center gap-2 text-[#8E8E93]">
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                className="hover:text-white p-1 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Body Content Area (Hero + Chat Feed) */}
          <div className="flex-1 overflow-y-auto bg-transparent p-4 sm:p-5 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-[#26262B]">
            {/* ── Top Hero Card ── */}
            <div className="relative pt-1 pb-2">
              <div className="flex items-start justify-between pr-2">
                <div>
                  <h3 className="font-sans font-bold text-2xl text-white tracking-tight flex items-center gap-1.5">
                    <span>{t('chatbot.hello')}</span>
                    <span className="text-xl">👋</span>
                  </h3>
                  <p className="font-sans text-xs text-[#C8C8D0] mt-1 font-medium">
                    {t('chatbot.subtitle')}
                  </p>
                </div>
              </div>

              {/* 2x2 Quick Action Buttons Grid (Pic 1) */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => handleSendMessage(t('chatbot.trackPrompt'))}
                  className="bg-[#1C1C22] hover:bg-[#25252E] border border-[#2B2B36] hover:border-[#C59B27]/60 text-white rounded-xl py-2.5 px-3 text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 group"
                >
                  <Package className="w-3.5 h-3.5 text-[#C59B27] group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-xs truncate">{t('chatbot.trackOrder')}</span>
                </button>
                <button
                  onClick={() => handleSendMessage(t('chatbot.dropsPrompt'))}
                  className="bg-[#1C1C22] hover:bg-[#25252E] border border-[#2B2B36] hover:border-[#C59B27]/60 text-white rounded-xl py-2.5 px-3 text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 group"
                >
                  <Shirt className="w-3.5 h-3.5 text-[#C59B27] group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-xs truncate">{t('chatbot.browseDrops')}</span>
                </button>
                <button
                  onClick={() => handleSendMessage(t('chatbot.findPrompt'))}
                  className="bg-[#1C1C22] hover:bg-[#25252E] border border-[#2B2B36] hover:border-[#C59B27]/60 text-white rounded-xl py-2.5 px-3 text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 group"
                >
                  <Tag className="w-3.5 h-3.5 text-[#C59B27] group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-xs truncate">{t('chatbot.findProduct')}</span>
                </button>
                <button
                  onClick={() => handleSendMessage(t('chatbot.faqsPrompt'))}
                  className="bg-[#1C1C22] hover:bg-[#25252E] border border-[#2B2B36] hover:border-[#C59B27]/60 text-white rounded-xl py-2.5 px-3 text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 group"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#C59B27] group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-xs truncate">{t('chatbot.faqs')}</span>
                </button>
              </div>
            </div>

            {/* Notification Badge when item is added to cart */}
            {addedItemNotice && (
              <div className="bg-[#EA301F] text-white px-3.5 py-1.5 rounded-xl font-azeret text-[11px] uppercase font-bold flex items-center justify-between animate-in slide-in-from-top duration-200 shadow-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="truncate max-w-[200px]">ADDED "{addedItemNotice.name}"</span>
                </div>
                <span className="text-[9px] font-mono bg-black/20 px-1.5 py-0.5 rounded">IN BAG ✓</span>
              </div>
            )}

            {/* ── Message Bubbles Stream ── */}
            <div className="space-y-4 pt-1">
              {messages.map((m) => {
                const isBot = m.sender === 'bot';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    {/* Bot Avatar Logo on the Left */}
                    {isBot && (
                      <div className="w-7 h-7 rounded-full bg-[#1C1C22] border border-[#2A2A35] flex items-center justify-center p-1 flex-shrink-0 mt-0.5 shadow-sm">
                        <KronosLogo className="w-4 h-3.5" />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[85%]">
                      {/* Bubble Card — Bot replies flow directly in the assistant #131317 background */}
                      <div
                        className={`text-xs leading-relaxed ${
                          isBot
                            ? 'bg-transparent px-0.5 py-1 text-white'
                            : 'rounded-2xl p-3.5 shadow-md bg-gradient-to-r from-[#EA301F] to-[#ff5a1f] text-white font-semibold shadow-[#EA301F]/25'
                        }`}
                      >
                        {isBot ? (
                          <RichChatbotMessage text={m.text} variant="dark" />
                        ) : (
                          <p className="whitespace-pre-line font-sans">{m.text}</p>
                        )}

                        {/* Interactive Product Recommendation Cards */}
                        {m.productCards && m.productCards.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#262633] space-y-2">
                            {m.productCards.map((prod) => {
                              const isAdded = addedItemNotice?.id === prod.id;
                              return (
                                <div
                                  key={prod.id}
                                  className="bg-[#121217] border border-[#242430] hover:border-[#C59B27]/50 rounded-xl p-2 flex items-center justify-between gap-2 transition-all group"
                                >
                                  <div
                                    onClick={() => onSelectProduct(prod, 0)}
                                    className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1 min-w-0"
                                  >
                                    <div className="w-10 h-12 bg-[#ECECE9] rounded-lg flex-shrink-0 border border-[#222] overflow-hidden">
                                      <img
                                        src={prod.image || prod.img}
                                        alt={prod.name}
                                        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                                      />
                                    </div>
                                    <div className="overflow-hidden">
                                      <h6 className="font-azeret font-bold text-[10px] uppercase text-[#FFFFE3] truncate max-w-[120px] group-hover:text-[#EA301F] transition-colors">
                                        {localizeProductName(prod.name, language)}
                                      </h6>
                                      <span className="font-azeret font-black text-[11px] text-white block">
                                        {formatPrice(prod.price)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => onOpenFittingLab(prod)}
                                      title={t('product.tryOn3dFull', '3D Virtual Try-On')}
                                      className="px-2 py-1 bg-[#20202A] hover:bg-[#2B2B38] text-[#FFFFE3] hover:text-[#C59B27] border border-[#2D2D3B] rounded font-azeret text-[9px] font-bold uppercase transition-colors cursor-pointer"
                                    >
                                      3D
                                    </button>
                                    <button
                                      onClick={() => {
                                        addToCart(prod, prod.sizes?.[0] || 'M', prod.colors?.[0] || 'Standard', 1);
                                        triggerAddFeedback(prod.id, prod.name);
                                      }}
                                      className={`px-2 py-1 rounded font-azeret text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                        isAdded
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-[#EA301F] hover:bg-[#ff3b29] text-white'
                                      }`}
                                    >
                                      {isAdded ? (
                                        <>
                                          <Check className="w-2.5 h-2.5" />
                                          <span>{t('chatbot.inBag')}</span>
                                        </>
                                      ) : (
                                        <>
                                          <ShoppingBag className="w-2.5 h-2.5" />
                                          <span>{t('chatbot.addBag')}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Client Feedback */}
                      <div className="flex flex-wrap items-center gap-2 mt-1 ml-1">
                        <span className="text-[10px] text-[#787878]">{m.timestamp}</span>
                        {isBot && m.ragMeta && (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRateMessage(m.id, m.ragMeta.logId, 1)}
                              className={`p-0.5 rounded cursor-pointer transition-colors ${
                                m.ragMeta.feedback === 1 ? 'text-emerald-400' : 'text-[#666] hover:text-white'
                              }`}
                              title="Helpful answer"
                            >
                              <ThumbsUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRateMessage(m.id, m.ragMeta.logId, -1)}
                              className={`p-0.5 rounded cursor-pointer transition-colors ${
                                m.ragMeta.feedback === -1 ? 'text-red-400' : 'text-[#666] hover:text-white'
                              }`}
                              title="Needs improvement"
                            >
                              <ThumbsDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 px-1 py-2 bg-transparent w-fit">
                  <div className="w-2 h-2 rounded-full bg-[#C59B27] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#FFFFE3] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-[#EA301F] animate-bounce [animation-delay:0.4s]" />
                  <span className="font-mono text-[10px] text-[#8E8E93] ml-1">
                    {t('chatbot.typing')}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── Footer Input Area ── */}
          <div className="p-3.5 bg-black/25 backdrop-blur-xl border-t border-white/10">
            {/* Input Pill with Gold Glow & Circular Gold Send Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="rounded-full bg-[#121216] border border-[#C59B27]/70 focus-within:border-[#E5A93C] p-1.5 pl-3.5 flex items-center gap-2 shadow-[0_0_15px_rgba(197,155,39,0.15)] transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#E5A93C] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('chatbot.placeholder')}
                className="w-full bg-transparent font-sans text-xs text-[#FFFFE3] placeholder-[#777] outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-[#E5A93C] to-[#D97706] hover:brightness-110 disabled:opacity-40 flex items-center justify-center text-black font-bold shadow-md cursor-pointer transition-transform hover:scale-105 shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-black fill-black -ml-0.5" />
              </button>
            </form>

            {/* Decorative Bottom Bar with Golden Corner Flairs (Pic 1) */}
            <div className="flex items-center justify-between px-2 pt-2 text-[#C59B27]">
              {/* Left corner tab flair */}
              <svg viewBox="0 0 10 10" className="w-2 h-2 fill-current">
                <polygon points="0,0 0,10 10,10" />
              </svg>

              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C59B27]/90 font-bold">
                {activeBrand} • STAY FRESH
              </span>

              {/* Right corner tab flair */}
              <svg viewBox="0 0 10 10" className="w-2 h-2 fill-current">
                <polygon points="10,0 0,10 10,10" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. FLOATING TRIGGER BUTTON (Animated Attention Motion)
          Circular black button with sonar pulse, float-nudge motion, and folded K logo
      ───────────────────────────────────────────────────────────── */}
      <div className="relative group">
        {!isOpen && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#E5A93C]/80 animate-chatbot-sonar"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1 rounded-full bg-[#EA301F]/25 blur-md animate-pulse"
            />
          </>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#111111] ring-2 ring-[#E5A93C] hover:ring-[#EA301F] shadow-[0_0_25px_rgba(229,169,60,0.6),0_0_50px_rgba(234,48,31,0.35)] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 ${
            !isOpen ? 'animate-chatbot-trigger' : ''
          }`}
          title={`${activeBrand} — ${t('nav.aiStylist')}`}
        >
          <KronosLogo className="w-8 h-7 sm:w-9 sm:h-8 transition-transform duration-300 group-hover:scale-110" />
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-85" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#22c55e] border-2 border-[#111111]" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
