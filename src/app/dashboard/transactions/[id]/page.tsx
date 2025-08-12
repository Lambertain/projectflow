'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, CheckCircle2, Edit, FileText, Trash2, XCircle } from 'lucide-react';
import Link from 'next/link';

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
  project: {
    name: string;
  } | null;
  createdAt: string;
};

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const transactionId = params.id as string;

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!transactionId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/transactions/${transactionId}`);
        if (!response.ok) {
          throw new Error('Транзакция не найдена');
        }
        const data = await response.json();
        setTransaction(data);
      } catch (error) {
        console.error('Error fetching transaction details:', error);
        toast.error('Ошибка', { description: 'Не удалось загрузить данные о транзакции.' });
        router.push('/dashboard/transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transactionId, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Не удалось удалить транзакцию');
      }
      toast.success('Успех', { description: 'Транзакция успешно удалена.' });
      router.push('/dashboard/transactions');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Ошибка', { description: 'Не удалось удалить транзакцию.' });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Согласовано</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">Ожидает</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500">Отклонено</Badge>;
      default:
        return <Badge>Неизвестно</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!transaction) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Транзакция не найдена</h2>
        <Button onClick={() => router.push('/dashboard/transactions')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/transactions/${transaction.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить транзакцию?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{transaction.description}</span>
            {getStatusBadge(transaction.approvalStatus)}
          </CardTitle>
          <CardDescription>
            Детали транзакции от {new Date(transaction.date).toLocaleDateString('ru-RU')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-medium">Сумма</h3>
            <p className={`text-2xl font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Тип</h3>
            <p>{transaction.type === 'INCOME' ? 'Доход' : 'Расход'}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Категория</h3>
            <p>{transaction.category?.name || 'Без категории'}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Проект</h3>
            <p>{transaction.project?.name || 'Без проекта'}</p>
          </div>
        </CardContent>
        {transaction.approvalStatus === 'PENDING' && (
          <CardFooter className="flex space-x-2">
             <Button><CheckCircle2 className="mr-2 h-4 w-4" />Согласовать</Button>
             <Button variant="secondary"><XCircle className="mr-2 h-4 w-4" />Отклонить</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
