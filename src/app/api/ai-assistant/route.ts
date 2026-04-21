import { NextRequest, NextResponse } from 'next/server';
import { Db, Document } from 'mongodb';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';

/* ───────────────── CONFIG ───────────────── */

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-oss-120b:free';
const MAX_LLM_RETRIES = 3;

const PROJECT_ROOT = path.resolve(process.cwd());

const BLOCKED_PATTERNS = [
  '.env',
  'node_modules',
  '.next',
  '.git',
  'secret',
  'password',
  'private',
  'key',
];

const FORBIDDEN_STAGES = ['$out', '$merge', '$where', '$function'];

// FIX #2: Reduce max iterations from 8 → 4 (saves 4 potential LLM round-trips)
const MAX_ITERATIONS = 4;
// FIX #6: Add timeout so requests don't hang forever
const LLM_TIMEOUT_MS = 30_000;

/* ───────────────── SAFETY ───────────────── */

function isSafeToRead(filePath: string): boolean {
  const resolved = path.resolve(PROJECT_ROOT, filePath);
  if (!resolved.startsWith(PROJECT_ROOT)) return false;
  return !BLOCKED_PATTERNS.some((p) => resolved.toLowerCase().includes(p));
}

function isPipelineSafe(pipeline: any): boolean {
  // must be array
  if (!Array.isArray(pipeline)) return false;

  return !pipeline.some((stage: any) => {
    if (typeof stage !== 'object' || stage === null) return true;

    return Object.keys(stage).some((k) => FORBIDDEN_STAGES.includes(k));
  });
}

/* ───────────────── SCHEMA CACHE ───────────────── */

interface SchemaCache {
  builtAt: Date;
  summary: string;
}

let schemaCache: SchemaCache | null = null;
let warmUpPromise: Promise<void> | null = null;

const TYPE_DIRS = [
  'types',
  'lib',
  'models',
  'interfaces',
  'schema',
  'app/types',
];
const TYPE_KEYWORDS = [
  'interface ',
  'type ',
  'Schema',
  'model',
  'Invoice',
  'Stock',
  'Dealer',
  'Product',
];

function findTypeFiles(): string[] {
  const found: string[] = [];

  for (const dir of TYPE_DIRS) {
    const resolved = path.resolve(PROJECT_ROOT, dir);
    if (!fs.existsSync(resolved)) continue;

    const walk = (d: string) => {
      try {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          if (
            BLOCKED_PATTERNS.some((p) => entry.name.toLowerCase().includes(p))
          )
            continue;
          const full = path.join(d, entry.name);

          if (entry.isDirectory()) {
            walk(full);
            continue;
          }

          if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx'))
            continue;

          try {
            const preview = fs.readFileSync(full, 'utf8').slice(0, 500);
            if (TYPE_KEYWORDS.some((k) => preview.includes(k))) {
              found.push(path.relative(PROJECT_ROOT, full));
            }
          } catch {}
        }
      } catch {}
    };

    walk(resolved);
  }

  return found;
}

