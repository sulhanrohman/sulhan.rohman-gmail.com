import React from 'react';
import { LayoutDashboard, CheckSquare, Users, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/MockContext';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { icon: LayoutDashboard, label: t('common.dashboard'), id: 'dashboard' },
    { icon: CheckSquare, label: t('common.tasks'), id: 'tasks' },
    { icon: ShieldCheck, label: t('common.approvals'), id: 'approvals', adminOnly: true },
    { icon: Users, label: t('common.team'), id: 'team', adminOnly: true },
    { icon: Settings, label: t('common.settings'), id: 'settings' },
  ];

  return (
    <div className="w-64 bg-blue-900 text-white h-screen flex flex-col fixed left-0 top-0 border-r border-blue-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center border border-white/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">NotaryFlow</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'notary') return null;
          return (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-blue-800 text-blue-200 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <div className="flex items-center gap-3 p-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
            {user?.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-blue-300/80 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t('common.signOut')}
        </button>
      </div>
    </div>
  );
};
