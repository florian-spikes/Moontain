
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function useDashboard() {
    const dashboardQuery = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const now = new Date();
            const startCurrentMonth = startOfMonth(now).toISOString();
            const endCurrentMonth = endOfMonth(now).toISOString();
            const startLastMonth = startOfMonth(subMonths(now, 1)).toISOString();
            const endLastMonth = endOfMonth(subMonths(now, 1)).toISOString();

            // 1. Revenue (Current Month)
            const { data: revenueData } = await supabase
                .from('documents')
                .select('total_amount')
                .eq('type', 'invoice')
                .neq('status', 'cancelled')
                .gte('date', startCurrentMonth)
                .lte('date', endCurrentMonth);

            const currentRevenue = revenueData?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0;

            // 2. Revenue (Last Month)
            const { data: lastRevenueData } = await supabase
                .from('documents')
                .select('total_amount')
                .eq('type', 'invoice')
                .neq('status', 'cancelled')
                .gte('date', startLastMonth)
                .lte('date', endLastMonth);

            const lastRevenue = lastRevenueData?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0;

            // 3. Pending Invoices (Sent or Overdue)
            const { count: pendingCount, data: pendingData } = await supabase
                .from('documents')
                .select('total_amount', { count: 'exact' })
                .eq('type', 'invoice')
                .in('status', ['sent', 'overdue']);

            const pendingAmount = pendingData?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0;

            // 4. Expiring Services (Next 30 days) => Replaced by Active Services
            const { count: activeServicesCount } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .or(`end_date.is.null,end_date.gte.${now.toISOString()}`);

            // 5. Active Clients
            const { count: activeClientsCount } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('is_archived', false);

            // 6. Recent Activity (Last 5 documents)
            const { data: recentDocs } = await supabase
                .from('documents')
                .select('id, number, type, status, date, client:clients(name), total_amount')
                .order('created_at', { ascending: false })
                .limit(5);

            return {
                revenue: {
                    current: currentRevenue,
                    last: lastRevenue,
                    growth: lastRevenue === 0 ? 100 : ((currentRevenue - lastRevenue) / lastRevenue) * 100
                },
                pendingInvoices: {
                    count: pendingCount || 0,
                    amount: pendingAmount
                },
                activeServices: activeServicesCount || 0,
                activeClients: activeClientsCount || 0,
                recentDocs: recentDocs || []
            };
        },
    });

    return {
        stats: dashboardQuery.data,
        isLoading: dashboardQuery.isLoading,
        error: dashboardQuery.error,
    };
}
