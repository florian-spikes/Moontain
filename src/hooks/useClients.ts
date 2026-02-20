
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Client, NewClient } from '../types';

export function useClients() {
    const queryClient = useQueryClient();

    const clientsQuery = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('*, documents(*), services(*)')
                .order('name');

            if (error) throw error;
            return data as Client[];
        },
    });

    const createClient = useMutation({
        mutationFn: async (newClient: NewClient) => {
            const { data, error } = await supabase
                .from('clients')
                .insert(newClient)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });

    const updateClient = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
            const { data, error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });

    const archiveClient = useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('clients')
                .update({ is_archived: true })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });

    return {
        clients: clientsQuery.data ?? [],
        isLoading: clientsQuery.isLoading,
        error: clientsQuery.error,
        createClient,
        updateClient,
        archiveClient
    };
}
