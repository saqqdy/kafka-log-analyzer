import { defineConfig } from 'vitepress'

export const shared = defineConfig({
  title: 'Kafka Log Analyzer',
  description: 'Intelligent Kafka log analysis tool for Claude Code',
  base: '/kafka-log-analyzer/',
  sitemap: {
    hostname: 'https://saqqdy.github.io/kafka-log-analyzer',
  },

  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'Kafka Log Analyzer | Documentation' }],
    ['meta', { name: 'og:description', content: 'Intelligent Kafka log analysis tool' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/saqqdy/kafka-log-analyzer' }],
  },
})
