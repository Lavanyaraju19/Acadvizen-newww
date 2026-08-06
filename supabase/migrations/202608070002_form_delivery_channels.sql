-- Webhook + autoresponder delivery config for the Form Builder. Email notification
-- config (send_email/email_to/email_subject) already existed but was never wired up
-- (see app/api/cms/forms/[id]/submit/route.js) - this adds the remaining two delivery
-- channels alongside it. Actual SMTP transport is configured via environment variables
-- (SMTP_HOST/PORT/USER/PASS/FROM, see lib/mailer.js), never stored in the database.

alter table public.forms
  add column if not exists webhook_enabled boolean not null default false,
  add column if not exists webhook_url text,
  add column if not exists autoresponder_enabled boolean not null default false,
  add column if not exists autoresponder_email_field text,
  add column if not exists autoresponder_subject text,
  add column if not exists autoresponder_body text;
