import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Table, Alert, Row, Col, Typography, Space,
  Button, Select, message, Input, Tooltip, Badge, Tag, Avatar, DatePicker
} from "antd";
import {
  EditOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, PlusOutlined,
  SearchOutlined, ExclamationCircleOutlined, CloseOutlined,
  TableOutlined, UserOutlined, ClockCircleOutlined, BugOutlined,
  FlagOutlined, MessageOutlined, SolutionOutlined
} from "@ant-design/icons";
// Tickets live in the shared ticket store: this month's 24 (the same list the
// Dashboard's DCIM tab counts — every one about a real 5D View asset) plus any
// raised since, e.g. automatically by a failure in the 5D View simulation.
import { ticketStore, useTicketStore, TECHNICIANS } from "../Component/Tickets/ticketStore";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const CATEGORIES = ['Hardware', 'Software', 'Network', 'Security', 'Database', 'Application', 'Power', 'Cooling'];

const TicketManagement = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);
  const [error, setError] = useState(null);

  const [technicians] = useState(TECHNICIANS);

  const tickets = useTicketStore(s => s.tickets);
  const location = useLocation();
  const focusNo = new URLSearchParams(location.search).get('focus');

  const emptyForm = { title: '', description: '', category: '', priority: 'Medium', assignedTo: null };
  const [formData, setFormData] = useState(emptyForm);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  // Opened from a ticket pop-up ("Open in Ticket Management"): show that ticket.
  useEffect(() => { if (focusNo) setSearchText(focusNo); }, [focusNo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingTicket(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title, description: ticket.description || '',
      category: ticket.category, priority: ticket.priority,
      assignedTo: ticket.assignedTo
    });
    setShowModal(true);
  };

  const openDeleteModal = (ticket) => { setTicketToDelete(ticket); setShowDeleteModal(true); };
  const closeModal = () => setShowModal(false);
  const closeDeleteModal = () => { setShowDeleteModal(false); setTicketToDelete(null); };

  const handleDelete = () => {
    if (ticketToDelete) {
      ticketStore.deleteTicket(ticketToDelete.ticketNo);
      message.success('Ticket deleted!');
      closeDeleteModal();
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.category || !formData.priority) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const payload = {
        title: formData.title, description: formData.description,
        category: formData.category, priority: formData.priority,
        status: editingTicket ? editingTicket.status : 'Open',
        assignedTo: formData.assignedTo,
        createdBy: editingTicket ? editingTicket.createdBy : 'Current User',
        createdDate: editingTicket ? editingTicket.createdDate : new Date().toISOString().split('T')[0]
      };
      
      if (editingTicket) {
        const { title, description, category, priority, assignedTo } = payload;
        ticketStore.updateTicket(editingTicket.ticketNo, { title, description, category, priority, assignedTo: assignedTo || null });
        message.success('Ticket updated!');
      } else {
        ticketStore.createTicket(payload);
        message.success('Ticket created!');
      }
      setLoading(false);
      closeModal();
    }, 500);
  };

  const handleStatusChange = (ticket, newStatus) => {
    ticketStore.updateTicket(ticket.ticketNo, { status: newStatus });
    message.success(`Status updated to ${newStatus}`);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Urgent': return '#ff4d4f';
      case 'High': return '#fa8c16';
      case 'Medium': return '#faad14';
      case 'Low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '#1890ff';
      case 'In Progress': return '#722ed1';
      case 'Resolved': return '#52c41a';
      case 'Closed': return '#8c8c8c';
      default: return '#d9d9d9';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const s = searchText.toLowerCase();
    const matchSearch = !s || ticket.ticketNo.toLowerCase().includes(s) || ticket.title.toLowerCase().includes(s) || ticket.createdBy.toLowerCase().includes(s);
    const matchStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'Open').length;
  const urgentTickets = tickets.filter(t => t.priority === 'Urgent' && t.status !== 'Closed').length;

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50, sorter: (a,b) => a.id - b.id },
    {
      title: 'Ticket No', dataIndex: 'ticketNo', key: 'ticketNo', width: 90,
      render: (text) => <Tag color="purple" style={{ fontSize: 11 }}>{text}</Tag>,
    },
    {
      title: 'Title', dataIndex: 'title', key: 'title', width: 200,
      render: (text, record) => (
        <Tooltip title={text}>
          <Space size={5}>
            <BugOutlined style={{ color: getPriorityColor(record.priority), fontSize: 12 }} />
            {record.source === 'simulation' && <Tag color="red" style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>5D SIM</Tag>}
            {record.source === 'alarm' && <Tag color="orange" style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>ALARM</Tag>}
            <Text style={{ fontSize: 12 }}>{text.length > 40 ? text.substring(0,40) + '…' : text}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category', width: 100,
      render: (text) => <Tag style={{ fontSize: 11 }}>{text}</Tag>,
    },
    {
      title: 'Priority', dataIndex: 'priority', key: 'priority', width: 80,
      render: (text) => <Badge color={getPriorityColor(text)} text={<span style={{ fontSize: 11 }}>{text}</span>} />,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (text) => <Badge status={text === 'Open' ? 'processing' : text === 'Resolved' ? 'success' : 'default'} text={<span style={{ fontSize: 11 }}>{text}</span>} />,
    },
    {
      title: 'Created By', dataIndex: 'createdBy', key: 'createdBy', width: 100,
      render: (text) => <Text style={{ fontSize: 11 }}>{text}</Text>,
    },
    {
      title: 'Assigned To', dataIndex: 'assignedTo', key: 'assignedTo', width: 100,
      render: (text) => text ? <Text style={{ fontSize: 11 }}>{text}</Text> : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
    },
    {
      title: 'Date', dataIndex: 'createdDate', key: 'createdDate', width: 90,
      render: (text) => <Text style={{ fontSize: 11 }}>{text}</Text>,
    },
    {
      title: 'Actions', key: 'actions', width: 150, fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="View / reassign">
            <Button type="text" size="small" icon={<SolutionOutlined />} onClick={() => ticketStore.view(record.ticketNo)} style={{ color: '#7c3aed', padding: '0 4px' }} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ color: '#1890ff', padding: '0 4px' }} />
          </Tooltip>
          {record.status !== 'Closed' && (
            <Select size="small" value={record.status} onChange={(val) => handleStatusChange(record, val)} style={{ width: 90, fontSize: 11 }}>
              {STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          )}
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => openDeleteModal(record)} style={{ color: '#ff4d4f', padding: '0 4px' }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const backdropStyle = { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000 };
  const taStyle = { width:'100%', border:'1px solid #d9d9d9', borderRadius:6, padding:'6px 10px', fontSize:12, resize:'vertical', fontFamily:'inherit', outline:'none', minHeight:62, boxSizing:'border-box' };

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', backgroundColor:'#f0f2f5', padding:'10px 16px', boxSizing:'border-box', overflow:'hidden' }}>

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexShrink:0 }}>
        <div>
          <Title level={4} style={{ margin:0, lineHeight:1.3 }}>
            <SolutionOutlined style={{ marginRight:8, color:'#1890ff' }}/>
            5D View Tickets
          </Title>
          <Text type="secondary" style={{ fontSize:12 }}>Tickets raised from the 5D View, including failures from the simulation</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined/>} onClick={openAddModal} size="small"
            style={{ background:'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border:'none' }}>
            Create Ticket
          </Button>
          <Button icon={<ReloadOutlined/>} size="small" onClick={()=>window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {error && <Alert message={error} type="error" showIcon closable onClose={()=>setError(null)} style={{ marginBottom:6, padding:'4px 12px', fontSize:12, flexShrink:0 }}/>}

      {/* STAT CARDS */}
      <Row gutter={10} style={{ marginBottom:8, flexShrink:0 }}>
        {[
          { label:'Total Tickets', value:totalTickets, color:'#1890ff', icon:<TableOutlined/> },
          { label:'Open', value:openTickets, color:'#1890ff', icon:<BugOutlined/> },
          { label:'Urgent', value:urgentTickets, color:'#ff4d4f', icon:<FlagOutlined/> },
        ].map(({ label, value, color, icon }) => (
          <Col key={label} span={8}>
            <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 14px', borderTop:`3px solid ${color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22, color }}>{icon}</span>
              <div>
                <div style={{ fontSize:11, color:'#888', lineHeight:1.3 }}>{label}</div>
                <div style={{ fontSize:22, fontWeight:700, color, lineHeight:1.2 }}>{value}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* FILTERS */}
      <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 12px', marginBottom:8, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8} lg={8}>
            <Input
              placeholder="Search by ticket #, title, user..."
              prefix={<SearchOutlined style={{ color:'#bbb' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear size="small"
            />
          </Col>
          <Col xs={24} sm={6} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width:'100%' }} placeholder="Status">
              <Option value="all">All Status</Option>
              {STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4} lg={4}>
            <Select value={priorityFilter} onChange={setPriorityFilter} size="small" style={{ width:'100%' }} placeholder="Priority">
              <Option value="all">All Priorities</Option>
              {PRIORITIES.map(p => <Option key={p} value={p}>{p}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={8} style={{ textAlign:'right' }}>
            <Text style={{ fontSize:12, color:'#888' }}>Showing {filteredTickets.length} of {totalTickets}</Text>
          </Col>
        </Row>
      </div>

      {/* TABLE */}
      <div style={{ flex:1, backgroundColor:'white', borderRadius:6, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
        <div style={{ padding:'7px 14px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <Text strong style={{ fontSize:13 }}>Tickets List</Text>
          <Badge count={filteredTickets.length} style={{ backgroundColor:'#1890ff' }}/>
        </div>
        <div style={{ flex:1, overflow:'auto', minHeight:0 }}>
          <Table
            columns={columns} dataSource={filteredTickets} loading={loading}
            bordered={false} rowKey="id" size="small"
            scroll={{ x:1000 }}
            onRow={(r) => (r.ticketNo === focusNo ? { style: { background: '#fff7e6' } } : {})}
            pagination={{ pageSize:6, showSizeChanger:false, showTotal:total=>`${total} tickets`, size:'small', style:{ padding:'5px 14px', margin:0 } }}
            style={{ fontSize:12 }}
            locale={{ emptyText: <div style={{ padding:'12px 0', textAlign:'center', color:'#999', fontSize:13 }}>No tickets found</div> }}
          />
        </div>
      </div>


      {/* ADD / EDIT MODAL */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)', backgroundColor:'white', padding:'20px 24px', borderRadius:10, width:'600px', maxWidth:'96%', maxHeight:'85vh', overflowY:'auto', zIndex:1001, boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ margin:0, color:'#1890ff', fontSize:16 }}>
                {editingTicket ? `Edit Ticket: ${editingTicket.ticketNo}` : 'Create New Ticket'}
              </h3>
              <Button type="text" icon={<CloseOutlined/>} onClick={closeModal} style={{ color:'#666' }}/>
            </div>

            <Row gutter={12} style={{ marginBottom:12 }}>
              <Col span={24}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Title <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Brief title of the issue" size="small"/>
              </Col>
            </Row>

            <Row gutter={12} style={{ marginBottom:12 }}>
              <Col span={24}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Detailed description of the problem..." style={taStyle}/>
              </Col>
            </Row>

            <Row gutter={12} style={{ marginBottom:12 }}>
              <Col span={8}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Category <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select category" style={{ width:'100%' }} size="small" value={formData.category||undefined} onChange={v=>handleSelectChange('category',v)}>
                  {CATEGORIES.map(c=><Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Priority <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select priority" style={{ width:'100%' }} size="small" value={formData.priority} onChange={v=>handleSelectChange('priority',v)}>
                  {PRIORITIES.map(p=><Option key={p} value={p}>{p}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Assign To</label>
                <Select placeholder="Assign technician" style={{ width:'100%' }} size="small" value={formData.assignedTo} onChange={v=>handleSelectChange('assignedTo',v)} allowClear>
                  {technicians.map(t=><Option key={t.id} value={t.name}>{t.name} ({t.dept})</Option>)}
                </Select>
              </Col>
            </Row>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" onClick={handleSubmit} loading={loading} icon={editingTicket?<EditOutlined/>:<PlusOutlined/>}>
                {loading ? 'Saving...' : (editingTicket ? 'Update Ticket' : 'Create Ticket')}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && ticketToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)', backgroundColor:'white', padding:'24px', borderRadius:8, width:'400px', maxWidth:'90%', zIndex:1001, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', textAlign:'center' }}>
            <ExclamationCircleOutlined style={{ fontSize:42, color:'#ff4d4f', marginBottom:10 }}/>
            <h3 style={{ color:'#ff4d4f', marginBottom:6 }}>Delete Ticket</h3>
            <p style={{ fontSize:14, marginBottom:10 }}>Are you sure you want to delete this ticket?</p>
            <div style={{ backgroundColor:'#f5f5f5', padding:12, borderRadius:4, marginBottom:12, textAlign:'left', fontSize:13 }}>
              {[
                ['Ticket No', ticketToDelete.ticketNo],
                ['Title', ticketToDelete.title],
                ['Priority', ticketToDelete.priority],
                ['Status', ticketToDelete.status]
              ].map(([k,v])=><p key={k} style={{ margin:'3px 0' }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color:'#ff7875', fontSize:12, marginBottom:16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined/>}>Delete Ticket</Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

export default TicketManagement;