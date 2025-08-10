'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Схема валидации для формы создания команды
const teamFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Название должно содержать минимум 2 символа' })
    .max(50, { message: 'Название не должно превышать 50 символов' }),
  description: z
    .string()
    .max(200, { message: 'Описание не должно превышать 200 символов' })
    .optional(),
  members: z
    .array(
      z.object({
        email: z.string().email({ message: 'Введите корректный email' }),
        role: z.enum(['member', 'admin', 'accountant'], {
          message: 'Выберите роль из списка',
        }),
      })
    )
    .optional(),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

export default function CreateTeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<{ email: string; role: string }[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: '',
      description: '',
      members: [],
    },
  });

  // Проверка авторизации
  if (status === 'loading') {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Добавление нового участника
  const addMember = () => {
    if (!newMemberEmail) return;

    // Проверка валидности email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)) {
      setError('Введите корректный email');
      return;
    }

    // Проверка на дубликаты
    if (members.some((member) => member.email === newMemberEmail)) {
      setError('Этот email уже добавлен в список');
      return;
    }

    setMembers([
      ...members,
      { email: newMemberEmail, role: newMemberRole as string },
    ]);
    setNewMemberEmail('');
    setNewMemberRole('member');
    setError(null);
  };

  // Удаление участника
  const removeMember = (email: string) => {
    setMembers(members.filter((member) => member.email !== email));
  };

  // Обработка отправки формы
  const onSubmit = async (data: TeamFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Добавляем список участников к данным формы
      const formData = {
        ...data,
        members,
      };

      // В реальном приложении здесь будет запрос к API для создания команды
      console.log('Создание команды:', formData);

      // Имитация задержки запроса
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Перенаправление на страницу команд после успешного создания
      router.push('/dashboard/teams');
    } catch (err) {
      console.error('Ошибка при создании команды:', err);
      setError(
        'Произошла ошибка при создании команды. Пожалуйста, попробуйте снова.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Создание новой команды</h1>
        <Link
          href="/dashboard/teams"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Вернуться к списку команд
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Название команды */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Название команды *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Например: Семья или Бизнес"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Описание
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Краткое описание команды"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Участники команды */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Участники команды
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              Вы будете автоматически добавлены как владелец команды. Добавьте
              других участников ниже.
            </p>

            {/* Текущий пользователь (владелец) */}
            <div className="mb-4 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  {session?.user?.name
                    ? session.user.name.charAt(0).toUpperCase()
                    : 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'Пользователь'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.email || ''}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                Владелец
              </span>
            </div>

            {/* Список добавленных участников */}
            {members.length > 0 && (
              <div className="mb-4 space-y-2">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRole(member.role)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(member.email)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Форма добавления нового участника */}
            <div className="rounded-md border border-gray-200 p-4">
              <h4 className="mb-3 text-sm font-medium">Добавить участника</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label
                    htmlFor="newMemberEmail"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="newMemberEmail"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newMemberRole"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Роль
                  </label>
                  <select
                    id="newMemberRole"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  >
                    <option value="member">Участник</option>
                    <option value="admin">Администратор</option>
                    <option value="accountant">Бухгалтер</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={addMember}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
                  Добавить
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href="/dashboard/teams"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Создание...' : 'Создать команду'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}