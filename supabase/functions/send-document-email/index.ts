
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";
import { getEmailHtml } from "./templates.ts";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { document_id, type, log_id } = await req.json();

        if (!document_id || !type) {
            throw new Error('Missing document_id or type');
        }

        // 1. Fetch Data
        const { data: doc, error: docError } = await supabaseClient
            .from('documents')
            .select('*, client:clients(email, name)')
            .eq('id', document_id)
            .single();

        if (docError || !doc) throw new Error('Document not found');
        if (!doc.client?.email) throw new Error('Client has no email');
        if (!doc.public_url) throw new Error('Document PDF not generated');

        // 2. Prepare Email HTML
        const html = getEmailHtml(type, doc);

        let subject = '';
        const docLabel = doc.number || 'Brouillon';

        switch (type) {
            case 'quote': subject = `Votre devis ${docLabel} de Moontain`; break;
            case 'invoice': subject = `Votre facture ${docLabel} de Moontain`; break;
            case 'reminder': subject = `Rappel : Facture ${docLabel} en attente`; break;
            case 'resend': subject = `Copie : ${doc.type === 'quote' ? 'Devis' : 'Facture'} ${docLabel}`; break;
        }

        // 3. Send Email
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Moontain <factures@app.moontain.studio>',
            to: [doc.client.email],
            subject,
            html,
            attachments: [
                {
                    filename: `${doc.type === 'quote' ? 'Devis' : 'Facture'}_${docLabel}.pdf`,
                    path: doc.public_url,
                },
            ],
        });

        if (emailError) {
            // Update log to error if log_id provided
            if (log_id) {
                await supabaseClient.from('email_logs').update({
                    status: 'error',
                    error: JSON.stringify(emailError)
                }).eq('id', log_id);
            }
            throw emailError;
        }

        // 4. Log Email (Update existing log)
        if (log_id) {
            await supabaseClient
                .from('email_logs')
                .update({
                    status: 'sent',
                    recipient: doc.client.email,
                    subject
                })
                .eq('id', log_id);
        } else {
            // Fallback: insert if no log_id provided
            await supabaseClient.from('email_logs').insert({
                type, document_id, status: 'sent', recipient: doc.client.email, subject
            });
        }

        // 5. Update Status if Invoice sent for first time
        if (doc.type === 'invoice' && doc.status === 'draft' && type === 'invoice') {
            await supabaseClient
                .from('documents')
                .update({ status: 'sent' })
                .eq('id', document_id);
        }

        return new Response(
            JSON.stringify({ success: true, id: emailData?.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});
