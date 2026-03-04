import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Document } from 'mongodb';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

/* ───────────────── CONFIG ───────────────── */

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

const MONGODB_URI = process.env.MONGODB_URI!;
const PROJECT_ROOT = path.resolve(process.cwd());

const BLOCKED_PATTERNS = [
  '.env', 'node_modules', '.next', '.git',
  'secret', 'password', 'private', 'key',
];

const FORBIDDEN_STAGES = ['$out', '$merge', '$where', '$function'];

/* ───────────────── INTENT DETECTION ───────────────── */

type Intent =
  | 'data_query'
  | 'schema_query'
  | 'code_query'
  | 'general_chat'
  | 'invalid';

function detectIntent(msg: string): Intent {
  const m = msg.toLowerCase();

  if (/(sale|sales|invoice|amount|kitni|count|total|sum|month|year|today|aaj|mahina|saal)/.test(m))
    return 'data_query';

  if (/(field|schema|type|interface|collection|column)/.test(m))
    return 'schema_query';

  if (/(file|code|typescript|model|read)/.test(m))
    return 'code_query';

  if (m.trim().length < 2) return 'invalid';

  return 'general_chat';
}

/* ───────────────── SAFETY ───────────────── */

function isSafeToRead(filePath: string): boolean {
  const resolved = path.resolve(PROJECT_ROOT, filePath);
  if (!resolved.startsWith(PROJECT_ROOT)) return false;
  return !BLOCKED_PATTERNS.some(p => resolved.toLowerCase().includes(p));
}

function isPipelineSafe(pipeline: any): boolean {
  // must be array
  if (!Array.isArray(pipeline)) return false;

  return !pipeline.some(stage => {
    if (typeof stage !== "object" || stage === null) return true;

    return Object.keys(stage).some(k =>
      FORBIDDEN_STAGES.includes(k)
    );
  });
}

/* ───────────────── SCHEMA CACHE ───────────────── */

interface SchemaCache {
  builtAt: Date;
  typeFiles: { path: string; content: string }[];
  collectionSamples: { name: string; sample: string; fields: string[] }[];
  summary: string;
}

let schemaCache: SchemaCache | null = null;
let warmUpPromise: Promise<void> | null = null;

const TYPE_DIRS = ['types', 'lib', 'models', 'interfaces', 'schema', 'app/types'];
const TYPE_KEYWORDS = ['interface ', 'type ', 'Schema', 'model', 'Invoice', 'Stock', 'Dealer', 'Product'];

