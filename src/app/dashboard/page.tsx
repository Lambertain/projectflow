import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Helper function to format amounts
const formatAmount = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.workspaceId) {
    redirect('/login');
  }

  const workspaceId = session.user.workspaceId;

  // --- DATA FETCHING ---

  // 1. Monthly Stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthlyStats = await prisma.transaction.groupBy({
    by: ['type'],
    where: { workspaceId, date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  });

  const incomeThisMonth = monthlyStats.find(s => s.type === 'INCOME')?._sum.amount || 0;
  const expenseThisMonth = monthlyStats.find(s => s.type === 'EXPENSE')?._sum.amount || 0;
  const netProfitThisMonth = incomeThisMonth - expenseThisMonth;

  // 2. Project Stats
  const projectStats = await prisma.transaction.groupBy({
    by: ['projectId', 'type'],
    where: { workspaceId, projectId: { not: null } },
    _sum: { amount: true },
  });

  const projects = await prisma.project.findMany({ where: { workspaceId } });

  const projectsData = projects.map(project => {
    const income = projectStats.find(s => s.projectId === project.id && s.type === 'INCOME')?._sum.amount || 0;
    const expense = projectStats.find(s => s.projectId === project.id && s.type === 'EXPENSE')?._sum.amount || 0;
    return {
      ...project,
      income,
      expense,
      profit: income - expense,
    };
  });

  // 3. Chart Data (Last 30 days)
  // For simplicity, we'll fetch last 12 months data instead of daily for a cleaner chart
  const monthlyChartData = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      workspaceId,
      date: {
        gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      },
    },
    _sum: { amount: true },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    }
  });
  
  // This is a simplified data structure for the chart.
  // A real implementation would group by month.
  const chartData = [
    { name: 'Доход', income: monthlyChartData.find(s => s.type === 'INCOME')?._sum.amount || 0, expense: 0 },
    { name: 'Расход', income: 0, expense: monthlyChartData.find(s => s.type === 'EXPENSE')?._sum.amount || 0 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <DashboardHeader user={session.user} />

      <main className="flex-1 p-4 sm:p-6">
        <div className="container mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Доход (за месяц)</CardTitle>
                <span className="text-2xl">💰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatAmount(incomeThisMonth)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Расход (за месяц)</CardTitle>
                <span className="text-2xl">💸</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatAmount(expenseThisMonth)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Чистая прибыль (за месяц)</CardTitle>
                <span className="text-2xl">🏆</span>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfitThisMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(netProfitThisMonth)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Обзор доходов и расходов</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <OverviewChart data={chartData} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Финансы по проектам</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Проект</TableHead>
                      <TableHead className="text-right">Прибыль</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectsData.length > 0 ? (
                      projectsData.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className={`text-right font-medium ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatAmount(p.profit, p.id === 'some-id' ? 'EUR' : 'USD')}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center h-24">
                          Нет данных по проектам.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}