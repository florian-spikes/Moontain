
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { PDFDocument, StandardFonts, rgb } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";

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

        const { document_id } = await req.json();

        if (!document_id) {
            throw new Error('Missing document_id');
        }

        // 1. Fetch Data
        const { data: doc, error: docError } = await supabaseClient
            .from('documents')
            .select('*, client:clients(*), lines:document_lines(*)')
            .eq('id', document_id)
            .single();

        if (docError || !doc) throw new Error('Document not found');

        // 2. Generate PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const fontSize = 10;
        const margin = 50;

        // Header
        page.drawText('MOONTAIN', { x: margin, y: height - margin, size: 20, font: boldFont, color: rgb(0.2, 0.2, 0.8) });
        page.drawText('Web Development & Services', { x: margin, y: height - margin - 15, size: 10, font });

        // Document Info
        const docType = doc.type === 'quote' ? 'DEVIS' : 'FACTURE';
        const docNumber = doc.number || 'BROUILLON';

        page.drawText(docType, { x: width - margin - 100, y: height - margin, size: 20, font: boldFont, color: rgb(0, 0, 0) });
        page.drawText(`# ${docNumber}`, { x: width - margin - 100, y: height - margin - 15, size: 10, font });
        page.drawText(`Date: ${new Date(doc.date).toLocaleDateString('fr-FR')}`, { x: width - margin - 100, y: height - margin - 30, size: 10, font });

        // Client Info
        page.drawText('Client:', { x: margin, y: height - margin - 60, size: 12, font: boldFont });
        page.drawText(doc.client?.name || '', { x: margin, y: height - margin - 75, size: 10, font });
        if (doc.client?.address) {
            const addressLines = doc.client.address.split('\n');
            addressLines.forEach((line: string, i: number) => {
                page.drawText(line, { x: margin, y: height - margin - 90 - (i * 12), size: 10, font });
            });
        }

        // Table Header
        const tableTop = height - margin - 150;
        page.drawLine({ start: { x: margin, y: tableTop }, end: { x: width - margin, y: tableTop }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

        page.drawText('Description', { x: margin, y: tableTop + 5, size: 10, font: boldFont });
        page.drawText('Qté', { x: width - margin - 150, y: tableTop + 5, size: 10, font: boldFont });
        page.drawText('Prix Unit.', { x: width - margin - 100, y: tableTop + 5, size: 10, font: boldFont });
        page.drawText('Total', { x: width - margin - 40, y: tableTop + 5, size: 10, font: boldFont });

        // Table Rows
        let y = tableTop - 20;
        doc.lines.forEach((line: any) => {
            page.drawText(line.description, { x: margin, y, size: 10, font, maxWidth: 300, lineHeight: 12 });
            page.drawText(line.quantity.toString(), { x: width - margin - 140, y, size: 10, font });
            page.drawText(`${line.unit_price}€`, { x: width - margin - 90, y, size: 10, font });
            page.drawText(`${(line.quantity * line.unit_price).toFixed(2)}€`, { x: width - margin - 40, y, size: 10, font });
            y -= 20;
        });

        // Total
        y -= 20;
        page.drawLine({ start: { x: margin, y: y + 10 }, end: { x: width - margin, y: y + 10 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        page.drawText('Total HT', { x: width - margin - 120, y, size: 12, font: boldFont });
        page.drawText(`${doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, { x: width - margin - 40, y, size: 12, font: boldFont });

        page.drawText('TVA non applicable, art. 293 B du CGI', { x: margin, y: 30, size: 8, font, color: rgb(0.5, 0.5, 0.5) });


        // 3. Upload to Storage
        const pdfBytes = await pdfDoc.save();
        const filePath = `${doc.client_id}/${document_id}.pdf`;

        const { error: uploadError } = await supabaseClient
            .storage
            .from('documents')
            .upload(filePath, pdfBytes, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 4. Get Public URL
        const { data: { publicUrl } } = supabaseClient
            .storage
            .from('documents')
            .getPublicUrl(filePath);

        // 5. Update Document
        await supabaseClient
            .from('documents')
            .update({
                public_url: publicUrl,
                // If it was draft and we generated PDF, maybe set number if not set?
                // For now, keep it simple.
            })
            .eq('id', document_id);

        return new Response(
            JSON.stringify({ success: true, url: publicUrl }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});
