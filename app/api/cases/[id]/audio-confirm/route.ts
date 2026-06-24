import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getPrivilegedSupabase } from '@/lib/supabase/privileged';
import { isAllowedAudioMime, extForMime } from '@/lib/limits';

export const runtime = 'nodejs';

/**
 * Confirma um upload de áudio feito via token assinado (Fase 1R2, item 6)
 * e marca o caso como `recorded`. Nunca aceita o path do client como
 * verdade — recalcula o path canônico a partir de userId+caseId+mimeType
 * (a mesma fórmula usada por /audio-url) e verifica que o objeto existe de
 * fato no Storage antes de escrever `audio_path`/`status`, que só a
 * camada privilegiada pode gravar.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await ctx.params;
  if (!caseId) {
    return NextResponse.json({ error: 'caseId ausente.' }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Backend não configurado.' }, { status: 503 });
  }
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: 'Sessão inválida ou expirada. Faça login novamente.' },
      { status: 401 },
    );
  }

  const privileged = getPrivilegedSupabase();
  if (!privileged) {
    return NextResponse.json(
      { error: 'Backend privilegiado não configurado neste ambiente.' },
      { status: 503 },
    );
  }

  let body: { mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida (JSON esperado).' }, { status: 400 });
  }
  const mimeType = body.mimeType;
  if (!mimeType || !isAllowedAudioMime(mimeType)) {
    return NextResponse.json({ error: 'Tipo de áudio não suportado.' }, { status: 400 });
  }

  const { data: caseRow, error: caseError } = await supabase
    .from('cases')
    .select('id, status, delete_status, legacy_pre_consent')
    .eq('id', caseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (caseError) {
    console.error('audio-confirm: falha ao carregar caso', caseError.message);
    return NextResponse.json(
      { error: 'Não foi possível carregar o caso agora. Tente novamente.' },
      { status: 503 },
    );
  }
  if (!caseRow) {
    return NextResponse.json({ error: 'Você não tem acesso a este caso.' }, { status: 403 });
  }
  if (caseRow.legacy_pre_consent) {
    return NextResponse.json(
      { error: 'Este caso é anterior à exigência de consentimento e não pode ser processado.' },
      { status: 403 },
    );
  }
  if (caseRow.delete_status !== 'active') {
    return NextResponse.json({ error: 'Este caso está em processo de exclusão.' }, { status: 409 });
  }
  if (caseRow.status !== 'draft') {
    return NextResponse.json({ error: 'Este caso já tem áudio gravado.' }, { status: 422 });
  }

  // Path canônico recalculado — nunca aceito do corpo da requisição.
  const path = `${userId}/${caseId}/audio.${extForMime(mimeType)}`;

  const { error: existsError } = await privileged.storage.from('consultations').createSignedUrl(path, 60);
  if (existsError) {
    return NextResponse.json(
      { error: 'Áudio não encontrado no armazenamento. Tente enviar novamente.' },
      { status: 422 },
    );
  }

  const { error: updateError } = await privileged
    .from('cases')
    .update({ audio_path: path, status: 'recorded' })
    .eq('id', caseId)
    .eq('user_id', userId);
  if (updateError) {
    console.error('audio-confirm: falha ao marcar caso como gravado', updateError.message);
    return NextResponse.json(
      { error: 'Áudio enviado, mas não foi possível atualizar o caso. Tente novamente.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
