<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use common\models\IntegrationLog;

class IntegrationController extends BaseController
{
    public $modelClass = IntegrationLog::class;

    public function actions(): array
    {
        return [];
    }

    public function actionLogs(): array
    {
        $this->requirePermission('integration.read');

        $query = IntegrationLog::find()
            ->orderBy(['created_at' => SORT_DESC]);

        $type = Yii::$app->request->get('integration_type');
        if ($type) {
            $query->andWhere(['integration_type' => $type]);
        }

        $status = Yii::$app->request->get('status');
        if ($status) {
            $query->andWhere(['status' => $status]);
        }

        $dateFrom = Yii::$app->request->get('date_from');
        $dateTo = Yii::$app->request->get('date_to');
        if ($dateFrom) {
            $query->andWhere(['>=', 'created_at', $dateFrom]);
        }
        if ($dateTo) {
            $query->andWhere(['<=', 'created_at', $dateTo]);
        }

        $provider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->request->get('perPage', 20),
            ],
        ]);

        return [
            'success' => true,
            'data' => $provider->getModels(),
            'pagination' => [
                'totalCount' => $provider->getTotalCount(),
                'pageCount' => $provider->getPagination()->getPageCount(),
                'currentPage' => $provider->getPagination()->getPage(),
                'perPage' => $provider->getPagination()->getPageSize(),
            ],
        ];
    }

    public function actionTypes(): array
    {
        $this->requirePermission('integration.read');

        $types = IntegrationLog::find()
            ->select('integration_type')
            ->distinct()
            ->column();

        return ['success' => true, 'data' => $types];
    }
}