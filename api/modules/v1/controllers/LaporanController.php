<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use common\models\Kunjungan;
use common\models\Poli;
use common\models\Dokter;
use common\models\Tindakan;
use common\models\Obat;
use common\models\Billing;

class LaporanController extends BaseController
{
    public $modelClass = Kunjungan::class;

    public function actions(): array
    {
        return [];
    }

    public function actionKunjungan(): array
    {
        $this->requirePermission('laporan-kunjungan-view');

        $query = Kunjungan::find()
            ->joinWith(['pasien', 'poli', 'dokter'])
            ->where(['simrs_kunjungan.is_deleted' => false])
            ->orderBy(['simrs_kunjungan.tanggal' => SORT_DESC, 'simrs_kunjungan.created_at' => SORT_DESC]);

        $this->applyDateFilter($query);
        $this->applyPoliFilter($query);
        $this->applyDokterFilter($query);

        $provider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->request->get('perPage', 20),
            ],
        ]);

        return [
            'success' => true,
            'data' => $provider->getModels(),
            'pagination' => $this->paginationData($provider),
        ];
    }

    public function actionPoli(): array
    {
        $this->requirePermission('laporan-poli-view');

        $query = Poli::find()
            ->select([
                'simrs_poli.id',
                'simrs_poli.nama',
                'COUNT(kunjungan.id) as total_kunjungan',
            ])
            ->leftJoin('simrs_kunjungan kunjungan', 'kunjungan.poli_id = simrs_poli.id AND kunjungan.is_deleted = false')
            ->groupBy(['simrs_poli.id', 'simrs_poli.nama'])
            ->orderBy(['total_kunjungan' => SORT_DESC]);

        $this->applyDateFilter($query, 'kunjungan.tanggal');

        $provider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->request->get('perPage', 50),
            ],
        ]);

        return [
            'success' => true,
            'data' => $provider->getModels(),
            'pagination' => $this->paginationData($provider),
        ];
    }

    public function actionDokter(): array
    {
        $this->requirePermission('laporan-dokter-view');

        $query = Dokter::find()
            ->select([
                'simrs_dokter.id',
                'simrs_dokter.full_name',
                'specialist.nama as specialist_nama',
                'COUNT(kunjungan.id) as total_kunjungan',
            ])
            ->leftJoin('simrs_kunjungan kunjungan', 'kunjungan.dokter_id = simrs_dokter.id AND kunjungan.is_deleted = false')
            ->leftJoin('simrs_specialist specialist', 'specialist.id = simrs_dokter.specialist_id')
            ->groupBy(['simrs_dokter.id', 'simrs_dokter.full_name', 'specialist.nama'])
            ->orderBy(['total_kunjungan' => SORT_DESC]);

        $this->applyDateFilter($query, 'kunjungan.tanggal');

        $provider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->request->get('perPage', 50),
            ],
        ]);

        return [
            'success' => true,
            'data' => $provider->getModels(),
            'pagination' => $this->paginationData($provider),
        ];
    }

    public function actionTindakan(): array
    {
        $this->requirePermission('laporan-tindakan-view');

        $query = Tindakan::find()
            ->select([
                'simrs_tindakan.id',
                'simrs_tindakan.nama',
                'simrs_tindakan.kode',
                'tindakan_tarif.tarif as harga',
                'tindakan_category.nama as category',
                'COUNT(tindakan_medis.id) as total_dilakukan',
                new \yii\db\Expression('SUM(tindakan_medis.quantity * tindakan_medis.tarif) as total_pendapatan'),
            ])
            ->leftJoin('simrs_tindakan_medis tindakan_medis', 'tindakan_medis.tindakan_id = simrs_tindakan.id AND tindakan_medis.is_deleted = false')
            ->leftJoin('simrs_kunjungan kunjungan', 'kunjungan.id = tindakan_medis.kunjungan_id AND kunjungan.is_deleted = false')
            ->leftJoin('simrs_tindakan_category tindakan_category', 'tindakan_category.id = simrs_tindakan.category_id')
            ->leftJoin('simrs_tindakan_tarif tindakan_tarif', 'tindakan_tarif.tindakan_id = simrs_tindakan.id AND tindakan_tarif.is_active = true')
            ->groupBy(['simrs_tindakan.id', 'simrs_tindakan.nama', 'simrs_tindakan.kode', 'tindakan_tarif.tarif', 'tindakan_category.nama'])
            ->orderBy(['total_dilakukan' => SORT_DESC]);

        $this->applyDateFilter($query, 'kunjungan.tanggal');

        $provider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->request->get('perPage', 50),
            ],
        ]);

        return [
            'success' => true,
            'data' => $provider->getModels(),
            'pagination' => $this->paginationData($provider),
        ];
    }

    public function actionObat(): array
    {
        $this->requirePermission('laporan-obat-view');

        $query = Obat::find()
            ->select([
                'simrs_obat.id',
                'simrs_obat.nama',
                'simrs_obat.kode',
                'simrs_obat.selling_price',
                'obat_category.nama as category',
                'simrs_obat.current_stock as stok_tersedia',
                'simrs_obat.min_stock as min_stok',
                new \yii\db\Expression('SUM(resep_detail.quantity) as total_terjual'),
                new \yii\db\Expression('SUM(resep_detail.quantity * resep_detail.harga_satuan) as total_pendapatan'),
            ])
            ->leftJoin('simrs_resep_detail resep_detail', 'resep_detail.obat_id = simrs_obat.id AND resep_detail.is_deleted = false')
            ->leftJoin('simrs_resep resep', 'resep.id = resep_detail.resep_id AND resep.is_deleted = false')
            ->leftJoin('simrs_kunjungan kunjungan', 'kunjungan.id = resep.kunjungan_id AND kunjungan.is_deleted = false')
            ->leftJoin('simrs_obat_category obat_category', 'obat_category.id = simrs_obat.category_id')
            ->groupBy(['simrs_obat.id', 'simrs_obat.nama', 'simrs_obat.kode', 'simrs_obat.selling_price', 'obat_category.nama', 'simrs_obat.current_stock', 'simrs_obat.min_stock'])
            ->orderBy(['total_terjual' => SORT_DESC]);

        $this->applyDateFilter($query, 'kunjungan.tanggal');

        $provider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->request->get('perPage', 50),
            ],
        ]);

        return [
            'success' => true,
            'data' => $provider->getModels(),
            'pagination' => $this->paginationData($provider),
        ];
    }

    public function actionPendapatan(): array
    {
        $this->requirePermission('laporan-pendapatan-view');

        $startDate = Yii::$app->request->get('date_from', date('Y-m-01'));
        $endDate = Yii::$app->request->get('date_to', date('Y-m-t'));

        $summary = Yii::$app->db->createCommand("
            SELECT
                COALESCE(SUM(b.total), 0) as total_billing,
                COALESCE(SUM(b.paid_amount), 0) as total_paid,
                COALESCE(SUM(b.total - b.paid_amount), 0) as outstanding,
                COUNT(DISTINCT b.id) as total_bills,
                COUNT(DISTINCT CASE WHEN b.status = 'paid' THEN b.id END) as paid_bills,
                COUNT(DISTINCT CASE WHEN b.status = 'partial' THEN b.id END) as partial_bills,
                COUNT(DISTINCT CASE WHEN b.status = 'unpaid' THEN b.id END) as unpaid_bills
            FROM simrs_billing b
            JOIN simrs_kunjungan k ON k.id = b.kunjungan_id
            WHERE k.tanggal BETWEEN :start_date AND :end_date
            AND b.is_deleted = false
        ", [':start_date' => $startDate, ':end_date' => $endDate])->queryOne();

        $byPoli = Yii::$app->db->createCommand("
            SELECT p.nama,
                   COALESCE(SUM(b.total), 0) as total,
                   COALESCE(SUM(b.paid_amount), 0) as paid,
                   COUNT(*) as count
            FROM simrs_billing b
            JOIN simrs_kunjungan k ON k.id = b.kunjungan_id
            JOIN simrs_poli p ON p.id = k.poli_id
            WHERE k.tanggal BETWEEN :start_date AND :end_date
            AND b.is_deleted = false
            GROUP BY p.id, p.nama
            ORDER BY total DESC
        ", [':start_date' => $startDate, ':end_date' => $endDate])->queryAll();

        $byPaymentMethod = Yii::$app->db->createCommand("
            SELECT py.method,
                   COUNT(*) as count,
                   COALESCE(SUM(py.amount), 0) as total
            FROM simrs_pembayaran py
            JOIN simrs_billing b ON b.id = py.billing_id
            JOIN simrs_kunjungan k ON k.id = b.kunjungan_id
            WHERE k.tanggal BETWEEN :start_date AND :end_date
            AND py.is_deleted = false AND py.status = 'success'
            GROUP BY py.method
            ORDER BY total DESC
        ", [':start_date' => $startDate, ':end_date' => $endDate])->queryAll();

        $daily = Yii::$app->db->createCommand("
            SELECT DATE(k.tanggal) as tanggal,
                   COALESCE(SUM(b.total), 0) as billing,
                   COALESCE(SUM(b.paid_amount), 0) as paid
            FROM simrs_kunjungan k
            LEFT JOIN simrs_billing b ON b.kunjungan_id = k.id AND b.is_deleted = false
            WHERE k.tanggal BETWEEN :start_date AND :end_date
            AND k.is_deleted = false
            GROUP BY DATE(k.tanggal)
            ORDER BY DATE(k.tanggal)
        ", [':start_date' => $startDate, ':end_date' => $endDate])->queryAll();

        return [
            'success' => true,
            'data' => [
                'period' => ['start_date' => $startDate, 'end_date' => $endDate],
                'summary' => $summary,
                'by_poli' => $byPoli,
                'by_payment_method' => $byPaymentMethod,
                'daily' => $daily,
            ],
        ];
    }

    public function actionPiutang(): array
    {
        $this->requirePermission('laporan-piutang-view');

        $query = Billing::find()
            ->select([
                'simrs_billing.id',
                'simrs_billing.no_billing',
                'simrs_profile.full_name as pasien_nama',
                'simrs_billing.total',
                'simrs_billing.paid_amount',
                new \yii\db\Expression('simrs_billing.total - simrs_billing.paid_amount as sisa'),
                'simrs_billing.status',
                'simrs_kunjungan.tanggal',
            ])
            ->joinWith(['kunjungan.pasien.profile'])
            ->where(['simrs_billing.is_deleted' => false])
            ->andWhere(new \yii\db\Expression('simrs_billing.paid_amount < simrs_billing.total'))
            ->orderBy(['simrs_kunjungan.tanggal' => SORT_ASC]);

        $this->applyDateFilter($query, 'kunjungan.tanggal');

        $provider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->request->get('perPage', 20),
            ],
        ]);

        return [
            'success' => true,
            'data' => $provider->getModels(),
            'pagination' => $this->paginationData($provider),
        ];
    }

    public function actionStok(): array
    {
        $this->requirePermission('laporan-stok-view');

        $query = Obat::find()
            ->select([
                'simrs_obat.id',
                'simrs_obat.nama as obat_nama',
                'simrs_obat.kode as obat_kode',
                'simrs_obat.current_stock as jumlah',
                'simrs_obat.min_stock as min_stok',
                'is_low' => new \yii\db\Expression('CASE WHEN simrs_obat.current_stock <= simrs_obat.min_stock THEN 1 ELSE 0 END'),
                'simrs_obat.expired_date',
            ])
            ->where(['simrs_obat.is_deleted' => false])
            ->orderBy(['is_low' => SORT_DESC, 'simrs_obat.expired_date' => SORT_ASC]);

        $lowOnly = Yii::$app->request->get('low_only');
        if ($lowOnly) {
            $query->andWhere(new \yii\db\Expression('simrs_obat.current_stock <= simrs_obat.min_stock'));
        }

        $provider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->request->get('perPage', 50),
            ],
        ]);

        return [
            'success' => true,
            'data' => $provider->getModels(),
            'pagination' => $this->paginationData($provider),
        ];
    }

    private function paginationData($provider): array
    {
        return [
            'totalCount' => $provider->getTotalCount(),
            'pageCount' => $provider->getPagination()->getPageCount(),
            'currentPage' => $provider->getPagination()->getPage(),
            'perPage' => $provider->getPagination()->getPageSize(),
        ];
    }

    private function applyDateFilter($query, $dateColumn = 'tanggal'): void
    {
        $dateFrom = Yii::$app->request->get('date_from');
        $dateTo = Yii::$app->request->get('date_to');

        if ($dateFrom) {
            $query->andWhere(['>=', $dateColumn, $dateFrom]);
        }
        if ($dateTo) {
            $query->andWhere(['<=', $dateColumn, $dateTo]);
        }
    }

    private function applyPoliFilter($query): void
    {
        $poliId = Yii::$app->request->get('poli_id');
        if ($poliId) {
            $query->andWhere(['kunjungan.poli_id' => $poliId]);
        }
    }

    private function applyDokterFilter($query): void
    {
        $dokterId = Yii::$app->request->get('dokter_id');
        if ($dokterId) {
            $query->andWhere(['kunjungan.dokter_id' => $dokterId]);
        }
    }
}