// FIX #7: Build schema cache using shared DB connection (no separate MongoClient)
async function buildSchemaCache(db: Db): Promise<void> {
  console.log('🔥 Building schema cache...');

  const lines: string[] = [];
  lines.push('DATABASE SCHEMA:');

  // FIX #4: Only include compact field lists, not full file contents or sample docs
  // This drastically reduces system prompt token count → faster LLM inference

  // Read type files (keep content compact — only interfaces)
  const typeFilePaths = findTypeFiles();
  if (typeFilePaths.length) {
    lines.push('\n── Type Definitions ──');
    for (const filePath of typeFilePaths) {
      const content = tool_read_file(filePath);
      if (!content.startsWith('Error:')) {
        // Extract only interface/type blocks, skip imports and implementations
        const compactContent = content
          .split('\n')
          .filter(
            (l) =>
              l.includes('interface ') ||
              l.includes('type ') ||
              l.trim().endsWith(';') ||
              l.trim() === '}' ||
              l.trim() === '{'
          )
          .slice(0, 50)
          .join('\n');
        if (compactContent.trim()) {
          lines.push(`\n${filePath}:`);
          lines.push(compactContent);
        }
      }
    }
  }

  // Sample collections — only field names + types, no full samples
  try {
    const collections = await db.listCollections().toArray();
    if (collections.length) {
      lines.push('\n── MongoDB Collections ──');
    }
    for (const col of collections) {
      try {
        const docs = await db.collection(col.name).find({}).limit(2).toArray();
        if (!docs.length) continue;

        const fields = new Map<string, string>();
        for (const doc of docs) {
          for (const [key, val] of Object.entries(doc)) {
            if (fields.has(key)) continue;
            let type: string = typeof val;
            if (val instanceof Date) type = 'Date';
            else if (Array.isArray(val)) type = `Array(${typeof val[0]})`;
            else if (val === null) type = 'null';
            fields.set(key, type);
          }
        }

        const fieldList = Array.from(fields.entries())
          .map(([k, v]) => `${k}:${v}`)
          .join(', ');

        lines.push(`${col.name}: { ${fieldList} }`);
      } catch (e: any) {
        console.warn(`⚠️ Could not sample ${col.name}`, e.message);
      }
    }
  } catch (e: any) {
    console.warn('Could not list collections', e.message);
  }

  lines.push('\nUSE FIELD NAMES EXACTLY. DO NOT GUESS.');

  schemaCache = {
    builtAt: new Date(),
    summary: lines.join('\n'),
  };

  console.log('✅ Schema cache built');
}

async function getSchemaCache(db: Db): Promise<SchemaCache> {
  if (schemaCache && Date.now() - schemaCache.builtAt.getTime() < 3600_000) {
    return schemaCache;
  }

  if (!warmUpPromise) {
    warmUpPromise = buildSchemaCache(db).finally(() => {
      warmUpPromise = null;
    });
  }

  await warmUpPromise;
  return schemaCache!;
}

/* ───────────────── TOOLS ───────────────── */

function tool_list_files(dir: string): string {
  try {
    const resolved = path.resolve(PROJECT_ROOT, dir);
    if (!resolved.startsWith(PROJECT_ROOT))
      return 'Error: Path outside project';

    const walk = (d: string, depth = 0): string[] => {
      if (depth > 3) return [];
      const entries = fs.readdirSync(d, { withFileTypes: true });
      const results: string[] = [];

      for (const entry of entries) {
        const rel = path.relative(PROJECT_ROOT, path.join(d, entry.name));
        if (BLOCKED_PATTERNS.some((p) => rel.toLowerCase().includes(p)))
          continue;

        if (entry.isDirectory()) {
          results.push(`📁 ${rel}/`);
          results.push(...walk(path.join(d, entry.name), depth + 1));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          results.push(`📄 ${rel}`);
        }
      }

      return results;
    };

    const files = walk(resolved);
    return files.join('\n') || 'No TypeScript files found.';
  } catch (e: any) {
    return `Error listing files: ${e.message}`;
  }
}

function tool_read_file(filePath: string): string {
  try {
    if (!isSafeToRead(filePath)) return 'Error: File is not allowed.';
    const resolved = path.resolve(PROJECT_ROOT, filePath);
    if (!fs.existsSync(resolved)) return `Error: File not found: ${filePath}`;
    const content = fs.readFileSync(resolved, 'utf8');
    return content.length > 4000
      ? content.slice(0, 4000) + '\n\n... [truncated]'
      : content;
  } catch (e: any) {
    return `Error reading file: ${e.message}`;
  }
}

