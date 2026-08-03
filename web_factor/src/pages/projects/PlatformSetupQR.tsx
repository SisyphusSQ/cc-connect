import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LeftOutlined,
  MobileOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Alert, Button, QRCode, Space, Spin, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  setupFeishuBegin,
  setupFeishuPoll,
  setupFeishuSave,
  setupWeixinBegin,
  setupWeixinPoll,
  setupWeixinSave,
} from '@/api/setup';
import { restartSystem } from '@/api/status';

type PlatformKind = 'feishu' | 'lark' | 'weixin';
type Phase = 'idle' | 'loading' | 'scanning' | 'scanned' | 'saving' | 'completed' | 'restarting' | 'expired' | 'denied' | 'error';

interface PlatformSetupQRProps {
  platformType: PlatformKind;
  projectName: string;
  workDir?: string;
  agentType?: string;
  onComplete: () => void;
  onCancel: () => void;
}

const sleep = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function PlatformSetupQR({
  platformType,
  projectName,
  workDir,
  agentType,
  onComplete,
  onCancel,
}: PlatformSetupQRProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('idle');
  const [qrUrl, setQrUrl] = useState('');
  const [error, setError] = useState('');
  const cancelledRef = useRef(false);
  const pollingRef = useRef(false);
  const feishuRef = useRef({ deviceCode: '', baseUrl: '', interval: 5 });
  const isFeishu = platformType === 'feishu' || platformType === 'lark';

  useEffect(() => () => {
    cancelledRef.current = true;
  }, []);

  const pollFeishu = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    while (!cancelledRef.current) {
      try {
        const response = await setupFeishuPoll(feishuRef.current.deviceCode, feishuRef.current.baseUrl || undefined);
        if (cancelledRef.current) break;
        if (response.base_url) feishuRef.current.baseUrl = response.base_url;
        if (response.slow_down) feishuRef.current.interval += 5;

        if (response.status === 'completed') {
          setPhase('saving');
          await setupFeishuSave({
            project: projectName,
            app_id: response.app_id!,
            app_secret: response.app_secret!,
            platform_type: response.platform || 'feishu',
            owner_open_id: response.owner_open_id,
            work_dir: workDir,
            agent_type: agentType,
          });
          setPhase('completed');
          break;
        }
        if (response.status === 'denied' || response.status === 'expired') {
          setPhase(response.status);
          break;
        }
        if (response.status === 'error') {
          setError(response.error || 'Unknown error');
          setPhase('error');
          break;
        }
      } catch (reason) {
        if (!cancelledRef.current) {
          setError(reason instanceof Error ? reason.message : String(reason));
          setPhase('error');
        }
        break;
      }
      await sleep(feishuRef.current.interval * 1000);
    }
    pollingRef.current = false;
  }, [agentType, projectName, workDir]);

  const startFeishu = useCallback(async () => {
    setPhase('loading');
    setError('');
    cancelledRef.current = false;
    pollingRef.current = false;
    try {
      const response = await setupFeishuBegin();
      feishuRef.current = { deviceCode: response.device_code, baseUrl: '', interval: response.interval || 5 };
      setQrUrl(response.qr_url);
      setPhase('scanning');
      void pollFeishu();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setPhase('error');
    }
  }, [pollFeishu]);

  const startWeixin = useCallback(async () => {
    setPhase('loading');
    setError('');
    cancelledRef.current = false;
    try {
      const response = await setupWeixinBegin();
      setQrUrl(response.qr_url);
      setPhase('scanning');
      let consecutiveErrors = 0;
      while (!cancelledRef.current) {
        try {
          const pollResponse = await setupWeixinPoll(response.qr_key);
          consecutiveErrors = 0;
          if (cancelledRef.current) break;
          if (pollResponse.status === 'scaned') setPhase('scanned');
          if (pollResponse.status === 'expired') {
            setPhase('expired');
            break;
          }
          if (pollResponse.status === 'confirmed') {
            setPhase('saving');
            await setupWeixinSave({
              project: projectName,
              token: pollResponse.bot_token!,
              base_url: pollResponse.base_url,
              ilink_bot_id: pollResponse.ilink_bot_id,
              ilink_user_id: pollResponse.ilink_user_id,
              work_dir: workDir,
              agent_type: agentType,
            });
            setPhase('completed');
            break;
          }
        } catch (reason) {
          consecutiveErrors += 1;
          if (consecutiveErrors >= 5) {
            setError(reason instanceof Error ? reason.message : String(reason));
            setPhase('error');
            break;
          }
        }
        await sleep(500);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setPhase('error');
    }
  }, [agentType, projectName, workDir]);

  const start = isFeishu ? startFeishu : startWeixin;
  const retry = () => {
    cancelledRef.current = false;
    pollingRef.current = false;
    void start();
  };
  const label = isFeishu ? t('setup.feishuLabel', 'Feishu / Lark') : t('setup.weixinLabel', 'WeChat');

  return (
    <Space orientation="vertical" align="center" size="large" style={{ width: '100%', paddingBlock: 16 }}>
      {phase === 'idle' && (
        <>
          <MobileOutlined style={{ fontSize: 48, color: 'var(--cc-color-text-tertiary)' }} />
          <Typography.Paragraph type="secondary" style={{ maxWidth: 360, textAlign: 'center' }}>
            {t('setup.qrDescription', { platform: label })}
          </Typography.Paragraph>
          <Button type="primary" onClick={() => void start()}>{t('setup.startQR', 'Start QR Setup')}</Button>
        </>
      )}

      {phase === 'loading' && <Spin size="large" description={t('setup.generating', 'Generating QR code...')} />}

      {['scanning', 'scanned', 'saving'].includes(phase) && (
        <>
          <QRCode value={qrUrl} size={220} errorLevel="M" bgColor="#ffffff" color="#0b0f0d" />
          <Spin
            description={phase === 'scanned'
              ? t('setup.scannedConfirm', 'Scanned. Confirm on your phone...')
              : phase === 'saving'
                ? t('setup.savingConfig', 'Saving configuration...')
                : isFeishu
                  ? t('setup.scanFeishu', 'Scan with Feishu / Lark')
                  : t('setup.scanWeixin', 'Scan with WeChat')}
          />
        </>
      )}

      {phase === 'completed' && (
        <>
          <CheckCircleOutlined style={{ fontSize: 52, color: 'var(--cc-color-success)' }} />
          <Typography.Text strong>{t('setup.completed', 'Platform connected successfully!')}</Typography.Text>
          <Typography.Text type="secondary">{t('setup.restartHint', 'Restart the service for the new platform to take effect.')}</Typography.Text>
          <Space>
            <Button onClick={onComplete}>{t('setup.later', 'Later')}</Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={async () => {
                setPhase('restarting');
                try {
                  await restartSystem();
                  window.setTimeout(onComplete, 3000);
                } catch (reason) {
                  setError(reason instanceof Error ? reason.message : String(reason));
                  setPhase('error');
                }
              }}
            >
              {t('setup.restartNow', 'Restart now')}
            </Button>
          </Space>
        </>
      )}

      {phase === 'restarting' && <Spin size="large" description={t('setup.restarting', 'Restarting service...')} />}

      {['expired', 'denied', 'error'].includes(phase) && (
        <>
          <CloseCircleOutlined style={{ fontSize: 52, color: 'var(--cc-color-error)' }} />
          <Alert
            type={phase === 'expired' ? 'warning' : 'error'}
            showIcon
            title={error || t(`setup.${phase}`, phase)}
          />
          <Button icon={<ReloadOutlined />} onClick={retry}>{t('setup.retry', 'Retry')}</Button>
        </>
      )}

      {!['completed', 'restarting'].includes(phase) && (
        <Button type="text" icon={<LeftOutlined />} onClick={() => {
          cancelledRef.current = true;
          onCancel();
        }}>
          {t('common.back')}
        </Button>
      )}
    </Space>
  );
}
