<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\rest\Controller;
use common\models\Kunjungan;
use common\models\Billing;
use common\models\Pembayaran;
use common\models\Laboratorium;
use common\models\Resep;
use common\models\Poli;
use common\models\Dokter;
use common\models\Obat;

class DashboardController extends BaseController
{
    public $modelClass = Kunjungan::class;

    public function actions(): array
    {
        return [];
    }

    public function actionSummary(): array
    {
        $this->requirePermission('dashboard-view');

        $date = Yii::$app->request->get('tanggal', date('Y-m-d'));

        $kunjunganStats = Kunjungan::find()
            ->where(['tanggal' => $date, 'is_deleted' => false])
            ->select([
                'COUNT(*) as total_kunjungan',
                "SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting",
                "SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress",
                "SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done",
                "SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled",
            ])
            ->asArray()
            ->one();

        $byPoli = Kunjungan::find()
            ->select(['poli_id', 'COUNT(*) as total'])
            ->where(['tanggal' => $date, 'is_deleted' => false])
            ->groupBy('poli_id')
            ->with(['poli' => function($q) { $q->select(['id', 'nama', 'kode']); }])
            ->asArray()
            ->all();

        $revenue = Billing::find()
            ->select([
                'COALESCE(SUM(total), 0) as total_billing',
                'COALESCE(SUM(paid_amount), 0) as total_paid',
                'COALESCE(SUM(total - paid_amount), 0) as outstanding',
            ])
            ->innerJoinWith('kunjungan')
            ->where(['kunjungan.tanggal' => $date, 'billing.is_deleted' => false])
            ->asArray()
            ->one();

        $labStats = Laboratorium::find()
            ->select([
                'COUNT(*) as total_orders',
                "SUM(CASE WHEN status IN ('ordered', 'sample_collected', 'in_progress') THEN 1 ELSE 0 END) as pending",
                "SUM(CASE WHEN status IN ('completed', 'verified') THEN 1 ELSE 0 END) as done",
            ])
            ->where(['DATE(created_at)' => $date, 'is_deleted' => false])
            ->asArray()
            ->one();

        $pharmacyStats = Resep::find()
            ->select([
                'COUNT(DISTINCT resep.id) as total_resep',
                "SUM(CASE WHEN resep.status = 'dispensed' THEN 1 ELSE 0 END) as dispensed",
                "SUM(CASE WHEN resep.status = 'partial' THEN 1 ELSE 0 END) as partial",
                'COALESCE(SUM(resep_detail.harga_satuan * resep_detail.dispensed_quantity), 0) as revenue',
            ])
            ->innerJoinWith('kunjungan')
            ->leftJoin('resep_detail', 'resep_detail.resep_id = resep.id')
            ->where(['kunjungan.tanggal' => $date, 'resep.is_deleted' => false])
            ->asArray()
            ->one();

        return [
            'success' => true,
            'data' => [
                'tanggal' => $date,
                'kunjungan' => $kunjunganStats,
                'by_poli' => $byPoli,
                'revenue' => $revenue,
                'laboratorium' => $labStats,
                'farmasi' => $pharmacyStats,
            ],
        ];
    }

