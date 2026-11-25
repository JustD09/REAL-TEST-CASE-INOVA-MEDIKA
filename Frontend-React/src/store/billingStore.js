import { create } from 'zustand';

export const useBillingStore = create((set) => ({
  currentBilling: null,
  billingHistory: [],
  loading: false,
  paymentProcessing: false,

  setCurrentBilling: (billing) => {
    set({ currentBilling: billing });
  },

  setBillingHistory: (history) => {
    set({ billingHistory: history });
  },

  addPayment: (payment) => {
    set((state) => ({
      currentBilling: state.currentBilling ? {
        ...state.currentBilling,
        paid_amount: state.currentBilling.paid_amount + payment.amount,
        status: state.currentBilling.paid_amount + payment.amount >= state.currentBilling.total ? 'paid' : 'partial',
        payments: [...(state.currentBilling.payments || []), payment],
      } : null,
    }));
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setPaymentProcessing: (processing) => {
    set({ paymentProcessing: processing });
  },

  clearCurrentBilling: () => {
    set({ currentBilling: null });
  },
}));