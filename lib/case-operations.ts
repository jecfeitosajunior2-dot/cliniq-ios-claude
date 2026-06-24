import { getPrivilegedSupabase } from './supabase/privileged';

export type CaseOperation = 'transcribe' | 'detective';

export type BeginOperationResult =
  | { ok: true; processingJobId: string }
  | { ok: false; status: number; error: string };

/**
 * Reserva atômica de quota+idempotência via RPC do Postgres
 * (`begin_case_operation`), ANTES de qualquer chamada à OpenAI/Anthropic.
 *
 * Chama exclusivamente pelo client privilegiado (service_role) — a RPC tem
 * EXECUTE revogado de public/anon/authenticated (Fase 1R2, item 1); um
 * navegador chamando supabase.rpc('begin_case_operation', ...) direto
 * recebe "permission denied for function" do Postgres. `userId` chega aqui
 * já validado pela rota Next.js via `auth.getUser()` — nunca de
 * `auth.uid()` (que não resolve sob service_role) nem de payload do
 * cliente — e é repassado como `p_user_id` explícito para a RPC revalidar
 * posse do caso internamente.
 *
 * Fail-closed por design: se a service role key não estiver configurada,
 * ou qualquer falha ao consultar o banco ocorrer (rede, RPC indisponível
 * etc.), a requisição é bloqueada com 503 — nunca degrada para o privilégio
 * do navegador.
 *
 * `processing_job_id` é gerado pela função `begin_case_operation` no
 * banco (gen_random_uuid() implícito não — na verdade gerado aqui não, ver
 * RPC); o valor retornado deve ser repassado para `finishCaseOperation`
 * para impedir que um worker desatualizado feche/sobrescreva uma reserva
 * mais nova (item 3).
 *
 * O limite diário (`p_max_per_day`) NÃO é mais parâmetro desta função nem
 * da RPC (item 2) — é uma constante embutida em `begin_case_operation`
 * (ver supabase/migrations/0001_phase1_hardening.up.sql, seção 7),
 * mantida em sincronia manual com `PILOT_LIMITS.maxRequestsPerUserPerDay`
 * apenas para a mensagem de erro/UX não divergir muito antes de bater no
 * banco — o valor que de fato é aplicado é o do banco.
 */
export async function beginCaseOperation(
  userId: string,
  caseId: string,
  operation: CaseOperation,
): Promise<BeginOperationResult> {
  const supabase = getPrivilegedSupabase();
  if (!supabase) {
    console.error('beginCaseOperation: SUPABASE_SERVICE_ROLE_KEY não configurada');
    return {
      ok: false,
      status: 503,
      error: 'Serviço de controle de uso não está configurado neste ambiente.',
    };
  }

  const processingJobId = crypto.randomUUID();

  let data: unknown;
  let error: { message: string } | null;
  try {
    const result = await supabase.rpc('begin_case_operation', {
      p_user_id: userId,
      p_case_id: caseId,
      p_operation: operation,
      p_processing_job_id: processingJobId,
    });
    data = result.data;
    error = result.error;
  } catch (e) {
    console.error('beginCaseOperation: falha de rede/infra', e instanceof Error ? e.message : e);
    return {
      ok: false,
      status: 503,
      error: 'Serviço de controle de uso indisponível no momento. Tente novamente em instantes.',
    };
  }

  if (error) {
    const message = error.message ?? '';
    if (message.includes('unauthenticated')) {
      return { ok: false, status: 401, error: 'Sessão inválida ou expirada. Faça login novamente.' };
    }
    if (message.includes('not found or not owned')) {
      return { ok: false, status: 403, error: 'Você não tem acesso a este caso.' };
    }
    if (message.includes('legacy case not processable')) {
      return {
        ok: false,
        status: 403,
        error: 'Este caso é anterior à exigência de consentimento e não pode ser processado.',
      };
    }
    if (message.includes('case not active')) {
      return { ok: false, status: 409, error: 'Este caso está em processo de exclusão.' };
    }
    if (message.includes('daily limit exceeded')) {
      return { ok: false, status: 429, error: 'Limite diário de uso do piloto atingido. Tente novamente amanhã.' };
    }
    if (message.includes('duplicate operation in progress')) {
      return {
        ok: false,
        status: 409,
        error: 'Esta operação já está em andamento para este caso. Aguarde a conclusão.',
      };
    }
    console.error('beginCaseOperation: erro inesperado do RPC', message);
    return {
      ok: false,
      status: 503,
      error: 'Não foi possível verificar o uso do piloto agora. Tente novamente em instantes.',
    };
  }

  if (!data) {
    // RPC retornou sem erro mas sem linha — trata como indisponibilidade
    // (fail-closed), nunca como sucesso silencioso.
    console.error('beginCaseOperation: RPC retornou vazio sem erro');
    return {
      ok: false,
      status: 503,
      error: 'Não foi possível reservar a operação agora. Tente novamente em instantes.',
    };
  }

  return { ok: true, processingJobId };
}

/**
 * Fecha a operação reservada por beginCaseOperation. Chamada sempre em
 * `finally` pelo route handler — tanto em sucesso (`'done'`) quanto em
 * falha (`'failed'`) — para nunca deixar uma reserva presa em
 * 'in_progress' (o que bloquearia permanentemente novas tentativas via o
 * índice único parcial).
 *
 * `processingJobId` precisa ser exatamente o retornado por
 * `beginCaseOperation` na mesma tentativa — a RPC `finish_case_operation`
 * só fecha a reserva se ele bater com a que está `in_progress` no banco,
 * impedindo que um worker desatualizado (cujo lease já expirou e foi
 * reivindicado por uma tentativa mais nova) feche ou sobrescreva a reserva
 * da tentativa nova quando ele finalmente responde.
 *
 * Falhas aqui são apenas logadas: não revertem uma transcrição/análise que
 * já terminou, e não devem virar um novo erro 5xx para o médico.
 */
export async function finishCaseOperation(
  userId: string,
  caseId: string,
  operation: CaseOperation,
  processingJobId: string,
  status: 'done' | 'failed',
): Promise<void> {
  const supabase = getPrivilegedSupabase();
  if (!supabase) {
    console.error('finishCaseOperation: SUPABASE_SERVICE_ROLE_KEY não configurada');
    return;
  }
  try {
    const { error } = await supabase.rpc('finish_case_operation', {
      p_user_id: userId,
      p_case_id: caseId,
      p_operation: operation,
      p_processing_job_id: processingJobId,
      p_status: status,
    });
    if (error) {
      console.error('finishCaseOperation:', error.message);
    }
  } catch (e) {
    console.error('finishCaseOperation: falha de rede/infra', e instanceof Error ? e.message : e);
  }
}
