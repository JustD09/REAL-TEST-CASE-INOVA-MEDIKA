<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class IntegrationLog extends ActiveRecord
{
    public const TYPE_BPJS = 'bpjs';
    public const TYPE_SATUSEHAT = 'satusehat';

    public const STATUS_PENDING = 'pending';
    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';

    public static function tableName(): string
    {
        return '{{%integration_log}}';
    }

    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['integration_type', 'endpoint', 'request_data', 'response_data', 'status'], 'required'],
            [['integration_type'], 'in', 'range' => [self::TYPE_BPJS, self::TYPE_SATUSEHAT]],
            [['endpoint', 'request_data', 'response_data'], 'string'],
            [['status'], 'in', 'range' => [self::STATUS_PENDING, self::STATUS_SUCCESS, self::STATUS_FAILED]],
            [['error_message'], 'string'],
            [['created_at'], 'safe'],
        ]);
    }

    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'integration_type' => 'Tipe Integrasi',
            'endpoint' => 'Endpoint',
            'request_data' => 'Data Request',
            'response_data' => 'Data Response',
            'status' => 'Status',
            'error_message' => 'Pesan Error',
            'created_at' => 'Dibuat Pada',
        ];
    }

    public function getTypeLabel(): string
    {
        $labels = [
            self::TYPE_BPJS => 'BPJS',
            self::TYPE_SATUSEHAT => 'SATUSEHAT',
        ];
        return $labels[$this->integration_type] ?? $this->integration_type;
    }

    public function getStatusLabel(): string
    {
        $labels = [
            self::STATUS_PENDING => 'Menunggu',
            self::STATUS_SUCCESS => 'Berhasil',
            self::STATUS_FAILED => 'Gagal',
        ];
        return $labels[$this->status] ?? $this->status;
    }

    public static function log(string $type, string $endpoint, string $requestData, string $responseData, string $status, string $errorMessage = ''): self
    {
        $log = new self();
        $log->integration_type = $type;
        $log->endpoint = $endpoint;
        $log->request_data = $requestData;
        $log->response_data = $responseData;
        $log->status = $status;
        $log->error_message = $errorMessage;
        $log->save(false);
        return $log;
    }
}