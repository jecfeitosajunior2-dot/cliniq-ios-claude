import { describe, it, expect, vi, afterEach } from 'vitest';

type RpcResult = { data: unknown; error: { message: string } | null };
type RpcImpl = (fn: string, args: Record<string, unknown>) => Promise<RpcResult> | RpcResult;

function mockPrivileged(rpcImpl: RpcImpl | null) {
  const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
  vi.doMock('@/lib/supabase/privileged', () => ({
    getPrivilegedSupabase: vi.fn(() => {
      if (!rpcImpl) return null;
      return {
        rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
          rpcCalls.push({ fn, args });
          return rpcImpl(fn, args);
        }),
      };
    }),
  }));
  return rpcCalls;
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/lib/supabase/privileged');
});

describe('beginCaseOperation: client privilegiado não configurado é fail-closed (503)', () => {
  it('retorna 503 sem nunca tentar nenhuma chamada de rede', async () => {
    mockPrivileged(null);
    const { beginCaseOperation } = await import('@/lib/case-operations');
    const result = await beginCaseOperation('user-a', 'case-1', 'transcribe');

    expect(result).toEqual({
      ok: false,
      status: 503,
      error: 'Serviço de controle de uso não está configurado neste ambiente.',
    });
  });
});

describe('beginCaseOperation: mapeamento de mensagens do RPC para status HTTP', () => {
  const scenarios: { message: string; status: number }[] = [
    { message: 'unauthenticated', status: 401 },
    { message: 'case not found or not owned', status: 403 },
    { message: 'legacy case not processable', status: 403 },
    { message: 'case not active', status: 409 },
    { message: 'daily limit exceeded', status: 429 },
    { message: 'duplicate operation in progress', status: 409 },
    { message: 'algum erro de banco nunca antes visto', status: 503 },
  ];

  for (const { message, status } of scenarios) {
    it(`mensagem do RPC "${message}" mapeia para HTTP ${status}`, async () => {
      mockPrivileged((fn) => {
        if (fn === 'begin_case_operation') return { data: null, error: { message } };
        return { data: null, error: null };
      });
      const { beginCaseOperation } = await import('@/lib/case-operations');
      const result = await beginCaseOperation('user-a', 'case-1', 'transcribe');

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(status);
    });
  }

  it('exceção lançada na chamada do RPC (falha de rede/infra) retorna 503', async () => {
    mockPrivileged(() => {
      throw new Error('conexão recusada');
    });
    const { beginCaseOperation } = await import('@/lib/case-operations');
    const result = await beginCaseOperation('user-a', 'case-1', 'transcribe');

    expect(result).toEqual({
      ok: false,
      status: 503,
      error: 'Serviço de controle de uso indisponível no momento. Tente novamente em instantes.',
    });
  });

  it('RPC retorna sem erro mas sem dado (linha vazia) retorna 503 — nunca sucesso silencioso', async () => {
    mockPrivileged((fn) => {
      if (fn === 'begin_case_operation') return { data: null, error: null };
      return { data: null, error: null };
    });
    const { beginCaseOperation } = await import('@/lib/case-operations');
    const result = await beginCaseOperation('user-a', 'case-1', 'transcribe');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });
});

describe('beginCaseOperation: chamada bem-sucedida', () => {
  it('retorna ok:true com processingJobId gerado no servidor e envia exatamente os 4 args esperados (sem p_max_per_day)', async () => {
    const rpcCalls = mockPrivileged((fn) => {
      if (fn === 'begin_case_operation') return { data: { id: 'op-1' }, error: null };
      return { data: null, error: null };
    });
    const { beginCaseOperation } = await import('@/lib/case-operations');
    const result = await beginCaseOperation('user-a', 'case-1', 'detective');

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('esperava sucesso');

    expect(typeof result.processingJobId).toBe('string');
    expect(result.processingJobId.length).toBeGreaterThan(0);
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].fn).toBe('begin_case_operation');
    expect(rpcCalls[0].args).toEqual({
      p_user_id: 'user-a',
      p_case_id: 'case-1',
      p_operation: 'detective',
      p_processing_job_id: result.processingJobId,
    });
  });

  it('duas chamadas sucessivas geram processingJobId diferentes (server-generated por tentativa)', async () => {
    mockPrivileged((fn) => {
      if (fn === 'begin_case_operation') return { data: { id: 'op-1' }, error: null };
      return { data: null, error: null };
    });
    const { beginCaseOperation } = await import('@/lib/case-operations');
    const r1 = await beginCaseOperation('user-a', 'case-1', 'transcribe');
    const r2 = await beginCaseOperation('user-a', 'case-1', 'transcribe');

    if (!r1.ok || !r2.ok) throw new Error('esperava sucesso em ambas');
    expect(r1.processingJobId).not.toBe(r2.processingJobId);
  });
});

describe('finishCaseOperation', () => {
  it('envia exatamente os 5 args esperados, incluindo o processingJobId recebido de beginCaseOperation', async () => {
    const rpcCalls = mockPrivileged(() => ({ data: null, error: null }));
    const { finishCaseOperation } = await import('@/lib/case-operations');

    await finishCaseOperation('user-a', 'case-1', 'transcribe', 'job-123', 'done');

    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].fn).toBe('finish_case_operation');
    expect(rpcCalls[0].args).toEqual({
      p_user_id: 'user-a',
      p_case_id: 'case-1',
      p_operation: 'transcribe',
      p_processing_job_id: 'job-123',
      p_status: 'done',
    });
  });

  it('nunca lança mesmo se o RPC retornar erro — falha aqui não pode virar 5xx para o médico', async () => {
    mockPrivileged(() => ({ data: null, error: { message: 'erro simulado' } }));
    const { finishCaseOperation } = await import('@/lib/case-operations');

    await expect(
      finishCaseOperation('user-a', 'case-1', 'transcribe', 'job-123', 'failed'),
    ).resolves.toBeUndefined();
  });

  it('nunca lança mesmo se a chamada do RPC lançar uma exceção de rede', async () => {
    mockPrivileged(() => {
      throw new Error('conexão recusada');
    });
    const { finishCaseOperation } = await import('@/lib/case-operations');

    await expect(
      finishCaseOperation('user-a', 'case-1', 'transcribe', 'job-123', 'failed'),
    ).resolves.toBeUndefined();
  });

  it('client privilegiado não configurado: não lança, apenas não faz nada', async () => {
    mockPrivileged(null);
    const { finishCaseOperation } = await import('@/lib/case-operations');

    await expect(
      finishCaseOperation('user-a', 'case-1', 'transcribe', 'job-123', 'failed'),
    ).resolves.toBeUndefined();
  });
});
