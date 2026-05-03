import React, { useState } from 'react';
import { AuthProvider, useAuth, useTasks } from './lib/MockContext';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { TaskCard } from './components/TaskCard';
import { TaskStatus, Task } from './types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileStack, 
  Search, 
  Filter,
  Plus,
  Send,
  X,
  Upload,
  UserCheck,
  UserX,
  Bell,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { user, signIn } = useAuth();
  const { tasks, updateTask } = useTasks();
  const { t, i18n } = useTranslation();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
  };

  const stats = [
    { label: t('dashboard.totalTasks'), value: tasks.length, icon: FileStack, color: 'slate' as const },
    { label: t('dashboard.pendingReview'), value: tasks.filter(t => t.status === TaskStatus.UPLOADED).length, icon: Clock, color: 'amber' as const },
    { label: t('dashboard.completed'), value: tasks.filter(t => t.status === TaskStatus.APPROVED).length, icon: CheckCircle2, color: 'emerald' as const },
    { label: t('dashboard.attentionNeeded'), value: tasks.filter(t => t.status === TaskStatus.REJECTED).length, icon: AlertCircle, color: 'blue' as const },
  ];

  const handleTaskAction = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setSelectedTask(task);
    setIsModalOpen(true);
    setFeedback(task.feedback || '');
  };

  const simulateEmailNotification = (to: string, subject: string) => {
    // In a real app, this would call an API route that uses SendGrid/SES
    toast.info(`Email Notification Sent`, {
      description: `Recipient: ${to}\nSubject: ${subject}`,
      duration: 5000,
    });
  };

  const handleReview = (status: TaskStatus) => {
    if (!selectedTask) return;
    updateTask(selectedTask.id, { 
      status, 
      feedback: feedback.trim() || undefined,
      updatedAt: Date.now()
    });
    
    // Notify team member
    const statusText = status === TaskStatus.APPROVED ? 'APPROVED' : 'REJECTED';
    toast.success(`Task ${statusText}`, {
      description: `Notification sent to ${selectedTask.assignedToName}`,
    });
    
    simulateEmailNotification(
      'agent@bank.com', 
      `Update on ${selectedTask.title}: ${statusText}`
    );

    setIsModalOpen(false);
    setSelectedTask(null);
    setFeedback('');
  };

  const handleSubmitResult = () => {
    if (!selectedTask) return;
    updateTask(selectedTask.id, { 
      status: TaskStatus.UPLOADED, 
      resultUrl: 'https://cdn.example.com/notary-result-' + Math.floor(Math.random() * 1000) + '.pdf',
      resultNotes: feedback.trim() || 'Work completed as requested.',
      updatedAt: Date.now()
    });

    toast.info("Result Submitted", {
      description: "Admin has been notified for review."
    });

    simulateEmailNotification(
      'notary@bank.com', 
      `New submission for review: ${selectedTask.title}`
    );

    setIsModalOpen(false);
    setSelectedTask(null);
    setFeedback('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative">
        <Toaster richColors position="top-right" />
        <button 
          onClick={toggleLanguage}
          className="absolute top-8 right-8 flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {i18n.language === 'en' ? 'English' : 'Bahasa Indonesia'}
        </button>

        <div className="w-full max-w-md banking-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white mb-4">
              <FileStack className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t('login.title')}</h1>
            <p className="text-slate-500">{t('login.subtitle')}</p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => signIn('notary@bank.com')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              {t('login.asNotary')}
            </button>
            <button 
              onClick={() => signIn('agent@bank.com')}
              className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              {t('login.asMember')}
            </button>
          </div>
          
          <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
            {t('login.secureEnv')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pl-64 flex flex-col bg-slate-50">
      <Toaster richColors position="top-right" />
      <Sidebar />
      
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-800">{t('dashboard.header')}</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {i18n.language.toUpperCase()}
          </button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-48"
            />
          </div>
          
          <div className="relative">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>

          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
          {user.role === 'notary' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              {t('dashboard.assignTask')}
            </button>
          )}
        </div>
      </header>


      <main className="flex-1 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.activeQueue')}</h3>
            <span className="text-xs font-medium text-slate-500">{tasks.length} total</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onAction={handleTaskAction} 
                  role={user.role} 
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedTask.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{t('common.status')}: <span className="font-semibold capitalize text-blue-600">{selectedTask.status}</span></p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('modal.description')}</label>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">{selectedTask.description}</p>
                </div>

                {selectedTask.resultUrl && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('modal.submittedResults')}</label>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          <FileStack className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Document_Verified.pdf</p>
                          <p className="text-xs text-slate-500">Uploaded {selectedTask.resultNotes ? 'with notes' : 'today'}</p>
                        </div>
                      </div>
                      <a href={selectedTask.resultUrl} target="_blank" className="text-xs font-bold text-blue-600 hover:underline">View File</a>
                    </div>
                    {selectedTask.resultNotes && (
                      <p className="mt-3 text-sm text-slate-600 italic italic">"{selectedTask.resultNotes}"</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {user.role === 'notary' ? t('modal.reviewComments') : (selectedTask.status === TaskStatus.REJECTED ? 'Reason for Rejection / Fix' : t('modal.submissionNotes'))}
                  </label>
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={user.role === 'notary' ? t('modal.placeholderReview') : t('modal.placeholderSubmission')}
                    className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm font-bold text-slate-500 hover:text-slate-700"
                >
                  {t('common.cancel')}
                </button>
                
                <div className="flex gap-2">
                  {user.role === 'notary' ? (
                    selectedTask.status === TaskStatus.UPLOADED ? (
                      <>
                        <button 
                          onClick={() => handleReview(TaskStatus.REJECTED)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          {t('common.reject')}
                        </button>
                        <button 
                          onClick={() => handleReview(TaskStatus.APPROVED)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-shadow shadow-sm flex items-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          {t('common.approve')}
                        </button>
                      </>
                    ) : (
                      <button className="px-4 py-2 bg-slate-200 text-slate-500 rounded-lg text-sm font-bold cursor-not-allowed">
                        Awaiting Action
                      </button>
                    )
                  ) : (
                    (selectedTask.status === TaskStatus.PENDING || selectedTask.status === TaskStatus.REJECTED) ? (
                      <button 
                        onClick={handleSubmitResult}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-shadow shadow-sm flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {t('common.submit')}
                      </button>
                    ) : (
                      <button className="px-4 py-2 bg-slate-200 text-slate-500 rounded-lg text-sm font-bold cursor-not-allowed">
                        Submitted
                      </button>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
