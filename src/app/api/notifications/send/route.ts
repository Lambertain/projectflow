import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sgMail from '@sendgrid/mail';

// Инициализация SendGrid API
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Функция для отправки email-уведомлений
async function sendEmailNotification(
  email: string,
  subject: string,
  content: string
) {
  if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_FROM) {
    console.error('SendGrid API key or sender email not configured');
    return false;
  }

  try {
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: subject,
      text: content,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">BillSmart</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #111827;">${subject}</h2>
          <p style="color: #4b5563;">${content}</p>
          <div style="margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Перейти в личный кабинет</a>
          </div>
        </div>
        <div style="text-align: center; padding: 10px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} BillSmart. Все права защищены.</p>
        </div>
      </div>`,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Функция для проверки и отправки уведомлений о предстоящих платежах
export async function GET() {
  try {
    // Получаем текущую дату
    const now = new Date();
    
    // Находим все счета, срок оплаты которых наступает в ближайшие дни
    const upcomingBills = await prisma.bill.findMany({
      where: {
        isPaid: false,
        dueDate: {
          // Счета со сроком оплаты в ближайшие 7 дней
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          gte: now,
        },
      },
      include: {
        user: true,
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        reminders: {
          where: {
            sentAt: null, // Только неотправленные напоминания
          },
        },
      },
    });

    const results = [];

    // Обрабатываем каждый счет
    for (const bill of upcomingBills) {
      // Определяем, сколько дней осталось до срока оплаты
      const daysUntilDue = Math.ceil(
        (bill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Проверяем, есть ли неотправленные напоминания для этого счета
      for (const reminder of bill.reminders) {
        // Если дней до оплаты меньше или равно дням для напоминания, отправляем уведомление
        if (daysUntilDue <= reminder.daysBefore) {
          // Определяем получателей уведомлений
          const recipients = [];

          // Если счет принадлежит команде, отправляем уведомления всем участникам команды
          if (bill.teamId && bill.team) {
            for (const member of bill.team.members) {
              if (member.user.email && member.notificationsEnabled) {
                recipients.push({
                  email: member.user.email,
                  name: member.user.name || member.user.email,
                });
              }
            }
          } else if (bill.userId && bill.user.email) {
            // Если счет личный, отправляем уведомление только владельцу
            recipients.push({
              email: bill.user.email,
              name: bill.user.name || bill.user.email,
            });
          }

          // Формируем текст уведомления
          const subject = `Напоминание об оплате: ${bill.name}`;
          const content = `Напоминаем, что через ${daysUntilDue} ${getDaysText(
            daysUntilDue
          )} наступает срок оплаты счета "${bill.name}" на сумму ${formatAmount(
            bill.amount
          )}. Пожалуйста, не забудьте оплатить его вовремя.`;

          // Отправляем уведомления всем получателям
          for (const recipient of recipients) {
            const emailSent = await sendEmailNotification(
              recipient.email,
              subject,
              content
            );

            if (emailSent) {
              results.push({
                billId: bill.id,
                recipient: recipient.email,
                status: 'sent',
              });

              // Обновляем статус напоминания в базе данных
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  sentAt: new Date(),
                },
              });

              // Создаем запись о уведомлении
              await prisma.notification.create({
                data: {
                  userId: bill.userId,
                  billId: bill.id,
                  teamId: bill.teamId,
                  type: 'PAYMENT_DUE',
                  message: content,
                  isRead: false,
                },
              });
            } else {
              results.push({
                billId: bill.id,
                recipient: recipient.email,
                status: 'failed',
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent: results.length,
      results,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}

// Вспомогательная функция для форматирования суммы
function formatAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Вспомогательная функция для склонения слова "день"
function getDaysText(days: number) {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ['день', 'дня', 'дней'];
  return titles[
    days % 100 > 4 && days % 100 < 20 ? 2 : cases[Math.min(days % 10, 5)]
  ];
}