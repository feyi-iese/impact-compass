// Supabase Edge Function: send-reminders
// Purpose: process due reminder_jobs and mark them as sent.
// Sends reminder emails via Resend and marks jobs as sent.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
const resendReplyTo = Deno.env.get('RESEND_REPLY_TO') ?? '';

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatEventTime = (iso: string) => {
  if (!iso) return 'soon';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Madrid',
  }).format(new Date(iso));
};

const buildReminderCopy = ({
  eventTitle,
  eventTime,
  location,
  reminderType,
}: {
  eventTitle: string;
  eventTime: string;
  location: string;
  reminderType: string;
}) => {
  const relativeLabel = reminderType === '1h' ? 'in about 1 hour' : 'tomorrow';
  const subjectPrefix = reminderType === '1h' ? 'Starting Soon' : 'Reminder';
  const formattedTime = formatEventTime(eventTime);
  const safeLocation = location || 'Barcelona';

  const subject = `${subjectPrefix}: ${eventTitle}`;
  const text = [
    `Your volunteer event "${eventTitle}" is ${relativeLabel}.`,
    '',
    `When: ${formattedTime}`,
    `Where: ${safeLocation}`,
    '',
    'Thanks for volunteering with Impact Compass.',
  ].join('\n');

  const html = `
    <div style="font-family: Georgia, serif; background:#f7f2e8; padding:32px; color:#1f2937;">
      <div style="max-width:560px; margin:0 auto; background:#fffdf8; border:1px solid #eadfcb; border-radius:16px; padding:32px;">
        <p style="margin:0 0 8px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#8c6a43;">Impact Compass Reminder</p>
        <h1 style="margin:0 0 16px; font-size:28px; line-height:1.2;">${eventTitle}</h1>
        <p style="margin:0 0 24px; font-size:16px; line-height:1.6;">
          Your volunteer event is <strong>${relativeLabel}</strong>. We're excited to help you show up ready.
        </p>
        <div style="background:#f4eee1; border-radius:12px; padding:20px; margin-bottom:24px;">
          <p style="margin:0 0 10px;"><strong>When:</strong> ${formattedTime}</p>
          <p style="margin:0;"><strong>Where:</strong> ${safeLocation}</p>
        </div>
        <p style="margin:0; font-size:14px; line-height:1.6; color:#4b5563;">
          Thanks for volunteering with Impact Compass.
        </p>
      </div>
    </div>
  `;

  return { subject, text, html };
};

const sendReminderEmail = async (payload: {
  to: string;
  eventTitle: string;
  eventTime: string;
  location: string;
  reminderType: string;
}) => {
  if (!resendApiKey) {
    throw new Error('Missing RESEND_API_KEY');
  }
  if (!resendFromEmail) {
    throw new Error('Missing RESEND_FROM_EMAIL');
  }

  const { subject, text, html } = buildReminderCopy(payload);
  const body: Record<string, unknown> = {
    from: resendFromEmail,
    to: [payload.to],
    subject,
    text,
    html,
  };

  if (resendReplyTo) {
    body.reply_to = resendReplyTo;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend error: ${response.status} ${errorBody}`);
  }

  return response.json();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const nowIso = new Date().toISOString();
    const { data: jobs, error: jobsError } = await supabase
      .from('reminder_jobs')
      .select(
        'id,reminder_type,send_at,event_signups:signup_id(volunteer_user_id),events:event_id(title,date_time,location_address)'
      )
      .eq('status', 'queued')
      .lte('send_at', nowIso)
      .limit(50);

    if (jobsError) throw jobsError;
    if (!jobs?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    for (const job of jobs) {
      const volunteerId = job.event_signups?.volunteer_user_id;
      if (!volunteerId) continue;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', volunteerId)
        .maybeSingle();

      if (!profile?.email) {
        await supabase
          .from('reminder_jobs')
          .update({ status: 'skipped_no_email' })
          .eq('id', job.id);
        continue;
      }

      await sendReminderEmail({
        to: profile.email,
        eventTitle: job.events?.title ?? 'Upcoming event',
        eventTime: job.events?.date_time ?? '',
        location: job.events?.location_address ?? '',
        reminderType: job.reminder_type,
      });

      const { error: updateError } = await supabase
        .from('reminder_jobs')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', job.id);
      if (updateError) throw updateError;
      processed += 1;
    }

    return new Response(JSON.stringify({ processed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
