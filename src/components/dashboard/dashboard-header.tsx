'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { User } from 'next-auth';

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="container flex h-14 items-center justify-between py-4">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-indigo-600">BillSmart</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link
              href="/dashboard"
              className="flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              Дашборд
            </Link>
            <Link
              href="/dashboard/bills"
              className="flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              Счета
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (isUserMenuOpen) setIsUserMenuOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600"
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
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="absolute right-0 top-0 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-md bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="mb-2 px-4 py-2 text-sm font-medium text-gray-700">
                  Уведомления
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                            <path d="M10 9H8" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Счет за интернет
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Срок оплаты через 3 дня
                        </p>
                        <div className="mt-2 flex">
                          <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                            Отметить как оплаченный
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Счет за телефон оплачен
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Оплачено вчера
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <Link
                    href="/dashboard/notifications"
                    className="block px-4 py-2 text-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    onClick={() => setIsNotificationsOpen(false)}
                  >
                    Все уведомления
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                if (isNotificationsOpen) setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-full text-sm font-medium text-gray-700 hover:text-gray-800 focus:outline-none"
            >
              <span className="sr-only">Открыть меню пользователя</span>
              <div className="relative h-8 w-8 rounded-full bg-gray-100">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || 'Avatar'}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <span className="hidden md:inline-block">{user.name}</span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="border-b border-gray-100 px-4 py-2 text-sm text-gray-500">
                  {user.email}
                </div>
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Профиль
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Настройки
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}