    public function actionPeriod(): array
    {
        $this->requirePermission('dashboard-view');

        $period = Yii::$app->request->get('period', 'monthly');
        $year = Yii::$app->request->get('year', date('Y'));
        $month = Yii::$app->request->get('month', date('m'));
        $startDate = Yii::$app->request->get('start_date');
        $endDate = Yii::$app->request->get('end_date');

        $dateFilter = '';
        $params = [];

        if ($startDate && $endDate) {
            $dateFilter = 'WHERE k.tanggal BETWEEN :start_date AND :end_date';
            $params = [':start_date' => $startDate, ':end_date' => $endDate];
        } elseif ($year && $month) {
            $dateFilter = 'WHERE YEAR(k.tanggal) = :year AND MONTH(k.tanggal) = :month';
            $params = [':year' => $year, ':month' => $month];
        } elseif ($year) {
            $dateFilter = 'WHERE YEAR(k.tanggal) = :year';
            $params = [':year' => $year];
        }

        $kunjunganTrend = Yii::$app->db->createCommand("
            SELECT DATE(k.tanggal) as tanggal,
                   COUNT(*) as total,
                   SUM(CASE WHEN k.status = 'done' THEN 1 ELSE 0 END) as completed
            FROM simrs_kunjungan k
            $dateFilter AND k.is_deleted = false
            GROUP BY DATE(k.tanggal)
            ORDER BY DATE(k.tanggal)
        ", $params)->queryAll();

        $revenueTrend = Yii::$app->db->createCommand("
            SELECT DATE(k.tanggal) as tanggal,
                   COALESCE(SUM(b.total), 0) as billing,
                   COALESCE(SUM(b.paid_amount), 0) as paid
            FROM simrs_kunjungan k
            LEFT JOIN simrs_billing b ON b.kunjungan_id = k.id AND b.is_deleted = false
            $dateFilter AND k.is_deleted = false
            GROUP BY DATE(k.tanggal)
            ORDER BY DATE(k.tanggal)
        ", $params)->queryAll();

        $topPoli = Yii::$app->db->createCommand("
            SELECT p.nama, COUNT(k.id) as total
            FROM simrs_kunjungan k
            JOIN simrs_poli p ON p.id = k.poli_id
            $dateFilter AND k.is_deleted = false
            GROUP BY p.id, p.nama
            ORDER BY total DESC
            LIMIT 10
        ", $params)->queryAll();

        $topDokter = Yii::$app->db->createCommand("
            SELECT d.full_name, COUNT(k.id) as total
            FROM simrs_kunjungan k
            JOIN simrs_dokter d ON d.id = k.dokter_id
            $dateFilter AND k.is_deleted = false AND k.dokter_id IS NOT NULL
            GROUP BY d.id, d.full_name
            ORDER BY total DESC
            LIMIT 10
        ", $params)->queryAll();

        $paymentMethods = Yii::$app->db->createCommand("
            SELECT py.method, COUNT(*) as count, COALESCE(SUM(py.amount), 0) as total
            FROM simrs_pembayaran py
            JOIN simrs_billing b ON b.id = py.billing_id
            JOIN simrs_kunjungan k ON k.id = b.kunjungan_id
            $dateFilter AND py.is_deleted = false AND py.status = 'success'
            GROUP BY py.method
            ORDER BY total DESC
        ", $params)->queryAll();

        return [
            'success' => true,
            'data' => [
                'period' => compact('period', 'year', 'month', 'start_date', 'end_date'),
                'kunjungan_trend' => $kunjunganTrend,
                'revenue_trend' => $revenueTrend,
                'top_poli' => $topPoli,
                'top_dokter' => $topDokter,
                'payment_methods' => $paymentMethods,
            ],
        ];
    }

    public function actionQueueStatus(): array
    {
        $this->requirePermission('dashboard-view');

        $date = Yii::$app->request->get('tanggal', date('Y-m-d'));

        $queueStatus = Poli::find()
            ->select([
                'p.id as poli_id',
                'p.nama as poli_nama',
                'p.kode as poli_kode',
                "SUM(CASE WHEN a.status IN ('waiting', 'called') THEN 1 ELSE 0 END) as waiting",
                "SUM(CASE WHEN a.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress",
                "SUM(CASE WHEN a.status = 'done' THEN 1 ELSE 0 END) as done",
                'COALESCE(MAX(a.no_antrean), 0) as last_number',
            ])
            ->leftJoin('simrs_antrean a', 'a.poli_id = p.id AND a.tanggal = :date AND a.is_deleted = false', [':date' => $date])
            ->where(['p.is_active' => true, 'p.is_deleted' => false])
            ->groupBy('p.id, p.nama, p.kode')
            ->orderBy('p.sort_order, p.nama')
            ->asArray()
            ->all();

        return [
            'success' => true,
            'data' => [
                'tanggal' => $date,
                'queues' => $queueStatus,
            ],
        ];
    }

    public function actionDoctorSchedule(string $dokterId = null, string $date = null): array
    {
        $this->requirePermission('dashboard-view');

        $date = $date ?? date('Y-m-d');

        $query = \common\models\JadwalPraktik::findActive()
            ->where(['day_of_week' => (int) date('w', strtotime($date))])
            ->andWhere(['<=', 'effective_from', $date])
            ->andWhere(['or', ['effective_until' => null], ['>=', 'effective_until', $date]])
            ->with(['dokter.user.profile', 'poli']);

        if ($dokterId) {
            $query->andWhere(['dokter_id' => $dokterId]);
        }

        $schedules = $query->orderBy(['start_time' => SORT_ASC])->asArray()->all();

        $result = [];
        foreach ($schedules as $schedule) {
            $bookedCount = Kunjungan::find()
                ->where([
                    'dokter_id' => $schedule['dokter_id'],
                    'poli_id' => $schedule['poli_id'],
                    'tanggal' => $date,
                ])
                ->andWhere(['in', 'status', [Kunjungan::STATUS_WAITING, Kunjungan::STATUS_IN_PROGRESS, Kunjungan::STATUS_DONE]])
                ->count();

            $result[] = [
                'schedule' => $schedule,
                'quota' => $schedule['quota'],
                'booked' => $bookedCount,
                'available' => max(0, $schedule['quota'] - $bookedCount),
            ];
        }

        return [
            'success' => true,
            'data' => [
                'tanggal' => $date,
                'schedules' => $result,
            ],
        ];
    }

    public function actionLowStock(): array
    {
        $this->requirePermission('dashboard-view');

        $lowStock = Obat::findActive()
            ->where(['<=', 'current_stock', new \yii\db\Expression('min_stock')])
            ->andWhere(['>', 'min_stock', 0])
            ->with(['category'])
            ->orderBy('current_stock')
            ->limit(20)
            ->asArray()
            ->all();

        $expiringSoon = Obat::findActive()
            ->where(['<=', 'expired_date', date('Y-m-d', strtotime('+90 days'))])
            ->andWhere(['is not', 'expired_date', new \yii\db\Expression('NULL')])
            ->with(['category'])
            ->orderBy('expired_date')
            ->limit(20)
            ->asArray()
            ->all();

        return [
            'success' => true,
            'data' => [
                'low_stock' => $lowStock,
                'expiring_soon' => $expiringSoon,
            ],
        ];
    }

    public function actionRevenueReport(): array
    {
        $this->requirePermission('laporan-keuangan-view');

        $startDate = Yii::$app->request->get('start_date', date('Y-m-01'));
        $endDate = Yii::$app->request->get('end_date', date('Y-m-t'));

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
}