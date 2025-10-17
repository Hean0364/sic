import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Account } from '../types';
import { IVA_RATE } from '../constants';
import CalendarIcon from './icons/CalendarIcon';

interface DailyJournalProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: Transaction[];
}

const DailyJournal: React.FC<DailyJournalProps> = ({ transactions }) => {
  const journalEntries = useMemo(() => {
    if (!transactions.length) return [];

    const grouped = transactions.reduce((acc, t) => {
      const id = t.journalEntryId;
      if (!acc[id]) {
        acc[id] = {
          id: id,
          date: t.date,
          description: t.description,
          lines: [],
        };
      }
      acc[id].lines.push(t);
      return acc;
    }, {} as Record<string, JournalEntry>);
    
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [transactions]);

  if (journalEntries.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/30">
        <p className="text-slate-400">No hay asientos en el libro diario.</p>
        <p className="text-sm text-slate-500">Registre un nuevo asiento para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800">
            <tr>
              <th scope="col" className="px-4 py-3">Cuenta</th>
              <th scope="col" className="px-4 py-3 text-right">Debe</th>
              <th scope="col" className="px-4 py-3 text-right">Haber</th>
            </tr>
          </thead>
          <tbody>
            {journalEntries.map((entry) => (
              <React.Fragment key={entry.id}>
                <tr className="bg-slate-900/70 border-y-2 border-slate-700">
                  <td colSpan={3} className="px-4 py-3 text-left">
                    <div className="flex justify-between items-center">
                       <span className="font-semibold text-white">{entry.description}</span>
                       <span className="text-xs text-slate-400 font-mono">{entry.date}</span>
                    </div>
                  </td>
                </tr>
                {entry.lines.map((line) => (
                  <tr key={line.id} className="border-b border-slate-800">
                    <td className="px-4 py-2 pl-8">{`${line.account.code} - ${line.account.name}`}</td>
                    <td className="px-4 py-2 text-right font-mono text-green-400">
                      {line.type === TransactionType.DEBIT ? formatCurrency(line.total) : ''}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-red-400">
                      {line.type === TransactionType.CREDIT ? formatCurrency(line.total) : ''}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


interface TransactionFormProps {
  onAddEntry: (transactions: Omit<Transaction, 'id' | 'journalEntryId'>[]) => void;
  postableAccounts: Account[];
  transactions: Transaction[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAddEntry, postableAccounts, transactions }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'journal'>('form');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  
  const [debitAccountCode, setDebitAccountCode] = useState<string>('');
  const [creditAccountCode, setCreditAccountCode] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [applyIva, setApplyIva] = useState<boolean>(false);

  const [error, setError] = useState<string>('');

  const journalEntryPreview = useMemo(() => {
    const baseAmount = parseFloat(amount) || 0;
    if ((!debitAccountCode && !creditAccountCode) || baseAmount <= 0) {
      return { lines: [], totalDebits: 0, totalCredits: 0, isValid: false };
    }

    const account1 = postableAccounts.find(a => a.code === debitAccountCode);
    const account2 = postableAccounts.find(a => a.code === creditAccountCode);

    if (!account1 || !account2) {
       return { lines: [], totalDebits: 0, totalCredits: 0, isValid: false };
    }

    const ivaAmount = applyIva ? baseAmount * IVA_RATE : 0;
    const totalAmount = baseAmount + ivaAmount;

    const lines: { accountName: string; debit: number; credit: number; }[] = [];

    const incomeAccount = account1.code.startsWith('4') ? account1 : (account2.code.startsWith('4') ? account2 : null);
    const expenseAccount = account1.code.startsWith('5') ? account1 : (account2.code.startsWith('5') ? account2 : null);

    if (incomeAccount) {
        const tenderAccount = incomeAccount.code === account1.code ? account2 : account1;
        lines.push({ accountName: `${tenderAccount.code} - ${tenderAccount.name}`, debit: totalAmount, credit: 0 });
        lines.push({ accountName: `${incomeAccount.code} - ${incomeAccount.name}`, debit: 0, credit: baseAmount });
        if (applyIva) {
            const ivaAccount = postableAccounts.find(a => a.code === '2103.01'); // IVA Débito
            lines.push({ accountName: ivaAccount ? `${ivaAccount.code} - ${ivaAccount.name}` : 'IVA Débito Fiscal (2103.01)', debit: 0, credit: ivaAmount });
        }
    } else if (expenseAccount) {
        const tenderAccount = expenseAccount.code === account1.code ? account2 : account1;
        lines.push({ accountName: `${expenseAccount.code} - ${expenseAccount.name}`, debit: baseAmount, credit: 0 });
        if (applyIva) {
            const ivaAccount = postableAccounts.find(a => a.code === '1103'); // IVA Crédito
            lines.push({ accountName: ivaAccount ? `${ivaAccount.code} - ${ivaAccount.name}` : 'IVA Crédito Fiscal (1103)', debit: ivaAmount, credit: 0 });
        }
        lines.push({ accountName: `${tenderAccount.code} - ${tenderAccount.name}`, debit: 0, credit: totalAmount });
    } else {
        lines.push({ accountName: `${account1.code} - ${account1.name}`, debit: baseAmount, credit: 0 });
        lines.push({ accountName: `${account2.code} - ${account2.name}`, debit: 0, credit: baseAmount });
    }

    const totalDebits = lines.reduce((sum, t) => sum + t.debit, 0);
    const totalCredits = lines.reduce((sum, t) => sum + t.credit, 0);

    const finalLines = lines.filter(l => l.debit > 0 || l.credit > 0);

    return {
      lines: finalLines,
      totalDebits,
      totalCredits,
      isValid: Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0
    };
  }, [debitAccountCode, creditAccountCode, amount, applyIva, postableAccounts]);
  
  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setDebitAccountCode('');
    setCreditAccountCode('');
    setAmount('');
    setApplyIva(false);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const baseAmount = parseFloat(amount) || 0;

    if (!date || !description.trim()) {
      setError('Por favor, complete la fecha y la descripción.');
      return;
    }
    
    if (!debitAccountCode || !creditAccountCode || baseAmount <= 0) {
      setError('Debe seleccionar ambas cuentas y un monto mayor a cero.');
      return;
    }

    if (debitAccountCode === creditAccountCode) {
        setError('La cuenta del debe y la cuenta del haber no pueden ser la misma.');
        return;
    }

    if (!journalEntryPreview.isValid) {
      setError('El asiento generado no es válido. Revise las selecciones.');
      return;
    }
    
    const newTransactions: Omit<Transaction, 'id' | 'journalEntryId'>[] = [];
    const mainDescription = description.trim();

    const account1 = postableAccounts.find(acc => acc.code === debitAccountCode)!;
    const account2 = postableAccounts.find(acc => acc.code === creditAccountCode)!;
    
    const ivaAmount = applyIva ? baseAmount * IVA_RATE : 0;
    const totalAmount = baseAmount + ivaAmount;

    const incomeAccount = account1.code.startsWith('4') ? account1 : (account2.code.startsWith('4') ? account2 : null);
    const expenseAccount = account1.code.startsWith('5') ? account1 : (account2.code.startsWith('5') ? account2 : null);

    if (incomeAccount) {
        const tenderAccount = incomeAccount.code === account1.code ? account2 : account1;
        newTransactions.push({ date, description: mainDescription, account: tenderAccount, type: TransactionType.DEBIT, amount: totalAmount, iva: 0, total: totalAmount });
        newTransactions.push({ date, description: mainDescription, account: incomeAccount, type: TransactionType.CREDIT, amount: baseAmount, iva: 0, total: baseAmount });
        if (applyIva) {
            const ivaDbAccount = postableAccounts.find(acc => acc.code === '2103.01');
            if (!ivaDbAccount) { setError(`Error: La cuenta de IVA Débito (2103.01) no se encuentra.`); return; }
            newTransactions.push({ date, description: `IVA de: ${mainDescription}`, account: ivaDbAccount, type: TransactionType.CREDIT, amount: ivaAmount, iva: 0, total: ivaAmount });
        }
    } else if (expenseAccount) {
        const tenderAccount = expenseAccount.code === account1.code ? account2 : account1;
        newTransactions.push({ date, description: mainDescription, account: expenseAccount, type: TransactionType.DEBIT, amount: baseAmount, iva: 0, total: baseAmount });
        if (applyIva) {
            const ivaCrAccount = postableAccounts.find(acc => acc.code === '1103');
            if (!ivaCrAccount) { setError(`Error: La cuenta de IVA Crédito (1103) no se encuentra.`); return; }
            newTransactions.push({ date, description: `IVA de: ${mainDescription}`, account: ivaCrAccount, type: TransactionType.DEBIT, amount: ivaAmount, iva: 0, total: ivaAmount });
        }
        newTransactions.push({ date, description: mainDescription, account: tenderAccount, type: TransactionType.CREDIT, amount: totalAmount, iva: 0, total: totalAmount });
    } else {
        newTransactions.push({ date, description: mainDescription, account: account1, type: TransactionType.DEBIT, amount: baseAmount, iva: 0, total: baseAmount });
        newTransactions.push({ date, description: mainDescription, account: account2, type: TransactionType.CREDIT, amount: baseAmount, iva: 0, total: baseAmount });
    }

    onAddEntry(newTransactions.filter(t => t.total > 0));
    resetForm();
    setActiveTab('journal');
  };
  
  const isSubmittable = journalEntryPreview.isValid;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Registro de transacciones</h1>
       <div className="flex items-center border-b border-slate-700">
        {(
          [
            { id: 'form', label: 'Registrar Asiento' },
            { id: 'journal', label: 'Libro Diario' },
          ] as const
        ).map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                        ? 'border-b-2 border-blue-500 text-white'
                        : 'text-slate-400 hover:text-white'
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'journal' && <DailyJournal transactions={transactions} />}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
          {/* --- HEADER: DATE & DESCRIPTION --- */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1">Fecha</label>
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none mt-2.5"/>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-1">Descripción</label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del asiento contable"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* --- BODY: ACCOUNTS & AMOUNT --- */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Cuenta (Debe)</label>
                    <select value={debitAccountCode} onChange={e => setDebitAccountCode(e.target.value)} className="w-full mt-1 p-2 bg-slate-900 border border-slate-600 rounded-md text-sm">
                      <option value="" disabled>Seleccionar cuenta para el Debe</option>
                      {postableAccounts.map(acc => <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Cuenta (Haber)</label>
                    <select value={creditAccountCode} onChange={e => setCreditAccountCode(e.target.value)} className="w-full mt-1 p-2 bg-slate-900 border border-slate-600 rounded-md text-sm">
                      <option value="" disabled>Seleccionar cuenta para el Haber</option>
                      {postableAccounts.map(acc => <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>)}
                    </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Monto (sin IVA)</label>
                    <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" className="w-full mt-1 p-2 bg-slate-900 border border-slate-600 rounded-md text-sm"/>
                  </div>
                  <div className="flex items-center h-[42px] gap-2">
                    <input type="checkbox" id="iva-apply" checked={applyIva} onChange={e => setApplyIva(e.target.checked)} className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-600"/>
                    <label htmlFor="iva-apply" className="text-sm text-slate-400">Aplicar IVA</label>
                  </div>
              </div>
          </div>

          {/* --- FOOTER: PREVIEW & TOTALS --- */}
          {journalEntryPreview.lines.length > 0 && (
            <div className="w-full bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
                <h3 className="text-sm font-semibold text-white mb-2">Asiento Contable Propuesto</h3>
                <div className="space-y-1 text-sm">
                    {journalEntryPreview.lines.map((line, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <span className="col-span-8 truncate text-slate-400" title={line.accountName}>{line.accountName}</span>
                            <span className="col-span-2 text-right font-mono text-green-400/80">{line.debit > 0 ? formatCurrency(line.debit) : ''}</span>
                            <span className="col-span-2 text-right font-mono text-red-400/80">{line.credit > 0 ? formatCurrency(line.credit) : ''}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-600/50 mt-2">
                <span>Balance:</span>
                <span className={`font-mono ${!journalEntryPreview.isValid || (journalEntryPreview.totalDebits - journalEntryPreview.totalCredits !== 0) ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(journalEntryPreview.totalDebits - journalEntryPreview.totalCredits)}</span>
                </div>
            </div>
          )}
          
          {error && <p className="text-center text-sm text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20">{error}</p>}

          <button 
            type="submit" 
            disabled={!isSubmittable}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all duration-150 text-base disabled:opacity-50 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            Agregar Asiento
          </button>
        </form>
      )}
    </div>
  );
};

export default TransactionForm;