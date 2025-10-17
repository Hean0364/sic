// Fix: Removed self-referential import of 'Account' which was causing a conflict with its own declaration.

export enum TransactionType {
  DEBIT = 'Cargo',
  CREDIT = 'Abono',
}

export interface Account {
  code: string;
  name: string;
}

export interface Transaction {
  id: string;
  journalEntryId: string;
  date: string;
  account: Account;
  description: string;
  type: TransactionType;
  amount: number; // base amount
  iva: number; // calculated iva
  total: number; // amount + iva
}