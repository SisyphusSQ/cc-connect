import { CaretDownOutlined, CaretUpOutlined, LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, InputNumber, Space, Switch, Typography } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addPlatformToProject } from '@/api/projects';
import { platformMeta, type FieldDef } from '@/lib/platformMeta';

interface PlatformManualFormProps {
  platformType: string;
  projectName: string;
  workDir?: string;
  agentType?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function PlatformManualForm({
  platformType,
  projectName,
  workDir,
  agentType,
  onComplete,
  onCancel,
}: PlatformManualFormProps) {
  const { t } = useTranslation();
  const meta = platformMeta[platformType];
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!meta) {
    return <Alert type="warning" showIcon title={t('setup.unsupportedPlatform', { type: platformType })} />;
  }

  const basicFields = meta.fields.filter((field) => field.group !== 'advanced');
  const advancedFields = meta.fields.filter((field) => field.group === 'advanced');

  const handleFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      const options = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== undefined && value !== '' && value !== false),
      );
      await addPlatformToProject(projectName, {
        type: platformType,
        options,
        work_dir: workDir,
        agent_type: agentType,
      });
      onComplete();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Typography.Title level={4}>{meta.label}</Typography.Title>
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
      <Form layout="vertical" requiredMark="optional" onFinish={handleFinish}>
        {basicFields.map((field) => <PlatformField key={field.key} field={field} />)}
        {advancedFields.length > 0 && (
          <Button
            type="text"
            icon={showAdvanced ? <CaretUpOutlined /> : <CaretDownOutlined />}
            onClick={() => setShowAdvanced((value) => !value)}
            style={{ marginBottom: showAdvanced ? 12 : 20 }}
          >
            {t('setup.advancedOptions', 'Advanced options')} ({advancedFields.length})
          </Button>
        )}
        {showAdvanced && advancedFields.map((field) => <PlatformField key={field.key} field={field} />)}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button icon={<LeftOutlined />} onClick={onCancel}>{t('common.back')}</Button>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={saving}>
            {t('setup.addPlatform', 'Add platform')}
          </Button>
        </Space>
      </Form>
    </div>
  );
}

function PlatformField({ field }: { field: FieldDef }) {
  const { t } = useTranslation();
  const label = t(field.labelKey);
  const rules = field.required ? [{ required: true, message: `${label} is required` }] : undefined;
  const extra = field.hintKey ? t(field.hintKey) : undefined;

  if (field.type === 'boolean') {
    return (
      <Form.Item name={field.key} label={label} valuePropName="checked" extra={extra} initialValue={false}>
        <Switch />
      </Form.Item>
    );
  }

  if (field.type === 'number') {
    return (
      <Form.Item name={field.key} label={label} rules={rules} extra={extra}>
        <InputNumber style={{ width: '100%' }} placeholder={field.placeholder} />
      </Form.Item>
    );
  }

  return (
    <Form.Item name={field.key} label={label} rules={rules} extra={extra}>
      {field.type === 'password'
        ? <Input.Password placeholder={field.placeholder} />
        : <Input placeholder={field.placeholder} />}
    </Form.Item>
  );
}
