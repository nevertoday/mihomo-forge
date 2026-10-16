/**
 * Strategy-group names carry a leading mark (🇺🇸 美国自动, 🤖 ChatGPT, 𝕏 Grok) because OpenClash shows them.
 * The interface shows the plain name, so line icons and text stay the only marks on screen;
 * config.yaml keeps the full name.
 */
// A leading token with no letters or digits of a real script (emoji, flags, symbols like 𝕏) is a mark.
const WORDY = /[\p{Script=Latin}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Cyrillic}\p{Nd}]/u

export function plain(name: string | undefined | null): string {
  const s = (name ?? '').trim()
  const m = /^(\S+)\s+(.+)$/su.exec(s)
  return m && !WORDY.test(m[1]) ? m[2] : s
}
