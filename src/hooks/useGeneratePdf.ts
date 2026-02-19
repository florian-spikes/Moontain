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
                const { count } = await supabase
                    .from('documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('type', doc.type);
                number = `${prefix}${String((count || 0) + 1).padStart(6, '0')}`;
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

            // Upload to Supabase Storage
            const fileName = `${doc.type}_${number}.pdf`;
            const { error: uploadErr } = await supabase.storage
                .from('documents')
                .upload(fileName, blob, {
                    contentType: 'application/pdf',
                    upsert: true,
                });

            if (uploadErr) throw uploadErr;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            // Update document record
            await supabase
                .from('documents')
                .update({ public_url: publicUrl, number })
                .eq('id', doc.id);

            return { url: publicUrl };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document'] });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
}
