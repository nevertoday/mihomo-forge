/* @xxd/extension — Copyright (c) 2026 小小东 (xiaoxiaodong.ai). MIT License. */
// 令牌里的颜色（亮 / 暗），给 service worker、OffscreenCanvas、通知用（它们拿不到 CSS 变量）。
export const TOKENS = {
  "light": {
    "--bg": "#fdfcfb",
    "--paper": "#ffffff",
    "--wash": "#f6f4f1",
    "--wash-strong": "#eeece9",
    "--selected-bg": "#eeece9",
    "--switch-on": "#111111",
    "--ink": "#111111",
    "--on-ink": "#ffffff",
    "--muted": "#6d6b67",
    "--muted-2": "#9a968d",
    "--line": "#e9e7e4",
    "--line-strong": "#ccc9c5",
    "--line-control": "#898681",
    "--paper-raised": "#ffffff",
    "--wash-raised": "#f6f4f1",
    "--wash-strong-raised": "#eeece9",
    "--line-raised": "#e9e7e4",
    "--disabled-ink": "#adaaa5",
    "--disabled-bg": "#f6f4f1",
    "--disabled-line": "#e9e7e4",
    "--success": "#15803d",
    "--danger": "#b42318",
    "--warning": "#b45309",
    "--success-strong": "#15803d",
    "--danger-strong": "#b42318",
    "--warning-strong": "#b45309"
  },
  "dark": {
    "--bg": "#171612",
    "--paper": "#201f1a",
    "--wash": "#2a2822",
    "--wash-strong": "#312f28",
    "--selected-bg": "#38362e",
    "--switch-on": "#cfc9bd",
    "--ink": "#f3f0ea",
    "--on-ink": "#171612",
    "--muted": "#a7a194",
    "--muted-2": "#837d72",
    "--line": "#34322b",
    "--line-strong": "#4c483f",
    "--line-control": "#807a6e",
    "--paper-raised": "#292720",
    "--wash-raised": "#33302a",
    "--wash-strong-raised": "#3b3830",
    "--line-raised": "#3f3c34",
    "--disabled-ink": "#66635d",
    "--disabled-bg": "#2a2822",
    "--disabled-line": "#34322b",
    "--success": "#7cc48a",
    "--danger": "#ec7a6d",
    "--warning": "#e8a95a",
    "--success-strong": "#2f7d47",
    "--danger-strong": "#d03a2f",
    "--warning-strong": "#a35f1b"
  }
};

const TONES = { neutral: "--ink", danger: "--danger", success: "--success", warning: "--warning" };

/** 工具栏图标上的徽章：setBadge("3", "danger")；setBadge("") 清掉。 */
export async function setBadge(text, tone = "neutral", { tabId } = {}) {
  const color = TOKENS.light[TONES[tone] ?? "--ink"];
  await chrome.action.setBadgeBackgroundColor({ color, tabId });
  await chrome.action.setBadgeTextColor?.({ color: "#ffffff", tabId });
  await chrome.action.setBadgeText({ text: String(text ?? ""), tabId });
}
