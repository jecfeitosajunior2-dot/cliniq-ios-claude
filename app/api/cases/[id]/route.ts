import { NextResponse } from 'next/server';
import type { DeleteStatus } from '@/lib/types';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getPrivilegedSupabase } from '@/lib/supabase/privileged';

export const runtime = 'nodejs';

interface CaseDeleteRow {
  id: string;
  audio_path: string | null;
  audio_removed: boolean;
  delete_status: DeleteStatus;
}

/**
 * Apaga um caso de forma recuperável (Fase 1R2, item 6). `delete_status`,
 * `audio_removed` e o DELETE da linha são todos server-controlled — só a
 * camada privilegiada tem GRANT para essas operações (a policy
 * `cases_delete_own` foi removida; `consultations_delete_own` também, do
 * lado do Storage). A rota ainda valida a sessão com o client comum, e
 * todo acesso à tabela via client privilegiado filtra `user_id = userId`
 * explicitamente — RLS não se aplica sob service_role, então essa
 * filtragem em código é a única barreira contra afetar o caso de outro
 * usuário.
 *
 * Nunca relata sucesso (2xx) para uma exclusão que não terminou. Contrato:
 *   200 "deleted"        — exclusão completa, ou já estava deletado (idempotente).
 *   401                  — sem sessão.
 *   403                  — caso não pertence ao usuário (ou não existe).
 *   409                  — exclusão concorrente já em andamento.
 *   502                  — Storage alcançável, mas respondeu com falha na
 *                          remoção do objeto (estado recuperável, repetível).
 *   503                  — Storage/DB genuinely indisponível (exceção de
 *                          rede/infra) ou backend privilegiado não
 *                          configurado (estado recuperável, repetível).
 * Em qualquer falha, o caso fica em `delete_status='delete_failed'`
 * (nunca a linha apagada pela metade) e uma nova chamada retoma do ponto
 * certo — idempotente por design.
 */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await ctx.params;
  if (!caseId) {
    return NextResponse.json({ status: 'delete_failed', error: 'caseId ausente.' }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { status: 'delete_failed', error: 'Backend não configurado.' },
      { status: 503 },
    );
  }
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    return NextResponse.json(
      { status: 'delete_failed', error: 'Sessão inválida ou expirada. Faça login novamente.' },
      { status: 401 },
    );
  }

  const privileged = getPrivilegedSupabase();
  if (!privileged) {
    return NextResponse.json(
      { status: 'delete_failed', error: 'Backend privilegiado não configurado neste ambiente.' },
      { status: 503 },
    );
  }

  // Reivindica o caso atomicamente: só avança se pertence ao usuário e está
  // num estado retomável (ativo, pedido pendente, ou falha anterior).
  const { data: claimed, error: claimError } = await privileged
    .from('cases')
    .update({ delete_status: 'deleting' })
    .eq('id', caseId)
    .eq('user_id', userId)
    .in('delete_status', ['active', 'delete_requested', 'delete_failed'])
    .select('id, audio_path, audio_removed, delete_status')
    .maybeSingle();

  if (claimError) {
    console.error('cases/[id] DELETE: falha ao reivindicar caso', claimError.message);
    return NextResponse.json(
      { status: 'delete_failed', error: 'Não foi possível apagar o caso agora. Tente novamente.' },
      { status: 503 },
    );
  }

  const row = claimed as CaseDeleteRow | null;

  if (!row) {
    // Não reivindicado: ou não existe/não pertence ao usuário, ou já está
    // em outro estado terminal/concorrente. Verifica posse para distinguir
    // "já apagado" (sucesso idempotente) de "sem acesso" (403).
    const { data: existing, error: lookupError } = await privileged
      .from('cases')
      .select('id, delete_status')
      .eq('id', caseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (lookupError) {
      console.error('cases/[id] DELETE: falha ao verificar caso', lookupError.message);
      return NextResponse.json(
        { status: 'delete_failed', error: 'Não foi possível apagar o caso agora. Tente novamente.' },
        { status: 503 },
      );
    }
    if (!existing) {
      return NextResponse.json(
        { status: 'delete_failed', error: 'Você não tem acesso a este caso.' },
        { status: 403 },
      );
    }
    if (existing.delete_status === 'deleted') {
      return NextResponse.json({ status: 'deleted' }, { status: 200 });
    }
    // Estado 'deleting' concorrente (outra requisição em andamento agora).
    return NextResponse.json(
      { status: 'delete_failed', error: 'Exclusão já em andamento. Tente novamente em instantes.' },
      { status: 409 },
    );
  }

  // Remove o áudio do Storage, se ainda não foi removido. Distingue Storage
  // genuinely-unreachable (exceção lançada na chamada — 503, retomável) de
  // Storage alcançável mas que respondeu com falha na remoção (502,
  // também retomável). Nenhum dos dois casos é relatado como 200: a
  // exclusão não terminou de fato em nenhum dos dois.
  if (row.audio_path && !row.audio_removed) {
    let storageError: { message: string } | null = null;
    try {
      const result = await privileged.storage.from('consultations').remove([row.audio_path]);
      storageError = result.error;
    } catch (e) {
      console.error('cases/[id] DELETE: storage inalcançável', e instanceof Error ? e.message : e);
      await privileged
        .from('cases')
        .update({ delete_status: 'delete_failed' })
        .eq('id', caseId)
        .eq('user_id', userId);
      return NextResponse.json(
        { status: 'delete_failed', error: 'Armazenamento indisponível no momento. Tente novamente.' },
        { status: 503 },
      );
    }
    if (storageError) {
      console.error('cases/[id] DELETE: falha ao remover áudio', storageError.message);
      await privileged
        .from('cases')
        .update({ delete_status: 'delete_failed' })
        .eq('id', caseId)
        .eq('user_id', userId);
      return NextResponse.json(
        { status: 'delete_failed', error: 'Não foi possível remover o áudio do caso. Tente novamente.' },
        { status: 502 },
      );
    }
  }

  const { error: markRemovedError } = await privileged
    .from('cases')
    .update({ audio_removed: true })
    .eq('id', caseId)
    .eq('user_id', userId);
  if (markRemovedError) {
    console.error('cases/[id] DELETE: falha ao marcar áudio removido', markRemovedError.message);
    await privileged
      .from('cases')
      .update({ delete_status: 'delete_failed' })
      .eq('id', caseId)
      .eq('user_id', userId);
    return NextResponse.json(
      { status: 'delete_failed', error: 'Não foi possível concluir a exclusão. Tente novamente.' },
      { status: 503 },
    );
  }

  const { error: deleteRowError } = await privileged
    .from('cases')
    .delete()
    .eq('id', caseId)
    .eq('user_id', userId);
  if (deleteRowError) {
    console.error('cases/[id] DELETE: falha ao apagar linha do caso', deleteRowError.message);
    await privileged
      .from('cases')
      .update({ delete_status: 'delete_failed', audio_removed: true })
      .eq('id', caseId)
      .eq('user_id', userId);
    return NextResponse.json(
      { status: 'delete_failed', error: 'Não foi possível concluir a exclusão. Tente novamente.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ status: 'deleted' }, { status: 200 });
}
