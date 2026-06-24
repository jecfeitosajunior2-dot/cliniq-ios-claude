import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface MockUser {
  id: string;
}

interface MockCaseRow {
  id: string;
  user_id: string;
  status: string;
  consent_confirmed_at: string | null;
  legacy_pre_consent: boolean;
  audio_path: string | null;
  case_data: unknown;
  transcription: unknown;
  intelligence: unknown;
  cost_usd: number;
}

type RpcResult = { data: unknown; error: { message: string } | null };
type RpcImpl = (fn: string, args: Record<string, unknown>) => Promise<RpcResult> | RpcResult;

function buildServerSupabaseMock(opts: { user: MockUser | null; caseRow: MockCaseRow | null }) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: opts.user } })) },
    from: vi.fn((table: string) => {
      if (table !== 'cases') throw new Error(`tabela inesperada: ${table}`);
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: opts.caseRow, error: null }),
            }),
          }),
        }),
      };
    }),
    // Deliberadamente SEM `.rpc`: begin/finish_case_operation não passam mais
    // pelo client de sessão (item 1). Se algum código regredir e chamar
    // supabase.rpc(...) neste client, o teste quebra com "rpc is not a
    // function" em vez de passar silenciosamente.
  };
}

function buildPrivilegedSupabaseMock(opts: { rpcImpl?: RpcImpl } = {}) {
  const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
  const updateCalls: Record<string, unknown>[] = [];

  const defaultRpc: RpcImpl = (fn) => {
    if (fn === 'begin_case_operation') return { data: { id: 'op-1' }, error: null };
    return { data: null, error: null };
  };
  const rpcImpl = opts.rpcImpl ?? defaultRpc;

  const mock = {
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      return rpcImpl(fn, args);
    }),
    from: vi.fn((table: string) => {
      if (table !== 'cases') throw new Error(`tabela inesperada: ${table}`);
      return {
        update: (payload: Record<string, unknown>) => {
          updateCalls.push(payload);
          return { eq: () => ({ eq: async () => ({ error: null }) }) };
        },
      };
    }),
    // Sem URL assinada disponível neste mock: a rota cai no 502 de "não foi
    // possível acessar o áudio" sem nunca chamar a OpenAI — caminho seguro
    // para os testes desta suíte, que focam em quota/posse/consentimento, não
    // no pipeline de transcrição em si.
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: null, error: { message: 'sem url assinada (mock)' } }),
      }),
    },
  };

  return { mock, rpcCalls, updateCalls };
}

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: { stream: vi.fn() },
  })),
}));

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.ANTHROPIC_API_KEY = 'test-key';
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/lib/supabase/server');
  vi.doUnmock('@/lib/supabase/privileged');
});

function mockServer(user: MockUser | null, caseRow: MockCaseRow | null) {
  vi.doMock('@/lib/supabase/server', () => ({
    getSupabaseServer: vi.fn(async () => buildServerSupabaseMock({ user, caseRow })),
  }));
}

function mockPrivileged(opts: { rpcImpl?: RpcImpl } = {}) {
  const built = buildPrivilegedSupabaseMock(opts);
  vi.doMock('@/lib/supabase/privileged', () => ({
    getPrivilegedSupabase: vi.fn(() => built.mock),
    isPrivilegedSupabaseConfigured: vi.fn(() => true),
  }));
  return built;
}

