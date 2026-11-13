import React from 'react';

export const CHATBOT_LUXURY_BG_STYLE = {
  backgroundColor: 'rgba(13, 13, 18, 0.86)',
  backgroundImage:
    'radial-gradient(115% 80% at 12% 0%, rgba(234, 48, 31, 0.22) 0%, rgba(234, 48, 31, 0) 54%), ' +
    'radial-gradient(95% 75% at 92% 96%, rgba(197, 155, 39, 0.22) 0%, rgba(197, 155, 39, 0) 58%), ' +
    'radial-gradient(75% 55% at 50% 44%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 70%), ' +
    'linear-gradient(170deg, rgba(28, 27, 36, 0.90) 0%, rgba(14, 14, 20, 0.93) 55%, rgba(19, 17, 22, 0.95) 100%)',
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 28px 70px rgba(0, 0, 0, 0.88), 0 0 42px rgba(197, 155, 39, 0.22)'
};

function pickHeaderTheme(title = '') {
  const t = title.toLowerCase();
  if (/promo|price|cost|discount|budget|margin|deal|خصم|تخفيض|سعر|code|tarif|💰|💎|🏷/.test(t)) {
    return {
      rule: 'border-b border-emerald-400/30',
      text: 'text-emerald-300'
    };
  }
  if (/ship|deliver|tunis|store|location|address|توصيل|شحن|فروع|livraison|boutique|🚚|📦|📍/.test(t)) {
    return {
      rule: 'border-b border-sky-400/30',
      text: 'text-sky-300'
    };
  }
  if (/3d|fit|size|sizing|material|fabric|قياس|مقاس|خامة|taille|coupe|📏|🧬/.test(t)) {
    return {
      rule: 'border-b border-purple-400/30',
      text: 'text-purple-300'
    };
  }
  return {
    rule: 'border-b border-white/10',
    text: 'text-[#FFB86B]'
  };
}

function classifyKeywordColor(phrase = '') {
  const s = phrase.toLowerCase();
  if (/krono|blackfriday|\bpromo\b|خصم|تخفيض|code\s*promo/.test(s)) return 'text-emerald-300';
  if (/3d|fit|virtual|rag|graph|supabase|groq|ai|gmv|revenue|stock|command|kpi|قياس|القياس|ذكي|مخزون/.test(s)) {
    return 'text-sky-300';
  }
  if (/tunis|ship|deliver|express|free|complimentary|livraison|offert|gratuit|تونس|توصيل|شحن|مجاني/.test(s)) {
    return 'text-emerald-300';
  }
  if (/jacket|jean|leather|suede|bomber|hoodie|overshirt|knit|coat|shirt|trouser|blazer|outfit|silhouette|piece|men|women|homme|femme|veste|blouson|cuir|tenue|جاكيت|سترة|جينز|جلد|إطلالة|رجالي|نسائي|قطعة/.test(s)) {
    return 'text-[#FF8C5A]';
  }
  return 'text-[#FFE082]';
}

const PRINCIPAL_KEYWORD_RE = /(\b(?:3D Virtual Fitting Lab|3D Fitting Lab|3D Try-On|Labo d'Essayage 3D|Graph RAG|Supabase|Groq|Tunisia|Tunis|express shipping|free delivery|complimentary|statement look|architectural pieces?|curated silhouettes?|leather jacket|suede|overshirt|knitwear|hoodie|blazer|jacket|jeans|outfit|collection|delivery|shipping|promo code|discount|revenue|commandes|GMV|livraison express|livraison offerte|livraison gratuite|livraison|Tunisie|blouson|veste|surchemise|cuir|tenue|تونس|التوصيل السريع|التوصيل المجاني|توصيل|شحن|جاكيت|سترة|جينز|جلد|إطلالة|خصم|مختبر القياس(?:\s*3D)?)\b)/gi;

function renderPrincipalKeywords(text = '', isDark = true) {
  if (!text) return null;
  const segments = String(text).split(PRINCIPAL_KEYWORD_RE);
  return segments.map((seg, i) => {
    if (!seg) return null;
    if (i % 2 === 1) {
      const colorCls = isDark ? classifyKeywordColor(seg) : 'text-[#c2410c]';
      return (
        <strong key={i} className={`font-extrabold ${colorCls}`}>
          {seg}
        </strong>
      );
    }
    return <React.Fragment key={i}>{seg}</React.Fragment>;
  });
}

function renderInlineTokens(text = '', isDark = true) {
  if (!text) return null;
  // Split by **bold**, `code`, or *italic*
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return parts.map((part, idx) => {
    if (!part) return null;

    // **Bold** ("gras") styling with vibrant colorful semantic accents (zero box wrapper)
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const inner = part.slice(2, -2);
      const isPriceOrPct = /\b\d+(?:\.\d+)?\s*(?:dt|tnd|%|€|\$)\b/i.test(inner);
      const isPromoToken = /^[A-Z0-9]{5,18}$/.test(inner.trim());

      if (isPromoToken) {
        return (
          <strong
            key={idx}
            dir="ltr"
            className="inline-block font-mono font-black text-emerald-300 tracking-wider underline decoration-emerald-400/60 underline-offset-4 mx-0.5"
          >
            {inner}
          </strong>
        );
      }

      if (isPriceOrPct) {
        return (
          <strong
            key={idx}
            dir="ltr"
            className="inline-block font-mono font-black text-[#FFD166] mx-0.5"
          >
            {inner}
          </strong>
        );
      }

      const semanticColor = isDark ? classifyKeywordColor(inner) : 'text-[#171717]';
      return (
        <strong
          key={idx}
          className={`font-black tracking-[0.01em] ${semanticColor}`}
        >
          {inner}
        </strong>
      );
    }

    // Inline `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          dir="ltr"
          className="font-mono font-bold text-amber-200 underline decoration-amber-300/40 underline-offset-4 mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // *italic*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className={isDark ? 'italic font-semibold text-[#FFE082]' : 'italic text-[#c2410c]'}>
          {part.slice(1, -1)}
        </em>
      );
    }

    return <React.Fragment key={idx}>{renderPrincipalKeywords(part, isDark)}</React.Fragment>;
  });
}

