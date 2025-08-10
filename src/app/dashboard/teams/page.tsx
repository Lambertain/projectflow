import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Здесь будет логика получения данных о командах пользователя из базы данных
  // В реальном приложении эти данные будут загружаться из базы данных через Prisma
  const teams = [
    {
      id: 'team-1',
      name: 'Семья',
      description: 'Семейные расходы и счета',
      role: 'owner',
      membersCount: 3,
      billsCount: 12,
      createdAt: new Date(2023, 8, 15),
    },
    {
      id: 'team-2',
      name: 'Бизнес',
      description: 'Расходы на бизнес и офис',
      role: 'owner',
      membersCount: 2,
      billsCount: 8,
      createdAt: new Date(2023, 9, 5),
    },
  ];

  // Функция для форматирования даты
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Функция для отображения роли пользователя в команде
  const formatRole = (role: string) => {
    const roles: Record<string, string> = {
      owner: 'Владелец',
      admin: 'Администратор',
      member: 'Участник',
      accountant: 'Бухгалтер',
    };
    return roles[role] || role;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={session.user} />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Управление командами</h1>
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

          {/* Список команд */}
          {teams.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex flex-col rounded-lg border bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex-1 p-6">
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {team.name}
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        {formatRole(team.role)}
                      </span>
                    </div>
                    <p className="mb-4 text-sm text-gray-500">
                      {team.description}
                    </p>
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Участников:</span>
                        <span className="font-medium">{team.membersCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Счетов:</span>
                        <span className="font-medium">{team.billsCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Создана:</span>
                        <span className="font-medium">
                          {formatDate(team.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-t border-gray-100">
                    <Link
                      href={`/dashboard/teams/${team.id}`}
                      className="flex flex-1 items-center justify-center py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Управление
                    </Link>
                    <div className="h-full w-px bg-gray-100"></div>
                    <Link
                      href={`/dashboard/teams/${team.id}/bills`}
                      className="flex flex-1 items-center justify-center py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Счета команды
                    </Link>
                  </div>
                </div>
              ))}

              {/* Карточка для создания новой команды */}
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center hover:border-gray-400">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-indigo-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium">Создать новую команду</h3>
                <p className="mb-4 text-sm text-gray-500">
                  Пригласите членов семьи или коллег для совместного управления
                  счетами
                </p>
                <Link
                  href="/dashboard/teams/create"
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Создать команду
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium">У вас пока нет команд</h3>
              <p className="mb-4 text-gray-500">
                Создайте команду, чтобы пригласить членов семьи или коллег для
                совместного управления счетами
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
                Создать первую команду
              </Link>
            </div>
          )}

          {/* Приглашения в команды */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Приглашения в команды</h2>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <p className="text-center text-gray-500">
                У вас нет активных приглашений в команды
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}