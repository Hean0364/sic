import React from 'react';
import BookOpenIcon from './icons/BookOpenIcon';
import PlusIcon from './icons/PlusIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import ChartBarIcon from './icons/ChartBarIcon';

interface SidebarProps {
  activeView: 'register' | 'ledger' | 'accounts' | 'reports';
  setView: (view: 'register' | 'ledger' | 'accounts' | 'reports') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView }) => {
  const navItems = [
    { id: 'register', label: 'Registrar Transacción', icon: <PlusIcon className="h-5 w-5" /> },
    { id: 'ledger', label: 'Libro Mayor', icon: <BookOpenIcon className="h-5 w-5" /> },
    { id: 'accounts', label: 'Catálogo de Cuentas', icon: <ListBulletIcon className="h-5 w-5" /> },
    { id: 'reports', label: 'Estados Financieros', icon: <ChartBarIcon className="h-5 w-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-800 p-4 flex-col hidden sm:flex">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="bg-blue-500/20 p-2 rounded-lg">
          <BookOpenIcon className="h-7 w-7 text-blue-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Contabilidad</h1>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id as 'register' | 'ledger' | 'accounts' | 'reports')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeView === item.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
