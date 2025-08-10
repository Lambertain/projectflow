'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addMonths, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, Clock, CreditCard, DollarSign, Edit, FileText, Trash2, Users, ArrowLeft, CheckCircle2, AlertCircle, CalendarClock } from 'lucide-react';
import Link from 'next/link';

type Bill = {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  paidDate?: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  isRecurring: boolean;
  recurringPeriod?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  recurringEndDate?: string;
  team?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  reminders: Array<{
    id: string;
    date: string;
    sent: boolean;
  }>;
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'SUCCESS' | 'FAILED';
  }>;
};

export default function BillDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [markingAsPaid, setMarkingAsPaid] = useState(false);
  const [upcomingPayments, setUpcomingPayments] = useState<Array<{ date: string; amount: number }>>([]);

  // Функция для получения данных о счете
  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      
      // В реальном приложении здесь будет запрос к API
      // const response = await fetch(`/api/bills/${params.id}`);
      // const data = await response.json();
      // setBill(data);
      
      // Для демонстрации используем моковые данные
      setTimeout(() => {
        const mockBill = generateMockBill(params.id as string);
        setBill(mockBill);
        
        // Генерируем предстоящие платежи для повторяющихся счетов
        if (mockBill.isRecurring && mockBill.recurringPeriod) {
          const upcoming = generateUpcomingPayments(mockBill);
          setUpcomingPayments(upcoming);
        }
        
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching bill details:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные о счете',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Генерация моковых данных для демонстрации
  const generateMockBill = (id: string): Bill => {
    const isRecurring = Math.random() > 0.5;
    const recurringPeriods: Array<'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'> = [
      'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'
    ];
    const statuses: Array<'PENDING' | 'PAID' | 'OVERDUE'> = ['PENDING', 'PAID', 'OVERDUE'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Создаем случайную дату оплаты в пределах последних 30 дней
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) - 15);
    
    // Если статус PAID, создаем дату оплаты до срока
    let paidDate;
    if (status === 'PAID') {
      paidDate = new Date(dueDate);
      paidDate.setDate(paidDate.getDate() - Math.floor(Math.random() * 5));
    }
    
    // Создаем случайную дату создания счета
    const createdAt = new Date(dueDate);
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30) - 5);
    
    // Создаем случайную дату обновления счета
    const updatedAt = new Date(createdAt);
    updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 5));
    
    // Создаем случайную дату окончания повторения (если счет повторяющийся)
    let recurringEndDate;
    if (isRecurring) {
      recurringEndDate = new Date(dueDate);
      recurringEndDate.setMonth(recurringEndDate.getMonth() + Math.floor(Math.random() * 12) + 6);
    }
    
    // Создаем случайные напоминания
    const reminders = [];
    const reminderCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < reminderCount; i++) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - (i + 1) * 3);
      reminders.push({
        id: `reminder-${i}`,
        date: reminderDate.toISOString(),
        sent: reminderDate < new Date(),
      });
    }
    
    // Создаем историю платежей для повторяющихся счетов
    const paymentHistory = [];
    if (isRecurring) {
      const historyCount = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < historyCount; i++) {
        const paymentDate = new Date(dueDate);
        paymentDate.setMonth(paymentDate.getMonth() - (i + 1));
        paymentHistory.push({
          id: `payment-${i}`,
          date: paymentDate.toISOString(),
          amount: Math.floor(Math.random() * 1000) + 500,
          status: Math.random() > 0.2 ? 'SUCCESS' : 'FAILED',
        });
      }
    }
    
    // Случайно определяем, принадлежит ли счет команде
    const hasTeam = Math.random() > 0.5;
    
    return {
      id,
      name: `Счет ${id.slice(0, 5)}`,
      description: 'Описание счета с подробной информацией о платеже',
      amount: Math.floor(Math.random() * 10000) + 1000,
      currency: 'RUB',
      status,
      dueDate: dueDate.toISOString(),
      paidDate: paidDate?.toISOString(),
      category: {
        id: 'category-1',
        name: 'Коммунальные услуги',
        color: '#3B82F6',
        icon: 'home',
      },
      isRecurring,
      recurringPeriod: isRecurring ? recurringPeriods[Math.floor(Math.random() * recurringPeriods.length)] : undefined,
      recurringEndDate: recurringEndDate?.toISOString(),
      team: hasTeam ? {
        id: 'team-1',
        name: 'Семья',
      } : undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      reminders,
      paymentHistory,
    };
  };

  // Генерация предстоящих платежей для повторяющихся счетов
  const generateUpcomingPayments = (bill: Bill) => {
    if (!bill.isRecurring || !bill.recurringPeriod) return [];
    
    const payments = [];
    const dueDate = new Date(bill.dueDate);
    
    for (let i = 0; i < 5; i++) {
      let nextDate = new Date(dueDate);
      
      switch (bill.recurringPeriod) {
        case 'WEEKLY':
          nextDate = addDays(nextDate, 7 * (i + 1));
          break;
        case 'MONTHLY':
          nextDate = addMonths(nextDate, i + 1);
          break;
        case 'QUARTERLY':
          nextDate = addMonths(nextDate, 3 * (i + 1));
          break;
        case 'YEARLY':
          nextDate = addMonths(nextDate, 12 * (i + 1));
          break;
      }
      
      // Проверяем, не превышает ли дата окончания повторения
      if (bill.recurringEndDate && nextDate > new Date(bill.recurringEndDate)) {
        break;
      }
      
      payments.push({
        date: nextDate.toISOString(),
        amount: bill.amount,
      });
    }
    
    return payments;
  };

  // Функция для удаления счета
  const deleteBill = async () => {
    try {
      setDeleting(true);
      
      // В реальном приложении здесь будет запрос к API
      // await fetch(`/api/bills/${params.id}`, {
      //   method: 'DELETE',
      // });
      
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Счет удален',
        description: 'Счет успешно удален',
      });
      
      // Перенаправляем на страницу со списком счетов
      router.push('/dashboard/bills');
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить счет',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  // Функция для отметки счета как оплаченного
  const markAsPaid = async () => {
    try {
      setMarkingAsPaid(true);
      
      // В реальном приложении здесь будет запрос к API
      // await fetch(`/api/bills/${params.id}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ status: 'PAID', paidDate: new Date().toISOString() }),
      // });
      
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Обновляем состояние
      setBill(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'PAID',
          paidDate: new Date().toISOString(),
        };
      });
      
      toast({
        title: 'Счет оплачен',
        description: 'Счет успешно отмечен как оплаченный',
      });
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отметить счет как оплаченный',
        variant: 'destructive',
      });
    } finally {
      setMarkingAsPaid(false);
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: ru });
  };

  // Функция для получения статуса счета
  const getBillStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500">Оплачен</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">Ожидает оплаты</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-500">Просрочен</Badge>;
      default:
        return <Badge>Неизвестно</Badge>;
    }
  };

  // Функция для получения периода повторения
  const getRecurringPeriodText = (period?: string) => {
    switch (period) {
      case 'WEEKLY':
        return 'Еженедельно';
      case 'MONTHLY':
        return 'Ежемесячно';
      case 'QUARTERLY':
        return 'Ежеквартально';
      case 'YEARLY':
        return 'Ежегодно';
      default:
        return 'Не повторяется';
    }
  };

  // Загружаем данные о счете при монтировании компонента
  useEffect(() => {
    fetchBillDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold">Счет не найден</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h3 className="mt-4 text-lg font-medium">Счет не найден</h3>
              <p className="text-muted-foreground mt-2">Запрашиваемый счет не существует или был удален</p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/bills')}>
                Вернуться к списку счетов
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold">{bill.name}</h1>
          {getBillStatusBadge(bill.status)}
        </div>
        
        <div className="flex items-center space-x-2">
          {bill.status !== 'PAID' && (
            <Button onClick={markAsPaid} disabled={markingAsPaid}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {markingAsPaid ? 'Отмечаем...' : 'Отметить как оплаченный'}
            </Button>
          )}
          
          <Button variant="outline" asChild>
            <Link href={`/dashboard/bills/${bill.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить счет?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Счет будет удален навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={deleteBill} disabled={deleting}>
                  {deleting ? 'Удаление...' : 'Удалить'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Детали</TabsTrigger>
              {bill.isRecurring && <TabsTrigger value="upcoming">Предстоящие платежи</TabsTrigger>}
              {bill.paymentHistory && bill.paymentHistory.length > 0 && (
                <TabsTrigger value="history">История платежей</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Информация о счете</CardTitle>
                  <CardDescription>
                    Подробная информация о счете и сроках оплаты
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Описание</h3>
                      <p className="mt-1">{bill.description || 'Нет описания'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Сумма</h3>
                        <p className="mt-1 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                          {bill.amount.toLocaleString()} {bill.currency}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Категория</h3>
                        <p className="mt-1">{bill.category.name}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Срок оплаты</h3>
                        <p className="mt-1 flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {formatDate(bill.dueDate)}
                        </p>
                      </div>
                      
                      {bill.paidDate && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Дата оплаты</h3>
                          <p className="mt-1 flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                            {formatDate(bill.paidDate)}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Повторение</h3>
                        <p className="mt-1 flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          {bill.isRecurring ? getRecurringPeriodText(bill.recurringPeriod) : 'Не повторяется'}
                        </p>
                      </div>
                      
                      {bill.isRecurring && bill.recurringEndDate && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Дата окончания повторения</h3>
                          <p className="mt-1 flex items-center">
                            <CalendarClock className="h-4 w-4 mr-1 text-muted-foreground" />
                            {formatDate(bill.recurringEndDate)}
                          </p>
                        </div>
                      )}
                      
                      {bill.team && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Команда</h3>
                          <p className="mt-1 flex items-center">
                            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                            <Link href={`/dashboard/teams/${bill.team.id}`} className="text-primary hover:underline">
                              {bill.team.name}
                            </Link>
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Дата создания</h3>
                        <p className="mt-1 flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                          {formatDate(bill.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {bill.reminders.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Напоминания</CardTitle>
                    <CardDescription>
                      Настроенные напоминания для этого счета
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bill.reminders.map((reminder) => (
                        <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                            <div>
                              <p>{formatDate(reminder.date)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(reminder.date) < new Date() ? 'Прошло' : 'Предстоит'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={reminder.sent ? 'outline' : 'secondary'}>
                            {reminder.sent ? 'Отправлено' : 'Ожидает отправки'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {bill.isRecurring && (
              <TabsContent value="upcoming" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Предстоящие платежи</CardTitle>
                    <CardDescription>
                      Расписание будущих платежей для этого повторяющегося счета
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingPayments.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Нет предстоящих платежей</h3>
                        <p className="text-muted-foreground mt-2">Для этого счета не запланировано будущих платежей</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingPayments.map((payment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                              <div>
                                <p>{formatDate(payment.date)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getRecurringPeriodText(bill.recurringPeriod)} платеж #{index + 1}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{payment.amount.toLocaleString()} {bill.currency}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {bill.paymentHistory && bill.paymentHistory.length > 0 && (
              <TabsContent value="history" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>История платежей</CardTitle>
                    <CardDescription>
                      История предыдущих платежей по этому счету
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bill.paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                            <div>
                              <p>{formatDate(payment.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <p className="font-medium mr-3">{payment.amount.toLocaleString()} {bill.currency}</p>
                            <Badge variant={payment.status === 'SUCCESS' ? 'default' : 'destructive'}>
                              {payment.status === 'SUCCESS' ? 'Успешно' : 'Ошибка'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bill.status !== 'PAID' && (
                  <Button className="w-full" onClick={markAsPaid} disabled={markingAsPaid}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {markingAsPaid ? 'Отмечаем...' : 'Отметить как оплаченный'}
                  </Button>
                )}
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/bills/${bill.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать счет
                  </Link>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить счет
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить счет?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие нельзя отменить. Счет будет удален навсегда.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteBill} disabled={deleting}>
                        {deleting ? 'Удаление...' : 'Удалить'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
          
          {bill.team && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Информация о команде</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Название команды</h3>
                    <p className="mt-1">{bill.team.name}</p>
                  </div>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/teams/${bill.team.id}`}>
                      <Users className="h-4 w-4 mr-2" />
                      Перейти к команде
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}