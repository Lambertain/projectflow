'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import Link from 'next/link';
import { Check, X, Plus } from 'lucide-react';

// Simplified type for a transaction, matching the expected API response
type Transaction = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  category: {
    name: string;
  } | null;
};

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      
      setTransactions(data.transactions);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Ошибка', { description: 'Не удалось загрузить транзакции' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]);

  const handleUpdateStatus = async (transactionId: string, approvalStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvalStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      const updatedTransaction = await response.json();

      // Update the local state for instant feedback
      setTransactions(prev => 
        prev.map(t => t.id === transactionId ? { ...t, approvalStatus: updatedTransaction.approvalStatus } : t)
      );

      toast.success('Успех', {
        description: `Статус транзакции обновлен на "${getStatusText(approvalStatus)}"`,
      });

    } catch (error) {
      console.error('Error updating transaction status:', error);
      toast.error('Ошибка', { 
        description: (error as Error).message || 'Не удалось обновить статус.',
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/dashboard/transactions?${params.toString()}`);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500 hover:bg-green-600">Согласовано</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Ожидает</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500 hover:bg-red-600">Отклонено</Badge>;
      default:
        return <Badge>Неизвестно</Badge>;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Согласовано';
      case 'REJECTED': return 'Отклонено';
      default: return 'Ожидает';
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Транзакции</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/transactions/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить транзакцию
            </Button>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Список транзакций</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Описание</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Статус</TableHead>
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
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Транзакции не найдены.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}
                      </TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell>{transaction.category?.name || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(transaction.approvalStatus)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateStatus(transaction.id, 'APPROVED')}
                            disabled={transaction.approvalStatus === 'APPROVED'}
                            title="Согласовать"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateStatus(transaction.id, 'REJECTED')}
                            disabled={transaction.approvalStatus === 'REJECTED'}
                            title="Отклонить"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                          <Link href={`/dashboard/transactions/${transaction.id}`} className="text-primary hover:underline ml-2">
                            Детали
                          </Link>
                        </div>
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
