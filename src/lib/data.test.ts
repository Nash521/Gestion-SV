import { getInvoiceTotal } from './data';
import type { Invoice } from './definitions';

describe('getInvoiceTotal', () => {
    it('should calculate the total correctly with line items', () => {
        const invoice = {
            lineItems: [
                { id: '1', description: 'Item A', quantity: 2, price: 100 }, // 200
                { id: '2', description: 'Item B', quantity: 1, price: 50 },  // 50
            ],
        } as unknown as Invoice;

        expect(getInvoiceTotal(invoice)).toBe(250);
    });

    it('should calculate the total correctly with discount', () => {
        const invoice = {
            lineItems: [
                { id: '1', description: 'Item A', quantity: 2, price: 100 },
            ],
            discountAmount: 20,
        } as unknown as Invoice;

        expect(getInvoiceTotal(invoice)).toBe(180);
    });

    it('should return 0 for empty invoice', () => {
        const invoice = {
            lineItems: [],
        } as unknown as Invoice;
        expect(getInvoiceTotal(invoice)).toBe(0);
    });
});
