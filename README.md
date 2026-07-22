# Creditology AI Pro

Next.js app for Creditology AI Pro.

## Local development

npm install
npm run dev

## Environment variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ANTHROPIC_API_KEY — server only, never exposed to the browser
- SUPABASE_SERVICE_ROLE_KEY — not used yet, reserved for a future admin dashboard

## Database setup

Run supabase/schema.sql once in the Supabase SQL Editor to create the
analyses and usage_logs tables, plus the private "reports" storage bucket.
