---
slug: inspecting-mcp-servers-visually
title: "Inspecting the Model Context Protocol: Building a Visual JSON-RPC Workbench"
date: 2026-10-05
topic: AI Systems
tags: [MCP, JSON-RPC, TypeScript, Developer Tools, AI Agents]
summary: "Inside MCP Studio: turning raw Model Context Protocol JSON Schemas and JSON-RPC 2.0 traffic into an interactive browser IDE for testing agent tools, resources, and prompts."
diagram: mcp-jsonrpc
featured: false
projectName: "MCP Studio"
projectRepo: "https://github.com/mohsen-niksirat/Mcp-Studio"
projectLive: "https://mohsen-niksirat.github.io/Mcp-Studio/"
---

As AI coding agents and desktop assistants adopt the **Model Context Protocol (MCP)**, backend engineers suddenly find themselves building tool servers whose primary consumer is an LLM rather than a human clicking buttons. When a tool call fails, staring at interleaved `stdio` or Server-Sent Event JSON lines makes it surprisingly tedious to tell whether the bug lives in your Zod schema, your argument coercion, or the protocol handshake.

I built **[MCP Studio](https://mohsen-niksirat.github.io/Mcp-Studio/)** to bring the ergonomics of Postman and GraphQL Playground to MCP server development: connect an endpoint, inspect exposed capabilities, generate typed test forms automatically from `inputSchema`, and trace raw JSON-RPC 2.0 frames side by side.

{{DIAGRAM}}

## Anatomy of an MCP Capability Handshake

Underneath the SDK abstractions, MCP is clean stateful JSON-RPC 2.0. Before invoking any tool, a client and server negotiate protocol versions and capability flags (`tools`, `resources`, `prompts`, `logging`), followed by discovery calls:

```typescript
export interface JsonRpcRequest<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: T;
}

export async function negotiateMcpSession(send: (msg: JsonRpcRequest) => Promise<any>) {
  const initResult = await send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: { roots: { listChanged: false } },
      clientInfo: { name: "mcp-studio", version: "1.0.0" },
    },
  });

  const [toolsRes, resourcesRes, promptsRes] = await Promise.allSettled([
    initResult.capabilities?.tools ? send({ jsonrpc: "2.0", id: 2, method: "tools/list" }) : null,
    initResult.capabilities?.resources ? send({ jsonrpc: "2.0", id: 3, method: "resources/list" }) : null,
    initResult.capabilities?.prompts ? send({ jsonrpc: "2.0", id: 4, method: "prompts/list" }) : null,
  ]);

  return { initResult, toolsRes, resourcesRes, promptsRes };
}
```

Seeing the exact `capabilities` object immediately exposes a common mistake: registering tool handlers in code while forgetting to declare `capabilities: { tools: {} }` during server initialization.

## Compiling JSON Schema into Live Input Controls

An MCP tool's `inputSchema` is standard JSON Schema. Rather than forcing developers to hand-type nested JSON blobs on every test run, MCP Studio recursively maps schema nodes into accessible form fields while keeping a synchronized raw JSON tab:

* `type: "string"` with `enum` renders a `<select>` menu; plain strings render validated text inputs with `pattern` and `description` hints.
* `type: "number"` or `"integer"` enforces numeric stepping alongside `minimum` and `maximum` bounds.
* `type: "boolean"` renders a keyboard-accessible toggle switch.
* Nested `object` and `array` properties render collapsible fieldsets, flagging required keys before a single packet hits the wire.

Catching a missing `description` or ambiguous parameter name in a visual form is also the fastest way to improve **LLM tool-calling accuracy**: if a human tester cannot tell whether `limit` expects `10` or `"10"`, a language model will guess inconsistently too.

## Distinguishing Protocol Errors from Tool Execution Errors

One subtle detail in the MCP specification is the distinction between **JSON-RPC transport/protocol errors** (returned in the top-level `error` object, such as `-32602 Invalid params`) and **application-level tool errors** (returned inside `result` with `isError: true` so the LLM can read the failure message and self-correct).

MCP Studio highlights these two failure modes distinctly in the trace timeline, making it obvious whether an exception crashed your RPC transport or returned an actionable recovery hint to the agent.
