<?php

namespace common\components;

use Yii;
use yii\db\Connection;
use Ramsey\Uuid\Uuid;

class AuditLogger
{
    public function log(
        string $action,
        string $entityType,
        ?string $entityId,
        ?array $oldData = null,
        ?array $newData = null,
        ?string $description = null
    ): void {
        $userId = Yii::$app->user->id ?? null;
        $ip = Yii::$app->request->getUserIP();
        $userAgent = Yii::$app->request->getUserAgent();
        
        $log = [
            'id' => Uuid::uuid4()->toString(),
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_data' => $oldData ? json_encode($oldData) : null,
            'new_data' => $newData ? json_encode($newData) : null,
            'description' => $description,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'created_at' => date('Y-m-d H:i:s'),
        ];
        
        Yii::$app->db->createCommand()
            ->insert('simrs_audit_log', $log)
            ->execute();
        
        Yii::info("Audit: {$action} on {$entityType}#{$entityId} by user#{$userId}", 'audit');
    }
    
    public function logCreate(string $entityType, string $entityId, array $data, ?string $description = null): void
    {
        $this->log('CREATE', $entityType, $entityId, null, $data, $description);
    }
    
    public function logUpdate(string $entityType, string $entityId, array $oldData, array $newData, ?string $description = null): void
    {
        $this->log('UPDATE', $entityType, $entityId, $oldData, $newData, $description);
    }
    
    public function logDelete(string $entityType, string $entityId, array $oldData, ?string $description = null): void
    {
        $this->log('DELETE', $entityType, $entityId, $oldData, null, $description);
    }
    
    public function logLogin(string $userId, bool $success, ?string $description = null): void
    {
        $this->log($success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED', 'User', $userId, null, null, $description);
    }
    
    public function logPayment(string $billingId, float $amount, string $method, string $status, ?string $description = null): void
    {
        $this->log('PAYMENT', 'Billing', $billingId, null, [
            'amount' => $amount,
            'method' => $method,
            'status' => $status,
        ], $description);
    }
    
    public function logStockChange(string $obatId, int $oldStock, int $newStock, string $reason): void
    {
        $this->log('STOCK_CHANGE', 'Obat', $obatId, ['stock' => $oldStock], ['stock' => $newStock], $reason);
    }
}