import { defineConfig } from 'vitepress'

export const en = defineConfig({
  lang: 'en',
  title: 'Kafka Log Analyzer',
  description: 'Intelligent Kafka log analysis tool for Claude Code',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'API Reference', link: '/api/mcp-tools', activeMatch: '/api/' },
      { text: 'Architecture', link: '/architecture/overview', activeMatch: '/architecture/' },
      { text: 'Deployment', link: '/deployment/guide', activeMatch: '/deployment/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Commands', link: '/guide/commands' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [{ text: 'MCP Tools', link: '/api/mcp-tools' }],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [{ text: 'Overview', link: '/architecture/overview' }],
        },
      ],
      '/deployment/': [
        {
          text: 'Deployment',
          items: [{ text: 'Guide', link: '/deployment/guide' }],
        },
      ],
    },

    editLink: {
      pattern: 'https://github.com/saqqdy/kafka-log-analyzer/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present saqqdy',
    },

    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },

    outline: {
      label: 'On this page',
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short',
      },
    },

    returnToTopLabel: 'Return to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme',
  },
})
