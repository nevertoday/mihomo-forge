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
  align-items: center;
  justify-content: space-between;
  gap: 0 var(--space-6);
  margin-top: auto;
  padding: var(--space-1) var(--gutter);
  border-top: 1px solid var(--line);
}
.meta, nav { display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--space-3); }
.meta { color: var(--muted); font-size: var(--text-2xs); line-height: var(--leading-xs); white-space: nowrap; }
nav a { display: inline-flex; align-items: center; min-height: var(--hit-min); color: var(--ink); font: var(--weight-medium) var(--text-xs) / var(--leading-xs) var(--font-body); text-decoration: none; }
nav a:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
