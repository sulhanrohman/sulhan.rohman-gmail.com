import React from 'react';
import { Task, TaskStatus } from '../types';
import { Clock, CheckCircle2, AlertCircle, FileText, ExternalLink, MessageSquare } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface TaskCardProps {
  task: Task;
  onAction: (taskId: string) => void;
  role: 'notary' | 'member';
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onAction, role }) => {
  const { t } = useTranslation();
  const statusConfig = {
    [TaskStatus.PENDING]: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' },
    [TaskStatus.UPLOADED]: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Ready for Review' },
    [TaskStatus.APPROVED]: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Approved' },
    [TaskStatus.REJECTED]: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rejected' },
  };

  const { icon: StatusIcon, color, bg, label } = statusConfig[task.status];
  const isOverdue = task.dueDate < Date.now() && task.status !== TaskStatus.APPROVED;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="banking-card p-5 group hover:border-blue-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", bg, color)}>
              {label}
            </span>
            {isOverdue && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-100 text-red-600">
                Overdue
              </span>
            )}
          </div>
          <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{task.title}</h4>
          <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
          <p className={cn("text-xs font-medium", isOverdue ? "text-red-600" : "text-slate-900")}>
            {formatDate(task.dueDate)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
            {task.assignedToName.charAt(0)}
          </div>
          <span className="text-xs text-slate-600">{task.assignedToName}</span>
        </div>

        <div className="flex items-center gap-2">
          {task.resultUrl && (
            <a 
              href={task.resultUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {task.feedback && <MessageSquare className="w-4 h-4 text-blue-500" />}
          
          <button 
            onClick={() => onAction(task.id)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-blue-50 rounded-md transition-colors"
          >
            {role === 'notary' ? (task.status === TaskStatus.UPLOADED ? t('common.review') : t('common.details')) : (task.status === TaskStatus.PENDING || task.status === TaskStatus.REJECTED ? t('common.submit') : t('common.details'))}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
