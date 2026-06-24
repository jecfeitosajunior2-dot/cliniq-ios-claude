import { describe, it, expect, vi, afterEach } from 'vitest';

interface MockRow {
  id: string;
  user_id: string;
  audio_path: string | null;
  audio_removed: boolean;
  delete_status: string;
}

interface PrivilegedMockOpts {
  initialRow: MockRow | null;
  storageRemoveError?: { message: string } | null;
  storageRemoveThrows?: boolean;
  markRemovedError?: { message: string } | null;
  deleteRowError?: { message: string } | null;
}

/**
 * Todas as operações em `cases` e no Storage passam pelo client privilegiado
 * (service_role) desde a Fase 1R2 — RLS não se aplica sob esse papel, então
 * `.eq('user_id', userId)` em toda query é a única barreira contra afetar o
 * caso de outro usuário (replica exatamente os encadeamentos da rota real).
 */
function buildPrivilegedMock(opts: PrivilegedMockOpts) {
  let row: MockRow | null = opts.initialRow ? { ...opts.initialRow } : null;
  const removedPaths: string[][] = [];
  const updateCalls: Record<string, unknown>[] = [];

  const casesTable = {
    update: (payload: Record<string, unknown>) => {
      updateCalls.push(payload);
      if (payload.delete_status === 'deleting') {
        // Reivindicação atômica: só "avança" se a linha existe e está num
        // estado retomável — espelha o WHERE ... IN (...) real.
        return {
          eq: () => ({
            eq: () => ({
              in: (_col: string, statuses: string[]) => ({
                select: () => ({
                  maybeSingle: async () => {
                    if (!row || !statuses.includes(row.delete_status)) {
                      return { data: null, error: null };
                    }
                    row.delete_status = 'deleting';
                    return { data: { ...row }, error: null };
                  },
                }),
              }),
            }),
          }),
        };
      }
      return {
        eq: () => ({
          eq: async () => {
            // Só a marcação genuína de audio_removed (sem delete_status
            // junto) pode falhar neste mock — a marcação de delete_failed
            // (inclusive a combinada com audio_removed:true no caminho de
            // deleteRowError) sempre é aceita, para não testar cascata de
            // falha dupla nesta suíte.
            if (payload.audio_removed === true && payload.delete_status === undefined && opts.markRemovedError) {
              return { error: opts.markRemovedError };
            }
            if (row) Object.assign(row, payload);
            return { error: null };
          },
        }),
      };
    },
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (!row) return { data: null, error: null };
            return { data: { id: row.id, delete_status: row.delete_status }, error: null };
          },
        }),
      }),
    }),
    delete: () => ({
      eq: () => ({
        eq: async () => {
          if (opts.deleteRowError) return { error: opts.deleteRowError };
          row = null;
          return { error: null };
        },
      }),
    }),
  };

  const storageFrom = vi.fn(() => ({
    remove: async (paths: string[]) => {
      removedPaths.push(paths);
      if (opts.storageRemoveThrows) throw new Error('storage inalcançável (mock)');
      return { error: opts.storageRemoveError ?? null };
    },
  }));

  return {
    mock: {
      from: vi.fn((table: string) => {
        if (table !== 'cases') throw new Error(`tabela inesperada: ${table}`);
        return casesTable;
      }),
      storage: { from: storageFrom },
    },
    getRow: () => row,
    removedPaths,
    updateCalls,
    storageFrom,
  };
}

function mockServer(user: { id: string } | null) {
  const authGetUser = vi.fn(async () => ({ data: { user } }));
  vi.doMock('@/lib/supabase/server', () => ({
    getSupabaseServer: vi.fn(async () => ({ auth: { getUser: authGetUser } })),
    // Deliberadamente SEM `.from`/`.storage`: a rota DELETE não deve mais
    // tocar o client de sessão para nada além de auth.getUser() — toda
    // leitura/escrita de `cases` e Storage passa pelo client privilegiado.
  }));
}

function mockPrivileged(opts: PrivilegedMockOpts | null) {
  const built = opts ? buildPrivilegedMock(opts) : null;
  vi.doMock('@/lib/supabase/privileged', () => ({
    getPrivilegedSupabase: vi.fn(() => (built ? built.mock : null)),
  }));
  return built;
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/lib/supabase/server');
  vi.doUnmock('@/lib/supabase/privileged');
});

