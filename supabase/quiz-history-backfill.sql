-- One-time conservative import of finalized single-entry legacy quiz sessions.
-- Uses the original authoritative per-question class grading (one submitted entry)
-- and leaves participant/account ownership UNLINKED pending verification.
insert into public.quiz_history (
  game_id,game_code,player_id,display_name,participation,entry_key,
  team_id,team_name,captain_player_id,pack_id,scripture,
  correct_count,question_count,percent,answers,submitted_at,finalized_at
)
select
  g.id,g.game_code,p.player_id,p.name,
  case when e.value->>'mode'='team' then 'team' else 'solo' end,
  e.value->>'key',
  case when e.value->>'mode'='team' then e.value->>'teamId' else null end,
  case when e.value->>'mode'='team' then teams.value->>'name' else null end,
  case when e.value->>'mode'='team' then teams.value->>'captainPlayerId' else null end,
  coalesce(g.question_pack->>'id','legacy'),
  coalesce(g.question_pack->>'scripture','Matthew 11'),
  coalesce((score.value->>'correct')::integer,0),
  jsonb_array_length(coalesce(g.question_pack->'questions','[]'::jsonb)),
  coalesce((score.value->>'percent')::integer,0),
  archived.answers,
  (g.state->'quizLocks'->>(e.value->>'key'))::timestamptz,
  coalesce((g.state->>'quizFinishedAt')::timestamptz,g.updated_at)
from public.game_sessions g
cross join lateral jsonb_array_elements(coalesce(g.state->'quizRoster','[]'::jsonb)) as e(value)
join public.game_players p on p.game_id=g.id
  and coalesce(e.value->'playerIds','[]'::jsonb) ? p.player_id
left join lateral jsonb_array_elements(coalesce(g.state->'teams','[]'::jsonb)) teams(value)
  on teams.value->>'id'=e.value->>'teamId'
left join lateral jsonb_array_elements(
  case when e.value->>'mode'='team'
    then coalesce(g.state->'quizResults'->'teamResults','[]'::jsonb)
    else coalesce(g.state->'quizResults'->'soloResults','[]'::jsonb)
  end
) score(value) on
  case when e.value->>'mode'='team'
    then score.value->>'teamId'=e.value->>'teamId'
    else score.value->>'playerId'=p.player_id
  end
cross join lateral (
  select coalesce(jsonb_agg(jsonb_build_object(
    'questionId',q.value->>'id',
    'order',q.ord,
    'type',coalesce(q.value->>'type','multiple_choice'),
    'reference',coalesce(q.value->>'reference',''),
    'prompt',coalesce(q.value->>'prompt',''),
    'answer',coalesce(saved.answer,''),
    'correctAnswer',coalesce(q.value->>'correctAnswer',''),
    'correct',coalesce((select (stat.value->>'correct')::int=1
      from jsonb_array_elements(coalesce(g.state->'quizResults'->'questionStats','[]'::jsonb)) stat(value)
      where stat.value->>'questionId'=q.value->>'id' limit 1),false),
    'submittedBy',saved.player_id
  ) order by q.ord),'[]'::jsonb) answers
  from jsonb_array_elements(coalesce(g.question_pack->'questions','[]'::jsonb)) with ordinality q(value,ord)
  left join lateral (
    select s.answer,s.player_id from public.game_submissions s
    where s.game_id=g.id and s.question_id=q.value->>'id'
      and (case when e.value->>'mode'='team'
        then s.team_id=e.value->>'teamId' else s.player_id=p.player_id end)
    order by s.created_at desc limit 1
  ) saved on true
) archived
where g.state->>'mode'='quiz'
  and g.state->>'phase' in ('quiz_results','quiz_review','quiz_complete')
  and coalesce((g.state->'quizResults'->>'countedUnits')::integer,0)=1
  and coalesce(g.state->'quizLocks','{}'::jsonb) ? (e.value->>'key')
on conflict (game_id,player_id) do nothing;
