'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Tooltip,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Typography,
  Card,
  Row,
  Col,
  Select,
  Tag,
  Image,
  Avatar
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  LinkOutlined,
  UndoOutlined
} from '@ant-design/icons'
import { ColumnType } from 'antd/es/table'
import { License, GetLicensesParams } from '@/types/license'
import {
  getLicenses,
  createLicense,
  updateLicense,
  deleteLicense
} from '@/api/admin/licenses'
import { getImageLink } from '@/lib/link'
import useDebounce from '@/hooks/use-debounce'

const { Title } = Typography
const { Option } = Select

interface LicenseFormData {
  name: string
  code: string
  description: string
  thumbnail?: string
  link?: string
  is_active: boolean
}

export default function LicensePage() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('true')

  // Modal 状态
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Form 实例
  const [form] = Form.useForm<LicenseFormData>()
  const [searchForm] = Form.useForm()
  const [expandSearch, setExpandSearch] = useState(false)

  // 防抖搜索
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // 获取许可证列表
  const fetchLicenses = async () => {
    setLoading(true)
    try {
      const params: GetLicensesParams = {
        page: currentPage,
        pageSize,
        searchTerm: debouncedSearchTerm,
        ...(activeFilter && {
          isActive: activeFilter === 'true'
        })
      }

      const response = await getLicenses(params)
      if (response.success && response.data) {
        // @ts-ignore - Type mismatch between API response and expected structure
        setLicenses(response.data.data || [])
        // @ts-ignore
        setTotal(response.data.count || 0)
      }
    } catch (error) {
      message.error('Failed to fetch licenses')
      console.error('Error fetching licenses:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始化数据和防抖搜索效果
  useEffect(() => {
    fetchLicenses()
  }, [currentPage, pageSize, debouncedSearchTerm, activeFilter])

  // 表单变化处理
  const handleFormChange = (changedValues: any, allValues: any) => {
    if ('searchTerm' in changedValues) {
      setSearchTerm(allValues.searchTerm || '')
    }
    if ('isActive' in changedValues) {
      setActiveFilter(allValues.isActive || '')
    }
    setCurrentPage(1)
  }

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields()
    setSearchTerm('')
    setActiveFilter('true')
    setCurrentPage(1)
  }

  // 打开新增/编辑弹窗
  const openModal = (license?: License) => {
    setEditingLicense(license || null)
    setIsModalVisible(true)

    if (license) {
      form.setFieldsValue({
        name: license.name,
        code: license.code,
        description: license.description,
        thumbnail: license.thumbnail || '',
        link: license.link || '',
        is_active: license.is_active
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ is_active: true })
    }
  }

  // 关闭弹窗
  const closeModal = () => {
    setIsModalVisible(false)
    setEditingLicense(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setModalLoading(true)

      const licenseData = {
        name: values.name,
        code: values.code,
        description: values.description,
        thumbnail: values.thumbnail || null,
        link: values.link || null,
        is_active: values.is_active
      }

      if (editingLicense) {
        await updateLicense(editingLicense.id, licenseData)
        message.success('License updated successfully')
      } else {
        await createLicense(licenseData)
        message.success('License created successfully')
      }

      closeModal()
      fetchLicenses()
    } catch (error) {
      message.error(editingLicense ? 'Failed to update' : 'Failed to create')
      console.error('Error saving license:', error)
    } finally {
      setModalLoading(false)
    }
  }

  // Delete license
  const handleDelete = async (id: string) => {
    try {
      await deleteLicense(id)
      message.success('License deleted successfully')
      fetchLicenses()
    } catch (error) {
      message.error('Failed to delete')
      console.error('Error deleting license:', error)
    }
  }

  // Table column definitions
  const columns: ColumnType<License>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      fixed: 'left',
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>
    },
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      width: 105,
      render: (thumbnail: string) =>
        thumbnail ? (
          <Image
            src={getImageLink(thumbnail) || ''}
            alt="License thumbnail"
            className="object-cover"
          />
        ) : (
          <div className="flex w-full items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-gray-400">
            No Image
          </div>
        )
    },
    {
      title: 'Code',
      dataIndex: 'code',
      width: 160,
      key: 'code',
      render: (code: string) => <Typography.Text code>{code}</Typography.Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: {
        showTitle: false
      },
      width: 300,
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          {description}
        </Tooltip>
      )
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      width: 100,
      render: (link: string) =>
        link ? (
          <Button
            type="link"
            size="small"
            href={link}
            target="_blank"
            icon={<LinkOutlined />}
          >
            View
          </Button>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('en-US')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this license?"
            description="This action cannot be undone"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ size: 'small' }}
            cancelButtonProps={{ size: 'small' }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-6 flex items-start justify-between">
        {/* Left: Title and Description */}
        <div>
          <Title level={3} className="mb-1">
            License Management
          </Title>
          <Typography.Text type="secondary">
            Manage software licenses and their properties
          </Typography.Text>
        </div>

        {/* Right: Action Buttons */}
        <Space size="middle">
          <Button
            onClick={handleReset}
            icon={<UndoOutlined />}
            size="small"
            title="Reset Filters"
          />
          <Button
            onClick={fetchLicenses}
            icon={<ReloadOutlined />}
            loading={loading}
            size="small"
            title="Refresh Data"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
            size="small"
          >
            Add License
          </Button>
        </Space>
      </div>

      {/* Search Section */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <Form
          form={searchForm}
          name="license_search"
          initialValues={{ isActive: 'true' }}
          onValuesChange={handleFormChange}
        >
          <Row gutter={16} align="bottom">
            <Col span={6}>
              <Form.Item name="searchTerm" label="Search" className="mb-0">
                <Input
                  placeholder="License name or code"
                  allowClear
                  size="small"
                  prefix={<SearchOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="isActive" label="Status" className="mb-0">
                <Select placeholder="All" allowClear size="small">
                  <Option value="true">Active</Option>
                  <Option value="false">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={licenses}
        rowKey="id"
        size="small"
        loading={loading}
        bordered={true}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `${total} items`,
          onChange: (page, size) => {
            setCurrentPage(page)
            setPageSize(size || 10)
          }
        }}
        scroll={{ x: 500 }}
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editingLicense ? 'Edit License' : 'Add License'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={modalLoading}
        width={600}
        okButtonProps={{ size: 'small' }}
        cancelButtonProps={{ size: 'small' }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="License Name"
            rules={[{ required: true, message: 'Please enter license name' }]}
          >
            <Input placeholder="e.g. MIT License" size="small" />
          </Form.Item>

          <Form.Item
            name="code"
            label="License Code"
            rules={[
              { required: true, message: 'Please enter license code' },
              {
                pattern: /^[a-z0-9-]+$/,
                message:
                  'Code can only contain lowercase letters, numbers and hyphens'
              }
            ]}
          >
            <Input placeholder="e.g. mit" size="small" />
          </Form.Item>

          <Form.Item
            name="description"
            label="License Description"
            rules={[
              { required: true, message: 'Please enter license description' }
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe the features and usage of this license"
              size="small"
            />
          </Form.Item>

          <Form.Item name="thumbnail" label="Thumbnail URL">
            <Input
              placeholder="License icon URL (optional)"
              prefix={<LinkOutlined />}
              size="small"
            />
          </Form.Item>

          <Form.Item name="link" label="License Link">
            <Input
              placeholder="License detailed information link (optional)"
              prefix={<LinkOutlined />}
              size="small"
            />
          </Form.Item>

          <Form.Item name="is_active" label="Status" valuePropName="checked">
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              size="small"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
