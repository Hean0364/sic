import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Account } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

interface LedgerEntry {
  transaction: Transaction;
  balance: number;
}
interface LedgerAccount {
  account: Account;
  entries: LedgerEntry[];
  finalBalance: number;
  totalDebits: number;
  totalCredits: number;
}

const GeneralLedgerView: React.FC<{ ledger: LedgerAccount[] }> = ({ ledger }) => {
  if (ledger.length === 0) {
    return (
       <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/30">
        <p className="text-slate-400">No se encontraron transacciones con los filtros aplicados.</p>
      </div>
    )
  }
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800">
            <tr>
              <th scope="col" className="px-4 py-3">Fecha</th>
              <th scope="col" className="px-4 py-3">Descripción</th>
              <th scope="col" className="px-4 py-3 text-right">Cargo (Debe)</th>
              <th scope="col" className="px-4 py-3 text-right">Abono (Haber)</th>
              <th scope="col" className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map(({ account, entries, finalBalance, totalDebits, totalCredits }) => (
              <React.Fragment key={account.code}>
                <tr className="bg-slate-900/70 border-y-2 border-slate-700">
                  <th colSpan={5} className="px-4 py-3 text-left">
                    <div className="font-bold text-base text-white">{account.code} - {account.name}</div>
                  </th>
                </tr>
                {entries.map(({ transaction, balance }) => (
                  <tr key={transaction.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{transaction.date}</td>
                    <td className="px-4 py-3">{transaction.description}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">
                      {transaction.type === TransactionType.DEBIT ? formatCurrency(transaction.total) : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">
                      {transaction.type === TransactionType.CREDIT ? formatCurrency(transaction.total) : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{formatCurrency(balance)}</td>
                  </tr>
                ))}
                <tr className="font-semibold text-white bg-slate-800/80">
                  <td colSpan={2} className="px-4 py-3 text-right text-xs uppercase tracking-wider">Totales de la Cuenta</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalDebits)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalCredits)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(finalBalance)}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
};

interface TrialBalanceEntry {
  code: string;
  name: string;
  totalDebits: number;
  totalCredits: number;
}

const TrialBalanceView: React.FC<{ data: TrialBalanceEntry[] }> = ({ data }) => {
  const totalDebits = useMemo(() => data.reduce((sum, acc) => sum + acc.totalDebits, 0), [data]);
  const totalCredits = useMemo(() => data.reduce((sum, acc) => sum + acc.totalCredits, 0), [data]);

  if (data.length === 0) {
    return (
       <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/30">
        <p className="text-slate-400">No hay datos para el balance de comprobación con los filtros aplicados.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3">Código</th>
              <th scope="col" className="px-6 py-3">Cuenta</th>
              <th scope="col" className="px-6 py-3 text-right">Debe</th>
              <th scope="col" className="px-6 py-3 text-right">Haber</th>
            </tr>
          </thead>
          <tbody>
            {data.map(account => (
              <tr key={account.code} className="border-b border-slate-700 hover:bg-slate-800/50">
                <td className="px-6 py-3 font-mono">{account.code}</td>
                <td className="px-6 py-3">{account.name}</td>
                <td className="px-6 py-3 text-right font-mono text-green-400/90">{formatCurrency(account.totalDebits)}</td>
                <td className="px-6 py-3 text-right font-mono text-red-400/90">{formatCurrency(account.totalCredits)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-white font-bold bg-slate-800">
            <tr>
                <td colSpan={2} className="px-6 py-3 text-right text-xs uppercase tracking-wider">Totales</td>
                <td className="px-6 py-3 text-right font-mono">{formatCurrency(totalDebits)}</td>
                <td className="px-6 py-3 text-right font-mono">{formatCurrency(totalCredits)}</td>
            </tr>
             <tr>
                <td colSpan={2} className="px-6 py-3 text-right text-xs uppercase tracking-wider">Balance</td>
                <td colSpan={2} className={`px-6 py-2 text-center font-mono text-lg ${Math.abs(totalDebits - totalCredits) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(totalDebits - totalCredits)}
                </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};


const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'trial-balance'>('ledger');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  const accountOptions = useMemo(() => {
    const uniqueAccounts: Account[] = [];
    const codes = new Set<string>();
    transactions.forEach(t => {
      if (!codes.has(t.account.code)) {
        codes.add(t.account.code);
        uniqueAccounts.push(t.account);
      }
    });
    return uniqueAccounts.sort((a, b) => a.code.localeCompare(b.code));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = t.date; // Compare as 'YYYY-MM-DD' strings for robustness
      if (startDate && transactionDate < startDate) return false;
      if (endDate && transactionDate > endDate) return false;
      if (selectedAccount && t.account.code !== selectedAccount) return false;
      return true;
    });
  }, [transactions, startDate, endDate, selectedAccount]);

  const ledgerData = useMemo(() => {
    const groupedByAccount = filteredTransactions.reduce((acc, t) => {
      const code = t.account.code;
      if (!acc[code]) acc[code] = [];
      acc[code].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);

    const result: Record<string, LedgerAccount> = {};
    for (const code in groupedByAccount) {
      const accountTransactions = groupedByAccount[code];
      const account = accountTransactions[0].account;
      let runningBalance = 0;
      let totalDebits = 0;
      let totalCredits = 0;
      
      const accountTypePrefix = account.code.charAt(0);
      const isDebitNormalBalance = ['1', '5', '6'].includes(accountTypePrefix);

      const entries = [...accountTransactions]
        .sort((a, b) => {
            const dateComparison = a.date.localeCompare(b.date);
            if (dateComparison !== 0) return dateComparison;
            return a.id.localeCompare(b.id);
        })
        .map(t => {
          if (t.type === TransactionType.DEBIT) {
            runningBalance += isDebitNormalBalance ? t.total : -t.total;
            totalDebits += t.total;
          } else { // CREDIT
            runningBalance -= isDebitNormalBalance ? t.total : -t.total;
            totalCredits += t.total;
          }
          return { transaction: t, balance: runningBalance };
        });
      
      result[code] = { account, entries, finalBalance: runningBalance, totalDebits, totalCredits };
    }
    return Object.values(result).sort((a,b) => a.account.code.localeCompare(b.account.code));
  }, [filteredTransactions]);

  const trialBalanceData = useMemo(() => {
    const balances: Record<string, TrialBalanceEntry> = {};

    filteredTransactions.forEach(t => {
        const code = t.account.code;
        if (!balances[code]) {
            balances[code] = {
                code: t.account.code,
                name: t.account.name,
                totalDebits: 0,
                totalCredits: 0
            };
        }
        if (t.type === TransactionType.DEBIT) {
            balances[code].totalDebits += t.total;
        } else {
            balances[code].totalCredits += t.total;
        }
    });

    return Object.values(balances).sort((a, b) => a.code.localeCompare(b.code));
  }, [filteredTransactions]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/30">
        <p className="text-slate-400">No hay transacciones para mostrar.</p>
        <p className="text-sm text-slate-500">Registre un nuevo asiento para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center border-b border-slate-700">
        {(
          [
            { id: 'ledger', label: 'Libro Mayor' },
            { id: 'trial-balance', label: 'Balance de Comprobación' },
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
      
      {activeTab === 'ledger' && (
         <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-wrap items-end gap-4">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-slate-400 mb-1">Fecha de Inicio</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-sm"/>
            </div>
            <div className="flex-grow">
              <label className="block text-sm font-medium text-slate-400 mb-1">Fecha de Fin</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-sm"/>
            </div>
            <div className="flex-grow min-w-[200px]">
              <label className="block text-sm font-medium text-slate-400 mb-1">Cuenta</label>
              <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-sm">
                <option value="">Todas las cuentas</option>
                {accountOptions.map(acc => <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>)}
              </select>
            </div>
            <button onClick={() => { setStartDate(''); setEndDate(''); setSelectedAccount(''); }} className="bg-slate-700 text-slate-300 px-4 py-2 rounded-md text-sm hover:bg-slate-600 transition">Limpiar Filtros</button>
          </div>
      )}
     
      {activeTab === 'ledger' ? <GeneralLedgerView ledger={ledgerData} /> : <TrialBalanceView data={trialBalanceData} />}
    </div>
  );
};

export default TransactionList;