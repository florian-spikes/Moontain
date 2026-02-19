
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
                    description: line.description,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
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
        mutationFn: async ({ id, type }: { id: string, type: 'quote' | 'invoice' | 'reminder' | 'resend' }) => {
            const { data, error } = await supabase.functions.invoke('send-document-email', {
                body: { document_id: id, type }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document'] });
            queryClient.invalidateQueries({ queryKey: ['email-logs'] });
        }
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: Document['status'] }) => {
            const { data, error } = await supabase
                .from('documents')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['document'] });
        }
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
