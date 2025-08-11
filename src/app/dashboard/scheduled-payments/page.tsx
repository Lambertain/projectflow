'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import Link from 'next/link';
import { Plus, Repeat } from 'lucide-react';

// Type for a scheduled payment, matching the API response
type ScheduledPayment = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  isRecurring: boolean;
  frequency: string | null;
  category: {
    name: string;
  } | null;
};

export default function ScheduledPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchScheduledPayments = async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: page.toString() });
        const response = await fetch(`/api/scheduled-payments?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch scheduled payments');
        }
        const data = await response.json();
        setPayments(data.scheduledPayments);
        setTotalPages(data.pagination.pages);
      } catch (error) {
        console.error('Error fetching scheduled payments:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить запланированные платежи',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledPayments(currentPage);
  }, [currentPage, toast]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/dashboard/scheduled-payments?${params.toString()}`);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Запланированные платежи</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/scheduled-payments/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить платеж
            </Button>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Список будущих и регулярных платежей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Описание</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Дата платежа</TableHead>
                  <TableHead>Повторение</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Запланированные платежи не найдены.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.description}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                      </TableCell>
                      <TableCell>{new Date(payment.dueDate).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell>
                        {payment.isRecurring ? (
                          <Badge variant="secondary" className="flex items-center w-fit">
                            <Repeat className="mr-1 h-3 w-3" />
                            {payment.frequency || 'Да'}
                          </Badge>
                        ) : (
                          'Разовый'
                        )}
                      </TableCell>
                      <TableCell>{payment.category?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/scheduled-payments/${payment.id}`} className="text-primary hover:underline">
                          Детали
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                  </PaginationItem>
                  {[...Array(totalPages).keys()].map((page) => (
                    <PaginationItem key={page + 1}>
                      <PaginationLink isActive={currentPage === page + 1} onClick={() => handlePageChange(page + 1)}>
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
