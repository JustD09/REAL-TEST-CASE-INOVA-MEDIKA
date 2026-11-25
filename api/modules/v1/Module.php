<?php

namespace api\modules\v1;

use Yii;
use yii\base\Module as BaseModule;

class Module extends BaseModule
{
    public $controllerNamespace = 'api\modules\v1\controllers';
    
    public function init(): void
    {
        parent::init();
        
        // Konfigurasikan format respons
        Yii::$app->response->format = 'json';
        
        // Nonaktifkan CSRF untuk API
        Yii::$app->request->enableCsrfValidation = false;
    }
}