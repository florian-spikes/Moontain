import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { InvoicePdf } from '../components/InvoicePdf';
import type { Document } from '../types';
import React from 'react';

export function useGeneratePdf() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (doc: Document) => {
            // Generate number if not set
            let number = doc.number;
            if (!number) {
                const prefix = doc.type === 'invoice' ? 'F' : 'D';
                const yearSuffix = new Date().getFullYear().toString().slice(-2);

                const { count } = await supabase
                    .from('documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('type', doc.type);

                number = `${prefix}${yearSuffix}-${String((count || 0) + 1).padStart(4, '0')}`;

                await supabase
                    .from('documents')
                    .update({ number, seq_number: (count || 0) + 1 })
                    .eq('id', doc.id);
            }

            // Prepare data for template
            const data = {
                type: doc.type as 'invoice' | 'quote',
                number,
                date: doc.date || new Date().toISOString(),
                client: {
                    name: (doc as any).client?.name || '',
                    email: (doc as any).client?.email || '',
                    address: (doc as any).client?.address || '',
                },
                lines: (doc.lines || []).map((l: any) => ({
                    name: l.name || '',
                    description: l.description,
                    unit_price: l.unit_price,
                    quantity: l.quantity,
                })),
                total_amount: doc.total_amount || 0,
            };

            // Logo URL
            const logoUrl = `${window.location.origin}/moontain-logo.png`;

            // Generate PDF blob
            const element = React.createElement(InvoicePdf, { data, logoUrl });
            const blob = await pdf(element as any).toBlob();

            // Upload to Supabase Storage (upsert)
            const fileName = `${doc.type}_${number}.pdf`;
            const { error: uploadErr } = await supabase.storage
                .from('documents')
                .upload(fileName, blob, {
                    contentType: 'application/pdf',
                    upsert: true,
                });

            if (uploadErr) throw uploadErr;

            // Get public URL + append timestamp to bust browser cache
            const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

            // Update document record
            await supabase
                .from('documents')
                .update({ public_url: publicUrl, number })
                .eq('id', doc.id);

            return { url: publicUrl };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['document'] });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            // Open the freshly generated PDF in a new tab
            if (result?.url) {
                window.open(result.url, '_blank');
            }
        },
        onError: (err) => {
            console.error('[useGeneratePdf] PDF generation failed:', err);
            alert('Erreur lors de la génération du PDF : ' + (err as Error).message);
        },
    });
}