export default function RichChatbotMessage({ text = '', variant = 'dark' }) {
  const isDark = variant === 'dark';
  const lines = String(text || '').split('\n');

  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Horizontal Divider (--- / ***)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <div key={`hr-${i}`} className="my-2 h-px bg-gradient-to-r from-[#ff6f1e]/40 via-white/15 to-transparent" />
      );
      i += 1;
      continue;
    }

    // Markdown Table block
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      const dataRows = tableLines.filter((l) => !/^\|[\s:-]+\|$/.test(l.replace(/\|/g, '|').trim()) && !/^(\|\s*-+\s*)+\|$/.test(l));
      if (dataRows.length > 0) {
        const headers = dataRows[0].slice(1, -1).split('|').map((c) => c.trim());
        const bodyRows = dataRows.slice(1);
        elements.push(
          <div
            key={`tbl-${i}`}
            className="my-2 border-y border-white/10 divide-y divide-white/10"
          >
            {bodyRows.length === 0 ? (
              <div className="px-3 py-2 text-[11px] font-bold text-white flex flex-wrap gap-2">
                {headers.map((h, hIdx) => (
                  <span key={hIdx}>{renderInlineTokens(h, isDark)}</span>
                ))}
              </div>
            ) : (
              bodyRows.map((rowStr, rIdx) => {
                const cells = rowStr.slice(1, -1).split('|').map((c) => c.trim());
                return (
                  <div key={rIdx} className="px-3 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px]">
                    {cells.map((cell, cIdx) => (
                      <span
                        key={cIdx}
                        className={cIdx === 0 ? 'font-extrabold text-white' : 'text-white/85'}
                      >
                        {cIdx > 0 && headers[cIdx] ? (
                          <span className="text-[9px] uppercase tracking-wider text-white/50 mr-1">
                            {headers[cIdx]}:
                          </span>
                        ) : null}
                        {renderInlineTokens(cell, isDark)}
                      </span>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        );
        continue;
      }
    }

    // Section Headings (### / ## / #) — borderless typographic accent on chatbot background
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      const title = headingMatch[1];
      const theme = pickHeaderTheme(title);
      elements.push(
        <div key={`hdr-${i}`} className={`mt-2 mb-1.5 pb-1 ${theme.rule}`}>
          <h5 className={`font-azeret font-extrabold text-[11px] uppercase tracking-wider ${theme.text}`}>
            {renderInlineTokens(title, isDark)}
          </h5>
        </div>
      );
      i += 1;
      continue;
    }

    // Strategy Callout Block — renders cleanly on chatbot background with zero inner box
    if (trimmed.startsWith('>') || /^(?:💡|🎯|⚡)\s*\*{0,2}(?:strateg|stratég|استراتيجية)/i.test(trimmed)) {
      const content = trimmed.replace(/^>\s*/, '');
      elements.push(
        <p
          key={`strat-${i}`}
          className="my-1.5 text-[11.5px] leading-relaxed text-[#E5A93C] font-medium"
        >
          {renderInlineTokens(content, isDark)}
        </p>
      );
      i += 1;
      continue;
    }

    // Numbered List Items
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 ps-0.5">
          <span className="w-4 h-4 rounded-full bg-[#ff6f1e] text-white font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <div className="flex-1 leading-relaxed">{renderInlineTokens(numMatch[2], isDark)}</div>
        </div>
      );
      i += 1;
      continue;
    }

    // Bullet List Items (-, •, *)
    const bulletMatch = trimmed.match(/^(?:[-•*]|\u2022)\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <div key={`bul-${i}`} className="flex items-start gap-2 my-1 ps-1">
          <span className="text-[#ff6f1e] text-[10px] leading-5 shrink-0">◆</span>
          <div className="flex-1 leading-relaxed">{renderInlineTokens(bulletMatch[1], isDark)}</div>
        </div>
      );
      i += 1;
      continue;
    }

    // Regular paragraph line
    elements.push(
      <p key={`p-${i}`} className="my-1 leading-relaxed">
        {renderInlineTokens(trimmed, isDark)}
      </p>
    );
    i += 1;
  }

  return <div className={`space-y-0.5 text-xs font-semibold ${isDark ? 'text-[#FAF8EE]' : 'text-[#171717]'}`}>{elements}</div>;
}
