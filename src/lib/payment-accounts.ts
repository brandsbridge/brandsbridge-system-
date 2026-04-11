export type PaymentAccountType = "bank" | "cash" | "wallet";

export const PAYMENT_ACCOUNT_TYPES: PaymentAccountType[] = ["bank", "cash", "wallet"];

export interface DefaultPaymentAccount {
  accountName: string;
  accountType: PaymentAccountType;
  owner: string;
  bankName?: string;
  currency: string;
}

export const DEFAULT_PAYMENT_ACCOUNTS: DefaultPaymentAccount[] = [
  { accountName: "Petty Cash", accountType: "cash", owner: "Company", currency: "USD" },
  { accountName: "Musaed - Personal Bank", accountType: "bank", owner: "Musaed", currency: "USD" },
  { accountName: "Sam - Personal Bank", accountType: "bank", owner: "Sam", currency: "USD" },
  { accountName: "Saddam - Personal Bank", accountType: "bank", owner: "Saddam", currency: "USD" },
  { accountName: "DIA - Personal Bank", accountType: "bank", owner: "DIA", currency: "USD" },
  { accountName: "Company Bank Account", accountType: "bank", owner: "Company", currency: "USD" },
];
