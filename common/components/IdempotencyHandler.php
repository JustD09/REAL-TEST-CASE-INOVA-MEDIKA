<?php

namespace common\components;

use Yii;
use yii\db\Connection;
use yii\db\Exception;
use Ramsey\Uuid\Uuid;

class IdempotencyHandler
{
    public function __construct(
        private ?Connection $db = null
    ) {
        $this->db ??= Yii::$app->db;
    }
    
    /**
     * Process a request with idempotency key.
     * Returns [success, result, isDuplicate]
     */
    public function process(string $idempotencyKey, callable $callback): array
    {
        // Periksa keberadaan kunci
        $existing = $this->db->createCommand(
            "SELECT result, status FROM simrs_idempotency_keys WHERE idempotency_key = :key FOR UPDATE",
            [':key' => $idempotencyKey]
        )->queryOne();
        
        if ($existing) {
            if ($existing['status'] === 'completed') {
                return [true, json_decode($existing['result'], true), true];
            }
            if ($existing['status'] === 'processing') {
                // Permintaan lain sedang diproses - tunggu atau tolak
                return [false, null, false]; // Let caller decide
            }
        }
        
        // Simpan rekam proses
        try {
            $this->db->createCommand()
                ->insert('simrs_idempotency_keys', [
                    'id' => Uuid::uuid4()->toString(),
                    'idempotency_key' => $idempotencyKey,
                    'status' => 'processing',
                    'created_at' => date('Y-m-d H:i:s'),
                    'expires_at' => date('Y-m-d H:i:s', time() + 86400), // 24 hours
                ])
                ->execute();
        } catch (Exception $e) {
            // Race condition - permintaan lain sudah menyimpan data
            return $this->process($idempotencyKey, $callback);
        }
        
        // Jalankan callback dalam transaksi
        $transaction = $this->db->beginTransaction();
        try {
            $result = $callback($transaction);
            
            $this->db->createCommand()
                ->update('simrs_idempotency_keys', [
                    'status' => 'completed',
                    'result' => json_encode($result),
                    'completed_at' => date('Y-m-d H:i:s'),
                ], 'idempotency_key = :key', [':key' => $idempotencyKey])
                ->execute();
            
            $transaction->commit();
            return [true, $result, false];
        } catch (\Throwable $e) {
            $transaction->rollBack();
            
            $this->db->createCommand()
                ->update('simrs_idempotency_keys', [
                    'status' => 'failed',
                    'error' => $e->getMessage(),
                    'completed_at' => date('Y-m-d H:i:s'),
                ], 'idempotency_key = :key', [':key' => $idempotencyKey])
                ->execute();
            
            throw $e;
        }
    }
    
    public function generateKey(string $prefix = ''): string
    {
        return $prefix . bin2hex(random_bytes(16));
    }
    
    public function cleanup(int $olderThanDays = 30): int
    {
        return $this->db->createCommand()
            ->delete('simrs_idempotency_keys', 'created_at < NOW() - INTERVAL \':days days\'', [':days' => $olderThanDays])
            ->execute();
    }
}