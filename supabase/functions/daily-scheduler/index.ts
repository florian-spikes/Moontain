
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results = {
            invoicesReminded: 0,
            servicesReminded: 0,
            errors: [] as string[]
        };

        // 1. Check Invoices (Reminders)
        // Criteria: -7, -3, +3, +10 days from due_date
        const { data: documents } = await supabaseClient
            .from('documents')
            .select('*')
            .eq('type', 'invoice')
            .in('status', ['sent', 'overdue']);

        if (documents) {
            for (const doc of documents) {
                if (!doc.due_date) continue;

                const dueDate = new Date(doc.due_date);
                dueDate.setHours(0, 0, 0, 0);

                const diffTime = today.getTime() - dueDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Positive = overdue, Negative = upcoming

                let shouldRemind = false;
                // Reminder logic: J-7, J+3, J+10
                if (diffDays === -7 || diffDays === 3 || diffDays === 10) {
                    shouldRemind = true;
                }

                if (shouldRemind) {
                    // Check if already sent today to avoid double send if cron runs multiple times
                    // (Optional but good practice)

                    // Call send-document-email
                    const { error } = await supabaseClient.functions.invoke('send-document-email', {
                        body: { document_id: doc.id, type: 'reminder' }
                    });

                    if (error) results.errors.push(`Failed to remind invoice ${doc.id}: ${error.message}`);
                    else results.invoicesReminded++;
                }
            }
        }

        // 2. Check Services (Renewals)
        // Criteria: -30, -7 days from renewal_date
        const { data: services } = await supabaseClient
            .from('services')
            .select('*, client:clients(name, email)');

        if (services) {
            for (const service of services) {
                if (!service.renewal_date) continue;

                const renewalDate = new Date(service.renewal_date);
                renewalDate.setHours(0, 0, 0, 0);

                const diffTime = today.getTime() - renewalDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Should be negative

                // J-30 => diffDays = -30
                // J-7 => diffDays = -7
                if (diffDays === -30 || diffDays === -7) {
                    if (service.client?.email) {
                        const { error } = await resend.emails.send({
                            from: 'Moontain <services@moontain.fr>',
                            to: [service.client.email],
                            subject: `Renouvellement de service : ${service.name}`,
                            html: `<p>Bonjour ${service.client.name},</p>
                               <p>Votre service <strong>${service.name}</strong> arrivera à échéance le ${renewalDate.toLocaleDateString('fr-FR')}.</p>
                               <p>Merci de prévoir son renouvellement.</p>
                               <p>Cordialement,<br>L'équipe Moontain</p>`
                        });

                        if (error) results.errors.push(`Failed to remind service ${service.id}: ${error.message}`);
                        else results.servicesReminded++;

                        // Log
                        await supabaseClient.from('email_logs').insert({
                            type: 'service_reminder',
                            // We don't have service_id in email_logs schema? 
                            // Schema says: document_id (uuid, null), recipient, subject, status...
                            // We can add validation, or just leave document_id null.
                            recipient: service.client.email,
                            subject: `Renouvellement de service : ${service.name}`,
                            status: error ? 'failed' : 'sent'
                        });
                    }
                }
            }
        }

        return new Response(
            JSON.stringify(results),
            { headers: { 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});
