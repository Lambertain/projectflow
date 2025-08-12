'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

// Схема валидации для формы профиля
const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Имя должно содержать минимум 2 символа' })
    .max(50, { message: 'Имя не должно превышать 50 символов' }),
  email: z.string().email({ message: 'Введите корректный email' }),
  phone: z
    .string()
    .min(10, { message: 'Телефон должен содержать минимум 10 символов' })
    .optional()
    .or(z.literal('')),
  notifyEmail: z.boolean().default(true),
  notifyPush: z.boolean().default(true),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notifyEmail: true,
      notifyPush: true,
    },
  });

  // Заполнение формы данными пользователя при загрузке
  useEffect(() => {
    if (session?.user) {
      reset({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '', // В реальном приложении здесь будет телефон из базы данных
        notifyEmail: true, // В реальном приложении здесь будут настройки из базы данных
        notifyPush: true, // В реальном приложении здесь будут настройки из базы данных
      });
    }
  }, [session, reset]);

  // Проверка авторизации
  if (status === 'loading') {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Обработка отправки формы
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // В реальном приложении здесь будет запрос к API для обновления профиля
      console.log('Обновление профиля:', data);

      // Имитация задержки запроса
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Обновление данных сессии
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          email: data.email,
        },
      });

      setSuccess('Профиль успешно обновлен');
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err);
      setError(
        'Произошла ошибка при обновлении профиля. Пожалуйста, попробуйте снова.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={session?.user} />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-3xl">
          <h1 className="mb-6 text-2xl font-bold">Профиль пользователя</h1>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                  {success}
                </div>
              )}

              {/* Аватар пользователя */}
              <div className="flex items-center space-x-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'Avatar'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-indigo-600">
                      {session?.user?.name
                        ? session.user.name.charAt(0).toUpperCase()
                        : 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">
                    {session?.user?.name || 'Пользователь'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {session?.user?.email || ''}
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Изменить фото
                  </button>
                </div>
              </div>

              <div className="grid gap-6 pt-4 md:grid-cols-2">
                {/* Имя */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Имя *
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Телефон */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Телефон
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    placeholder="+7 (XXX) XXX-XX-XX"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Настройки уведомлений */}
              <div className="pt-4">
                <h3 className="mb-4 text-lg font-medium">Настройки уведомлений</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="notifyEmail"
                        type="checkbox"
                        {...register('notifyEmail')}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="notifyEmail"
                        className="font-medium text-gray-700"
                      >
                        Email-уведомления
                      </label>
                      <p className="text-gray-500">
                        Получать уведомления о предстоящих платежах по email
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="notifyPush"
                        type="checkbox"
                        {...register('notifyPush')}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="notifyPush"
                        className="font-medium text-gray-700"
                      >
                        Push-уведомления
                      </label>
                      <p className="text-gray-500">
                        Получать push-уведомления в браузере
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>

          {/* Изменение пароля */}
          <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium">Изменение пароля</h2>
            <p className="mb-4 text-sm text-gray-500">
              Для изменения пароля нажмите на кнопку ниже. Вам будет отправлена
              ссылка для сброса пароля на ваш email.
            </p>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Сбросить пароль
            </button>
          </div>

          {/* Удаление аккаунта */}
          <div className="mt-6 rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-red-600">
              Удаление аккаунта
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Внимание! Удаление аккаунта приведет к безвозвратной потере всех
              ваших данных, включая информацию о счетах и командах.
            </p>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Удалить аккаунт
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}