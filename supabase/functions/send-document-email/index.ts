
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

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

        const { document_id, type } = await req.json();

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

        // 2. Prepare Email
        let subject = '';
        let html = '';

        const docTypeLabel = doc.type === 'quote' ? 'Devis' : 'Facture';
        const amount = doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

        switch (type) {
            case 'quote':
                subject = `Votre devis ${doc.number || ''} de Moontain`;
                html = `<p>Bonjour ${doc.client.name},</p>
                    <p>Veuillez trouver ci-joint votre devis d'un montant de <strong>${amount}</strong>.</p>
                    <p>N'hésitez pas à revenir vers nous pour toute question.</p>
                    <p>Cordialement,<br>L'équipe Moontain</p>`;
                break;
            case 'invoice':
                subject = `Votre facture ${doc.number || ''} de Moontain`;
                html = `<p>Bonjour ${doc.client.name},</p>
                    <p>Veuillez trouver ci-joint votre facture d'un montant de <strong>${amount}</strong>.</p>
                    <p>Merci de votre confiance.</p>
                    <p>Cordialement,<br>L'équipe Moontain</p>`;
                break;
            case 'reminder':
                subject = `Rappel : Facture ${doc.number || ''} en attente`;
                html = `<p>Bonjour ${doc.client.name},</p>
                    <p>Sauf erreur de notre part, la facture ${doc.number} d'un montant de <strong>${amount}</strong> est toujours en attente de règlement.</p>
                    <p>Merci de faire le nécessaire rapidement.</p>
                    <p>Cordialement,<br>L'équipe Moontain</p>`;
                break;
            case 'resend':
                subject = `Copie : ${docTypeLabel} ${doc.number || ''}`;
                html = `<p>Bonjour ${doc.client.name},</p>
                    <p>Voici une copie de votre ${docTypeLabel.toLowerCase()}.</p>
                    <p>Cordialement,<br>L'équipe Moontain</p>`;
                break;
            default:
                throw new Error('Invalid email type');
        }

        // 3. Send Email
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Moontain <factures@app.moontain.studio>', // Verified domain
            to: [doc.client.email],
            subject,
            html,
            attachments: [
                {
                    filename: `${docTypeLabel}_${doc.number || 'brouillon'}.pdf`,
                    path: doc.public_url,
                },
            ],
        });

        if (emailError) throw emailError;

        // 4. Log Email
        await supabaseClient
            .from('email_logs')
            .insert({
                type: type,
                document_id: document_id,
                status: 'sent',
                recipient: doc.client.email,
                subject
            });

        // 5. Update Status if Invoice
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
