import React, { useState, useMemo } from 'react';
import { Account, Transaction } from '../types';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';

interface ChartOfAccountsProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddAccount: (account: Account) => void;
  onDeleteAccount: (code: string) => void;
}

const AddAccountForm: React.FC<{ onAddAccount: (account: Account) => void; existingCodes: Set<string>; }> = ({ onAddAccount, existingCodes }) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!code.trim() || !name.trim()) {
            setError('El código y el nombre son obligatorios.');
            return;
        }
        if (existingCodes.has(code.trim())) {
            setError('El código de cuenta ya existe.');
            return;
        }
        onAddAccount({ code: code.trim(), name: name.trim() });
        setCode('');
        setName('');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-wrap items-end gap-4 mb-6">
            <div className="flex-grow" style={{ minWidth: '120px' }}>
                <label htmlFor="new-acc-code" className="block text-sm font-medium text-slate-400 mb-1">Código</label>
                <input id="new-acc-code" type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Ej: 5102" className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-sm"/>
            </div>
             <div className="flex-grow" style={{ minWidth: '200px' }}>
                <label htmlFor="new-acc-name" className="block text-sm font-medium text-slate-400 mb-1">Nombre de Cuenta</label>
                <input id="new-acc-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Salario de Diseñadores" className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-sm"/>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition flex items-center gap-2">
                <PlusIcon className="h-5 w-5" />
                <span>Agregar</span>
            </button>
            {error && <p className="text-red-400 text-sm w-full mt-2">{error}</p>}
        </form>
    );
}

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({ accounts, transactions, onAddAccount, onDeleteAccount }) => {
  const usedAccountCodes = useMemo(() => {
    return new Set(transactions.map(t => t.account.code));
  }, [transactions]);

  const existingCodes = useMemo(() => {
      return new Set(accounts.map(a => a.code));
  }, [accounts]);

  const getRowStyle = (code: string) => {
    if (code.includes('.')) return 'pl-16'; // Sub-sub-accounts
    switch (code.length) {
      case 1: return 'pl-4 font-bold text-white bg-slate-900/50';
      case 2: return 'pl-8 font-semibold';
      case 4: return 'pl-12';
      default: return 'pl-4';
    }
  };

  const isParentAccount = (code: string) => {
      return accounts.some(acc => acc.code.startsWith(code) && acc.code !== code);
  }

  return (
    <>
      <AddAccountForm onAddAccount={onAddAccount} existingCodes={existingCodes} />
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800">
              <tr>
                <th scope="col" className="px-6 py-3">Código</th>
                <th scope="col" className="px-6 py-3">Nombre de la Cuenta</th>
                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const isUsed = usedAccountCodes.has(account.code);
                const isParent = isParentAccount(account.code);
                const canDelete = !isUsed && !isParent;

                return (
                  <tr key={account.code} className="border-b border-slate-700">
                    <td className={`px-6 py-3 font-mono align-top ${getRowStyle(account.code)}`}>{account.code}</td>
                    <td className={`px-6 py-3 ${getRowStyle(account.code)}`}>{account.name}</td>
                    <td className="px-6 py-3 text-right">
                        <button 
                            onClick={() => onDeleteAccount(account.code)}
                            disabled={!canDelete}
                            title={!canDelete ? (isUsed ? "No se puede eliminar: cuenta en uso" : "No se puede eliminar: es una cuenta padre") : "Eliminar cuenta"}
                            className="p-1 rounded-md text-slate-500 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 disabled:cursor-not-allowed transition"
                        >
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ChartOfAccounts;