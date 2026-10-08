/**
 * Zweck:     Minimaler, sicherer Markdown-Renderer für Chat-Blasen (ohne dangerouslySetInnerHTML).
 *            Unterstützt **fett**, __fett__, *kursiv*, _kursiv_, Überschriften (#) und Aufzählungen (* / -).
 * Parameter: renderChatMarkdown(text: string) -> React.ReactNode
 * Revision:  v1.0 (2026-10-07)
 */
import React from 'react';

const INLINE_PATTERN =
  /(\*\*[^*\n]+\*\*|__[^_\n]+__|(?<![\w*])\*[^*\s][^*\n]*\*(?![\w*])|(?<![\w_])_[^_\s][^_\n]*_(?![\w_]))/g;

/** Wandelt eine einzelne Zeile in Text-/Fett-/Kursiv-Knoten um. */
function renderInline(line: string, keyPrefix: string): React.ReactNode[] {
  return line.split(INLINE_PATTERN).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (/^\*\*[^*\n]+\*\*$/.test(part) || /^__[^_\n]+__$/.test(part)) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (/^\*[^*\n]+\*$/.test(part) || /^_[^_\n]+_$/.test(part)) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

/** Rendert mehrzeiligen Markdown-Text; Zeilenumbrüche bleiben über whitespace-pre-wrap erhalten. */
export function renderChatMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^\s*[*-]\s+(.*)$/);
    let content: React.ReactNode;
    if (heading) {
      content = <strong>{renderInline(heading[1], `h${i}`)}</strong>;
    } else if (bullet) {
      content = <>{'• '}{renderInline(bullet[1], `b${i}`)}</>;
    } else {
      content = <>{renderInline(line, `l${i}`)}</>;
    }
    return (
      <React.Fragment key={`line-${i}`}>
        {content}
        {i < lines.length - 1 ? '\n' : null}
      </React.Fragment>
    );
  });
}
