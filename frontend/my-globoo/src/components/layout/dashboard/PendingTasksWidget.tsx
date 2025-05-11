import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PendingTasksWidgetProps {
  loading?: boolean;
}

export function PendingTasksWidget({ loading = false }: PendingTasksWidgetProps) {
  // Mock de tarefas pendentes
  const mockTasks = [
    {
      id: '1',
      title: 'Revisar documentação de novo funcionário',
      priority: 'alta',
      dueDate: '24/05/2025'
    },
    {
      id: '2',
      title: 'Enviar relatório mensal',
      priority: 'média',
      dueDate: '28/05/2025'
    },
    {
      id: '3',
      title: 'Atualizar registros de férias',
      priority: 'baixa',
      dueDate: '30/05/2025'
    },
    {
      id: '4',
      title: 'Aprovar solicitação de equipamento',
      priority: 'média',
      dueDate: '25/05/2025'
    }
  ];

  // Definir variante de badge com base na prioridade
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'destructive';
      case 'média':
        return 'default'; 
      case 'baixa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Ícone de prioridade
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'alta':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'média':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'baixa':
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
          Tarefas Pendentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {mockTasks.map((task) => (
              <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Prazo: {task.dueDate}
                    </p>
                  </div>
                  <Badge variant={getPriorityBadge(task.priority)} className="flex items-center gap-1">
                    {getPriorityIcon(task.priority)}
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && (
          <button className="w-full mt-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-center transition-colors">
            Ver todas as tarefas
          </button>
        )}
      </CardContent>
    </Card>
  );
}