'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const assetFormSchema = z.object({
  name: z.string().min(1, 'Название обязательно для заполнения'),
  purchaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Неверный формат даты' }),
  initialValue: z.coerce.number().positive('Стоимость должна быть положительным числом'),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

export default function AssetFormPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  const isEditing = assetId !== 'create';

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      purchaseDate: new Date().toISOString().split('T')[0], // Today's date
      initialValue: 0,
    },
  });

  useEffect(() => {
    if (isEditing) {
      const fetchAsset = async () => {
        try {
          const response = await fetch(`/api/assets/${assetId}`);
          if (!response.ok) throw new Error('Asset not found');
          const data = await response.json();
          form.reset({
            ...data,
            purchaseDate: new Date(data.purchaseDate).toISOString().split('T')[0],
          });
        } catch (error) {
          toast.error('Ошибка', { description: 'Не удалось загрузить данные актива' });
          router.push('/dashboard/assets');
        }
      };
      fetchAsset();
    }
  }, [isEditing, assetId, form, router]);

  const onSubmit = async (data: AssetFormValues) => {
    try {
      const response = await fetch(
        isEditing ? `/api/assets/${assetId}` : '/api/assets',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            purchaseDate: new Date(data.purchaseDate).toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error(isEditing ? 'Failed to update asset' : 'Failed to create asset');
      
      toast.success('Успех', { description: `Актив успешно ${isEditing ? 'обновлен' : 'создан'}` });
      router.push('/dashboard/assets');
      router.refresh(); // Refresh server components
    } catch (error) {
      toast.error('Ошибка', { description: `Не удалось ${isEditing ? 'обновить' : 'создать'} актив` });
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditing ? 'Редактировать актив' : 'Создать актив'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Например, MacBook Pro 16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата покупки</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Начальная стоимость (в USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Отмена
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