describe('exclusão sem sessão é rejeitada (401) sem tocar o client privilegiado', () => {
  it('retorna 401 sem reivindicar nenhum caso', async () => {
    mockServer(null);
    const priv = mockPrivileged({ initialRow: null });
    const { DELETE } = await import('@/app/api/cases/[id]/route');

    const req = new Request('http://localhost/api/cases/case-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'case-1' }) });

    expect(res.status).toBe(401);
    expect(priv?.mock.from).not.toHaveBeenCalled();
    expect(priv?.storageFrom).not.toHaveBeenCalled();
  });
});

describe('exclusão sem client privilegiado configurado é fail-closed (503)', () => {
  it('retorna 503 quando SUPABASE_SERVICE_ROLE_KEY não está configurada', async () => {
    mockServer({ id: 'user-a' });
    mockPrivileged(null);
    const { DELETE } = await import('@/app/api/cases/[id]/route');

    const req = new Request('http://localhost/api/cases/case-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'case-1' }) });
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe('delete_failed');
  });
});

describe('exclusão rejeita posse indevida (403) sem alterar o caso de outro usuário', () => {
  it('caso que não pertence ao usuário autenticado (ou não existe) retorna 403', async () => {
    mockServer({ id: 'user-a' });
    mockPrivileged({ initialRow: null });
    const { DELETE } = await import('@/app/api/cases/[id]/route');

    const req = new Request('http://localhost/api/cases/case-de-outro', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'case-de-outro' }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.status).toBe('delete_failed');
  });
});

describe('exclusão é idempotente quando o caso já foi totalmente apagado', () => {
  it('caso com delete_status=deleted retorna 200 sem tentar remover áudio de novo', async () => {
    const priv = mockPrivileged({
      initialRow: {
        id: 'case-1',
        user_id: 'user-a',
        audio_path: 'user-a/case-1/audio.webm',
        audio_removed: true,
        delete_status: 'deleted',
      },
    });
    mockServer({ id: 'user-a' });
    const { DELETE } = await import('@/app/api/cases/[id]/route');

    const req = new Request('http://localhost/api/cases/case-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'case-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('deleted');
    expect(priv?.removedPaths).toHaveLength(0);
  });
});

describe('exclusão concorrente é rejeitada (409)', () => {
  it('caso já em delete_status=deleting (outra requisição em andamento) retorna 409', async () => {
    mockServer({ id: 'user-a' });
    mockPrivileged({
      initialRow: {
        id: 'case-1',
        user_id: 'user-a',
        audio_path: 'user-a/case-1/audio.webm',
        audio_removed: false,
        delete_status: 'deleting',
      },
    });
    const { DELETE } = await import('@/app/api/cases/[id]/route');

    const req = new Request('http://localhost/api/cases/case-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'case-1' }) });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.status).toBe('delete_failed');
  });
});

describe('exclusão recuperável: falha parcial nunca é relatada como sucesso (item 6)', () => {
  it('Storage alcançável mas responde com falha na remoção retorna 502 (recuperável, não 200)', async () => {
    const priv = mockPrivileged({
      initialRow: {
        id: 'case-1',
        user_id: 'user-a',
        audio_path: 'user-a/case-1/audio.webm',
        audio_removed: false,
        delete_status: 'active',
      },
      storageRemoveError: { message: 'falha simulada no storage' },
    });
    mockServer({ id: 'user-a' });
    const { DELETE } = await import('@/app/api/cases/[id]/route');

    const req = new Request('http://localhost/api/cases/case-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'case-1' }) });
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.status).toBe('delete_failed');
    const row = priv?.getRow();
    expect(row?.delete_status).toBe('delete_failed');
    expect(row?.audio_removed).toBe(false);
  });

  it('Storage genuinamente inalcançável (exceção) retorna 503 (recuperável, não 200)', async () => {
    const priv = mockPrivileged({
      initialRow: {
        id: 'case-1',
        user_id: 'user-a',
        audio_path: 'user-a/case-1/audio.webm',
        audio_removed: false,
        delete_status: 'active',
      },
      storageRemoveThrows: true,
    });
    mockServer({ id: 'user-a' });
    const { DELETE } = await import('@/app/api/cases/[id]/route');

    const req = new Request('http://localhost/api/cases/case-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'case-1' }) });
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe('delete_failed');
    const row = priv?.getRow();
    expect(row?.delete_status).toBe('delete_failed');
    expect(row?.audio_removed).toBe(false);
  });

  it('falha (nossa própria infra) ao marcar audio_removed retorna 503, sem apagar a linha', async () => {
    const priv = mockPrivileged({
      initialRow: {
        id: 'case-1',
        user_id: 'user-a',
        audio_path: null, // sem áudio: pula direto para a marcação de audio_removed
        audio_removed: false,
        delete_status: 'active',
      },
      markRemovedError: { message: 'falha simulada ao marcar audio_removed' },
    });
    mockServer({ id: 'user-a' });
    const { DELETE } = await import('@/app/api/cases/[id]/route');

    const req = new Request('http://localhost/api/cases/case-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'case-1' }) });
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe('delete_failed');
    const row = priv?.getRow();
    expect(row?.delete_status).toBe('delete_failed');
  });

  it('retry após falha em apagar a linha (nossa própria infra, 503) retoma do ponto certo e conclui com sucesso (idempotente)', async () => {
    const opts: PrivilegedMockOpts = {
      initialRow: {
        id: 'case-1',
        user_id: 'user-a',
        audio_path: 'user-a/case-1/audio.webm',
        audio_removed: false,
        delete_status: 'active',
      },
      deleteRowError: { message: 'falha simulada ao apagar linha' },
    };
    const priv = mockPrivileged(opts);
    mockServer({ id: 'user-a' });
    const { DELETE } = await import('@/app/api/cases/[id]/route');

    const req1 = new Request('http://localhost/api/cases/case-1', { method: 'DELETE' });
    const res1 = await DELETE(req1, { params: Promise.resolve({ id: 'case-1' }) });
    const body1 = await res1.json();

    expect(res1.status).toBe(503);
    expect(body1.status).toBe('delete_failed');
    const rowAfterFirst = priv?.getRow();
    expect(rowAfterFirst?.delete_status).toBe('delete_failed');
    expect(rowAfterFirst?.audio_removed).toBe(true); // já marcado antes do passo que falhou
    expect(priv?.removedPaths).toEqual([['user-a/case-1/audio.webm']]);

    // Retry manual do usuário: sem o erro simulado, deve concluir.
    opts.deleteRowError = null;

    const req2 = new Request('http://localhost/api/cases/case-1', { method: 'DELETE' });
    const res2 = await DELETE(req2, { params: Promise.resolve({ id: 'case-1' }) });
    const body2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(body2.status).toBe('deleted');
    // Áudio não foi removido de novo na 2ª chamada — já estava audio_removed=true.
    expect(priv?.removedPaths).toHaveLength(1);
    expect(priv?.getRow()).toBeNull();
  });
});
