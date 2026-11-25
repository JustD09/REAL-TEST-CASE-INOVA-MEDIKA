<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Diagnosa;

class DiagnosaController extends BaseController
{
    public $modelClass = Diagnosa::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('master-pasien-view');

        $query = Diagnosa::findActive();

        $params = Yii::$app->request->queryParams;

        if (!empty($params['search'])) {
            $query->andWhere(['or',
                ['like', 'kode', $params['search']],
                ['like', 'nama', $params['search']],
            ]);
        }

        if (!empty($params['chapter'])) {
            $query->andWhere(['chapter' => $params['chapter']]);
        }

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['kode' => SORT_ASC],
            ],
        ]);
    }

    public function actionView(string $id): Diagnosa
    {
        $this->requirePermission('master-pasien-view');

        $model = Diagnosa::findActive()
            ->with(['children'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Diagnosa not found');
        }
        return $model;
    }

    public function actionSearch(): array
    {
        $this->requirePermission('master-pasien-view');

        $q = Yii::$app->request->get('q', '');
        $limit = (int) Yii::$app->request->get('limit', 20);

        if (strlen($q) < 2) {
            return ['success' => true, 'data' => []];
        }

        $results = Diagnosa::findActive()
            ->where(['or',
                ['like', 'kode', $q],
                ['like', 'nama', $q],
            ])
            ->limit($limit)
            ->asArray()
            ->all();

        return ['success' => true, 'data' => $results];
    }

    public function actionChapters(): array
    {
        $this->requirePermission('master-pasien-view');

        $chapters = Diagnosa::findActive()
            ->select(['chapter', 'COUNT(*) as count'])
            ->groupBy('chapter')
            ->orderBy('chapter')
            ->asArray()
            ->all();

        return ['success' => true, 'data' => $chapters];
    }

    public function actionByChapter(string $chapter): ActiveDataProvider
    {
        $this->requirePermission('master-pasien-view');

        $query = Diagnosa::findActive()->where(['chapter' => $chapter]);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['kode' => SORT_ASC],
            ],
        ]);
    }
}