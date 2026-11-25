<?php

namespace common\models;

use Yii;
use yii\db\ActiveRecord as BaseActiveRecord;
use yii\behaviors\TimestampBehavior;
use yii\behaviors\BlameableBehavior;
use yii\db\Expression;
use Ramsey\Uuid\Uuid;

abstract class ActiveRecord extends BaseActiveRecord
{
    public static function primaryKey(): array
    {
        return ['id'];
    }
    
    public function behaviors(): array
    {
        return [
            [
                'class' => TimestampBehavior::class,
                'createdAtAttribute' => 'created_at',
                'updatedAtAttribute' => 'updated_at',
                'value' => new Expression('NOW()'),
            ],
            [
                'class' => BlameableBehavior::class,
                'createdByAttribute' => 'created_by',
                'updatedByAttribute' => 'updated_by',
            ],
        ];
    }
    
    public function rules(): array
    {
        return [
            [['id'], 'string', 'max' => 36],
            [['created_at', 'updated_at'], 'safe'],
            [['created_by', 'updated_by'], 'string', 'max' => 36],
            [['is_deleted'], 'boolean'],
            [['deleted_at'], 'safe'],
        ];
    }
    
    public function beforeSave($insert): bool
    {
        if ($insert && empty($this->id)) {
            $this->id = Uuid::uuid4()->toString();
        }
        return parent::beforeSave($insert);
    }
    
    public function softDelete(): bool
    {
        $this->is_deleted = true;
        $this->deleted_at = date('Y-m-d H:i:s');
        return $this->save(false, ['is_deleted', 'deleted_at']);
    }
    
    public static function findActive(): \yii\db\ActiveQuery
    {
        return static::find()->where(['is_deleted' => false]);
    }
    
    public static function findByUuid(string $uuid): ?static
    {
        return static::findActive()->where(['id' => $uuid])->one();
    }

    public static function findOneForUpdate(array $condition): ?static
    {
        $command = static::find()->where($condition)->createCommand();
        return static::findBySql($command->getSql() . ' FOR UPDATE', $command->params)->one();
    }
    
    public function toArray(array $fields = [], array $expand = [], $recursive = true): array
    {
        $data = parent::toArray($fields, $expand, $recursive);
        
        // Format dates
        foreach (['created_at', 'updated_at', 'deleted_at'] as $dateField) {
            if (isset($data[$dateField]) && $data[$dateField]) {
                $data[$dateField] = Yii::$app->formatter->asDatetime($data[$dateField]);
            }
        }
        
        return $data;
    }
}