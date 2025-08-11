import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Helper function to format amounts
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD', // Should be dynamic based on workspace settings later
    minimumFractionDigits: 2,
  }).format(amount);
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.workspaceId) {
    redirect('/login');
  }

  const workspaceId = session.user.workspaceId;

  // Fetch real data from the database
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      workspaceId,
      date: {
        gte: monthStart,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const incomeThisMonth = stats.find(s => s.type === 'INCOME')?._sum.amount || 0;
  const expenseThisMonth = stats.find(s => s.type === 'EXPENSE')?._sum.amount || 0;

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      workspaceId,
    },
    take: 5,
    orderBy: {
      date: 'desc',
    },
    include: {
      category: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={session.user} />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <h1 className="mb-6 text-2xl font-bold">Обзор</h1>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Статистика */}
            <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="mb-4 text-lg font-medium">Финансы за этот месяц</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-gray-500">Доход</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(incomeThisMonth)}
                  </p>
                </div>
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-gray-500">Расход</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatAmount(expenseThisMonth)}
                  </p>
                </div>
              </div>
            </div>

            {/* Последние транзакции */}
            <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium">Последние транзакции</h2>
                <Link
                  href="/dashboard/transactions"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Все транзакции
                </Link>
              </div>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.category?.name || 'Без категории'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    Транзакций пока нет.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
