'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Схема валидации для профиля
const profileFormSchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  email: z.string().email('Некорректный email'),
  phone: z.string().optional(),
});

// Схема валидации для уведомлений
const notificationsFormSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

// Схема валидации для изменения пароля
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
  newPassword: z.string().min(8, 'Новый пароль должен содержать минимум 8 символов'),
  confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

// Схема валидации для удаления аккаунта
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Пароль обязателен'),
  confirmation: z.string().min(1, 'Подтверждение обязательно'),
}).refine(data => data.confirmation === 'DELETE', {
  message: 'Для подтверждения введите DELETE',
  path: ['confirmation'],
});

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isNotificationsSubmitting, setIsNotificationsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Форма профиля
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: session?.user?.phone || '',
    },
  });

  // Форма уведомлений
  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: session?.user?.notificationSettings?.email || false,
      pushNotifications: session?.user?.notificationSettings?.push || false,
    },
  });

  // Форма изменения пароля
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Форма удаления аккаунта
  const deleteForm = useForm<z.infer<typeof deleteAccountSchema>>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmation: '',
    },
  });

  // Обработчик отправки формы профиля
  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      setIsProfileSubmitting(true);
      
      // В реальном приложении здесь будет запрос к API
      // const response = await fetch('/api/profile', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(data),
      // });
      // const result = await response.json();
      // if (!response.ok) throw new Error(result.error);
      
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Обновляем сессию
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      });
      
      toast.success('Профиль обновлен', { description: 'Ваши данные успешно обновлены' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Ошибка', { description: 'Не удалось обновить профиль' });
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  // Обработчик отправки формы уведомлений
  const onNotificationsSubmit = async (data: z.infer<typeof notificationsFormSchema>) => {
    try {
      setIsNotificationsSubmitting(true);
      
      // В реальном приложении здесь будет запрос к API
      // const response = await fetch('/api/profile', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     notificationSettings: {
      //       email: data.emailNotifications,
      //       push: data.pushNotifications,
      //     },
      //   }),
      // });
      // const result = await response.json();
      // if (!response.ok) throw new Error(result.error);
      
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Обновляем сессию
      await update({
        ...session,
        user: {
          ...session?.user,
          notificationSettings: {
            email: data.emailNotifications,
            push: data.pushNotifications,
          },
        },
      });
      
      toast.success('Настройки уведомлений обновлены', { description: 'Ваши настройки уведомлений успешно обновлены' });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Ошибка', { description: 'Не удалось обновить настройки уведомлений' });
    } finally {
      setIsNotificationsSubmitting(false);
    }
  };

  // Обработчик отправки формы изменения пароля
  const onPasswordSubmit = async (data: z.infer<typeof passwordFormSchema>) => {
    try {
      setIsPasswordSubmitting(true);
      setPasswordError('');
      
      // В реальном приложении здесь будет запрос к API
      // const response = await fetch('/api/profile/password', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(data),
      // });
      // const result = await response.json();
      // if (!response.ok) throw new Error(result.error);
      
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Сбрасываем форму
      passwordForm.reset();
      
      toast.success('Пароль изменен', { description: 'Ваш пароль успешно изменен' });
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError((error as Error).message || 'Не удалось изменить пароль');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Обработчик отправки формы удаления аккаунта
  const onDeleteSubmit = async (data: z.infer<typeof deleteAccountSchema>) => {
    try {
      setIsDeleteSubmitting(true);
      setDeleteError('');
      
      // В реальном приложении здесь будет запрос к API
      // const response = await fetch('/api/profile/delete', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(data),
      // });
      // const result = await response.json();
      // if (!response.ok) throw new Error(result.error);
      
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDeleteSuccess(true);
      
      // Перенаправляем на главную страницу через 3 секунды
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError((error as Error).message || 'Не удалось удалить аккаунт');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Настройки</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
        </TabsList>
        
        {/* Вкладка профиля */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Профиль</CardTitle>
              <CardDescription>
                Управляйте информацией о вашем профиле
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя</FormLabel>
                        <FormControl>
                          <Input placeholder="Ваше имя" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="example@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+7 (999) 123-45-67" {...field} />
                        </FormControl>
                        <FormDescription>
                          Необязательно. Используется для уведомлений.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isProfileSubmitting}>
                    {isProfileSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Сохранить изменения
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Вкладка уведомлений */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Уведомления</CardTitle>
              <CardDescription>
                Настройте способы получения уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-4">
                  <FormField
                    control={notificationsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email уведомления</FormLabel>
                          <FormDescription>
                            Получайте уведомления о предстоящих платежах на email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationsForm.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Push-уведомления</FormLabel>
                          <FormDescription>
                            Получайте push-уведомления в браузере
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isNotificationsSubmitting}>
                    {isNotificationsSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Сохранить настройки
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Вкладка безопасности */}
        <TabsContent value="security" className="mt-6 space-y-6">
          {/* Изменение пароля */}
          <Card>
            <CardHeader>
              <CardTitle>Изменение пароля</CardTitle>
              <CardDescription>
                Обновите ваш пароль для повышения безопасности
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ошибка</AlertTitle>
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Текущий пароль</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Новый пароль</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Минимум 8 символов
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Подтверждение пароля</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isPasswordSubmitting}>
                    {isPasswordSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Изменить пароль
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Удаление аккаунта */}
          <Card>
            <CardHeader>
              <CardTitle>Удаление аккаунта</CardTitle>
              <CardDescription>
                Удаление аккаунта приведет к потере всех данных
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deleteSuccess ? (
                <Alert className="mb-4 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle>Аккаунт удален</AlertTitle>
                  <AlertDescription>
                    Ваш аккаунт успешно удален. Вы будете перенаправлены на главную страницу.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {deleteError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Ошибка</AlertTitle>
                      <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Внимание</AlertTitle>
                    <AlertDescription>
                      Это действие необратимо. Все ваши данные, включая счета, команды и настройки, будут удалены.
                    </AlertDescription>
                  </Alert>
                  
                  <Form {...deleteForm}>
                    <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4">
                      <FormField
                        control={deleteForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deleteForm.control}
                        name="confirmation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Подтверждение</FormLabel>
                            <FormControl>
                              <Input placeholder="Введите DELETE для подтверждения" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" variant="destructive" disabled={isDeleteSubmitting}>
                        {isDeleteSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Удалить аккаунт
                      </Button>
                    </form>
                  </Form>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}