import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Deadline } from '../../types/deadline';
import { Appointment } from '../../types/appointment';

export interface NotificationTriggerInput {
  date?: Date;
  seconds?: number;
  repeats?: boolean;
}

interface ScheduledNotificationInfo {
  identifier: string;
  title: string;
  body: string;
}

function buildTrigger(
  trigger: NotificationTriggerInput,
): Notifications.NotificationTriggerInput {
  if (trigger.date) {
    return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger.date };
  }
  if (trigger.seconds !== undefined) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: trigger.seconds,
      repeats: trigger.repeats ?? false,
    };
  }
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date() };
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AdvogaPlan',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E40AF',
    });
  }

  return true;
}

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function scheduleNotification(
  title: string,
  body: string,
  trigger: NotificationTriggerInput,
  data?: Record<string, string>,
): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: true,
    },
    trigger: buildTrigger(trigger),
  });

  return identifier;
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications(): Promise<ScheduledNotificationInfo[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map((notification) => ({
    identifier: notification.identifier,
    title: notification.content.title ?? '',
    body: notification.content.body ?? '',
  }));
}

export async function scheduleDeadlineReminders(
  deadline: Deadline,
): Promise<string[]> {
  const identifiers: string[] = [];
  const now = new Date();
  const dueDate = deadline.dueDate instanceof Date
    ? deadline.dueDate
    : new Date(deadline.dueDate);

  for (const days of deadline.reminderDays) {
    const reminderDate = new Date(dueDate.getTime());
    reminderDate.setDate(reminderDate.getDate() - days);

    if (reminderDate <= now) {
      continue;
    }

    const daysLabel = days === 1 ? '1 dia' : `${days} dias`;
    const body = `O prazo "${deadline.title}" vence em ${daysLabel}.`;

    const id = await scheduleNotification(
      'Lembrete de Prazo',
      body,
      { date: reminderDate },
      {
        type: 'deadline',
        deadlineId: deadline.id,
        caseId: deadline.caseId,
      },
    );

    identifiers.push(id);
  }

  // Schedule a notification on the due date itself
  if (dueDate > now) {
    const id = await scheduleNotification(
      'Prazo Vencendo Hoje',
      `O prazo "${deadline.title}" vence hoje!`,
      { date: dueDate },
      {
        type: 'deadline',
        deadlineId: deadline.id,
        caseId: deadline.caseId,
      },
    );
    identifiers.push(id);
  }

  return identifiers;
}

export async function scheduleAppointmentReminders(
  appointment: Appointment,
): Promise<string[]> {
  const identifiers: string[] = [];
  const now = new Date();
  const appointmentDate = appointment.date instanceof Date
    ? appointment.date
    : new Date(appointment.date);

  for (const minutes of appointment.reminderMinutes) {
    const reminderDate = new Date(appointmentDate.getTime() - minutes * 60 * 1000);

    if (reminderDate <= now) {
      continue;
    }

    let timeLabel: string;
    if (minutes < 60) {
      timeLabel = minutes === 1 ? '1 minuto' : `${minutes} minutos`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        timeLabel = hours === 1 ? '1 hora' : `${hours} horas`;
      } else {
        const hoursStr = hours === 1 ? '1 hora' : `${hours} horas`;
        const minsStr = remainingMinutes === 1 ? '1 minuto' : `${remainingMinutes} minutos`;
        timeLabel = `${hoursStr} e ${minsStr}`;
      }
    }

    const body = `"${appointment.title}" comeca em ${timeLabel}.`;

    const data: Record<string, string> = {
      type: 'hearing',
      appointmentId: appointment.id,
    };

    if (appointment.caseId) {
      data.caseId = appointment.caseId;
    }

    const id = await scheduleNotification(
      'Lembrete de Compromisso',
      body,
      { date: reminderDate },
      data,
    );

    identifiers.push(id);
  }

  return identifiers;
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
