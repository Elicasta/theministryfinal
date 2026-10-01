# Lumaneer platform foundation

This branch intentionally builds Lumaneer beside the production Kingdom Evidence system.

## Safety rule
Do not replace or redirect existing production routes until the Lumaneer shell, authentication, course/module schema, migration, and live-session compatibility are verified.

## Product model
Course -> Module -> Lesson -> Content / Live / Notes / Discussion / Assessment / Resources.

Existing Kingdom Evidence presenter/projector/student behavior remains the live teaching engine during the transition.

## Initial routes
- /lumaneer/
- /lumaneer/learn/
- /lumaneer/admin/

## Next implementation
1. Supabase Auth and profile roles
2. Course/module/enrollment schema
3. Matthew course seeded with Chapter 11 as first migrated module
4. Student private notes
5. Discussions
6. Quiz/question bank integration
7. Admin module builder
8. Live session adapter around existing presenter/projector/poll system
9. Import workflow for Matthew 1-10
10. Only after verification, map lumaneer.com and establish permanent public routes
