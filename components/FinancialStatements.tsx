import React, { useMemo, useState } from 'react';
import { Account, Transaction, TransactionType } from '../types';

interface FinancialStatementsProps {
    transactions: Transaction[];
    accounts: Account[];
}

type ReportType = 'balance-sheet' | 'income-statement' | 'equity-statement';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

interface ReportAccount {
    code: string;
    name: string;
    balance: number;
    isParent: boolean;
}

const FinancialStatements: React.FC<FinancialStatementsProps> = ({ transactions, accounts }) => {
    const [activeReport, setActiveReport] = useState<ReportType>('balance-sheet');

    const reportData = useMemo(() => {
        const balances: Record<string, number> = {};
        const postableAccounts = accounts.filter(acc => acc.code.length >= 4 || acc.code.includes('.'));

        postableAccounts.forEach(acc => {
            let balance = 0;
            const accountTypePrefix = acc.code.charAt(0);
            const isDebitNormalBalance = ['1', '5', '6'].includes(accountTypePrefix);

            transactions.forEach(t => {
                if (t.account.code === acc.code) {
                    if (t.type === TransactionType.DEBIT) {
                        balance += isDebitNormalBalance ? t.total : -t.total;
                    } else { // CREDIT
                        balance -= isDebitNormalBalance ? t.total : -t.total;
                    }
                }
            });
            balances[acc.code] = balance;
        });

        const assets: ReportAccount[] = [];
        const liabilities: ReportAccount[] = [];
        const equity: ReportAccount[] = [];
        const revenues: ReportAccount[] = [];
        const expenses: ReportAccount[] = [];
        
        let totalAssets = 0, totalLiabilities = 0, totalEquity = 0, totalRevenues = 0, totalExpenses = 0;

        accounts.forEach(acc => {
            const isParent = !postableAccounts.some(pa => pa.code === acc.code);
            let balance = 0;
            if (isParent) {
                // Sum children balances for parent accounts
                 Object.keys(balances).forEach(childCode => {
                    if(childCode.startsWith(acc.code)) {
                        balance += balances[childCode];
                    }
                });
            } else {
                balance = balances[acc.code] || 0;
            }

            if (balance === 0 && isParent) return; // Don't show empty parent accounts

            const reportAccount: ReportAccount = { ...acc, balance, isParent };

            switch (acc.code.charAt(0)) {
                case '1': assets.push(reportAccount); if (!isParent) totalAssets += balance; break;
                case '2': liabilities.push(reportAccount); if (!isParent) totalLiabilities += balance; break;
                case '3': equity.push(reportAccount); if (!isParent) totalEquity += balance; break;
                case '4': revenues.push(reportAccount); if (!isParent) totalRevenues += balance; break;
                case '5': expenses.push(reportAccount); if (!isParent) totalExpenses += balance; break;
                default: break;
            }
        });
        
        const netIncome = totalRevenues - totalExpenses;
        const totalEquityAndLiabilities = totalLiabilities + totalEquity + netIncome;

        return {
            assets, liabilities, equity, revenues, expenses,
            totalAssets, totalLiabilities, totalEquity, totalRevenues, totalExpenses, netIncome,
            totalEquityAndLiabilities
        };
    }, [transactions, accounts]);

    const renderReport = () => {
        switch (activeReport) {
            case 'balance-sheet': return <BalanceSheet data={reportData} />;
            case 'income-statement': return <IncomeStatement data={reportData} />;
            case 'equity-statement': return <StatementOfCapital data={reportData} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center border-b border-slate-700">
                {(
                  [
                    { id: 'balance-sheet', label: 'Balance General' },
                    { id: 'income-statement', label: 'Estado de Resultados' },
                    { id: 'equity-statement', label: 'Estado de Capital' },
                  ] as const
                ).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveReport(tab.id)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeReport === tab.id
                                ? 'border-b-2 border-blue-500 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {renderReport()}
        </div>
    );
};

const ReportRow: React.FC<{account: ReportAccount, level?: number}> = ({ account, level = 0 }) => {
    const getRowStyle = (code: string) => {
        if (code.includes('.')) return { paddingLeft: `${4 + (level * 1.5)}rem`};
        switch (code.length) {
          case 1: return { paddingLeft: '1rem', fontWeight: 'bold', color: 'white' };
          case 2: return { paddingLeft: `${2 + (level * 1.5)}rem`, fontWeight: '600' };
          case 4: return { paddingLeft: `${3 + (level * 1.5)}rem` };
          default: return { paddingLeft: '1rem' };
        }
    };
    return (
         <div className="flex justify-between py-2 border-b border-slate-800">
            <span style={getRowStyle(account.code)}>{account.code} - {account.name}</span>
            <span className="font-mono">{!account.isParent ? formatCurrency(account.balance) : ''}</span>
        </div>
    );
};

const BalanceSheet: React.FC<{data: any}> = ({data}) => (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 text-center">Balance General</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assets */}
            <div>
                <h3 className="text-lg font-semibold text-blue-400 border-b-2 border-blue-400/50 pb-2 mb-3">Activos</h3>
                {data.assets.filter((a: ReportAccount) => a.balance !== 0).map((acc: ReportAccount) => <ReportRow key={acc.code} account={acc} />)}
                <div className="flex justify-between font-bold text-white pt-3 mt-3 border-t-2 border-slate-600">
                    <span>Total Activos</span>
                    <span className="font-mono">{formatCurrency(data.totalAssets)}</span>
                </div>
            </div>
            {/* Liabilities & Equity */}
            <div>
                <h3 className="text-lg font-semibold text-orange-400 border-b-2 border-orange-400/50 pb-2 mb-3">Pasivos</h3>
                {data.liabilities.filter((a: ReportAccount) => a.balance !== 0).map((acc: ReportAccount) => <ReportRow key={acc.code} account={acc} />)}
                <div className="flex justify-between font-semibold text-white pt-2 mt-2 border-t border-slate-600">
                    <span>Total Pasivos</span>
                    <span className="font-mono">{formatCurrency(data.totalLiabilities)}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-green-400 border-b-2 border-green-400/50 pb-2 mb-3 mt-6">Patrimonio</h3>
                {data.equity.filter((a: ReportAccount) => a.balance !== 0).map((acc: ReportAccount) => <ReportRow key={acc.code} account={acc} />)}
                 <div className="flex justify-between">
                    <span>Utilidad/Pérdida del Ejercicio</span>
                    <span className="font-mono">{formatCurrency(data.netIncome)}</span>
                </div>
                <div className="flex justify-between font-semibold text-white pt-2 mt-2 border-t border-slate-600">
                    <span>Total Patrimonio</span>
                    <span className="font-mono">{formatCurrency(data.totalEquity + data.netIncome)}</span>
                </div>

                <div className="flex justify-between font-bold text-white pt-3 mt-3 border-t-2 border-slate-600">
                    <span>Total Pasivos y Patrimonio</span>
                    <span className="font-mono">{formatCurrency(data.totalEquityAndLiabilities)}</span>
                </div>
            </div>
        </div>
         <div className="mt-6 pt-4 border-t-2 border-slate-500 text-center">
            <p className={`text-lg font-bold ${Math.abs(data.totalAssets - data.totalEquityAndLiabilities) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                Balance Contable: {formatCurrency(data.totalAssets - data.totalEquityAndLiabilities)}
            </p>
        </div>
    </div>
);

const IncomeStatement: React.FC<{data: any}> = ({data}) => (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Estado de Resultados</h2>
        
        <h3 className="text-lg font-semibold text-green-400 border-b border-green-400/50 pb-2 mb-3">Ingresos</h3>
        {data.revenues.filter((a: ReportAccount) => a.balance !== 0).map((acc: ReportAccount) => <ReportRow key={acc.code} account={acc} />)}
        <div className="flex justify-between font-semibold text-white pt-2 mt-2 border-t border-slate-600">
            <span>Total Ingresos</span>
            <span className="font-mono">{formatCurrency(data.totalRevenues)}</span>
        </div>
        
        <h3 className="text-lg font-semibold text-orange-400 border-b border-orange-400/50 pb-2 mb-3 mt-8">Gastos</h3>
        {data.expenses.filter((a: ReportAccount) => a.balance !== 0).map((acc: ReportAccount) => <ReportRow key={acc.code} account={acc} />)}
        <div className="flex justify-between font-semibold text-white pt-2 mt-2 border-t border-slate-600">
            <span>Total Gastos</span>
            <span className="font-mono">{formatCurrency(data.totalExpenses)}</span>
        </div>

        <div className="flex justify-between font-bold text-xl text-white pt-4 mt-6 border-t-2 border-slate-500">
            <span>Utilidad/Pérdida Neta</span>
            <span className={`font-mono ${data.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.netIncome)}</span>
        </div>
    </div>
);

const StatementOfCapital: React.FC<{data: any}> = ({data}) => (
     <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Estado de Capital Contable</h2>
        <div className="space-y-2">
            {data.equity.filter((a: ReportAccount) => a.balance !== 0 && !a.isParent).map((acc: ReportAccount) => (
                 <div key={acc.code} className="flex justify-between py-2">
                    <span>{acc.name} (Capital Inicial)</span>
                    <span className="font-mono">{formatCurrency(acc.balance)}</span>
                </div>
            ))}
            <div className="flex justify-between py-2 border-t border-slate-600 pt-3">
                <span>Capital Social Inicial</span>
                <span className="font-mono">{formatCurrency(data.totalEquity)}</span>
            </div>
             <div className="flex justify-between py-2">
                <span>(+) Utilidad/Pérdida del Ejercicio</span>
                <span className={`font-mono ${data.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.netIncome)}</span>
            </div>
             <div className="flex justify-between font-bold text-lg text-white pt-4 mt-4 border-t-2 border-slate-500">
                <span>Capital Contable Final</span>
                <span className="font-mono">{formatCurrency(data.totalEquity + data.netIncome)}</span>
            </div>
        </div>
    </div>
);


export default FinancialStatements;
