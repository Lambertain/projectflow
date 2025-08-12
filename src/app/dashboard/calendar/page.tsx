'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  categoryId: string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
  teamId?: string;
  team?: {
    name: string;
  };
};

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  bills: Bill[];
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Функция для получения счетов
  const fetchBills = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      
      // В реальном приложении здесь будет запрос к API
      // const response = await fetch(`/api/bills?startDate=${startDate}&endDate=${endDate}`);
      // const data = await response.json();
      // setBills(data.bills);
      
      // Для демонстрации используем моковые данные
      setTimeout(() => {
        const mockBills = generateMockBills(currentDate);
        setBills(mockBills);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Ошибка', { description: 'Не удалось загрузить данные счетов' });
      setLoading(false);
    }
  };

  // Генерация моковых данных для демонстрации
  const generateMockBills = (date: Date): Bill[] => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const mockBills: Bill[] = [];
    const categories = [
      { id: '1', name: 'Коммунальные', color: '#FF5733', icon: '🏠' },
      { id: '2', name: 'Подписки', color: '#33FF57', icon: '📱' },
      { id: '3', name: 'Интернет', color: '#3357FF', icon: '🌐' },
      { id: '4', name: 'Аренда', color: '#F033FF', icon: '🏢' },
    ];
    
    const teams = [
      { id: '1', name: 'Семья' },
      { id: '2', name: 'Офис' },
    ];
    
    // Генерируем от 10 до 20 счетов на месяц
    const billsCount = Math.floor(Math.random() * 11) + 10;
    
    for (let i = 0; i < billsCount; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const categoryIndex = Math.floor(Math.random() * categories.length);
      const hasTeam = Math.random() > 0.5;
      const teamIndex = Math.floor(Math.random() * teams.length);
      const status = Math.random() > 0.7 ? 'PAID' : (Math.random() > 0.5 ? 'UNPAID' : 'OVERDUE');
      
      mockBills.push({
        id: `bill-${i}`,
        name: `Счет ${i + 1}`,
        amount: Math.floor(Math.random() * 10000) + 500,
        dueDate: new Date(year, month, day).toISOString(),
        status: status as 'PAID' | 'UNPAID' | 'OVERDUE',
        categoryId: categories[categoryIndex].id,
        category: categories[categoryIndex],
        ...(hasTeam ? {
          teamId: teams[teamIndex].id,
          team: teams[teamIndex],
        } : {}),
      });
    }
    
    return mockBills;
  };

  // Функция для генерации дней календаря
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Получаем дни для отображения в календаре
    const days: CalendarDay[] = dateRange.map(date => {
      // Фильтруем счета для текущего дня
      const dayBills = bills.filter(bill => {
        const billDate = new Date(bill.dueDate);
        return isSameDay(date, billDate);
      });
      
      return {
        date,
        isCurrentMonth: isSameMonth(date, currentDate),
        bills: dayBills,
      };
    });
    
    setCalendarDays(days);
  };

  // Обработчики навигации по месяцам
  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  // Обработчик выбора дня
  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day.date);
  };

  // Форматирование суммы
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Получение статуса счета в виде текста и цвета
  const getBillStatusInfo = (status: string) => {
    switch (status) {
      case 'PAID':
        return { text: 'Оплачен', color: 'bg-green-500' };
      case 'UNPAID':
        return { text: 'Не оплачен', color: 'bg-yellow-500' };
      case 'OVERDUE':
        return { text: 'Просрочен', color: 'bg-red-500' };
      default:
        return { text: 'Неизвестно', color: 'bg-gray-500' };
    }
  };

  // Загружаем счета при изменении месяца
  useEffect(() => {
    fetchBills();
  }, [currentDate]);

  // Генерируем дни календаря при изменении счетов или месяца
  useEffect(() => {
    if (!loading) {
      generateCalendarDays();
    }
  }, [bills, currentDate, loading]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Календарь платежей</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handlePreviousMonth}>
            &lt;
          </Button>
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{format(currentDate, 'LLLL yyyy', { locale: ru })}</span>
          </div>
          <Button variant="outline" onClick={handleNextMonth}>
            &gt;
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {/* Дни недели */}
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
          <div key={index} className="text-center font-medium py-2">
            {day}
          </div>
        ))}

        {/* Скелетон загрузки */}
        {loading && Array.from({ length: 31 }).map((_, index) => (
          <div key={index} className="min-h-[120px] rounded-lg overflow-hidden">
            <Skeleton className="h-full w-full" />
          </div>
        ))}

        {/* Дни календаря */}
        {!loading && calendarDays.map((day, index) => {
          const isSelected = selectedDay && isSameDay(day.date, selectedDay);
          const isToday = isSameDay(day.date, new Date());
          
          return (
            <div 
              key={index} 
              className={`min-h-[120px] rounded-lg border overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${isToday ? 'bg-muted/50' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <div className="p-2">
                <div className="text-right">
                  <span className={`inline-block rounded-full w-7 h-7 text-center leading-7 ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                    {format(day.date, 'd')}
                  </span>
                </div>
                <div className="mt-1 space-y-1 max-h-[80px] overflow-auto">
                  {day.bills.map((bill) => {
                    const statusInfo = getBillStatusInfo(bill.status);
                    return (
                      <div 
                        key={bill.id} 
                        className="text-xs flex items-center space-x-1 truncate"
                        style={{ borderLeftColor: bill.category.color, borderLeftWidth: '2px', paddingLeft: '2px' }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bill.category.color }}></span>
                        <span className="truncate">{bill.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Детали выбранного дня */}
      {selectedDay && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Платежи на {format(selectedDay, 'd MMMM yyyy', { locale: ru })}</CardTitle>
            <CardDescription>
              {calendarDays.find(day => selectedDay && isSameDay(day.date, selectedDay))?.bills.length || 0} платежей запланировано
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calendarDays.find(day => selectedDay && isSameDay(day.date, selectedDay))?.bills.length === 0 ? (
              <p className="text-muted-foreground">На этот день нет запланированных платежей</p>
            ) : (
              <div className="space-y-4">
                {calendarDays
                  .find(day => selectedDay && isSameDay(day.date, selectedDay))
                  ?.bills.map((bill) => {
                    const statusInfo = getBillStatusInfo(bill.status);
                    return (
                      <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: bill.category.color }}
                          >
                            {bill.category.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{bill.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {bill.category.name}{bill.team ? ` • ${bill.team.name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold">{formatAmount(bill.amount)}</span>
                          <Badge variant="outline" className={`${statusInfo.color} text-white mt-1`}>
                            {statusInfo.text}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedDay(null)}>Закрыть</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}