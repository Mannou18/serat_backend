import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Button, 
  Modal, 
  Form, 
  Select, 
  Input, 
  message, 
  Statistic,
  Descriptions,
  Space,
  Divider
} from 'antd';
import { 
  DollarOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useParams } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const CustomerInstallments = () => {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [paymentForm] = Form.useForm();
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });

  // Fetch customer installments
  const fetchCustomerInstallments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        ...filters
      });

      const response = await fetch(`/api/installments/customer/${customerId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        setInstallments(data.installments);
        setStats(data.stats);
      } else {
        message.error('Failed to fetch customer installments');
      }
    } catch (error) {
      console.error('Error fetching customer installments:', error);
      message.error('Error loading customer installments');
    } finally {
      setLoading(false);
    }
  };

  // Mark installment as paid
  const markAsPaid = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/installments/${selectedInstallment.venteId}/${selectedInstallment.installmentIndex}/paid`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        }
      );

      if (response.ok) {
        message.success('Payment recorded successfully');
        setPaymentModal(false);
        paymentForm.resetFields();
        fetchCustomerInstallments(); // Refresh data
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      message.error('Error recording payment');
    }
  };

  // Mark installment as unpaid
  const markAsUnpaid = async (installment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/installments/${installment.venteId}/${installment.installmentIndex}/unpaid`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        message.success('Installment marked as unpaid');
        fetchCustomerInstallments(); // Refresh data
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to update installment');
      }
    } catch (error) {
      console.error('Error updating installment:', error);
      message.error('Error updating installment');
    }
  };

  // Handle payment modal
  const showPaymentModal = (installment) => {
    setSelectedInstallment(installment);
    setPaymentModal(true);
  };

  // Get status color and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid':
        return {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: 'Payé'
        };
      case 'overdue':
        return {
          color: 'error',
          icon: <ExclamationCircleOutlined />,
          text: 'En retard'
        };
      case 'pending':
      default:
        return {
          color: 'processing',
          icon: <ClockCircleOutlined />,
          text: 'En attente'
        };
    }
  };

  // Get payment method text
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'card': return 'Carte';
      case 'transfer': return 'Virement';
      case 'check': return 'Chèque';
      default: return 'Non spécifié';
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Facture',
      dataIndex: 'venteInfo',
      key: 'venteInfo',
      render: (venteInfo) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {moment(venteInfo.createdAt).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Total: {parseFloat(venteInfo.totalAmount).toLocaleString('fr-FR')} DA
          </div>
        </div>
      )
    },
    {
      title: 'Articles',
      dataIndex: 'venteInfo',
      key: 'articles',
      render: (venteInfo) => (
        <div>
          {venteInfo.articles.map((art, idx) => (
            <div key={idx} style={{ fontSize: '12px' }}>
              {art.product} (x{art.quantity})
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Services',
      dataIndex: 'venteInfo',
      key: 'services',
      render: (venteInfo) => (
        <div>
          {venteInfo.services.map((srv, idx) => (
            <div key={idx} style={{ fontSize: '12px' }}>
              {srv.service}
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Échéance',
      dataIndex: 'installment',
      key: 'installment',
      render: (installment) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>
            {parseFloat(installment.amount).toLocaleString('fr-FR')} DA
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {moment(installment.dueDate).format('DD/MM/YYYY')}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.installment.dueDate) - new Date(b.installment.dueDate)
    },
    {
      title: 'Statut',
      dataIndex: 'installment',
      key: 'status',
      render: (installment) => {
        const config = getStatusConfig(installment.status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
      filters: [
        { text: 'En attente', value: 'pending' },
        { text: 'Payé', value: 'paid' },
        { text: 'En retard', value: 'overdue' }
      ],
      onFilter: (value, record) => record.installment.status === value
    },
    {
      title: 'Paiement',
      dataIndex: 'installment',
      key: 'payment',
      render: (installment) => {
        if (installment.status === 'paid') {
          return (
            <div>
              <div style={{ fontSize: '12px' }}>
                {installment.paymentDate ? moment(installment.paymentDate).format('DD/MM/YYYY') : ''}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {getPaymentMethodText(installment.paymentMethod)}
              </div>
            </div>
          );
        }
        return '-';
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isOverdue = record.installment.status === 'overdue';
        const isPending = record.installment.status === 'pending';
        
        return (
          <Space>
            {isPending && (
              <Button 
                type="primary" 
                size="small"
                onClick={() => showPaymentModal(record)}
              >
                Marquer payé
              </Button>
            )}
            {record.installment.status === 'paid' && (
              <Button 
                type="default" 
                size="small"
                onClick={() => markAsUnpaid(record)}
              >
                Marquer impayé
              </Button>
            )}
            {isOverdue && (
              <Button 
                type="primary" 
                danger
                size="small"
                onClick={() => showPaymentModal(record)}
              >
                Payer maintenant
              </Button>
            )}
          </Space>
        );
      }
    }
  ];

  // Load data on component mount
  useEffect(() => {
    if (customerId) {
      fetchCustomerInstallments();
    }
  }, [customerId, filters]);

  if (!customer) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, marginBottom: '8px' }}>
          Échéances du Client
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          Suivi des paiements en facilité pour {customer.name}
        </p>
      </div>

      {/* Customer Info */}
      <Card style={{ marginBottom: '24px' }}>
        <Descriptions title="Informations Client" bordered>
          <Descriptions.Item label="Nom" span={3}>
            <UserOutlined style={{ marginRight: '8px' }} />
            {customer.name}
          </Descriptions.Item>
          <Descriptions.Item label="Téléphone" span={3}>
            <PhoneOutlined style={{ marginRight: '8px' }} />
            {customer.phoneNumber}
          </Descriptions.Item>
          <Descriptions.Item label="CIN" span={3}>
            <IdcardOutlined style={{ marginRight: '8px' }} />
            {customer.cin}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Échéances"
              value={stats.totalPending + stats.totalPaid + stats.totalOverdue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="En Attente"
              value={stats.totalPending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Payées"
              value={stats.totalPaid}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="En Retard"
              value={stats.totalOverdue}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Financial Summary */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Montant Total"
              value={parseFloat(stats.totalAmount || 0).toLocaleString('fr-FR')}
              suffix="DA"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Montant Payé"
              value={parseFloat(stats.paidAmount || 0).toLocaleString('fr-FR')}
              suffix="DA"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Montant Restant"
              value={parseFloat(stats.remainingAmount || 0).toLocaleString('fr-FR')}
              suffix="DA"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Select
              placeholder="Filtrer par statut"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: '100%' }}
            >
              <Option value="all">Tous les statuts</Option>
              <Option value="pending">En attente</Option>
              <Option value="paid">Payées</Option>
              <Option value="overdue">En retard</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="Trier par"
              value={filters.sortBy}
              onChange={(value) => setFilters({ ...filters, sortBy: value })}
              style={{ width: '100%' }}
            >
              <Option value="dueDate">Date d'échéance</Option>
              <Option value="amount">Montant</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="Ordre"
              value={filters.sortOrder}
              onChange={(value) => setFilters({ ...filters, sortOrder: value })}
              style={{ width: '100%' }}
            >
              <Option value="asc">Croissant</Option>
              <Option value="desc">Décroissant</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Installments Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={installments}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} sur ${total} échéances`
          }}
        />
      </Card>

      {/* Payment Modal */}
      <Modal
        title="Enregistrer le Paiement"
        open={paymentModal}
        onCancel={() => {
          setPaymentModal(false);
          paymentForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={markAsPaid}
        >
          <Form.Item
            label="Méthode de paiement"
            name="paymentMethod"
            rules={[{ required: true, message: 'Veuillez sélectionner une méthode de paiement' }]}
          >
            <Select placeholder="Sélectionner une méthode">
              <Option value="cash">Espèces</Option>
              <Option value="card">Carte bancaire</Option>
              <Option value="transfer">Virement</Option>
              <Option value="check">Chèque</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <TextArea rows={3} placeholder="Notes optionnelles..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Enregistrer le paiement
              </Button>
              <Button onClick={() => {
                setPaymentModal(false);
                paymentForm.resetFields();
              }}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerInstallments; 