function findTypeFiles(): string[] {
  const found: string[] = [];

  for (const dir of TYPE_DIRS) {
    const resolved = path.resolve(PROJECT_ROOT, dir);
    if (!fs.existsSync(resolved)) continue;

    const walk = (d: string) => {
      try {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          if (BLOCKED_PATTERNS.some(p => entry.name.toLowerCase().includes(p))) continue;
          const full = path.join(d, entry.name);

          if (entry.isDirectory()) {
            walk(full);
            continue;
          }

          if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;

          try {
            const preview = fs.readFileSync(full, 'utf8').slice(0, 500);
            if (TYPE_KEYWORDS.some(k => preview.includes(k))) {
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

async function buildSchemaCache(mongoClient: MongoClient): Promise<void> {
  console.log('🔥 Building schema cache...');
  const db = mongoClient.db();

  const cache: SchemaCache = {
    builtAt: new Date(),
    typeFiles: [],
    collectionSamples: [],
    summary: '',
  };

  const typeFilePaths = findTypeFiles();
  console.log(`Found ${typeFilePaths.length} type files`);

  for (const filePath of typeFilePaths) {
    const content = tool_read_file(filePath);
    if (!content.startsWith('Error:')) {
      cache.typeFiles.push({ path: filePath, content });
    }
  }

  try {
    const collections = await db.listCollections().toArray();
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

        const fieldList = Array.from(fields.entries()).map(([k, v]) => `${k}: ${v}`);

        cache.collectionSamples.push({
          name: col.name,
          sample: JSON.stringify(docs[0], null, 2).slice(0, 800),
          fields: fieldList,
        });

      } catch (e: any) {
        console.warn(`⚠️ Could not sample ${col.name}`, e.message);
      }
    }
  } catch (e: any) {
    console.warn('Could not list collections', e.message);
  }

  const lines: string[] = [];

  lines.push('═══════════════════════════════════════');
  lines.push('PRE-LOADED CODEBASE KNOWLEDGE:');

  if (cache.typeFiles.length) {
    lines.push('── Type Definitions ──');
    for (const f of cache.typeFiles) {
      lines.push(`\n📄 ${f.path}`);
      lines.push(f.content);
    }
  }

  if (cache.collectionSamples.length) {
    lines.push('── MongoDB Collections ──');
    for (const col of cache.collectionSamples) {
      lines.push(`\nCollection: ${col.name}`);
      lines.push(`Fields: ${col.fields.join(' | ')}`);
      lines.push(col.sample);
    }
  }

  lines.push('USE FIELD NAMES EXACTLY. DO NOT GUESS.');
  lines.push('═══════════════════════════════════════');

  cache.summary = lines.join('\n');
  schemaCache = cache;

  console.log('✅ Schema cache built');
}

async function getSchemaCache(mongoClient: MongoClient): Promise<SchemaCache> {
  if (schemaCache && (Date.now() - schemaCache.builtAt.getTime()) < 3600_000) {
    return schemaCache;
  }

  if (!warmUpPromise) {
    warmUpPromise = buildSchemaCache(mongoClient).finally(() => {
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
    if (!resolved.startsWith(PROJECT_ROOT)) return 'Error: Path outside project';

    const walk = (d: string, depth = 0): string[] => {
      if (depth > 3) return [];
      const entries = fs.readdirSync(d, { withFileTypes: true });
      const results: string[] = [];

      for (const entry of entries) {
        const rel = path.relative(PROJECT_ROOT, path.join(d, entry.name));
        if (BLOCKED_PATTERNS.some(p => rel.toLowerCase().includes(p))) continue;

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
  db: ReturnType<MongoClient['db']>,
  collection: string,
  pipeline: Document[]
): Promise<string> {
// 🔧 normalize pipeline
if (!Array.isArray(pipeline)) {
  // if LLM returned a plain object → wrap it as $match
  if (typeof pipeline === "object" && pipeline !== null) {
    pipeline = [{ $match: pipeline }];
  } else {
    return "Main database se search nahi kar sakta kyun ke query samajh nahi aayi.";
  }
}

if (!isPipelineSafe(pipeline)) {
  throw new Error("Unsafe pipeline");
}

  try {
    const safePipeline: Document[] = JSON.parse(
      JSON.stringify(pipeline),
      (_key, value) => {
        if (value && typeof value === 'object' && '$date' in value) return new Date(value['$date']);
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value);
        return value;
      }
    );

    const result = await db.collection(collection).aggregate(safePipeline).toArray();
    return JSON.stringify(result, null, 2);
  } catch (e: any) {
    return `Error running query: ${e.message}`;
  }
}

async function tool_list_collections(db: ReturnType<MongoClient['db']>): Promise<string> {
  try {
    const collections = await db.listCollections().toArray();
    return collections.map(c => c.name).join(', ');
  } catch (e: any) {
    return `Error listing collections: ${e.message}`;
  }
}

async function tool_sample_collection(
  db: ReturnType<MongoClient['db']>,
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

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List TypeScript files in a project directory.',
      parameters: {
        type: 'object',
        properties: {
          dir: { type: 'string' },
        },
        required: ['dir'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a TypeScript file.',
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
      name: 'list_collections',
      description: 'List MongoDB collections.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sample_collection',
      description: 'Sample MongoDB collection.',
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
      name: 'query_database',
      description: 'Run MongoDB aggregation.',
      parameters: {
        type: 'object',
        properties: {
          collection: { type: 'string' },
          pipeline: { type: 'array', items: { type: 'object' } },
        },
        required: ['collection', 'pipeline'],
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

/* ───────────────── AGENT LOOP ───────────────── */

async function runAgentLoop(
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  db: ReturnType<MongoClient['db']>,
  mongoClient: MongoClient
): Promise<string> {

  const now = new Date();
  const cached = await getSchemaCache(mongoClient);

  const systemPrompt = `
You are an AI assistant for Mudasir Traders.

RULES:
- ALWAYS query database for numeric answers.
- NEVER guess fields.
- NEVER use $out, $merge, $where, $function.
- Retry if query fails.
- Use schema below.

SCHEMA:
${cached.summary}

TIME:
Now: ${now.toISOString()}
Month start: ${new Date(now.getFullYear(), now.getMonth(), 1).toISOString()}
Year start: ${new Date(now.getFullYear(), 0, 1).toISOString()}
`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6),
    { role: 'user', content: userMessage },
  ];

  for (let iteration = 0; iteration < 8; iteration++) {
    const response = await openai.chat.completions.create({
      model: 'stepfun/step-3.5-flash:free',
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || 'No answer.';
    }

    for (const toolCall of message.tool_calls) {
      if (toolCall.type === 'function') {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || '{}');

        let result = '';

        switch (name) {
          case 'list_files':
            result = tool_list_files(args.dir);
            break;
          case 'read_file':
            result = tool_read_file(args.path);
            break;
          case 'list_collections':
            result = await tool_list_collections(db);
            break;
          case 'sample_collection':
            result = await tool_sample_collection(db, args.collection);
            break;
          case 'query_database':
            result = await tool_query_db(db, args.collection, args.pipeline);
            if (result.startsWith('Error') || result === '[]') {
              messages.push({
                role: 'system',
                content: 'Query failed or empty. Re-check field names and retry.',
              });
            }
            break;
          default:
            result = `Unknown tool: ${name}`;
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }
  }

  return 'Unable to answer after retries.';
}

/* ───────────────── API ROUTE ───────────────── */

let globalMongo: MongoClient | null = null;

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY missing' }, { status: 500 });
    }

    if (!MONGODB_URI) {
      return NextResponse.json({ error: 'MONGODB_URI missing' }, { status: 500 });
    }

    const intent = detectIntent(message);

    if (intent === 'invalid') {
      return NextResponse.json({
        response: 'Please ask a valid question.',
        timestamp: new Date().toISOString(),
      });
    }

    if (intent === 'data_query' && !/(today|month|year|\d{4})/.test(message.toLowerCase())) {
      return NextResponse.json({
        response: 'Aap kis date range ka data chahte ho? (today, this month, this year)',
        timestamp: new Date().toISOString(),
      });
    }

    if (!globalMongo) {
      globalMongo = new MongoClient(MONGODB_URI);
      await globalMongo.connect();
    }

    const db = globalMongo.db();

    if (!schemaCache) {
      getSchemaCache(globalMongo).catch(e => console.warn('Warm-up error:', e));
    }

    const response = await runAgentLoop(message, history, db, globalMongo);

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