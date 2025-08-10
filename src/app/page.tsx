import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirect to dashboard if user is authenticated
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-indigo-600">ProjectFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Войти
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex items-center">
        <div className="container mx-auto px-4 py-16 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Превратите хаос в прибыль с помощью AI
            </h1>
            <p className="text-xl text-gray-800 mb-8">
              Единая платформа для автоматизации финансового учета, контроля активов и ведения проектов. Избавьтесь от хаоса в таблицах и получите полный контроль над вашим бизнесом в реальном времени.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/register" 
                className="px-8 py-3 rounded-md text-center font-medium bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Начать бесплатно
              </Link>
              <Link 
                href="/about" 
                className="px-8 py-3 rounded-md text-center font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Узнать больше
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              {/* Placeholder for dashboard preview image */}
              <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-500">Изображение дашборда</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Основные возможности</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Автоматизация с AI</h3>
              <p className="text-gray-800">Импортируйте данные из любых источников и позвольте AI автоматически их классифицировать и упорядочить.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Дашборд в реальном времени</h3>
              <p className="text-gray-800">Получайте полное представление о финансовом состоянии вашего бизнеса с помощью наглядных и всегда актуальных графиков.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Учет Активов</h3>
              <p className="text-gray-800">Отслеживайте все ваше оборудование и материальные ценности с помощью QR-кодов и мобильного приложения.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-xl font-bold">ProjectFlow</span>
              <p className="text-gray-400 mt-2">© {new Date().getFullYear()} ProjectFlow. Все права защищены.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                О нас
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Политика конфиденциальности
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
