#!/usr/bin/env node
/**
 * Kafka Log Analyzer MCP Server
 *
 * Provides tools for analyzing Kafka logs, detecting anomalies,
 * and monitoring consumer lag.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { analyzeLog } from './tools/analyze_log.js';
import { getLag } from './tools/get_lag.js';

// Tool definitions
const TOOLS = [
  {
    name: 'analyze_log',
    description: '分析 Kafka 日志，检测异常并生成报告',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['paste', 'file'],
          description: '日志来源类型',
        },
        content: {
          type: 'string',
          description: '日志内容（source=paste 时使用）',
        },
        path: {
          type: 'string',
          description: '日志文件路径（source=file 时使用）',
        },
        focus: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['producer', 'consumer', 'broker', 'lag', 'error'],
          },
          description: '关注领域',
        },
        timeline: {
          type: 'string',
          enum: ['1m', '5m', '15m', '1h', '6h', '1d'],
          description: '时间窗口',
        },
      },
      required: ['source'],
    },
  },
  {
    name: 'get_lag',
    description: '获取 Kafka 消费积压指标（占位）',
    inputSchema: {
      type: 'object',
      properties: {
        cluster: {
          type: 'string',
          description: '集群名称',
        },
        consumer_group: {
          type: 'string',
          description: '消费者组',
        },
        topic: {
          type: 'string',
          description: '主题名称',
        },
      },
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: 'kafka-analyzer',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'analyze_log': {
        const result = await analyzeLog(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_lag': {
        const result = await getLag(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${message}`);
  }
});

// Start server
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Kafka Analyzer MCP Server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