async function tool_query_db(
  db: Db,
  collection: string,
  pipeline: Document[]
): Promise<string> {
  // 🔧 normalize pipeline
  if (!Array.isArray(pipeline)) {
    // if LLM returned a plain object → wrap it as $match
    if (typeof pipeline === 'object' && pipeline !== null) {
      pipeline = [{ $match: pipeline }];
    } else {
      return 'Main database se search nahi kar sakta kyun ke query samajh nahi aayi.';
    }
  }

  if (!isPipelineSafe(pipeline)) {
    throw new Error('Unsafe pipeline');
  }

  try {
    const safePipeline: Document[] = JSON.parse(
      JSON.stringify(pipeline),
      (_key, value) => {
        if (value && typeof value === 'object' && '$date' in value)
          return new Date(value['$date']);
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))
          return new Date(value);
        return value;
      }
    );

    const result = await db
      .collection(collection)
      .aggregate(safePipeline)
      .toArray();
    return JSON.stringify(result, null, 2);
  } catch (e: any) {
    return `Error running query: ${e.message}`;
  }
}

async function tool_list_collections(db: Db): Promise<string> {
  try {
    const collections = await db.listCollections().toArray();
    return collections.map((c: any) => c.name).join(', ');
  } catch (e: any) {
    return `Error listing collections: ${e.message}`;
  }
}

async function tool_sample_collection(
  db: Db,
  collection: string
): Promise<string> {
  try {
    const docs = await db.collection(collection).find({}).limit(2).toArray();
    return JSON.stringify(docs, null, 2);
  } catch (e: any) {
    return `Error sampling collection: ${e.message}`;
  }
}

/* ───────────────── AI TOOLS ───────────────── */

// FIX #3: Much more specific tool descriptions → LLM queries directly instead of exploring
const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'query_database',
      description:
        'Run a MongoDB aggregation pipeline on a collection. Collections include: sales, products, customers, invoices, stockHistory, brands, categories. Use $match, $group, $sort, $limit, $project, $unwind, $lookup. Dates are stored as ISO strings. Always use this tool FIRST for data questions.',
      parameters: {
        type: 'object',
        properties: {
          collection: {
            type: 'string',
            description: 'MongoDB collection name',
          },
          pipeline: {
            type: 'array',
            items: { type: 'object' },
            description: 'MongoDB aggregation pipeline stages',
          },
        },
        required: ['collection', 'pipeline'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_collections',
      description:
        'List all MongoDB collection names. Only use if you are unsure which collection to query.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sample_collection',
      description:
        'Get 2 sample documents from a collection to understand its schema. Only use if field names in the schema are unclear.',
      parameters: {
        type: 'object',
        properties: {
          collection: { type: 'string' },
        },
        required: ['collection'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description:
        'Read a TypeScript source file from the project. Only use for code-related questions.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description:
        'List TypeScript files in a project directory. Only use for code-related questions.',
      parameters: {
        type: 'object',
        properties: {
          dir: { type: 'string' },
        },
        required: ['dir'],
      },
    },
  },
];

/* ───────────────── RESULT SUMMARIZER ───────────────── */

function summarizeResult(text: string) {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data) && data.length === 1 && data[0].total) {
      return `Total: Rs ${Number(data[0].total).toLocaleString('en-PK')}`;
    }
  } catch {}
  return text;
}

/* ───────────────── LLM CALL WITH TIMEOUT + RETRY ───────────────── */

