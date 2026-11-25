<?php

namespace common\components;

use Yii;
use yii\web\Request;
use yii\web\BadRequestHttpException;

class ApiRequest extends Request
{
    public function getAuthToken(): ?string
    {
        $authHeader = $this->getHeaders()->get('Authorization');
        if ($authHeader && preg_match('/^Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        // Periksa parameter query (untuk WebSocket/fallback)
        return $this->getQueryParam('access_token');
    }
    
    public function getApiKey(): ?string
    {
        return $this->getHeaders()->get('X-API-Key');
    }
    
    public function getIdempotencyKey(): ?string
    {
        return $this->getHeaders()->get('Idempotency-Key');
    }
    
    public function validateJson(): array
    {
        $rawBody = $this->getRawBody();
        if (empty($rawBody)) {
            throw new BadRequestHttpException('Request body is empty');
        }
        
        $data = json_decode($rawBody, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new BadRequestHttpException('Invalid JSON: ' . json_last_error_msg());
        }
        
        if (!is_array($data)) {
            throw new BadRequestHttpException('Request body must be a JSON object');
        }
        
        return $data;
    }
    
    public function getClientIp(): string
    {
        $headers = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP'];
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                return trim($ips[0]);
            }
        }
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}