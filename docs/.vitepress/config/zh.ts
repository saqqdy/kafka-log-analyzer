import { defineConfig } from 'vitepress'

export const zh = defineConfig({
  lang: 'zh-CN',
  title: 'Kafka Log Analyzer',
  description: 'Claude Code 智能 Kafka 日志分析工具',

  themeConfig: {
    nav: [
      { text: '指南', link: '/zh/guide/', activeMatch: '/zh/guide/' },
      { text: 'API 参考', link: '/zh/api/mcp-tools', activeMatch: '/zh/api/' },
      { text: '架构设计', link: '/zh/architecture/overview', activeMatch: '/zh/architecture/' },
      { text: '部署指南', link: '/zh/deployment/guide', activeMatch: '/zh/deployment/' },
    ],

    sidebar: {
      '/zh/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '介绍', link: '/zh/guide/' },
            { text: '快速开始', link: '/zh/guide/quick-start' },
            { text: '命令参考', link: '/zh/guide/commands' },
            { text: '配置', link: '/zh/guide/configuration' },
          ],
        },
      ],
      '/zh/api/': [
        {
          text: 'API 参考',
          items: [{ text: 'MCP Tools', link: '/zh/api/mcp-tools' }],
        },
      ],
      '/zh/architecture/': [
        {
          text: '架构设计',
          items: [{ text: '概览', link: '/zh/architecture/overview' }],
        },
      ],
      '/zh/deployment/': [
        {
          text: '部署指南',
          items: [{ text: '部署向导', link: '/zh/deployment/guide' }],
        },
      ],
    },

    editLink: {
      pattern: 'https://github.com/saqqdy/kafka-log-analyzer/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    footer: {
      message: '基于 MIT 许可发布',
      copyright: '版权所有 © 2026-present saqqdy',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      label: '页面导航',
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short',
      },
    },

    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色主题',
    darkModeSwitchTitle: '切换到深色主题',
  },
})
