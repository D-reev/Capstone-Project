import React from 'react';
import { Modal, Descriptions, Tag, Typography, Divider, Card, Empty } from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TagOutlined,
  SwapOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import './Modal.css';

const { Title, Text, Paragraph } = Typography;

const LogDetailsModal = ({ open, onClose, log }) => {
  if (!log) return null;

  const getTypeColor = (type) => {
    const colors = {
      'CREATE': 'success',
      'UPDATE': 'processing',
      'DELETE': 'error',
      'LOGIN': 'cyan',
      'LOGOUT': 'default',
      'ACCESS_DENIED': 'error',
      'LOGIN_FAILED': 'warning',
    };
    return colors[type] || 'default';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderChanges = () => {
    if (!log.changes || Object.keys(log.changes).length === 0) {
      return <Empty description="No changes recorded" />;
    }

    return (
      <div style={{ marginTop: '16px' }}>
        {Object.entries(log.changes).map(([field, change]) => (
          <Card
            key={field}
            size="small"
            style={{ marginBottom: '12px' }}
            title={
              <span>
                <SwapOutlined style={{ marginRight: '8px' }} />
                {field}
              </span>
            }
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Text type="secondary" strong>From:</Text>
                <div style={{
                  padding: '8px',
                  background: '#fff1f0',
                  border: '1px solid #ffccc7',
                  borderRadius: '4px',
                  marginTop: '4px',
                  wordBreak: 'break-word'
                }}>
                  <Text type="danger">{formatValue(change.from)}</Text>
                </div>
              </div>
              <div style={{ fontSize: '20px', color: '#1890ff' }}>→</div>
              <div style={{ flex: 1 }}>
                <Text type="secondary" strong>To:</Text>
                <div style={{
                  padding: '8px',
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '4px',
                  marginTop: '4px',
                  wordBreak: 'break-word'
                }}>
                  <Text type="success">{formatValue(change.to)}</Text>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderDataSection = (title, data, color) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <Card
        size="small"
        style={{ marginTop: '16px' }}
        title={title}
        headStyle={{ backgroundColor: color, fontWeight: 'bold' }}
      >
        <pre style={{
          background: '#f5f5f5',
          padding: '12px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px',
          margin: 0,
          fontSize: '13px'
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <span>Activity Log Details</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      style={{ top: 20 }}
    >
      <Divider style={{ margin: '16px 0' }} />

      {/* Primary Information */}
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item
          label={
            <span>
              <TagOutlined /> Type
            </span>
          }
        >
          <Tag color={getTypeColor(log.type)}>{log.type}</Tag>
        </Descriptions.Item>
        
        <Descriptions.Item
          label={
            <span>
              <ClockCircleOutlined /> Timestamp
            </span>
          }
        >
          {new Date(log.timestamp).toLocaleString()}
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <span>
              <UserOutlined /> User
            </span>
          }
        >
          <div>
            <Text strong>{log.userName || 'N/A'}</Text>
            <br />
            <Tag color="blue" size="small">{log.userRole || 'N/A'}</Tag>
          </div>
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <span>
              <InfoCircleOutlined /> Resource
            </span>
          }
        >
          <Tag color="cyan">{log.resource}</Tag>
          {log.resourceId && (
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ID: {log.resourceId}
              </Text>
            </div>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Action" span={2}>
          <Text strong style={{ fontSize: '14px' }}>
            {log.action}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      {/* Changes Section */}
      {log.type === 'UPDATE' && (
        <>
          <Divider orientation="left">
            <Title level={5} style={{ margin: 0 }}>
              <SwapOutlined /> Changes Made
            </Title>
          </Divider>
          {renderChanges()}
        </>
      )}

      {/* Old Data Section */}
      {log.oldData && renderDataSection(
        '📋 Previous Data',
        log.oldData,
        '#fff1f0'
      )}

      {/* New Data Section */}
      {log.newData && renderDataSection(
        '📄 New Data',
        log.newData,
        '#f6ffed'
      )}

      {/* Metadata Section */}
      {log.metadata && Object.keys(log.metadata).length > 0 && renderDataSection(
        '🔍 Additional Information',
        log.metadata,
        '#e6f7ff'
      )}
    </Modal>
  );
};

export default LogDetailsModal;
