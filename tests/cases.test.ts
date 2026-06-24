import { describe, it, expect, vi, beforeEach } from 'vitest';

function buildSupabaseMock() {
  const insertedRows: Record<string, unknown>[] = [];
  let listResult: { data: unknown[] | null; error: { message: string } | null } = {
    data: [],
    error: null,
  };
  let getResult: { data: unknown | null; error: { message: string } | null } = {
    data: null,
    error: null,
  };

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'user-a' } } })),
    },
    from: vi.fn((table: string) => {
      if (table !== 'cases') throw new Error(`tabela inesperada: ${table}`);
      return {
        insert: (row: Record<string, unknown>) => {
          insertedRows.push(row);
          return {
            select: () => ({
              single: async () => ({ data: { id: 'case-1' }, error: null }),
            }),
          };
        },
        select: (cols: string) => {
          // getCase usa select('*'); listCases usa uma lista de colunas + filtros encadeados.
          if (cols === '*') {
            return { eq: () => ({ single: async () => getResult }) };
          }
          const builder = {
            neq: () => builder,
            order: () => builder,
            limit: async () => listResult,
          };
          return builder;
        },
      };
    }),
  };

  return {
    supabase,
    insertedRows,
    setListResult: (r: typeof listResult) => (listResult = r),
    setGetResult: (r: typeof getResult) => (getResult = r),
  };
}

let mock: ReturnType<typeof buildSupabaseMock>;

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: vi.fn(() => mock.supabase),
}));

beforeEach(() => {
  mock = buildSupabaseMock();
  vi.resetModules();
});

describe('createDraftCase persiste o consentimento no momento da criação (item 4)', () => {
  it('grava consent_confirmed_at e consent_text_version já na criação do rascunho', async () => {
    const { createDraftCase } = await import('@/lib/cases');
    const result = await createDraftCase();

    expect('id' in result && result.id).toBe('case-1');
    expect(mock.insertedRows).toHaveLength(1);
    expect(mock.insertedRows[0].consent_confirmed_at).toBeTruthy();
    expect(mock.insertedRows[0].consent_text_version).toBeTruthy();
  });

  it('nunca envia status/audio_path/etc. no insert — são server-controlled, sem GRANT para authenticated (item 4)', async () => {
    const { createDraftCase } = await import('@/lib/cases');
    await createDraftCase();

    const row = mock.insertedRows[0];
    expect(row.status).toBeUndefined();
    expect(row.audio_path).toBeUndefined();
    expect(row.legacy_pre_consent).toBeUndefined();
    expect(row.delete_status).toBeUndefined();
  });

  it('nunca cria o rascunho sem usuário autenticado', async () => {
    mock.supabase.auth.getUser = vi.fn(async () => ({ data: { user: null } }));
    const { createDraftCase } = await import('@/lib/cases');
    const result = await createDraftCase();

    expect('error' in result).toBe(true);
    expect(mock.insertedRows).toHaveLength(0);
  });
});

describe('regressão: nenhum dado de demonstração/fake é retornado pelas leituras de caso', () => {
  it('listCases retorna lista vazia quando não há casos reais — sem fallback de demonstração', async () => {
    mock.setListResult({ data: [], error: null });
    const { listCases } = await import('@/lib/cases');
    const result = await listCases();

    expect(result).toEqual([]);
  });

  it('listCases retorna vazio (fail-closed) em erro do banco, nunca dados inventados', async () => {
    mock.setListResult({ data: null, error: { message: 'falha simulada' } });
    const { listCases } = await import('@/lib/cases');
    const result = await listCases();

    expect(result).toEqual([]);
  });

  it('getCase retorna null quando o caso não existe — nunca um caso fictício', async () => {
    mock.setGetResult({ data: null, error: { message: 'not found' } });
    const { getCase } = await import('@/lib/cases');
    const result = await getCase('caso-inexistente');

    expect(result).toBeNull();
  });
});

describe('deleteCase chama a rota server-side autenticada e nunca apaga localmente', () => {
  it('reporta status "deleted" em sucesso', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'deleted' }), { status: 200 }),
    );
    const { deleteCase } = await import('@/lib/cases');
    const result = await deleteCase('case-1');

    expect(fetchSpy).toHaveBeenCalledWith('/api/cases/case-1', { method: 'DELETE' });
    expect(result).toEqual({ ok: true, status: 'deleted' });
    fetchSpy.mockRestore();
  });

  it('reporta status "delete_failed" sem afirmar sucesso quando o servidor falha parcialmente', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'delete_failed', error: 'falha no storage' }), { status: 200 }),
    );
    const { deleteCase } = await import('@/lib/cases');
    const result = await deleteCase('case-1');

    expect(result.ok).toBe(false);
    expect(result.status).toBe('delete_failed');
    fetchSpy.mockRestore();
  });
});
