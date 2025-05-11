// src/components/dashboard/RecentActivityList.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, User, FileText, Calendar, MessageSquare, CheckCircle2 } from 'lucide-react';

interface RecentActivityListProps {
  loading?: boolean;
}

export function RecentActivityList({ loading = false }: RecentActivityListProps) {
  // Mock de atividades recentes
  const mockActivities = [
    {
      id: '1',
      type: 'document',
      title: 'Contrato assinado',
      user: 'Carlos Silva',
      timestamp: 'Hoje, 10:35'
    },
    {
      id: '2',
      type: 'user',
      title: 'Novo funcionário adicionado',
      user: 'Amanda Rodrigues',
      timestamp: 'Hoje, 09:42'
    },
    {
      id: '3',
      type: 'message',
      title: 'Comentário adicionado',
      user: 'Rafael Martins',
      timestamp: 'Hoje, 08:15'
    },
    {
      id: '4',
      type: 'task',
      title: 'Tarefa concluída',
      user: 'Juliana Lima',
      timestamp: 'Ontem, 16:30'
    },
    {
      id: '5',
      type: 'calendar',
      title: 'Reunião agendada',
      user: 'Fernanda Costa',
      timestamp: 'Ontem, 14:20'
    }
  ];

  // Definir ícone com base no tipo de atividade
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'user':
        return <User className="h-5 w-5 text-emerald-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'task':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'calendar':
        return <Calendar className="h-5 w-5 text-amber-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Activity className="h-5 w-5 mr-2 text-purple-500" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Por {activity.user}
                  </p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}