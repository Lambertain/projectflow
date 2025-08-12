'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Edit, Trash2, Repeat, Bell } from 'lucide-react';
import Link from 'next/link';

type ScheduledPayment = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  isRecurring: boolean;
  frequency: string | null;
  category: { name: string } | null;
  reminders: { id: string; daysBefore: number }[];
};

export default function ScheduledPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<ScheduledPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const paymentId = params.id as string;

  useEffect(() => {
    const fetchDetails = async () => {
      if (!paymentId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/scheduled-payments/${paymentId}`);
        if (!response.ok) throw new Error('Payment not found');
        const data = await response.json();
        setPayment(data);
      } catch (error) {
        toast.error('Ошибка', { description: 'Не удалось загрузить данные.' });
        router.push('/dashboard/scheduled-payments');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [paymentId, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/scheduled-payments/${paymentId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Успех', { description: 'Платеж удален.' });
      router.push('/dashboard/scheduled-payments');
    } catch (error) {
      toast.error('Ошибка', { description: 'Не удалось удалить платеж.' });
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!payment) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Платеж не найден</h2>
        <Button onClick={() => router.push('/dashboard/scheduled-payments')} className="mt-4">
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
            <Link href={`/dashboard/scheduled-payments/${payment.id}/edit`}>
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
                <AlertDialogTitle>Удалить этот запланированный платеж?</AlertDialogTitle>
                <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{payment.description}</CardTitle>
              <CardDescription>
                Следующая дата платежа: {new Date(payment.dueDate).toLocaleDateString('ru-RU')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-medium">Сумма</h3>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Повторение</h3>
                <div className="flex items-center">
                  <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                  <p>{payment.isRecurring ? payment.frequency || 'Регулярно' : 'Разовый платеж'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Категория</h3>
                <p>{payment.category?.name || 'Без категории'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Напоминания
              </CardTitle>
              <CardDescription>Система напомнит вам об этом платеже.</CardDescription>
            </CardHeader>
            <CardContent>
              {payment.reminders.length > 0 ? (
                <ul className="space-y-2">
                  {payment.reminders.map(reminder => (
                    <li key={reminder.id} className="flex items-center text-sm">
                      <Badge variant="secondary">За {reminder.daysBefore} дней</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Напоминания не настроены.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
