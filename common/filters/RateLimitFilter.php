<?php

namespace common\filters;

use Yii;
use yii\base\ActionFilter;
use yii\web\TooManyRequestsHttpException;
use yii\caching\CacheInterface;

class RateLimitFilter extends ActionFilter
{
    public int $limit = 100;
    public int $window = 60; // detik
    public ?CacheInterface $cache = null;
    
    public function init(): void
    {
        parent::init();
        if ($this->cache === null) {
            $this->cache = Yii::$app->cache;
        }
    }
    
    public function beforeAction($action): bool
    {
        $key = $this->getRateLimitKey($action);
        $current = $this->cache->get($key);
        
        if ($current === false) {
            $this->cache->set($key, 1, $this->window);
        } elseif ($current >= $this->limit) {
            $retryAfter = $this->cache->get($key . '_ttl') ?? $this->window;
            throw new TooManyRequestsHttpException("Rate limit exceeded. Try again in {$retryAfter} seconds.");
        } else {
            $this->cache->set($key, $current + 1, $this->window);
        }
        
        $remaining = max(0, $this->limit - ($current ?? 0) - 1);
        Yii::$app->response->getHeaders()->set('X-RateLimit-Limit', $this->limit);
        Yii::$app->response->getHeaders()->set('X-RateLimit-Remaining', $remaining);
        Yii::$app->response->getHeaders()->set('X-RateLimit-Reset', time() + $this->window);
        
        return parent::beforeAction($action);
    }
    
    protected function getRateLimitKey($action): string
    {
        $userId = Yii::$app->user->id ?? 'guest';
        $ip = Yii::$app->request->getUserIP();
        $route = $action->getUniqueId();
        
        return "ratelimit:{$userId}:{$ip}:{$route}";
    }
}