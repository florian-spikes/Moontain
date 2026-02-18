
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Service, NewService } from '../types';

export function useServices(clientId?: string) {
    const queryClient = useQueryClient();

    const servicesQuery = useQuery({
        queryKey: ['services', clientId],
        queryFn: async () => {
            let query = supabase
                .from('services')
                .select('*, client:clients(name)');

            if (clientId) {
                query = query.eq('client_id', clientId);
            }

            const { data, error } = await query.order('renewal_date', { ascending: true });
            if (error) throw error;
            return data as Service[];
        },
    });

    const createService = useMutation({
        mutationFn: async (newService: NewService) => {
            const { data, error } = await supabase
                .from('services')
                .insert(newService)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });

    const updateService = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
            const { data, error } = await supabase
                .from('services')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });

    const deleteService = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });

    return {
        services: servicesQuery.data ?? [],
        isLoading: servicesQuery.isLoading,
        error: servicesQuery.error,
        createService,
        updateService,
        deleteService
    };
}