describe('rotas de processamento exigem sessão antes de qualquer chamada externa (401)', () => {
  it('POST /api/transcribe sem sessão retorna 401 e nunca chama a OpenAI', async () => {
    mockServer(null, null);
    mockPrivileged();
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { POST } = await import('@/app/api/transcribe/route');

    const req = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('POST /api/detective sem sessão retorna 401 e nunca chama a Anthropic', async () => {
    mockServer(null, null);
    mockPrivileged();
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { POST } = await import('@/app/api/detective/route');

    const req = new Request('http://localhost/api/detective', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(Anthropic).not.toHaveBeenCalled();
  });
});

describe('rota de transcrição rejeita caso de outro usuário (403) antes de baixar áudio', () => {
  it('caseId pertencente a outro usuário retorna 403, nunca chama a OpenAI nem reserva quota', async () => {
    // O servidor filtra por user_id na query — um caso de outro dono nunca aparece (data: null).
    mockServer({ id: 'user-a' }, null);
    const priv = mockPrivileged();
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { POST } = await import('@/app/api/transcribe/route');

    const req = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-de-outro-usuario' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(priv.rpcCalls).toHaveLength(0);
    fetchSpy.mockRestore();
  });
});

describe('rota de transcrição exige consentimento persistido (422)', () => {
  it('caso sem consent_confirmed_at e sem legacy_pre_consent retorna 422, nunca chama a OpenAI nem reserva quota', async () => {
    const caseRow: MockCaseRow = {
      id: 'case-1',
      user_id: 'user-a',
      status: 'recorded',
      consent_confirmed_at: null,
      legacy_pre_consent: false,
      audio_path: 'user-a/case-1/audio.webm',
      case_data: null,
      transcription: null,
      intelligence: null,
      cost_usd: 0,
    };
    mockServer({ id: 'user-a' }, caseRow);
    const priv = mockPrivileged();
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { POST } = await import('@/app/api/transcribe/route');

    const req = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(422);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(priv.rpcCalls).toHaveLength(0);
    fetchSpy.mockRestore();
  });
});

describe('rota de transcrição nunca reprocessa caso legado (item 5)', () => {
  it('caso com legacy_pre_consent=true retorna 403, nunca chama a OpenAI nem reserva quota', async () => {
    const caseRow: MockCaseRow = {
      id: 'case-1',
      user_id: 'user-a',
      status: 'recorded',
      consent_confirmed_at: null,
      legacy_pre_consent: true,
      audio_path: 'user-a/case-1/audio.webm',
      case_data: null,
      transcription: null,
      intelligence: null,
      cost_usd: 0,
    };
    mockServer({ id: 'user-a' }, caseRow);
    const priv = mockPrivileged();
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { POST } = await import('@/app/api/transcribe/route');

    const req = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(priv.rpcCalls).toHaveLength(0);
    fetchSpy.mockRestore();
  });
});

describe('quota e idempotência são fail-closed (item 1/2/3)', () => {
  const validCaseRow: MockCaseRow = {
    id: 'case-1',
    user_id: 'user-a',
    status: 'recorded',
    consent_confirmed_at: '2026-06-23T10:00:00.000Z',
    legacy_pre_consent: false,
    audio_path: 'user-a/case-1/audio.webm',
    case_data: null,
    transcription: null,
    intelligence: null,
    cost_usd: 0,
  };

  it('falha de infraestrutura no RPC de quota retorna 503 e nunca chama a OpenAI', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    mockPrivileged({
      rpcImpl: (fn) => {
        if (fn === 'begin_case_operation') throw new Error('conexão recusada');
        return { data: { ok: true }, error: null };
      },
    });
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { POST } = await import('@/app/api/transcribe/route');

    const req = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('limite diário excedido retorna 429 e nunca chama a OpenAI', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    mockPrivileged({
      rpcImpl: (fn) => {
        if (fn === 'begin_case_operation') {
          return { data: null, error: { message: 'daily limit exceeded' } };
        }
        return { data: { ok: true }, error: null };
      },
    });
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { POST } = await import('@/app/api/transcribe/route');

    const req = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('operação duplicada concorrente (índice único parcial) retorna 409 na segunda chamada e nunca chama a OpenAI duas vezes', async () => {
    // Simula o que a constraint do banco garante: a 1ª chamada reserva
    // 'in_progress'; uma 2ª chamada concorrente para o MESMO caso colide
    // com o índice único parcial e o RPC traduz isso em 'duplicate operation
    // in progress' — sem depender de nenhum estado em memória do processo.
    let reserved = false;
    mockServer({ id: 'user-a' }, validCaseRow);
    mockPrivileged({
      rpcImpl: (fn) => {
        if (fn === 'begin_case_operation') {
          if (reserved) return { data: null, error: { message: 'duplicate operation in progress' } };
          reserved = true;
          return { data: { ok: true }, error: null };
        }
        return { data: { ok: true }, error: null };
      },
    });
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { POST } = await import('@/app/api/transcribe/route');

    const makeReq = () =>
      new Request('http://localhost/api/transcribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caseId: 'case-1' }),
      });

    const [resA, resB] = await Promise.all([POST(makeReq()), POST(makeReq())]);
    const statuses = [resA.status, resB.status].sort();

    // Uma das duas chamadas segue (e falha mais à frente, no download — não
    // o foco deste teste), a outra é barrada com 409 antes de qualquer
    // tentativa de chamar a OpenAI duas vezes para a mesma operação.
    expect(statuses).toContain(409);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('nunca chama supabase.rpc no client de sessão — begin/finish passam só pelo client privilegiado (item 1)', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    const priv = mockPrivileged();
    const { POST } = await import('@/app/api/transcribe/route');

    const req = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-1' }),
    });
    // Se o código regredisse e chamasse o `.rpc` do client de sessão (que o
    // mock acima não define), a chamada lançaria "rpc is not a function" e
    // este POST rejeitaria — em vez disso, completa normalmente até o 502
    // (sem signed URL no mock privilegiado).
    const res = await POST(req);

    expect(res.status).toBe(502);
    expect(priv.rpcCalls.some((c) => c.fn === 'begin_case_operation')).toBe(true);
  });

  it('begin_case_operation nunca recebe p_max_per_day — limite diário vem só do banco (item 2)', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    const priv = mockPrivileged();
    const { POST } = await import('@/app/api/transcribe/route');

    const req = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-1' }),
    });
    await POST(req);

    const beginCall = priv.rpcCalls.find((c) => c.fn === 'begin_case_operation');
    expect(beginCall).toBeDefined();
    expect(beginCall?.args).not.toHaveProperty('p_max_per_day');
    expect(Object.keys(beginCall?.args ?? {}).sort()).toEqual(
      ['p_case_id', 'p_operation', 'p_processing_job_id', 'p_user_id'].sort(),
    );
  });

  it('o processingJobId retornado por begin é exatamente o usado para fechar a operação em finish (item 3)', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    const priv = mockPrivileged();
    const { POST } = await import('@/app/api/transcribe/route');

    const req = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: 'case-1' }),
    });
    await POST(req);

    const beginCall = priv.rpcCalls.find((c) => c.fn === 'begin_case_operation');
    const finishCall = priv.rpcCalls.find((c) => c.fn === 'finish_case_operation');
    expect(beginCall).toBeDefined();
    expect(finishCall).toBeDefined();
    expect(finishCall?.args.p_processing_job_id).toBe(beginCall?.args.p_processing_job_id);
    // 502 no download do áudio (mock sem signed URL) conta como falha.
    expect(finishCall?.args.p_status).toBe('failed');
  });
});
