import { test, expect } from '@playwright/test';
import { query } from '../../config/database.js';

// Test payment process for billing
test.describe('Payment Integration Test', () => {
  test('should process payment successfully', async ({ }) => {
    // Create a test billing record first
    const billingId = 'test-billing-123';
    await query(
      `INSERT INTO simrs_billing (id, kunjungan_id, pasien_id, no_billing, status, total, paid_amount, due_date, created_by)
       VALUES ($1, $2, $3, $4, 'open', 100000, 0, NOW() + INTERVAL '7 days', 'test_user')
       RETURNING *`,
      ['test-billing-123', 'test-kunjungan-123', 'test-pasien-123', 'BIL-2023-10-25-0001', 'test_user']
    );

    // Process payment
    const result = await query(
      `UPDATE simrs_billing 
       SET paid_amount = paid_amount + 50000, status = CASE WHEN paid_amount + 50000 >= total THEN 'paid' ELSE 'partial' END,
           updated_by = 'test_user'
       WHERE id = $1 
       RETURNING *`,
      ['test-billing-123']
    );

    // Verify the result
    expect(result.rows[0].status).toBe('partial');
    expect(result.rows[0].paid_amount).toBe(50000);
  });

  test('should handle overpayment error', async ({ }) => {
    // Create a test billing record with remaining balance of 10000
    const billingId = 'test-billing-456';
    await query(
      `INSERT INTO simrs_billing (id, kunjungan_id, pasien_id, no_billing, status, total, paid_amount, due_date, created_by)
       VALUES ($1, $2, $3, $4, 'open', 10000, 0, NOW() + INTERVAL '7 days', 'test_user')
       RETURNING *`,
      ['test-billing-456', 'test-kunjungan-456', 'test-pasien-456', 'BIL-2023-10-26-0002', 'test_user']
    );

    // Try to process payment more than remaining balance
    await expect(
      query(
        `UPDATE simrs_billing 
         SET paid_amount = paid_amount + 20000, status = 'partial'
         WHERE id = $1`,
        ['test-billing-456']
      )
    ).rejects.toThrow('JUMLAH_MELEBIHI');

    // Verify the billing status is unchanged
    const result = await query('SELECT paid_amount, status FROM simrs_billing WHERE id = $1', ['test-billing-456']);
    expect(result.rows[0].status).toBe('open');
    expect(result.rows[0].paid_amount).toBe(0);
  });
});