'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Asset = {
  id: string;
  name: string;
  purchaseDate: string;
  initialValue: number;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/assets');
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить активы', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete asset');
      toast({ title: 'Успех', description: 'Актив успешно удален' });
      fetchAssets(); // Refresh list
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить актив', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Активы</h2>
        <Link href="/dashboard/assets/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Добавить актив
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список активов</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Дата покупки</TableHead>
                <TableHead>Начальная стоимость</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : assets.length > 0 ? (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{new Date(asset.purchaseDate).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(asset.initialValue)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Открыть меню</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/dashboard/assets/${asset.id}`}>
                            <DropdownMenuItem>Редактировать</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleDelete(asset.id)} className="text-red-600">
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Активы не найдены.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
