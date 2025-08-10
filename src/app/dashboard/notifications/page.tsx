'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Check, Trash2, AlertCircle, Calendar, Users, CreditCard, Info } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';

type Notification = {
  id: string;
  type: 'BILL_DUE' | 'BILL_PAID' | 'TEAM_INVITE' | 'TEAM_JOIN' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  billId?: string;
  bill?: {
    id: string;
    name: string;
  };
  teamId?: string;
  team?: {
    id: string;
    name: string;
  };
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const { toast } = useToast();

  // Функция для получения уведомлений
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // В реальном приложении здесь будет запрос к API
      // const response = await fetch(`/api/notifications?page=${currentPage}&read=${filter === 'unread' ? 'false' : ''}`);
      // const data = await response.json();
      // setNotifications(data.notifications);
      // setTotalPages(data.pagination.pages);
      
      // Для демонстрации используем моковые данные
      setTimeout(() => {
        const mockNotifications = generateMockNotifications(filter);
        setNotifications(mockNotifications);
        setTotalPages(5); // Предположим, что всего 5 страниц
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить уведомления',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Генерация моковых данных для демонстрации
  const generateMockNotifications = (filter: 'all' | 'unread'): Notification[] => {
    const types: Array<'BILL_DUE' | 'BILL_PAID' | 'TEAM_INVITE' | 'TEAM_JOIN' | 'SYSTEM'> = [
      'BILL_DUE', 'BILL_PAID', 'TEAM_INVITE', 'TEAM_JOIN', 'SYSTEM'
    ];
    
    const mockNotifications: Notification[] = [];
    
    // Генерируем от 5 до 15 уведомлений
    const count = Math.floor(Math.random() * 11) + 5;
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const read = Math.random() > 0.3; // 30% непрочитанных
      
      // Если фильтр установлен на непрочитанные, пропускаем прочитанные
      if (filter === 'unread' && read) continue;
      
      let title = '';
      let message = '';
      let billId: string | undefined;
      let bill: { id: string; name: string } | undefined;
      let teamId: string | undefined;
      let team: { id: string; name: string } | undefined;
      
      switch (type) {
        case 'BILL_DUE':
          billId = `bill-${i}`;
          bill = { id: billId, name: `Счет ${i + 1}` };
          title = 'Скоро оплата';
          message = `Напоминаем, что скоро наступает срок оплаты счета "${bill.name}"`;
          break;
        case 'BILL_PAID':
          billId = `bill-${i}`;
          bill = { id: billId, name: `Счет ${i + 1}` };
          title = 'Счет оплачен';
          message = `Счет "${bill.name}" был успешно оплачен`;
          break;
        case 'TEAM_INVITE':
          teamId = `team-${i}`;
          team = { id: teamId, name: `Команда ${i + 1}` };
          title = 'Приглашение в команду';
          message = `Вы были приглашены в команду "${team.name}"`;
          break;
        case 'TEAM_JOIN':
          teamId = `team-${i}`;
          team = { id: teamId, name: `Команда ${i + 1}` };
          title = 'Новый участник команды';
          message = `Пользователь "Иван Иванов" присоединился к команде "${team.name}"`;
          break;
        case 'SYSTEM':
          title = 'Системное уведомление';
          message = 'Обновление системы было успешно завершено';
          break;
      }
      
      // Создаем случайную дату в пределах последних 30 дней
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      mockNotifications.push({
        id: `notification-${i}`,
        type,
        title,
        message,
        read,
        createdAt: date.toISOString(),
        billId,
        bill,
        teamId,
        team,
      });
    }
    
    // Сортируем по дате (сначала новые)
    return mockNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Функция для отметки уведомления как прочитанное
  const markAsRead = async (id: string) => {
    try {
      // В реальном приложении здесь будет запрос к API
      // await fetch(`/api/notifications/${id}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ read: true }),
      // });
      
      // Обновляем состояние
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отметить уведомление как прочитанное',
        variant: 'destructive',
      });
    }
  };

  // Функция для отметки всех уведомлений как прочитанные
  const markAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      
      // В реальном приложении здесь будет запрос к API
      // await fetch('/api/notifications', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ markAllAsRead: true }),
      // });
      
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Обновляем состояние
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      toast({
        title: 'Готово',
        description: 'Все уведомления отмечены как прочитанные',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отметить все уведомления как прочитанные',
        variant: 'destructive',
      });
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  // Функция для удаления уведомления
  const deleteNotification = async (id: string) => {
    try {
      // В реальном приложении здесь будет запрос к API
      // await fetch(`/api/notifications/${id}`, {
      //   method: 'DELETE',
      // });
      
      // Обновляем состояние
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      toast({
        title: 'Уведомление удалено',
        description: 'Уведомление успешно удалено',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить уведомление',
        variant: 'destructive',
      });
    }
  };

  // Функция для удаления всех уведомлений
  const deleteAllNotifications = async () => {
    try {
      setDeletingAll(true);
      
      // В реальном приложении здесь будет запрос к API
      // await fetch('/api/notifications?all=true', {
      //   method: 'DELETE',
      // });
      
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Обновляем состояние
      setNotifications([]);
      
      toast({
        title: 'Уведомления удалены',
        description: 'Все уведомления успешно удалены',
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить все уведомления',
        variant: 'destructive',
      });
    } finally {
      setDeletingAll(false);
    }
  };

  // Функция для получения иконки уведомления
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BILL_DUE':
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      case 'BILL_PAID':
        return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'TEAM_INVITE':
      case 'TEAM_JOIN':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'SYSTEM':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ru });
  };

  // Загружаем уведомления при изменении страницы или фильтра
  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filter]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Уведомления</h1>
        <div className="flex items-center space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={notifications.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Очистить все
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить все уведомления?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Все уведомления будут удалены навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAllNotifications} disabled={deletingAll}>
                  {deletingAll ? 'Удаление...' : 'Удалить все'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={markingAllAsRead || notifications.every(n => n.read)}>
            <Check className="h-4 w-4 mr-2" />
            {markingAllAsRead ? 'Отмечаем...' : 'Отметить все как прочитанные'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setFilter(value as 'all' | 'unread')}>
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="all">Все уведомления</TabsTrigger>
          <TabsTrigger value="unread">Непрочитанные</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Все уведомления</CardTitle>
              <CardDescription>
                Просмотр всех уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                // Скелетон загрузки
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                // Нет уведомлений
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Нет уведомлений</h3>
                  <p className="text-muted-foreground mt-2">У вас пока нет уведомлений</p>
                </div>
              ) : (
                // Список уведомлений
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start space-x-4 p-4 rounded-lg border ${!notification.read ? 'bg-muted/50' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            
                            {/* Ссылки на связанные объекты */}
                            {notification.billId && (
                              <Link href={`/dashboard/bills/${notification.billId}`} className="text-sm text-primary hover:underline mt-2 inline-block">
                                Перейти к счету
                              </Link>
                            )}
                            {notification.teamId && (
                              <Link href={`/dashboard/teams/${notification.teamId}`} className="text-sm text-primary hover:underline mt-2 inline-block ml-4">
                                Перейти к команде
                              </Link>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 px-2"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center">
                          <p className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
                          {!notification.read && (
                            <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground text-xs">
                              Новое
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {!loading && notifications.length > 0 && (
              <CardFooter>
                <Pagination className="w-full justify-center">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const page = index + 1;
                      // Показываем только текущую страницу и соседние
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink 
                              isActive={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <PaginationEllipsis key={page} />;
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="unread" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Непрочитанные уведомления</CardTitle>
              <CardDescription>
                Просмотр непрочитанных уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                // Скелетон загрузки
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.filter(n => !n.read).length === 0 ? (
                // Нет непрочитанных уведомлений
                <div className="text-center py-8">
                  <Check className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Все уведомления прочитаны</h3>
                  <p className="text-muted-foreground mt-2">У вас нет непрочитанных уведомлений</p>
                </div>
              ) : (
                // Список непрочитанных уведомлений
                <div className="space-y-4">
                  {notifications.filter(n => !n.read).map((notification) => (
                    <div 
                      key={notification.id} 
                      className="flex items-start space-x-4 p-4 rounded-lg border bg-muted/50"
                    >
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            
                            {/* Ссылки на связанные объекты */}
                            {notification.billId && (
                              <Link href={`/dashboard/bills/${notification.billId}`} className="text-sm text-primary hover:underline mt-2 inline-block">
                                Перейти к счету
                              </Link>
                            )}
                            {notification.teamId && (
                              <Link href={`/dashboard/teams/${notification.teamId}`} className="text-sm text-primary hover:underline mt-2 inline-block ml-4">
                                Перейти к команде
                              </Link>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 px-2"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center">
                          <p className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
                          <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground text-xs">
                            Новое
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}