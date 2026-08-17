import { CaretDownOutlined, CaretUpOutlined, LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, InputNumber, Select, Space, Switch, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addPlatformToProject } from '@/api/projects';
import { validateCloudWebForm } from '@/lib/cloudWebFormValidation';
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
  const [form] = Form.useForm<Record<string, unknown>>();
  const initialValues = useMemo<Record<string, unknown>>(() => {
    if (platformType === 'cloud_web') return { transport: 'websocket' };
    if (platformType === 'tuitui') return { group_policy: 'allowlist', require_mention: true, history_limit: 50 };
    return {};
  }, [platformType]);
  const [formValues, setFormValues] = useState<Record<string, unknown>>(initialValues);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  if (!meta) {
    return <Alert type="warning" showIcon title={t('setup.unsupportedPlatform', { type: platformType })} />;
  }

  const currentValues = { ...initialValues, ...formValues };
  const fieldVisible = (field: FieldDef) => {
    if (!field.showWhen) return true;
    return Object.entries(field.showWhen).every(([dependency, allowed]) => allowed.includes(String(currentValues[dependency] ?? '')));
  };
  const visibleFields = (fields: FieldDef[]) => fields.filter(fieldVisible);
  const basicFields = visibleFields(meta.fields.filter((field) => field.group !== 'advanced'));
  const advancedFields = visibleFields(meta.fields.filter((field) => field.group === 'advanced'));

  const handleFinish = async (values: Record<string, unknown>) => {
    const missing = meta.fields.filter((field) => fieldVisible(field) && field.required && !values[field.key]);
    if (missing.length > 0) {
      setError(`${missing.map((field) => t(field.labelKey)).join(', ')} required`);
      return;
    }
    if (platformType === 'cloud_web') {
      const issue = validateCloudWebForm(values);
      if (issue) {
        const field = issue.fieldLabelKey ? t(issue.fieldLabelKey) : undefined;
        setError(t(issue.messageKey, field ? { field } : undefined));
        return;
      }
    }
    setSaving(true);
    setError('');
    try {
      const options = Object.fromEntries(
        meta.fields
          .filter(fieldVisible)
          .map((field) => [field.key, values[field.key]])
          .filter(([, value]) => value !== undefined && value !== ''),
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
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={initialValues}
        onValuesChange={(_, allValues) => setFormValues(allValues as Record<string, unknown>)}
        onFinish={handleFinish}
      >
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
      <Form.Item name={field.key} label={label} valuePropName="checked" extra={extra}>
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

  if (field.type === 'select') {
    return (
      <Form.Item name={field.key} label={label} rules={rules} extra={extra}>
        <Select options={(field.options || []).map((value) => ({ value, label: value }))} />
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
