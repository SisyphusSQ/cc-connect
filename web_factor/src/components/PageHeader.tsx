import { Flex, Space, Typography } from 'antd';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  extra?: React.ReactNode;
}

export default function PageHeader({ title, description, extra }: PageHeaderProps) {
  return (
    <Flex className="cc-page-header" justify="space-between" align="flex-start" gap="middle" wrap>
      <Space orientation="vertical" size={2}>
        <Typography.Title level={2}>{title}</Typography.Title>
        {description && <Typography.Text type="secondary">{description}</Typography.Text>}
      </Space>
      {extra}
    </Flex>
  );
}
