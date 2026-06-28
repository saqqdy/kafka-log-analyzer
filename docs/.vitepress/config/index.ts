import { defineConfig } from 'vitepress'
import { en } from './en'
import { shared } from './shared'
import { zh } from './zh'

export default defineConfig({
  ...shared,

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      ...en,
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      ...zh,
    },
  },
})
