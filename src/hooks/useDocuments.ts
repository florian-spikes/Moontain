
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addMonths, addYears, format } from 'date-fns';
import { supabase } from '../lib/supabase';
import type { Document, NewDocument, EmailLog } from '../types';

export function useDocuments() {
    const queryClient = useQueryClient();

    const documentsQuery = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('documents')
                .select('*, client:clients(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Document[];
        },
    });

    const getDocument = (id: string) => useQuery({
        queryKey: ['document', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('documents')
                .select('*, client:clients(*), lines:document_lines(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Document;
        },
        enabled: !!id,
    });

    const createDocument = useMutation({
        mutationFn: async (newDoc: NewDocument) => {
            // 1. Create document
            const { data: doc, error: docError } = await supabase
                .from('documents')
                .insert({
                    client_id: newDoc.client_id,
                    type: newDoc.type,
                    date: newDoc.date,
                    due_date: newDoc.due_date,
                    status: 'draft',
                    // total_amount will be calculated/stored or we trust frontend?
                    // The schema has total generated in lines, but total_amount in doc is manual or trigger?
                    // I will calculate it here.
                    total_amount: newDoc.lines.reduce((acc, line) => acc + (line.quantity * line.unit_price), 0)
                })
                .select()
                .single();

            if (docError) throw docError;

            // 2. Create lines
            if (newDoc.lines.length > 0) {
                const lines = newDoc.lines.map(line => ({
                    document_id: doc.id,
                    name: line.name,
                    description: line.description,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    catalog_item_id: line.catalog_item_id || null,
                }));

                const { error: linesError } = await supabase
                    .from('document_lines')
                    .insert(lines);

                if (linesError) throw linesError;
            }

            return doc;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });

    const generatePdf = useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase.functions.invoke('generate-pdf', {
                body: { document_id: id }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document'] });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });

    const sendEmail = useMutation({
        mutationFn: async ({ id, type, to, cc, bcc, number }: { id: string, type: string, to: string | string[], cc?: string[], bcc?: string[], number: string }) => {
            // 1. Insert "Sending..." log immediately
            const recipientsStr = Array.isArray(to) ? to.join(', ') : to;

            const { data: log, error: logError } = await supabase
                .from('email_logs')
                .insert({
                    type,
                    document_id: id,
                    status: 'pending', // or 'sending' if your schema allows
                    recipient: recipientsStr, // Primary recipient for log
                    subject: `${type === 'quote' ? 'Devis' : 'Facture'} ${number}`
                })
                .select()
                .single();

            if (logError) throw logError;

            // 2. Call function with log_id
            const { data, error } = await supabase.functions.invoke('send-document-email', {
                body: { document_id: id, type, log_id: log.id, to, cc, bcc }
            });

            if (error) {
                // Return generic error, the function might have updated the log to error already, 
                // but if invoke failed (network), we should update it here.
                await supabase.from('email_logs').update({ status: 'error', error: error.message }).eq('id', log.id);
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document'] });
            // email-logs query will be updated via Realtime or invalidate
            queryClient.invalidateQueries({ queryKey: ['email-logs'] });
        }
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: Document['status'] }) => {
            const { data, error } = await supabase
                .from('documents')
                .update({ status })
                .eq('id', id)
                .select('*, lines:document_lines(*, catalog_item:catalog_items(*))')
                .single();

            if (error) throw error;

            // Automation: Generate services if quote is accepted
            if (status === 'accepted' && data.type === 'quote' && data.lines) {
                const servicesToCreate = data.lines
                    .filter((line: any) => line.catalog_item && line.catalog_item.billing_mode === 'subscription')
                    .map((line: any) => {
                        const catalogItem = line.catalog_item;
                        const startDate = new Date();
                        let renewalDate = null;

                        if (catalogItem.billing_frequency === 'monthly') {
                            renewalDate = addMonths(startDate, 1);
                        } else if (catalogItem.billing_frequency === 'yearly') {
                            renewalDate = addYears(startDate, 1);
                        }

                        return {
                            client_id: data.client_id,
                            name: line.description.split('\n')[0] || catalogItem.name, // Usually the first line is the main title
                            type: catalogItem.service_type || 'other',
                            price: line.unit_price * line.quantity,
                            start_date: format(startDate, 'yyyy-MM-dd'),
                            renewal_date: renewalDate ? format(renewalDate, 'yyyy-MM-dd') : null,
                            end_date: catalogItem.end_date || null,
                            notes: `Service généré automatiquement depuis le Devis #${data.number || data.id}`
                        };
                    });

                if (servicesToCreate.length > 0) {
                    const { error: serviceError } = await supabase.from('services').insert(servicesToCreate);
                    if (serviceError) console.error("Failed to insert automated services:", serviceError);
                    else {
                        // Refresh services list across the app
                        queryClient.invalidateQueries({ queryKey: ['services'] });
                        queryClient.invalidateQueries({ queryKey: ['client', data.client_id] });
                    }
                }
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['document'] });
        }
    });

    const updateDocument = useMutation({
        mutationFn: async ({ id, date, due_date, lines }: {
            id: string;
            date?: string;
            due_date?: string;
            lines?: { name: string; description: string; quantity: number; unit_price: number; catalog_item_id?: string | null }[];
        }) => {
            const updates: any = {};
            if (date) updates.date = date;
            if (due_date) updates.due_date = due_date;
            if (lines) {
                updates.total_amount = lines.reduce((acc, l) => acc + l.quantity * l.unit_price, 0);
            }
            const { error } = await supabase.from('documents').update(updates).eq('id', id);
            if (error) throw error;

            if (lines) {
                // Delete old lines then insert new
                await supabase.from('document_lines').delete().eq('document_id', id);
                const { error: linesErr } = await supabase.from('document_lines').insert(
                    lines.map(l => ({
                        document_id: id,
                        name: l.name,
                        description: l.description,
                        quantity: l.quantity,
                        unit_price: l.unit_price,
                        catalog_item_id: l.catalog_item_id || null
                    }))
                );
                if (linesErr) throw linesErr;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['document'] });
        },
    });

    return {
        documents: documentsQuery.data ?? [],
        isLoading: documentsQuery.isLoading,
        error: documentsQuery.error,
        getDocument,
        createDocument,
        generatePdf,
        sendEmail,
        updateStatus,
        updateDocument,
        getEmailLogs: (documentId: string) => useQuery({
            queryKey: ['email-logs', documentId],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('email_logs')
                    .select('*')
                    .eq('document_id', documentId)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return data as EmailLog[];
            },
            enabled: !!documentId,
        }),
    };
}
