<script setup lang="ts">
import { Download, FileCode2, Save } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import BuildReport from '@/components/BuildReport.vue'
import ProjectFileCard from '@/components/ProjectFileCard.vue'
import YamlSheet from '@/components/YamlSheet.vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const showYaml = ref(false)
const size = computed(() => `${(new Blob([store.build.yaml]).size / 1024).toFixed(1)} KB`)
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

    <BuildReport />

    <section class="section">
      <ProjectFileCard />
    </section>

    <div class="dock">
      <div class="dock-meta">
        <strong>config.yaml</strong><span class="num" dir="ltr">{{ size }}</span>
      </div>
      <span class="spacer"></span>
      <button type="button" class="btn btn-quiet" @click="showYaml = true"><FileCode2 />{{ t('buildPage.viewYaml') }}</button>
      <button type="button" class="btn btn-quiet" :disabled="!store.dirty" @click="store.save()"><Save />{{ t('topbar.save') }}</button>
      <button type="button" class="btn btn-primary" :disabled="!store.build.ok" @click="store.downloadConfig()"><Download />{{ t('buildPage.download') }}</button>
    </div>

    <YamlSheet v-if="showYaml" @close="showYaml = false" />
  </div>
</template>
