import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import ChartOfAccounts from './ChartOfAccounts';
import FinancialStatements from './FinancialStatements';
import { Transaction, Account } from '../types';
import { INITIAL_CHART_OF_ACCOUNTS } from '../constants';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_CHART_OF_ACCOUNTS);
  const [view, setView] = useState<'register' | 'ledger' | 'accounts' | 'reports'>('register');

  const postableAccounts = useMemo(() => {
    return accounts.filter(acc => acc.code.length >= 4 || acc.code.includes('.'));
  }, [accounts]);

  const addJournalEntry = (entryTransactions: Omit<Transaction, 'id' | 'journalEntryId'>[]) => {
    const journalEntryId = crypto.randomUUID();
    const newTransactions: Transaction[] = entryTransactions.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      journalEntryId: journalEntryId,
    }));

    setTransactions(prev => [...prev, ...newTransactions]);
  };

  const handleAddAccount = (newAccount: Account) => {
    // Basic validation
    if (accounts.some(acc => acc.code === newAccount.code)) {
      alert('Error: El código de la cuenta ya existe.');
      return;
    }
    setAccounts(prev => [...prev, newAccount].sort((a,b) => a.code.localeCompare(b.code)));
  };

  const handleDeleteAccount = (accountCode: string) => {
    setAccounts(prev => prev.filter(acc => acc.code !== accountCode));
  };


  return (
    <div className="flex h-screen bg-slate-900 text-slate-300 font-sans antialiased">
      <Sidebar activeView={view} setView={setView} />
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
        {view === 'register' && (
            <TransactionForm 
              onAddEntry={addJournalEntry} 
              postableAccounts={postableAccounts} 
              transactions={transactions} 
            />
        )}
        {view === 'ledger' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Libro Mayor</h1>
            <TransactionList transactions={transactions} />
          </div>
        )}
        {view === 'accounts' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Catálogo de Cuentas</h1>
            <ChartOfAccounts 
              accounts={accounts}
              transactions={transactions}
              onAddAccount={handleAddAccount}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
        )}
        {view === 'reports' && (
          <div>
             <h1 className="text-3xl font-bold text-white mb-6">Estados Financieros</h1>
             <FinancialStatements transactions={transactions} accounts={accounts} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;