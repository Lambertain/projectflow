import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Здесь будет логика получения данных о счетах и предстоящих платежах
  // В реальном приложении эти данные будут загружаться из базы данных
  const upcomingBills = [
    {
      id: '1',
      name: 'Аренда квартиры',
      amount: 25000,
      dueDate: new Date(2023, 10, 15),
      category: 'Жилье',
      isPaid: false,
    },
    {
      id: '2',
      name: 'Интернет',
      amount: 1200,
      dueDate: new Date(2023, 10, 20),
      category: 'Связь',
      isPaid: false,
    },
    {
      id: '3',
      name: 'Электричество',
      amount: 3500,
      dueDate: new Date(2023, 10, 25),
      category: 'Коммунальные услуги',
      isPaid: false,
    },
  ];

  const recentlyPaidBills = [
    {
      id: '4',
      name: 'Мобильная связь',
      amount: 800,
      paidDate: new Date(2023, 10, 5),
      category: 'Связь',
      isPaid: true,
    },
    {
      id: '5',
      name: 'Подписка Netflix',
      amount: 1500,
      paidDate: new Date(2023, 10, 3),
      category: 'Развлечения',
      isPaid: true,
    },
  ];

  // Функция для форматирования даты
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  };

  // Функция для форматирования суммы
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={session.user} />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <h1 className="mb-6 text-2xl font-bold">Обзор</h1>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Статистика */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium">Статистика</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md bg-indigo-50 p-4">
                  <p className="text-sm text-gray-500">Предстоящие платежи</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatAmount(
                      upcomingBills.reduce((sum, bill) => sum + bill.amount, 0)
                    )}
                  </p>
                </div>
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-gray-500">Оплачено в этом месяце</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(
                      recentlyPaidBills.reduce(
                        (sum, bill) => sum + bill.amount,
                        0
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Предстоящие платежи */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium">Предстоящие платежи</h2>
                <Link
                  href="/dashboard/bills"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Все счета
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingBills.length > 0 ? (
                  upcomingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{bill.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(bill.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-indigo-600">
                          {formatAmount(bill.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{bill.category}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    Нет предстоящих платежей
                  </p>
                )}
              </div>
            </div>

            {/* Недавно оплаченные */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium">Недавно оплаченные</h2>
              <div className="space-y-4">
                {recentlyPaidBills.length > 0 ? (
                  recentlyPaidBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{bill.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(bill.paidDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {formatAmount(bill.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{bill.category}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    Нет недавно оплаченных счетов
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Календарь платежей */}
          <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Календарь платежей</h2>
              <Link
                href="/dashboard/calendar"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Полный календарь
              </Link>
            </div>
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-center text-gray-500">
                Здесь будет календарь с отмеченными датами платежей
              </p>
            </div>
          </div>

          {/* Команды */}
          <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Мои команды</h2>
              <Link
                href="/dashboard/teams"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Управление командами
              </Link>
            </div>
            <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
              <h3 className="mb-2 text-lg font-medium">Создайте команду</h3>
              <p className="mb-4 text-gray-500">
                Пригласите членов семьи или коллег для совместного управления
                счетами
              </p>
              <Link
                href="/dashboard/teams/create"
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Создать команду
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}