async function callLLMWithTimeout(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.ChatCompletionTool[]
): Promise<OpenAI.Chat.ChatCompletion> {
  let lastError: any;

  for (let attempt = 0; attempt < MAX_LLM_RETRIES; attempt++) {
    // Retry same model with backoff on 429
    const model = AI_MODEL;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    try {
      const response = await openai.chat.completions.create(
        {
          model,
          messages,
          tools,
          tool_choice: 'auto',
        },
        { signal: controller.signal }
      );
      return response;
    } catch (e: any) {
      lastError = e;
      clearTimeout(timer);

      const status = e?.status || e?.response?.status;
      if (status === 429) {
        console.warn(
          `⚠️ 429 rate-limited on ${model}, trying fallback... (attempt ${attempt + 1}/${MAX_LLM_RETRIES})`
        );
        // Brief delay before retry
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      // Non-429 errors: throw immediately
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

/* ───────────────── AGENT LOOP ───────────────── */

async function runAgentLoop(
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  db: Db,
  storeData?: any
): Promise<string> {
  const now = new Date();
  const cached = await getSchemaCache(db);

  // Build store data section if available (sent from frontend Jotai atoms)
  let storeSection = '';
  if (storeData) {
    console.log('📦 Store data received:', {
      categories: storeData.categories?.length || 0,
      brands: storeData.brands?.length || 0,
      stockItems: storeData.stockSummary?.items?.length || 0,
      invoices: storeData.invoiceSummary?.totalInvoices || 0,
    });
  } else {
    console.log('⚠️ No store data received from frontend');
  }
  if (storeData) {
    const parts: string[] = [
      '\n── LIVE APP DATA (from client store, use this FIRST before querying DB) ──',
    ];
    if (storeData.categories?.length) {
      parts.push(`Categories: ${storeData.categories.join(', ')}`);
    }
    if (storeData.brands?.length) {
      parts.push(`Brands: ${storeData.brands.join(', ')}`);
    }
    if (storeData.stockSummary) {
      parts.push(
        `Total Products in Stock: ${storeData.stockSummary.totalProducts}`
      );
      if (storeData.stockSummary.items?.length) {
        const stockLines = storeData.stockSummary.items.map(
          (s: any) => `${s.brand} ${s.name}: qty=${s.qty}, price=Rs${s.price}`
        );
        parts.push('Stock Items:\n' + stockLines.join('\n'));
      }
    }
    if (storeData.invoiceSummary) {
      const inv = storeData.invoiceSummary;
      parts.push(
        `Invoices: ${inv.totalInvoices} total, Revenue=Rs${inv.totalRevenue?.toLocaleString('en-PK')}, Received=Rs${inv.totalReceived?.toLocaleString('en-PK')}, Pending=Rs${inv.totalPending?.toLocaleString('en-PK')}`
      );
      if (inv.recentInvoices?.length) {
        const invLines = inv.recentInvoices.map(
          (i: any) =>
            `#${i.no} ${i.customer}: Rs${i.total} (${i.status}, remaining Rs${i.remaining})`
        );
        parts.push('Recent Invoices:\n' + invLines.join('\n'));
      }
    }
    storeSection = parts.join('\n');
  }

  const systemPrompt = `You are an AI assistant for Mudasir Traders (battery dealership in Pakistan).

CRITICAL LANGUAGE RULE (HIGHEST PRIORITY):
You MUST reply using the EXACT SAME script/alphabet as the user's message.
- If user writes in ROMAN URDU using Latin/English letters (e.g. "kitna stock ha", "total sales batao", "profit kiya ha"), you MUST reply in ROMAN URDU using Latin/English letters ONLY. Example: "Total stock Rs 11,264,878 ka hai."
- If user writes in Urdu script (e.g. "کل اسٹاک کتنا ہے"), reply in Urdu script.
- If user writes in English, reply in English.
- NEVER use Urdu/Arabic script (اردو) when the user wrote in Latin letters. This is STRICTLY FORBIDDEN.

RULES:
- If LIVE APP DATA is provided below, use it FIRST to answer. Only use query_database tool if the data is not available in the store or if you need filtered/aggregated results.
- ALWAYS use query_database tool for date-filtered or complex aggregation queries.
- Use the schema below for exact field names. NEVER guess field names.
- NEVER use $out, $merge, $where, $function in pipelines.
- If a query returns empty or error, check field names against schema and retry ONCE.
- Keep answers concise. Use Rs for currency.
- If no date range specified, assume current month.
${storeSection}

${cached.summary}

CURRENT TIME: ${now.toISOString()}
Month start: ${new Date(now.getFullYear(), now.getMonth(), 1).toISOString()}
Year start: ${new Date(now.getFullYear(), 0, 1).toISOString()}

REMINDER: If the user's message uses Latin/English letters (even if the language is Urdu), your response MUST also use Latin/English letters only. NO Urdu script.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    // FIX #10: Only keep last 4 history messages to reduce token count
    ...history.slice(-4),
    { role: 'user', content: userMessage },
  ];

  // FIX #2: Reduced from 8 to MAX_ITERATIONS (4)
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    try {
      const llmStart = Date.now();
      const response = await callLLMWithTimeout(messages, TOOLS);
      console.log(
        `⏱️ LLM call #${iteration + 1} took ${Date.now() - llmStart}ms`
      );

      const message = response.choices[0].message;
      messages.push(message);

      if (!message.tool_calls || message.tool_calls.length === 0) {
        console.log(
          `✅ LLM answered directly on iteration #${iteration + 1} (no tool calls)`
        );
        return message.content || 'No answer.';
      }

      console.log(
        `🔧 LLM requested ${message.tool_calls.length} tool call(s) on iteration #${iteration + 1}:`,
        message.tool_calls.map((tc: any) => tc.function?.name)
      );

      // FIX #5: Execute tool calls in parallel instead of sequentially
      const toolResults = await Promise.all(
        message.tool_calls
          .filter((tc) => tc.type === 'function')
          .map(async (toolCall) => {
            const name = toolCall.function.name;
            let args: any;
            try {
              args = JSON.parse(toolCall.function.arguments || '{}');
            } catch {
              return {
                id: toolCall.id,
                result: 'Error: Invalid JSON arguments',
              };
            }

            let result = '';

            switch (name) {
              case 'list_files':
                result = tool_list_files(args.dir || '.');
                break;
              case 'read_file':
                result = tool_read_file(args.path || '');
                break;
              case 'list_collections':
                result = await tool_list_collections(db);
                break;
              case 'sample_collection':
                result = await tool_sample_collection(
                  db,
                  args.collection || ''
                );
                break;
              case 'query_database':
                result = await tool_query_db(
                  db,
                  args.collection || '',
                  args.pipeline || []
                );
                break;
              default:
                result = `Unknown tool: ${name}`;
            }

            console.log(`  📊 Tool [${name}] result: ${result.length} chars`);
            return { id: toolCall.id, result, name };
          })
      );

      // Push all tool results back
      let hasError = false;
      for (const tr of toolResults) {
        messages.push({
          role: 'tool',
          tool_call_id: tr.id,
          content: tr.result,
        });
        if (
          tr.name === 'query_database' &&
          (tr.result.startsWith('Error') || tr.result === '[]')
        ) {
          hasError = true;
        }
      }

      if (hasError) {
        messages.push({
          role: 'system',
          content:
            'Query failed or empty. Re-check field names against schema and retry.',
        });
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return 'Request timed out. Please try again with a simpler question.';
      }
      console.error('LLM error:', e.message);
      return 'An error occurred while processing your request.';
    }
  }

  return 'Unable to answer after retries.';
}

/* ───────────────── API ROUTE ───────────────── */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { message, history = [], storeData } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY missing' },
        { status: 500 }
      );
    }

    if (typeof message !== 'string' || message.trim().length < 2) {
      return NextResponse.json({
        response: 'Please ask a valid question.',
        timestamp: new Date().toISOString(),
      });
    }

    // FIX #8: Reuse the app's shared MongoDB connection instead of creating a separate one
    const db = await connectToMongoDB();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // FIX #7: Pre-warm schema cache in background (non-blocking for first request)
    if (!schemaCache) {
      getSchemaCache(db).catch((e: any) => console.warn('Warm-up error:', e));
    }

    // FIX #9: Removed the date-range gate that blocked valid questions
    // The LLM can now infer "current month" as default via system prompt

    const response = await runAgentLoop(message, history, db, storeData);

    const elapsed = Date.now() - startTime;
    console.log(`🤖 AI response in ${elapsed}ms`);

    return NextResponse.json({
      response: summarizeResult(response),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
