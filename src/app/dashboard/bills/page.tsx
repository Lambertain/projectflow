'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, CreditCard, DollarSign, Filter, Plus, Search, Users, Calendar as CalendarIcon, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { format, isAfter, isBefore, parseISO, addDays, addMonths, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Bill = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  paidDate?: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  isRecurring: boolean;
  recurringPeriod?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  team?: {
    id: string;
    name: string;
  };
};

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type Team = {
  id: string;
  name: string;
};

export default function BillsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Состояния для фильтров и сортировки
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'all');
  const [period, setPeriod] = useState<string>(searchParams.get('period') || 'all');
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('category') || 'all');
  const [teamId, setTeamId] = useState<string>(searchParams.get('team') || 'all');
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc');
  const [fromDate, setFromDate] = useState<Date | undefined>(searchParams.get('fromDate') ? parseISO(searchParams.get('fromDate') as string) : undefined);
  const [toDate, setToDate] = useState<Date | undefined>(searchParams.get('toDate') ? parseISO(searchParams.get('toDate') as string) : undefined);
  
  // Состояния для данных
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalBills, setTotalBills] = useState(0);
  const [activeFilters, setActiveFilters] = useState(0);

  // Функция для получения счетов
  const fetchBills = async () => {
    try {
      setLoading(true);
      
      // В реальном приложении здесь будет запрос к API
      // const queryParams = new URLSearchParams();
      // queryParams.append('page', currentPage.toString());
      // if (status !== 'all') queryParams.append('status', status);
      // if (period !== 'all') queryParams.append('period', period);
      // if (categoryId !== 'all') queryParams.append('categoryId', categoryId);
      // if (teamId !== 'all') queryParams.append('teamId', teamId);
      // if (search) queryParams.append('search', search);
      // if (sortBy) queryParams.append('sortBy', sortBy);
      // if (sortOrder) queryParams.append('sortOrder', sortOrder);
      // if (fromDate) queryParams.append('fromDate', fromDate.toISOString());
      // if (toDate) queryParams.append('toDate', toDate.toISOString());
      // 
      // const response = await fetch(`/api/bills?${queryParams.toString()}`);
      // const data = await response.json();
      // setBills(data.bills);
      // setTotalPages(data.pagination.pages);
      // setTotalBills(data.pagination.total);
      
      // Для демонстрации используем моковые данные
      setTimeout(() => {
        const mockBills = generateMockBills();
        let filteredBills = [...mockBills];
        
        // Применяем фильтры
        if (status !== 'all') {
          filteredBills = filteredBills.filter(bill => bill.status === status);
        }
        
        if (period !== 'all') {
          const now = new Date();
          switch (period) {
            case 'overdue':
              filteredBills = filteredBills.filter(bill => 
                bill.status !== 'PAID' && isBefore(new Date(bill.dueDate), now)
              );
              break;
            case 'today':
              filteredBills = filteredBills.filter(bill => {
                const dueDate = new Date(bill.dueDate);
                return dueDate.getDate() === now.getDate() && 
                       dueDate.getMonth() === now.getMonth() && 
                       dueDate.getFullYear() === now.getFullYear();
              });
              break;
            case 'week':
              const nextWeek = new Date(now);
              nextWeek.setDate(now.getDate() + 7);
              filteredBills = filteredBills.filter(bill => 
                bill.status !== 'PAID' && 
                isAfter(new Date(bill.dueDate), now) && 
                isBefore(new Date(bill.dueDate), nextWeek)
              );
              break;
            case 'month':
              const nextMonth = new Date(now);
              nextMonth.setMonth(now.getMonth() + 1);
              filteredBills = filteredBills.filter(bill => 
                bill.status !== 'PAID' && 
                isAfter(new Date(bill.dueDate), now) && 
                isBefore(new Date(bill.dueDate), nextMonth)
              );
              break;
          }
        }
        
        if (categoryId !== 'all') {
          filteredBills = filteredBills.filter(bill => bill.category.id === categoryId);
        }
        
        if (teamId !== 'all') {
          filteredBills = filteredBills.filter(bill => bill.team?.id === teamId);
        }
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredBills = filteredBills.filter(bill => 
            bill.name.toLowerCase().includes(searchLower)
          );
        }
        
        if (fromDate) {
          filteredBills = filteredBills.filter(bill => 
            isAfter(new Date(bill.dueDate), fromDate) || 
            (new Date(bill.dueDate).getDate() === fromDate.getDate() && 
             new Date(bill.dueDate).getMonth() === fromDate.getMonth() && 
             new Date(bill.dueDate).getFullYear() === fromDate.getFullYear())
          );
        }
        
        if (toDate) {
          filteredBills = filteredBills.filter(bill => 
            isBefore(new Date(bill.dueDate), toDate) || 
            (new Date(bill.dueDate).getDate() === toDate.getDate() && 
             new Date(bill.dueDate).getMonth() === toDate.getMonth() && 
             new Date(bill.dueDate).getFullYear() === toDate.getFullYear())
          );
        }
        
        // Сортировка
        filteredBills.sort((a, b) => {
          let valueA, valueB;
          
          switch (sortBy) {
            case 'name':
              valueA = a.name;
              valueB = b.name;
              break;
            case 'amount':
              valueA = a.amount;
              valueB = b.amount;
              break;
            case 'dueDate':
            default:
              valueA = new Date(a.dueDate).getTime();
              valueB = new Date(b.dueDate).getTime();
              break;
          }
          
          if (sortOrder === 'asc') {
            return valueA > valueB ? 1 : -1;
          } else {
            return valueA < valueB ? 1 : -1;
          }
        });
        
        // Пагинация
        const pageSize = 10;
        const total = filteredBills.length;
        const pages = Math.ceil(total / pageSize);
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const paginatedBills = filteredBills.slice(start, end);
        
        setBills(paginatedBills);
        setTotalPages(pages);
        setTotalBills(total);
        
        // Подсчет активных фильтров
        let filterCount = 0;
        if (status !== 'all') filterCount++;
        if (period !== 'all') filterCount++;
        if (categoryId !== 'all') filterCount++;
        if (teamId !== 'all') filterCount++;
        if (search) filterCount++;
        if (fromDate) filterCount++;
        if (toDate) filterCount++;
        setActiveFilters(filterCount);
        
        setLoading(false);
      }, 500);
      
      // Загружаем категории и команды
      fetchCategories();
      fetchTeams();
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить счета',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Функция для получения категорий
  const fetchCategories = async () => {
    try {
      // В реальном приложении здесь будет запрос к API
      // const response = await fetch('/api/categories');
      // const data = await response.json();
      // setCategories(data);
      
      // Для демонстрации используем моковые данные
      const mockCategories: Category[] = [
        { id: 'category-1', name: 'Коммунальные услуги', color: '#3B82F6', icon: 'home' },
        { id: 'category-2', name: 'Подписки', color: '#10B981', icon: 'repeat' },
        { id: 'category-3', name: 'Аренда', color: '#F59E0B', icon: 'building' },
        { id: 'category-4', name: 'Кредиты', color: '#EF4444', icon: 'credit-card' },
        { id: 'category-5', name: 'Интернет', color: '#8B5CF6', icon: 'wifi' },
      ];
      
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Функция для получения команд
  const fetchTeams = async () => {
    try {
      // В реальном приложении здесь будет запрос к API
      // const response = await fetch('/api/teams');
      // const data = await response.json();
      // setTeams(data);
      
      // Для демонстрации используем моковые данные
      const mockTeams: Team[] = [
        { id: 'team-1', name: 'Семья' },
        { id: 'team-2', name: 'Работа' },
        { id: 'team-3', name: 'Друзья' },
      ];
      
      setTeams(mockTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  // Генерация моковых данных для демонстрации
  const generateMockBills = (): Bill[] => {
    const statuses: Array<'PENDING' | 'PAID' | 'OVERDUE'> = ['PENDING', 'PAID', 'OVERDUE'];
    const recurringPeriods: Array<'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'> = [
      'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'
    ];
    
    const mockBills: Bill[] = [];
    
    // Генерируем 50 счетов
    for (let i = 0; i < 50; i++) {
      const isRecurring = Math.random() > 0.5;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Создаем случайную дату оплаты в пределах ±30 дней от текущей даты
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60) - 30);
      
      // Если статус PAID, создаем дату оплаты до срока
      let paidDate;
      if (status === 'PAID') {
        paidDate = new Date(dueDate);
        paidDate.setDate(paidDate.getDate() - Math.floor(Math.random() * 5));
      }
      
      // Случайно определяем, принадлежит ли счет команде
      const hasTeam = Math.random() > 0.3;
      const teamIndex = Math.floor(Math.random() * 3);
      
      // Случайно выбираем категорию
      const categoryIndex = Math.floor(Math.random() * 5);
      
      mockBills.push({
        id: `bill-${i}`,
        name: `Счет ${i + 1}`,
        amount: Math.floor(Math.random() * 10000) + 1000,
        currency: 'RUB',
        status,
        dueDate: dueDate.toISOString(),
        paidDate: paidDate?.toISOString(),
        category: {
          id: `category-${categoryIndex + 1}`,
          name: ['Коммунальные услуги', 'Подписки', 'Аренда', 'Кредиты', 'Интернет'][categoryIndex],
          color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][categoryIndex],
        },
        isRecurring,
        recurringPeriod: isRecurring ? recurringPeriods[Math.floor(Math.random() * recurringPeriods.length)] : undefined,
        team: hasTeam ? {
          id: `team-${teamIndex + 1}`,
          name: ['Семья', 'Работа', 'Друзья'][teamIndex],
        } : undefined,
      });
    }
    
    return mockBills;
  };

  // Функция для применения фильтров
  const applyFilters = () => {
    setCurrentPage(1);
    fetchBills();
    
    // Обновляем URL с параметрами фильтрации
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (period !== 'all') params.set('period', period);
    if (categoryId !== 'all') params.set('category', categoryId);
    if (teamId !== 'all') params.set('team', teamId);
    if (search) params.set('search', search);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    if (fromDate) params.set('fromDate', fromDate.toISOString());
    if (toDate) params.set('toDate', toDate.toISOString());
    params.set('page', '1');
    
    const queryString = params.toString();
    router.push(`/dashboard/bills${queryString ? `?${queryString}` : ''}`);
  };

  // Функция для сброса фильтров
  const resetFilters = () => {
    setStatus('all');
    setPeriod('all');
    setCategoryId('all');
    setTeamId('all');
    setSearch('');
    setSortBy('dueDate');
    setSortOrder('asc');
    setFromDate(undefined);
    setToDate(undefined);
    setCurrentPage(1);
    
    router.push('/dashboard/bills');
  };

  // Функция для изменения страницы
  const changePage = (page: number) => {
    setCurrentPage(page);
    
    // Обновляем URL с параметром страницы
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    
    const queryString = params.toString();
    router.push(`/dashboard/bills${queryString ? `?${queryString}` : ''}`);
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

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: ru });
  };

  // Загружаем счета при монтировании компонента или изменении параметров
  useEffect(() => {
    fetchBills();
  }, [currentPage]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Счета</h2>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard/bills/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Создать счет
              </Button>
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          {/* Статистика */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Всего счетов
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBills}</div>
                <p className="text-xs text-muted-foreground">
                  +5 с прошлого месяца
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ожидают оплаты
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bills.filter(bill => bill.status === 'PENDING').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +2 с прошлой недели
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Оплачено в этом месяце
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bills.filter(bill => bill.status === 'PAID').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12 с прошлого месяца
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Просрочено
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bills.filter(bill => bill.status === 'OVERDUE').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  -2 с прошлого месяца
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Вкладки */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Все счета</TabsTrigger>
              <TabsTrigger value="pending">Ожидают оплаты</TabsTrigger>
              <TabsTrigger value="paid">Оплаченные</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              {/* Фильтры */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Фильтры</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="status">Статус</Label>
                          <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status">
                              <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Все</SelectItem>
                              <SelectItem value="PENDING">Ожидает оплаты</SelectItem>
                              <SelectItem value="PAID">Оплачен</SelectItem>
                              <SelectItem value="OVERDUE">Просрочен</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="period">Период</Label>
                          <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger id="period">
                              <SelectValue placeholder="Выберите период" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Все</SelectItem>
                              <SelectItem value="today">Сегодня</SelectItem>
                              <SelectItem value="week">Эта неделя</SelectItem>
                              <SelectItem value="month">Этот месяц</SelectItem>
                              <SelectItem value="overdue">Просрочено</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="category">Категория</Label>
                          <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger id="category">
                              <SelectValue placeholder="Выберите категорию" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Все</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="search">Поиск</Label>
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="search"
                              placeholder="Поиск счетов..."
                              className="pl-8"
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Дополнительные фильтры</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="team">Команда</Label>
                        <Select value={teamId} onValueChange={setTeamId}>
                          <SelectTrigger id="team">
                            <SelectValue placeholder="Выберите команду" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fromDate">С даты</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {fromDate ? format(fromDate, 'PPP', { locale: ru }) : "Выберите дату"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={fromDate}
                                onSelect={setFromDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label htmlFor="toDate">По дату</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {toDate ? format(toDate, 'PPP', { locale: ru }) : "Выберите дату"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={toDate}
                                onSelect={setToDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={resetFilters}>
                          Сбросить {activeFilters > 0 && `(${activeFilters})`}
                        </Button>
                        <Button onClick={applyFilters}>Применить</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Таблица счетов */}
              <Card>
                <CardHeader>
                  <CardTitle>Список счетов</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="ml-4 h-6 w-32" />
                    </div>
                  ) : bills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <h3 className="text-lg font-medium">Счета не найдены</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Не найдено счетов, соответствующих заданным критериям фильтрации.
                      </p>
                      <Button variant="outline" onClick={resetFilters}>
                        Сбросить фильтры
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="pb-2 text-left font-medium">Название</th>
                              <th className="pb-2 text-left font-medium">Сумма</th>
                              <th className="pb-2 text-left font-medium">Срок оплаты</th>
                              <th className="pb-2 text-left font-medium">Категория</th>
                              <th className="pb-2 text-left font-medium">Повторение</th>
                              <th className="pb-2 text-left font-medium">Статус</th>
                              <th className="pb-2 text-right font-medium">Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bills.map((bill) => (
                              <tr key={bill.id} className="border-b">
                                <td className="py-3 pr-4">{bill.name}</td>
                                <td className="py-3 pr-4">
                                  {new Intl.NumberFormat('ru-RU', {
                                    style: 'currency',
                                    currency: bill.currency,
                                    minimumFractionDigits: 0,
                                  }).format(bill.amount)}
                                </td>
                                <td className="py-3 pr-4">{formatDate(bill.dueDate)}</td>
                                <td className="py-3 pr-4">
                                  <Badge style={{ backgroundColor: bill.category.color }}>
                                    {bill.category.name}
                                  </Badge>
                                </td>
                                <td className="py-3 pr-4">
                                  {bill.isRecurring ? getRecurringPeriodText(bill.recurringPeriod) : 'Разовый'}
                                </td>
                                <td className="py-3 pr-4">{getBillStatusBadge(bill.status)}</td>
                                <td className="py-3 text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Link
                                      href={`/dashboard/bills/${bill.id}`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Просмотр
                                    </Link>
                                    <Link
                                      href={`/dashboard/bills/${bill.id}/edit`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Изменить
                                    </Link>
                                    <button className="text-red-600 hover:text-red-900">
                                      Удалить
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Пагинация */}
                      {totalPages > 1 && (
                        <Pagination className="mt-4">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink 
                                  isActive={currentPage === page}
                                  onClick={() => changePage(page)}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              {/* Содержимое вкладки "Ожидают оплаты" */}
              <Card>
                <CardHeader>
                  <CardTitle>Ожидающие оплаты счета</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="ml-4 h-6 w-32" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="pb-2 text-left font-medium">Название</th>
                            <th className="pb-2 text-left font-medium">Сумма</th>
                            <th className="pb-2 text-left font-medium">Срок оплаты</th>
                            <th className="pb-2 text-left font-medium">Категория</th>
                            <th className="pb-2 text-left font-medium">Повторение</th>
                            <th className="pb-2 text-right font-medium">Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bills
                            .filter(bill => bill.status === 'PENDING')
                            .map((bill) => (
                              <tr key={bill.id} className="border-b">
                                <td className="py-3 pr-4">{bill.name}</td>
                                <td className="py-3 pr-4">
                                  {new Intl.NumberFormat('ru-RU', {
                                    style: 'currency',
                                    currency: bill.currency,
                                    minimumFractionDigits: 0,
                                  }).format(bill.amount)}
                                </td>
                                <td className="py-3 pr-4">{formatDate(bill.dueDate)}</td>
                                <td className="py-3 pr-4">
                                  <Badge style={{ backgroundColor: bill.category.color }}>
                                    {bill.category.name}
                                  </Badge>
                                </td>
                                <td className="py-3 pr-4">
                                  {bill.isRecurring ? getRecurringPeriodText(bill.recurringPeriod) : 'Разовый'}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Link
                                      href={`/dashboard/bills/${bill.id}`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Просмотр
                                    </Link>
                                    <Link
                                      href={`/dashboard/bills/${bill.id}/edit`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Изменить
                                    </Link>
                                    <button className="text-green-600 hover:text-green-900">
                                      Оплатить
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="paid" className="space-y-4">
              {/* Содержимое вкладки "Оплаченные" */}
              <Card>
                <CardHeader>
                  <CardTitle>Оплаченные счета</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="ml-4 h-6 w-32" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="pb-2 text-left font-medium">Название</th>
                            <th className="pb-2 text-left font-medium">Сумма</th>
                            <th className="pb-2 text-left font-medium">Срок оплаты</th>
                            <th className="pb-2 text-left font-medium">Дата оплаты</th>
                            <th className="pb-2 text-left font-medium">Категория</th>
                            <th className="pb-2 text-left font-medium">Повторение</th>
                            <th className="pb-2 text-right font-medium">Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bills
                            .filter(bill => bill.status === 'PAID')
                            .map((bill) => (
                              <tr key={bill.id} className="border-b">
                                <td className="py-3 pr-4">{bill.name}</td>
                                <td className="py-3 pr-4">
                                  {new Intl.NumberFormat('ru-RU', {
                                    style: 'currency',
                                    currency: bill.currency,
                                    minimumFractionDigits: 0,
                                  }).format(bill.amount)}
                                </td>
                                <td className="py-3 pr-4">{formatDate(bill.dueDate)}</td>
                                <td className="py-3 pr-4">{bill.paidDate && formatDate(bill.paidDate)}</td>
                                <td className="py-3 pr-4">
                                  <Badge style={{ backgroundColor: bill.category.color }}>
                                    {bill.category.name}
                                  </Badge>
                                </td>
                                <td className="py-3 pr-4">
                                  {bill.isRecurring ? getRecurringPeriodText(bill.recurringPeriod) : 'Разовый'}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Link
                                      href={`/dashboard/bills/${bill.id}`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Просмотр
                                    </Link>
                                    <Link
                                      href={`/dashboard/bills/${bill.id}/edit`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Изменить
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}