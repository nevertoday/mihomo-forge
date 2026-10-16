<script setup lang="ts">
import { APP_VERSION, REPO_URL } from '@/app/meta'
import { t } from '@/i18n'
</script>

<template>
  <!-- Compact, logo-free, last child of <main> (reference footer rule). -->
  <footer class="app-footer">
    <div class="meta">
      <span>© 2026 Mihomo Forge</span>
      <span dir="ltr">v{{ APP_VERSION }}</span>
      <span>{{ t('footer.license') }}</span>
    </div>
    <nav :aria-label="t('footer.label')">
      <a :href="`${REPO_URL}#readme`" target="_blank" rel="noopener">{{ t('footer.guide') }}</a>
      <a :href="`${REPO_URL}/blob/main/SECURITY.md`" target="_blank" rel="noopener">{{ t('footer.privacy') }}</a>
      <a :href="`${REPO_URL}/issues`" target="_blank" rel="noopener">{{ t('footer.issues') }}</a>
      <a :href="REPO_URL" target="_blank" rel="noopener">GitHub</a>
    </nav>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0 24px;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 4px var(--gutter);
  border-top: 1px solid var(--line);
  background: var(--panel);
}
.meta, nav { display: flex; flex-wrap: wrap; gap: 0 14px; align-items: center; }
.meta { color: var(--muted); font-size: 11px; font-weight: 650; white-space: nowrap; }
nav a { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); font-size: 12px; font-weight: 800; text-decoration: none; }
nav a:hover { text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 700px) { .app-footer, .meta, nav { gap: 0 12px; } }
</style>
