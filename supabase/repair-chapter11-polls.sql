-- Repair Chapter 11 teaching polls and allow anonymous vote changes.
drop policy if exists event_poll_votes_update on public.lesson_poll_votes;
create policy event_poll_votes_update on public.lesson_poll_votes
for update to anon
using (true)
with check (true);

insert into public.lesson_polls
  (poll_id,series_slug,lesson_slug,question,poll_type,options,save_anonymous,status,updated_at)
values
  ('expectation-response','kingdom-evidence','chapter-11-part-1','When God''s work does not match your expectation, what is your first instinct?','choice','["Bring the question to Jesus","Search the Scriptures","Try to control the outcome","Withdraw or assume the worst"]'::jsonb,true,'ready',now()),
  ('john-tension','kingdom-evidence','chapter-11-part-1','Which tension is hardest to separate in real life?','choice','["Promise vs. expectation","Timing vs. denial","Pain vs. abandonment","Messenger style vs. message"]'::jsonb,true,'ready',now()),
  ('evidence-response','kingdom-evidence','chapter-11-part-1','What does Jesus point John toward in Matthew 11:4–6?','choice','["His circumstances","Public opinion","Scripture-shaped evidence","A guaranteed immediate rescue"]'::jsonb,true,'ready',now()),
  ('familiarity-check','kingdom-evidence','chapter-11-part-2','What most often keeps truth from producing change?','choice','["Familiarity","Pride","Delay","Fear"]'::jsonb,true,'ready',now()),
  ('yoke-check','kingdom-evidence','chapter-11-part-2','Which yoke are you most tempted to carry?','choice','["Approval","Performance","Control","Comparison"]'::jsonb,true,'ready',now()),
  ('response-now','kingdom-evidence','chapter-11-part-2','What response does revelation require from you right now?','choice','["Repent","Obey","Trust","Release control"]'::jsonb,true,'ready',now())
on conflict (poll_id) do update set
  series_slug=excluded.series_slug,
  lesson_slug=excluded.lesson_slug,
  question=excluded.question,
  poll_type=excluded.poll_type,
  options=excluded.options,
  save_anonymous=excluded.save_anonymous,
  updated_at=now();
