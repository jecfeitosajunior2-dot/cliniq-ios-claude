import { describe, it, expect, vi, afterEach } from 'vitest';

interface MockCaseRow {
  id: string;
  status: string;
  delete_status: string;
  legacy_pre_consent: boolean;
}

function buildSessionMock(opts: { user: { id: string } | null; caseRow: MockCaseRow | null }) {
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
  };
}

function mockServer(user: { id: string } | null, caseRow: MockCaseRow | null) {
  vi.doMock('@/lib/supabase/server', () => ({
    getSupabaseServer: vi.fn(async () => buildSessionMock({ user, caseRow })),
  }));
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/lib/supabase/client');
  vi.doUnmock('@/lib/supabase/server');
  vi.doUnmock('@/lib/supabase/privileged');
});

// =============================================================================
// A) lib/audio-upload.ts — orquestração client-side do fluxo de 3 passos.
// =============================================================================
describe('uploadAudio: fluxo de upload via signed URL (item 6)', () => {
  function mockClient(opts: { configured: boolean; uploadError?: { message: string } | null }) {
    const uploadToSignedUrl = vi.fn(async () => ({ error: opts.uploadError ?? null }));
    vi.doMock('@/lib/supabase/client', () => ({
      getSupabase: vi.fn(() =>
        opts.configured ? { storage: { from: () => ({ uploadToSignedUrl }) } } : null,
      ),
    }));
    return { uploadToSignedUrl };
  }

  function mockFetch(handlers: Record<string, () => Response | Promise<Response>>) {
    const calls: string[] = [];
    const spy = vi.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      const key = Object.keys(handlers).find((k) => url.includes(k));
      if (!key) throw new Error(`fetch não esperado neste teste: ${url}`);
      return handlers[key]();
    });
    return { spy, calls };
  }

  it('backend não configurado retorna erro sem nunca chamar fetch', async () => {
    mockClient({ configured: false });
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { uploadAudio } = await import('@/lib/audio-upload');
    const blob = new Blob(['x'], { type: 'audio/webm' });

    const result = await uploadAudio('case-1', blob, 'audio/webm');

    expect(result).toEqual({ ok: false, error: 'Backend não configurado.' });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('fluxo completo: pede token assinado, sobe o blob e confirma — retorna ok:true', async () => {
    const { uploadToSignedUrl } = mockClient({ configured: true });
    const { spy, calls } = mockFetch({
      '/audio-url': () =>
        new Response(JSON.stringify({ path: 'user-a/case-1/audio.webm', token: 'tok-1' }), { status: 200 }),
      '/audio-confirm': () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    });
    const { uploadAudio } = await import('@/lib/audio-upload');
    const blob = new Blob(['x'], { type: 'audio/webm' });

    const result = await uploadAudio('case-1', blob, 'audio/webm');

    expect(result).toEqual({ ok: true });
    expect(uploadToSignedUrl).toHaveBeenCalledWith('user-a/case-1/audio.webm', 'tok-1', blob, {
      contentType: 'audio/webm',
    });
    expect(calls).toHaveLength(2);
    spy.mockRestore();
  });

  it('audio-url retorna erro: propaga a mensagem e nunca tenta subir o blob', async () => {
    const { uploadToSignedUrl } = mockClient({ configured: true });
    const { spy } = mockFetch({
      '/audio-url': () =>
        new Response(JSON.stringify({ error: 'Tipo de áudio não suportado.' }), { status: 400 }),
    });
    const { uploadAudio } = await import('@/lib/audio-upload');
    const blob = new Blob(['x'], { type: 'audio/webm' });

    const result = await uploadAudio('case-1', blob, 'audio/webm');

    expect(result).toEqual({ ok: false, error: 'Tipo de áudio não suportado.' });
    expect(uploadToSignedUrl).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('falha de rede ao pedir o token assinado retorna erro sem lançar', async () => {
    mockClient({ configured: true });
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const { uploadAudio } = await import('@/lib/audio-upload');
    const blob = new Blob(['x'], { type: 'audio/webm' });

    const result = await uploadAudio('case-1', blob, 'audio/webm');

    expect(result).toEqual({
      ok: false,
      error: 'Falha de rede ao preparar o envio do áudio. Tente novamente.',
    });
    fetchSpy.mockRestore();
  });

  it('uploadToSignedUrl falha: retorna erro e nunca chama audio-confirm', async () => {
    mockClient({ configured: true, uploadError: { message: 'falha simulada de upload' } });
    const { spy, calls } = mockFetch({
      '/audio-url': () =>
        new Response(JSON.stringify({ path: 'user-a/case-1/audio.webm', token: 'tok-1' }), { status: 200 }),
    });
    const { uploadAudio } = await import('@/lib/audio-upload');
    const blob = new Blob(['x'], { type: 'audio/webm' });

    const result = await uploadAudio('case-1', blob, 'audio/webm');

    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(1); // só /audio-url; /audio-confirm nunca chamado
    spy.mockRestore();
  });

  it('audio-confirm retorna erro: propaga a mensagem mesmo com upload bem-sucedido', async () => {
    mockClient({ configured: true });
    const { spy } = mockFetch({
      '/audio-url': () =>
        new Response(JSON.stringify({ path: 'user-a/case-1/audio.webm', token: 'tok-1' }), { status: 200 }),
      '/audio-confirm': () =>
        new Response(JSON.stringify({ error: 'Áudio não encontrado no armazenamento.' }), { status: 422 }),
    });
    const { uploadAudio } = await import('@/lib/audio-upload');
    const blob = new Blob(['x'], { type: 'audio/webm' });

    const result = await uploadAudio('case-1', blob, 'audio/webm');

    expect(result).toEqual({ ok: false, error: 'Áudio não encontrado no armazenamento.' });
    spy.mockRestore();
  });
});

// =============================================================================
// B) POST /api/cases/[id]/audio-url — emite o token de upload assinado.
// =============================================================================
describe('POST /api/cases/[id]/audio-url', () => {
  const validCaseRow: MockCaseRow = {
    id: 'case-1',
    status: 'draft',
    delete_status: 'active',
    legacy_pre_consent: false,
  };

  function mockPrivilegedUrl(opts: { signError?: { message: string } | null } = {}) {
    const createSignedUploadUrl = vi.fn(async (path: string) => {
      if (opts.signError) return { data: null, error: opts.signError };
      return { data: { path, token: 'signed-token-abc' }, error: null };
    });
    vi.doMock('@/lib/supabase/privileged', () => ({
      getPrivilegedSupabase: vi.fn(() => ({ storage: { from: () => ({ createSignedUploadUrl }) } })),
    }));
    return { createSignedUploadUrl };
  }

  const makeReq = (body: unknown) =>
    new Request('http://localhost/api/cases/case-1/audio-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('sem sessão retorna 401', async () => {
    mockServer(null, null);
    mockPrivilegedUrl();
    const { POST } = await import('@/app/api/cases/[id]/audio-url/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(401);
  });

  it('sem client privilegiado configurado retorna 503', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    vi.doMock('@/lib/supabase/privileged', () => ({ getPrivilegedSupabase: vi.fn(() => null) }));
    const { POST } = await import('@/app/api/cases/[id]/audio-url/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(503);
  });

  it('mimeType ausente ou não suportado retorna 400', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    mockPrivilegedUrl();
    const { POST } = await import('@/app/api/cases/[id]/audio-url/route');
    const res = await POST(makeReq({ mimeType: 'application/pdf' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(400);
  });

  it('caso de outro usuário (ou inexistente) retorna 403', async () => {
    mockServer({ id: 'user-a' }, null);
    mockPrivilegedUrl();
    const { POST } = await import('@/app/api/cases/[id]/audio-url/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(403);
  });

  it('caso legado (legacy_pre_consent=true) retorna 403', async () => {
    mockServer({ id: 'user-a' }, { ...validCaseRow, legacy_pre_consent: true });
    mockPrivilegedUrl();
    const { POST } = await import('@/app/api/cases/[id]/audio-url/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(403);
  });

  it('caso em processo de exclusão (delete_status != active) retorna 409', async () => {
    mockServer({ id: 'user-a' }, { ...validCaseRow, delete_status: 'deleting' });
    mockPrivilegedUrl();
    const { POST } = await import('@/app/api/cases/[id]/audio-url/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(409);
  });

  it('caso que não está em draft (já tem áudio) retorna 422', async () => {
    mockServer({ id: 'user-a' }, { ...validCaseRow, status: 'recorded' });
    mockPrivilegedUrl();
    const { POST } = await import('@/app/api/cases/[id]/audio-url/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(422);
  });

  it('sucesso: cria o token assinado para o path canônico user/case/audio.ext e retorna path+token', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    const priv = mockPrivilegedUrl();
    const { POST } = await import('@/app/api/cases/[id]/audio-url/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(priv.createSignedUploadUrl).toHaveBeenCalledWith('user-a/case-1/audio.webm');
    expect(body.path).toBe('user-a/case-1/audio.webm');
    expect(body.token).toBeTruthy();
  });

  it('falha ao criar o token assinado retorna 502', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    mockPrivilegedUrl({ signError: { message: 'falha simulada' } });
    const { POST } = await import('@/app/api/cases/[id]/audio-url/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(502);
  });
});

// =============================================================================
// C) POST /api/cases/[id]/audio-confirm — recalcula o path e marca `recorded`.
// =============================================================================
describe('POST /api/cases/[id]/audio-confirm', () => {
  const validCaseRow: MockCaseRow = {
    id: 'case-1',
    status: 'draft',
    delete_status: 'active',
    legacy_pre_consent: false,
  };

  function mockPrivilegedConfirm(
    opts: { existsError?: { message: string } | null; updateError?: { message: string } | null } = {},
  ) {
    const createSignedUrl = vi.fn(async () => {
      if (opts.existsError) return { data: null, error: opts.existsError };
      return { data: { signedUrl: 'https://example.test/signed' }, error: null };
    });
    const updateCalls: Record<string, unknown>[] = [];
    vi.doMock('@/lib/supabase/privileged', () => ({
      getPrivilegedSupabase: vi.fn(() => ({
        storage: { from: () => ({ createSignedUrl }) },
        from: vi.fn((table: string) => {
          if (table !== 'cases') throw new Error(`tabela inesperada: ${table}`);
          return {
            update: (payload: Record<string, unknown>) => {
              updateCalls.push(payload);
              return { eq: () => ({ eq: async () => ({ error: opts.updateError ?? null }) }) };
            },
          };
        }),
      })),
    }));
    return { createSignedUrl, updateCalls };
  }

  const makeReq = (body: unknown) =>
    new Request('http://localhost/api/cases/case-1/audio-confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('sem sessão retorna 401', async () => {
    mockServer(null, null);
    mockPrivilegedConfirm();
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(401);
  });

  it('sem client privilegiado configurado retorna 503', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    vi.doMock('@/lib/supabase/privileged', () => ({ getPrivilegedSupabase: vi.fn(() => null) }));
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(503);
  });

  it('mimeType ausente ou não suportado retorna 400', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    mockPrivilegedConfirm();
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    const res = await POST(makeReq({ mimeType: 'application/pdf' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(400);
  });

  it('caso de outro usuário (ou inexistente) retorna 403', async () => {
    mockServer({ id: 'user-a' }, null);
    mockPrivilegedConfirm();
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(403);
  });

  it('caso legado (legacy_pre_consent=true) retorna 403', async () => {
    mockServer({ id: 'user-a' }, { ...validCaseRow, legacy_pre_consent: true });
    mockPrivilegedConfirm();
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(403);
  });

  it('caso em processo de exclusão (delete_status != active) retorna 409', async () => {
    mockServer({ id: 'user-a' }, { ...validCaseRow, delete_status: 'deleting' });
    mockPrivilegedConfirm();
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(409);
  });

  it('caso que não está em draft (já confirmado antes) retorna 422', async () => {
    mockServer({ id: 'user-a' }, { ...validCaseRow, status: 'recorded' });
    mockPrivilegedConfirm();
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(422);
  });

  it('objeto inexistente no Storage retorna 422 e nunca marca o caso como recorded', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    const priv = mockPrivilegedConfirm({ existsError: { message: 'not found' } });
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });

    expect(res.status).toBe(422);
    expect(priv.updateCalls).toHaveLength(0);
  });

  it('sucesso: recalcula o path a partir de userId+caseId+mimeType — um path adulterado no corpo é ignorado', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    const priv = mockPrivilegedConfirm();
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    // O corpo só aceita `mimeType`; um campo `path` extra simula uma
    // tentativa de adulteração e deve ser simplesmente ignorado.
    const res = await POST(
      makeReq({ mimeType: 'audio/webm', path: 'outro-user/outro-case/audio.mp3' }),
      { params: Promise.resolve({ id: 'case-1' }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(priv.createSignedUrl).toHaveBeenCalledWith('user-a/case-1/audio.webm', 60);
    expect(priv.updateCalls).toEqual([{ audio_path: 'user-a/case-1/audio.webm', status: 'recorded' }]);
  });

  it('falha ao marcar o caso como recorded (nossa própria infra) retorna 502', async () => {
    mockServer({ id: 'user-a' }, validCaseRow);
    mockPrivilegedConfirm({ updateError: { message: 'falha simulada' } });
    const { POST } = await import('@/app/api/cases/[id]/audio-confirm/route');
    const res = await POST(makeReq({ mimeType: 'audio/webm' }), { params: Promise.resolve({ id: 'case-1' }) });
    expect(res.status).toBe(502);
  });
});
