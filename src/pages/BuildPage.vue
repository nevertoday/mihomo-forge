<script setup lang="ts">
import { ref } from 'vue'
import BuildReport from '@/components/BuildReport.vue'
import DownloadPanel from '@/components/DownloadPanel.vue'
import ImportGuide from '@/components/ImportGuide.vue'
import ProjectFileCard from '@/components/ProjectFileCard.vue'
import YamlSheet from '@/components/YamlSheet.vue'
import { t } from '@/i18n'

const showYaml = ref(false)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <p class="eyebrow">{{ t('buildPage.eyebrow') }}</p>
        <h1 class="page-title">{{ t('nav.build') }}</h1>
        <p class="page-lede">{{ t('buildPage.lede') }}</p>
      </div>
    </header>

    <div class="stack">
      <DownloadPanel @view-yaml="showYaml = true" />
      <ImportGuide />
    </div>

    <section class="section checks">
      <div class="section-head"><h2 class="section-title">{{ t('buildPage.checksTitle') }}</h2></div>
      <BuildReport hide-verdict />
    </section>

    <section class="section">
      <ProjectFileCard />
    </section>

    <YamlSheet v-if="showYaml" @close="showYaml = false" />
  </div>
</template>

<style scoped>
.section.checks { margin-top: 36px; }
</style>
