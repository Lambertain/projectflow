'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Схема валидации для формы создания счета
const billFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Название должно содержать минимум 2 символа' })
    .max(100, { message: 'Название не должно превышать 100 символов' }),
  amount: z
    .string()
    .min(1, { message: 'Введите сумму' })
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Сумма должна быть числом',
    })
    .refine((val) => parseFloat(val) > 0, {
      message: 'Сумма должна быть больше нуля',
    }),
  dueDate: z.string().min(1, { message: 'Выберите дату оплаты' }),
  category: z.string().min(1, { message: 'Выберите категорию' }),
  description: z.string().optional(),
  isRecurring: z.boolean(),
  recurringPeriod: z.string().optional(),
  notifyBefore: z.string().optional(),
  teamId: z.string().optional(),
});

type BillFormValues = z.infer<typeof billFormSchema>;

export default function CreateBillPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      name: '',
      amount: '',
      dueDate: '',
      category: '',
      description: '',
      isRecurring: false,
      recurringPeriod: 'monthly',
      notifyBefore: '3',
      teamId: '',
    },
  });

  const isRecurring = watch('isRecurring');

  // Проверка авторизации
  if (status === 'loading') {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Обработка отправки формы
  const onSubmit = async (data: BillFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // В реальном приложении здесь будет запрос к API для создания счета
      console.log('Создание счета:', data);

      // Имитация задержки запроса
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Перенаправление на страницу счетов после успешного создания
      router.push('/dashboard/bills');
    } catch (err) {
      console.error('Ошибка при создании счета:', err);
      setError('Произошла ошибка при создании счета. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Создание нового счета</h1>
        <Link
          href="/dashboard/bills"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Вернуться к списку счетов
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Название счета */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Название счета *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Например: Аренда квартиры"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Сумма */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700"
              >
                Сумма *
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">₽</span>
                </div>
                <input
                  id="amount"
                  type="text"
                  {...register('amount')}
                  className="block w-full rounded-md border border-gray-300 pl-7 pr-12 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Дата оплаты */}
            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700"
              >
                Дата оплаты *
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.dueDate.message}
                </p>
              )}
            </div>

            {/* Категория */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                Категория *
              </label>
              <select
                id="category"
                {...register('category')}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Выберите категорию</option>
                <option value="Жилье">Жилье</option>
                <option value="Коммунальные услуги">Коммунальные услуги</option>
                <option value="Связь">Связь</option>
                <option value="Развлечения">Развлечения</option>
                <option value="Транспорт">Транспорт</option>
                <option value="Здоровье">Здоровье</option>
                <option value="Образование">Образование</option>
                <option value="Другое">Другое</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category.message}
                </p>
              )}
            </div>
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
              placeholder="Дополнительная информация о счете"
            />
          </div>

          {/* Повторяющийся платеж */}
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="isRecurring"
                type="checkbox"
                {...register('isRecurring')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="isRecurring" className="font-medium text-gray-700">
                Повторяющийся платеж
              </label>
              <p className="text-gray-500">
                Включите эту опцию, если счет повторяется регулярно
              </p>
            </div>
          </div>

          {/* Период повторения (отображается только если isRecurring = true) */}
          {isRecurring && (
            <div>
              <label
                htmlFor="recurringPeriod"
                className="block text-sm font-medium text-gray-700"
              >
                Период повторения
              </label>
              <select
                id="recurringPeriod"
                {...register('recurringPeriod')}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
                <option value="quarterly">Ежеквартально</option>
                <option value="yearly">Ежегодно</option>
              </select>
            </div>
          )}

          {/* Уведомления */}
          <div>
            <label
              htmlFor="notifyBefore"
              className="block text-sm font-medium text-gray-700"
            >
              Уведомить за
            </label>
            <select
              id="notifyBefore"
              {...register('notifyBefore')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="1">1 день до срока оплаты</option>
              <option value="2">2 дня до срока оплаты</option>
              <option value="3">3 дня до срока оплаты</option>
              <option value="5">5 дней до срока оплаты</option>
              <option value="7">7 дней до срока оплаты</option>
              <option value="14">14 дней до срока оплаты</option>
            </select>
          </div>

          {/* Команда (если есть) */}
          <div>
            <label
              htmlFor="teamId"
              className="block text-sm font-medium text-gray-700"
            >
              Команда (необязательно)
            </label>
            <select
              id="teamId"
              {...register('teamId')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Личный счет (без команды)</option>
              {/* В реальном приложении здесь будет список команд пользователя */}
              <option value="team-1">Семья</option>
              <option value="team-2">Бизнес</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Выберите команду, если хотите поделиться этим счетом с другими
              пользователями
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href="/dashboard/bills"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Создание...' : 'Создать счет'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}