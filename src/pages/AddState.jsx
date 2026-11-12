// // AddState.jsx
// import React, { useState } from 'react';
// import {
//   Typography, Row, Col, Table, Tag, Space, Button, Select,
//   Input, Badge, Tooltip, Switch, message, Divider, Avatar
// } from 'antd';
// import {
//   EnvironmentOutlined, SearchOutlined, PlusOutlined, ReloadOutlined,
//   CloseOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
//   StopOutlined, EditOutlined, DeleteOutlined, GlobalOutlined
// } from '@ant-design/icons';

// const { Title, Text } = Typography;
// const { Option } = Select;

// const AddState = () => {
//   const countriesList = [
//     { id:1,  name:'United States',  code:'USA' },
//     { id:2,  name:'United Kingdom', code:'GBR' },
//     { id:3,  name:'India',          code:'IND' },
//     { id:4,  name:'Germany',        code:'DEU' },
//     { id:5,  name:'Japan',          code:'JPN' },
//     { id:6,  name:'Canada',         code:'CAN' },
//     { id:7,  name:'Australia',      code:'AUS' },
//     { id:8,  name:'France',         code:'FRA' },
//     { id:9,  name:'Brazil',         code:'BRA' },
//     { id:10, name:'Mexico',         code:'MEX' },
//   ];

//   const [states, setStates] = useState([
//     { id:1, name:'California',     statusCode:'CA',  countryId:1, countryName:'United States', capital:'Sacramento', timezone:'UTC-8 / UTC-7',   status:'Active',   regDate:'2024-01-15 09:30 AM' },
//     { id:2, name:'Texas',          statusCode:'TX',  countryId:1, countryName:'United States', capital:'Austin',     timezone:'UTC-6 / UTC-5',   status:'Active',   regDate:'2024-02-20 11:15 AM' },
//     { id:3, name:'Ontario',        statusCode:'ON',  countryId:6, countryName:'Canada',        capital:'Toronto',    timezone:'UTC-5 / UTC-4',   status:'Active',   regDate:'2024-03-10 02:45 PM' },
//     { id:4, name:'Bavaria',        statusCode:'BY',  countryId:4, countryName:'Germany',       capital:'Munich',     timezone:'UTC+1 / UTC+2',   status:'Active',   regDate:'2024-04-05 09:20 AM' },
//     { id:5, name:'Maharashtra',    statusCode:'MH',  countryId:3, countryName:'India',         capital:'Mumbai',     timezone:'UTC+5:30',         status:'Inactive', regDate:'2024-05-12 04:30 PM' },
//     { id:6, name:'New South Wales',statusCode:'NSW', countryId:7, countryName:'Australia',     capital:'Sydney',     timezone:'UTC+10 / UTC+11', status:'Active',   regDate:'2024-06-18 10:00 AM' },
//     { id:7, name:'Tokyo Metropolis',stateCode:'13',  countryId:5, countryName:'Japan',         capital:'Tokyo',      timezone:'UTC+9',            status:'Active',   regDate:'2024-07-22 01:30 PM' },
//   ]);

//   const emptyForm = { name:'',statusCode:'', countryId:'', capital:'', timezone:'', status:true };

//   const [formData, setFormData]               = useState(emptyForm);
//   const [searchTerm, setSearchTerm]           = useState('');
//   const [countryFilter, setCountryFilter]     = useState('all');
//   const [statusFilter, setStatusFilter]       = useState('all');
//   const [showFormModal, setShowFormModal]     = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [editingState, setEditingState]       = useState(null);
//   const [stateToDelete, setStateToDelete]     = useState(null);
//   const [loading, setLoading]                 = useState(false);
//   const [sortedInfo, setSortedInfo]           = useState({ columnKey:'id', order:'ascend' });

//   // ── Computed ─────────────────────────────────────────────────────────────
//   const uniqueCountries = [...new Map(states.map(s => [s.countryId, { id:s.countryId, name:s.countryName }])).values()];
//   const totalCount      = states.length;
//   const activeCount     = states.filter(s => s.status === 'Active').length;
//   const inactiveCount   = states.filter(s => s.status !== 'Active').length;
//   const countryCount    = new Set(states.map(s => s.countryId)).size;

//   const filteredStates = states.filter(s => {
//     const q = searchTerm.toLowerCase();
//     const matchSearch = !searchTerm ||
//       s.name.toLowerCase().includes(q) ||
//       s.stateCode.toLowerCase().includes(q) ||
//       s.capital.toLowerCase().includes(q) ||
//       s.countryName.toLowerCase().includes(q);
//     const matchCountry = countryFilter === 'all' || s.countryId === countryFilter;
//     const matchStatus  = statusFilter  === 'all' || s.status === statusFilter;
//     return matchSearch && matchCountry && matchStatus;
//   });

//   // ── Handlers ─────────────────────────────────────────────────────────────
//   const handleInputChange  = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
//   const handleStatusToggle = (checked) => setFormData(prev => ({ ...prev, status: checked }));

//   const openAddModal    = () => { setEditingState(null); setFormData(emptyForm); setShowFormModal(true); };
//   const openEditModal   = (s) => { setEditingState(s); setFormData({ name:s.name,statusCode:s.stateCode, countryId:s.countryId, capital:s.capital, timezone:s.timezone||'', status:s.status==='Active' }); setShowFormModal(true); };
//   const closeModal      = () => { setShowFormModal(false); setEditingState(null); };
//   const openDeleteModal = (s) => { setStateToDelete(s); setShowDeleteModal(true); };
//   const closeDeleteModal= () => { setShowDeleteModal(false); setStateToDelete(null); };

//   const handleDelete = () => {
//     if (stateToDelete) { setStates(states.filter(s => s.id !== stateToDelete.id)); message.success('State deleted!'); closeDeleteModal(); }
//   };

//   const handleSubmit = () => {
//     if (!formData.name || !formData.stateCode || !formData.countryId || !formData.capital) { message.error('Please fill all required fields'); return; }
//     setLoading(true);
//     const selectedCountry = countriesList.find(c => c.id === formData.countryId);
//     setTimeout(() => {
//       const payload = { ...formData,statusCode: formData.stateCode.toUpperCase(), countryName: selectedCountry?.name || '', status: formData.status ? 'Active' : 'Inactive' };
//       if (editingState) {
//         setStates(states.map(s => s.id === editingState.id ? { ...s, ...payload } : s));
//         message.success('State updated successfully!');
//       } else {
//         setStates([...states, { id: Date.now(), ...payload, regDate: new Date().toLocaleString() }]);
//         message.success('State added successfully!');
//       }
//       setLoading(false); closeModal();
//     }, 500);
//   };

//   const handleTableChange = (_, __, sorter) => setSortedInfo(sorter);

//   // ── Stat Card ─────────────────────────────────────────────────────────────
//   const StatCard = ({ label, value, color, icon }) => (
//     <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 14px', borderTop:`3px solid ${color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:10 }}>
//       <span style={{ fontSize:22, color }}>{icon}</span>
//       <div>
//         <div style={{ fontSize:11, color:'#888', lineHeight:1.3 }}>{label}</div>
//         <div style={{ fontSize:22, fontWeight:700, color, lineHeight:1.2 }}>{value}</div>
//       </div>
//     </div>
//   );

//   // ── Shared style tokens ───────────────────────────────────────────────────
//   const backdropStyle = { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000 };
//   const modalBoxStyle = (width) => ({ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'white', padding:'20px', borderRadius:'8px', width, maxWidth:'95%', maxHeight:'92vh', overflowY:'auto', zIndex:1001, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' });
//   const lbl       = { display:'block', marginBottom:4, fontWeight:500, fontSize:13 };
//   const inputStyle= { width:'100%', padding:'6px 10px', border:'1px solid #d9d9d9', borderRadius:6, fontSize:13, boxSizing:'border-box', outline:'none', fontFamily:'inherit' };

//   // ── Columns ───────────────────────────────────────────────────────────────
//   const columns = [
//     { title:'ID', dataIndex:'id', key:'id', width:52,
//       sorter:(a,b)=>a.id-b.id, sortOrder:sortedInfo.columnKey==='id'&&sortedInfo.order,
//       render: t => <Text style={{ fontSize:11 }}>{t}</Text> },
//     { title:'State', dataIndex:'name', key:'name', width:150, ellipsis:true,
//       sorter:(a,b)=>a.name.localeCompare(b.name), sortOrder:sortedInfo.columnKey==='name'&&sortedInfo.order,
//       render:(t,r)=>(
//         <Space size={4}>
//           <Avatar icon={<EnvironmentOutlined/>} style={{ backgroundColor:'#1890ff', flexShrink:0 }} size={20}/>
//           <div>
//             <Text strong style={{ fontSize:11 }}>{t}</Text>
//             <div><Text type="secondary" style={{ fontSize:10 }}>Code: {r.stateCode}</Text></div>
//           </div>
//         </Space>
//       )},
//     { title:'Country', key:'country', width:140, ellipsis:true,
//       sorter:(a,b)=>a.countryName.localeCompare(b.countryName), sortOrder:sortedInfo.columnKey==='country'&&sortedInfo.order,
//       render:(_,r)=>(
//         <Space size={4}>
//           <GlobalOutlined style={{ color:'#52c41a', fontSize:11 }}/>
//           <Text style={{ fontSize:11 }}>{r.countryName}</Text>
//         </Space>
//       ),
//       filters:[...new Set(states.map(s=>s.countryName))].map(c=>({ text:c, value:c })),
//       onFilter:(v,r)=>r.countryName===v },
//     { title:'Capital', dataIndex:'capital', key:'capital', width:120, ellipsis:true,
//       sorter:(a,b)=>a.capital.localeCompare(b.capital), sortOrder:sortedInfo.columnKey==='capital'&&sortedInfo.order,
//       render: t => <Text style={{ fontSize:11 }}>{t}</Text> },
//     { title:'Timezone', dataIndex:'timezone', key:'timezone', width:130, ellipsis:true,
//       sorter:(a,b)=>(a.timezone||'').localeCompare(b.timezone||''),
//       render: t => <Text style={{ fontSize:10 }}>{t||'-'}</Text> },
//     { title:'Reg. Date', dataIndex:'regDate', key:'regDate', width:130,
//       sorter:(a,b)=>new Date(a.regDate)-new Date(b.regDate),
//       render: t => <Text style={{ fontSize:10 }}>{t}</Text> },
//     { title:'Status', dataIndex:'status', key:'status', width:90,
//       sorter:(a,b)=>a.status.localeCompare(b.status), sortOrder:sortedInfo.columnKey==='status'&&sortedInfo.order,
//       render: t => <Badge status={t==='Active'?'success':'default'} text={<span style={{ fontSize:11 }}>{t}</span>}/>,
//       filters:[{ text:'Active', value:'Active' },{ text:'Inactive', value:'Inactive' }],
//       onFilter:(v,r)=>r.status===v },
//     { title:'', key:'actions', width:72, fixed:'right',
//       render:(_,r)=>(
//         <Space size={0}>
//           <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>openEditModal(r)} style={{ color:'#1890ff', padding:'0 3px' }}/></Tooltip>
//           <Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteOutlined/>} onClick={()=>openDeleteModal(r)} style={{ color:'#ff4d4f', padding:'0 3px' }}/></Tooltip>
//         </Space>
//       )},
//   ];

//   // ══════════════════════════════════════════════════════════════════════════
//   return (
//     <div style={{ height:'100vh', display:'flex', flexDirection:'column', backgroundColor:'#f0f2f5', padding:'10px 16px', boxSizing:'border-box', overflow:'hidden' }}>

//       {/* ── HEADER ── */}
//       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexShrink:0 }}>
//         <div>
//           <Title level={4} style={{ margin:0, lineHeight:1.3 }}>
//             <EnvironmentOutlined style={{ marginRight:8, color:'#1890ff' }}/>
//             States Management
//           </Title>
//           <Text type="secondary" style={{ fontSize:12 }}>Manage states/provinces for data center locations</Text>
//         </div>
//         <Space>
//           <Button type="primary" icon={<PlusOutlined/>} onClick={openAddModal} size="small"
//             style={{ background:'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border:'none' }}>
//             Add State
//           </Button>
//           <Button icon={<ReloadOutlined/>} size="small" onClick={()=>window.location.reload()}>Refresh</Button>
//         </Space>
//       </div>

//       {/* ── STAT CARDS ── */}
//       <Row gutter={10} style={{ marginBottom:8, flexShrink:0 }}>
//         <Col span={6}><StatCard label="Total States"  value={totalCount}    color="#1890ff" icon={<EnvironmentOutlined style={{ color:'#1890ff' }}/>}/></Col>
//         <Col span={6}><StatCard label="Active"        value={activeCount}   color="#52c41a" icon={<CheckCircleOutlined style={{ color:'#52c41a' }}/>}/></Col>
//         <Col span={6}><StatCard label="Inactive"      value={inactiveCount} color="#8c8c8c" icon={<StopOutlined       style={{ color:'#8c8c8c' }}/>}/></Col>
//         <Col span={6}><StatCard label="Countries"     value={countryCount}  color="#fa8c16" icon={<GlobalOutlined     style={{ color:'#fa8c16' }}/>}/></Col>
//       </Row>

//       {/* ── FILTERS ── */}
//       <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 12px', marginBottom:8, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
//         <Row gutter={16} align="middle">
//           <Col xs={24} sm={24} md={10} lg={10}>
//             <Input placeholder="Search by name, code, capital or country..." prefix={<SearchOutlined style={{ color:'#bbb' }}/>}
//               value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} allowClear size="small"/>
//           </Col>
//           <Col xs={8} sm={6} md={5} lg={5}>
//             <Select value={countryFilter} onChange={setCountryFilter} size="small" style={{ width:'100%' }} showSearch optionFilterProp="children">
//               <Option value="all">All Countries</Option>
//               {uniqueCountries.map(c=><Option key={c.id} value={c.id}>{c.name}</Option>)}
//             </Select>
//           </Col>
//           <Col xs={8} sm={6} md={5} lg={5}>
//             <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width:'100%' }}>
//               <Option value="all">All Status</Option>
//               <Option value="Active">Active</Option>
//               <Option value="Inactive">Inactive</Option>
//             </Select>
//           </Col>
//           <Col xs={0} sm={0} md={4} lg={4} style={{ textAlign:'right' }}>
//             <Text style={{ fontSize:12, color:'#888', whiteSpace:'nowrap' }}>{filteredStates.length} / {totalCount} shown</Text>
//           </Col>
//         </Row>
//       </div>

//       {/* ── TABLE ── */}
//       <div style={{ flex:1, backgroundColor:'white', borderRadius:6, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
//         <div style={{ padding:'7px 14px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
//           <Text strong style={{ fontSize:13 }}>States List</Text>
//           <Badge count={filteredStates.length} style={{ backgroundColor:'#1890ff' }}/>
//         </div>
//         <div style={{ flex:1, overflow:'auto', minHeight:0 }}>
//           <Table
//             columns={columns} dataSource={filteredStates} loading={loading}
//             bordered={false} rowKey="id" size="small" scroll={{ x:'max-content' }}
//             pagination={{ pageSize:8, showSizeChanger:false, showTotal:total=>`${total} states`, size:'small', style:{ padding:'5px 14px', margin:0 } }}
//             onChange={handleTableChange} style={{ fontSize:12 }}
//             locale={{ emptyText:<div style={{ padding:'12px 0', textAlign:'center', color:'#999', fontSize:13 }}>No data found</div> }}
//           />
//         </div>
//       </div>

//       {/* ── FOOTER ── */}
//       <div style={{ textAlign:'center', paddingTop:4, fontSize:11, fontWeight:700, flexShrink:0 }}>
//       </div>


//       {/* ══ ADD / EDIT MODAL ══ */}
//       {showFormModal && (
//         <>
//           <div style={backdropStyle} onClick={closeModal}/>
//           <div style={modalBoxStyle('560px')}>
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
//               <h3 style={{ margin:0, color:'#1890ff', fontSize:15 }}>{editingState ? 'Edit State' : 'Add New State'}</h3>
//               <Button type="text" icon={<CloseOutlined/>} onClick={closeModal} style={{ color:'#666' }}/>
//             </div>

//             {/* Row 1 — Country + State Name */}
//             <Row gutter={12} style={{ marginBottom:14 }}>
//               <Col span={12}>
//                 <label style={lbl}>Country <span style={{ color:'#ff4d4f' }}>*</span></label>
//                 <Select placeholder="Select country" style={{ width:'100%' }} size="small"
//                   value={formData.countryId||undefined} onChange={v=>setFormData(prev=>({ ...prev, countryId:v }))} showSearch optionFilterProp="children">
//                   {countriesList.map(c=>(
//                     <Option key={c.id} value={c.id}>
//                       <Space size={4}><GlobalOutlined style={{ color:'#52c41a' }}/>{c.name} ({c.code})</Space>
//                     </Option>
//                   ))}
//                 </Select>
//               </Col>
//               <Col span={12}>
//                 <label style={lbl}>State Name <span style={{ color:'#ff4d4f' }}>*</span></label>
//                 <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., California"
//                   onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
//               </Col>
//             </Row>

//             {/* Row 2 — State Code + Capital */}
//             <Row gutter={12} style={{ marginBottom:14 }}>
//               <Col span={12}>
//                 <label style={lbl}>State Code <span style={{ color:'#ff4d4f' }}>*</span></label>
//                 <input type="text" name="stateCode" value={formData.stateCode} onChange={handleInputChange} maxLength={3}
//                   style={{ ...inputStyle, textTransform:'uppercase' }} placeholder="e.g., CA"
//                   onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
//               </Col>
//               <Col span={12}>
//                 <label style={lbl}>Capital City <span style={{ color:'#ff4d4f' }}>*</span></label>
//                 <input type="text" name="capital" value={formData.capital} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., Sacramento"
//                   onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
//               </Col>
//             </Row>

//             {/* Row 3 — Timezone + Status */}
//             <Row gutter={12} style={{ marginBottom:14 }}>
//               <Col span={12}>
//                 <label style={lbl}>Timezone</label>
//                 <input type="text" name="timezone" value={formData.timezone} onChange={handleInputChange} style={inputStyle}
//                   placeholder="e.g., UTC-8 / UTC-7"
//                   onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
//               </Col>
//               <Col span={12}>
//                 <label style={lbl}>Status</label>
//                 <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
//                   <Switch checked={formData.status} onChange={handleStatusToggle}
//                     checkedChildren="Active" unCheckedChildren="Inactive"
//                     style={{ backgroundColor: formData.status ? '#52c41a' : '#ff4d4f' }}/>
//                   <Text style={{ fontSize:12, color: formData.status ? '#52c41a' : '#ff4d4f', fontWeight:500 }}>
//                     {formData.status ? 'Active' : 'Inactive'}
//                   </Text>
//                 </div>
//               </Col>
//             </Row>

//             <Divider style={{ margin:'12px 0' }}/>
//             <div style={{ textAlign:'right' }}>
//               <Button onClick={closeModal} style={{ marginRight:8 }}>Cancel</Button>
//               <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingState ? <EditOutlined/> : <PlusOutlined/>}>
//                 {loading ? 'Saving...' : editingState ? 'Update State' : 'Create State'}
//               </Button>
//             </div>
//           </div>
//         </>
//       )}


//       {/* ══ DELETE MODAL ══ */}
//       {showDeleteModal && stateToDelete && (
//         <>
//           <div style={backdropStyle} onClick={closeDeleteModal}/>
//           <div style={{ ...modalBoxStyle('440px'), textAlign:'center' }}>
//             <ExclamationCircleOutlined style={{ fontSize:40, color:'#ff4d4f', marginBottom:10 }}/>
//             <h3 style={{ color:'#ff4d4f', marginBottom:6 }}>Delete State</h3>
//             <p style={{ fontSize:14, marginBottom:10 }}>Are you sure you want to delete this state?</p>
//             <div style={{ backgroundColor:'#f5f5f5', padding:12, borderRadius:4, marginBottom:12, textAlign:'left', fontSize:13 }}>
//               {[
//                 ['State',    `${stateToDelete.name} (${stateToDelete.stateCode})`],
//                 ['Country',  stateToDelete.countryName],
//                 ['Capital',  stateToDelete.capital],
//                 ['Timezone', stateToDelete.timezone || '-'],
//                 ['Status',   stateToDelete.status],
//               ].map(([k,v])=><p key={k} style={{ margin:'3px 0' }}><strong>{k}:</strong> {v}</p>)}
//             </div>
//             <p style={{ color:'#ff7875', fontSize:12, marginBottom:16 }}>This action cannot be undone.</p>
//             <Space>
//               <Button onClick={closeDeleteModal}>Cancel</Button>
//               <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined/>}>Delete State</Button>
//             </Space>
//           </div>
//         </>
//       )}

//     </div>
//   );
// };

// export default AddState;













// components/State.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Table, Tag, Row, Col, Typography, Space, Button, Select,
  Input, Divider, Tooltip, Badge, Modal, message, Pagination, Form,
} from "antd";
import {
  EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined,
  SearchOutlined, ExclamationCircleOutlined, FlagOutlined,
  EnvironmentOutlined, BarcodeOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../config";


const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 10;

// ── Parse paginated response (same shape as DeviceMaster) ─────────────────
const extractPaginatedResponse = (res) => {
  const body = res?.data ?? res;
  if (body && typeof body === "object" && "totalRecords" in body) {
    return {
      rows: Array.isArray(body.data) ? body.data : [],
      total: Number(body.totalRecords) || 0,
    };
  }
  if (Array.isArray(body)) return { rows: body, total: body.length };
  return { rows: [], total: 0 };
};

const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

// ── Pagination Bar ────────────────────────────────────────────────────────
function PaginationBar({ page, pageSize, total, onChange }) {
  return (
    <div style={{
      display: "flex", justifyContent: "flex-end", alignItems: "center",
      padding: "10px 16px", borderTop: "1px solid #F3F4F6",
      background: "#FAFAFA", flexShrink: 0,
    }}>
      <Pagination
        current={page} pageSize={pageSize} total={total} size="small"
        showTotal={(t) => `Total ${t} items`}
        onChange={onChange} showSizeChanger={false}
      />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: "white", borderRadius: 8, padding: "12px 16px",
    borderTop: `3px solid ${color}`,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex", alignItems: "center", gap: 12,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 40,
      background: `${color}15`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: 20, color }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────
const AddState = () => {

  const [states, setStates] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingState, setEditingState] = useState(null);
  const [stateToDelete, setStateToDelete] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [sortedInfo, setSortedInfo] = useState({});
  const [countryMap, setCountryMap] = useState({});

  // refs — avoid stale closures
  const currentPageRef = useRef(1);
  const searchRef = useRef("");
  const countryRef = useRef("");
  const searchDebounceRef = useRef(null);

  const [form] = Form.useForm();

  // ── Fetch States ──────────────────────────────────────────────────────
  const fetchStates = useCallback(async (targetPage) => {
    const pg = targetPage ?? currentPageRef.current;
    const search = searchRef.current;
    const country = countryRef.current;
    try {
      setLoading(true);
      const res = await axiosInstance.get("/State/getAll-state", {
        params: {
          Page: pg,
          PageSize: PAGE_SIZE,
          IsPaginated: true,
          Search: search || undefined,
          CountryId: country || undefined,
        },
      });
      const { rows, total } = extractPaginatedResponse(res);
      setStates(rows);
      setTotalRecords(total);
    } catch (err) {
      console.error(err);
      message.error("Failed to load states");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch Countries (for dropdown) ────────────────────────────────────
  const fetchCountries = async () => {
    try {
      const res = await axiosInstance.get("/Country/get-country");
      const data = toArray(res);
      setCountries(data);
      const map = {};
      data.forEach((c) => (map[c.id] = c.name));
      setCountryMap(map);
    } catch {
      message.error("Failed to load countries");
    }
  };

  useEffect(() => {
    fetchStates(1);
    fetchCountries();
  }, []); // eslint-disable-line

  // ── Reset to page 1 and fetch ─────────────────────────────────────────
  const resetAndFetch = useCallback(() => {
    currentPageRef.current = 1;
    setCurrentPage(1);
    fetchStates(1);
  }, [fetchStates]);

  // ── Search handlers ───────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    searchRef.current = val;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => resetAndFetch(), 400);
  };

  const handleSearchClear = () => {
    setSearchText("");
    searchRef.current = "";
    resetAndFetch();
  };

  // ── Country filter ────────────────────────────────────────────────────
  const handleCountryFilter = (val) => {
    const v = val ?? "";
    setCountryFilter(v);
    countryRef.current = v;
    resetAndFetch();
  };

  // ── Page change ───────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    currentPageRef.current = newPage;
    setCurrentPage(newPage);
    fetchStates(newPage);
  };

  // ── Submit (Add / Edit) ───────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        countryId: values.countryId,
        name: values.name.trim(),
        statusCode: values.stateCode.trim().toUpperCase(),
      };
      if (editingState) {
        await axiosInstance.post(`/State/update-state/${editingState.id}`, payload);
        message.success("State updated successfully");
      } else {
        await axiosInstance.post("/State/create-state", payload);
        message.success("State created successfully");
      }
      closeModal();
      fetchStates(currentPageRef.current);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || "Failed to save state");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!stateToDelete) return;
    setSubmitting(true);
    try {
      await axiosInstance.delete(`/State/remove-state${stateToDelete.id}`);
      message.success("State deleted successfully");
      setShowDeleteModal(false);
      setStateToDelete(null);
      const newPage =
        states.length === 1 && currentPageRef.current > 1
          ? currentPageRef.current - 1
          : currentPageRef.current;
      currentPageRef.current = newPage;
      setCurrentPage(newPage);
      fetchStates(newPage);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete state");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingState(null);
    form.resetFields();
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingState(record);
    form.setFieldsValue({
      countryId: record.countryId ?? null,
      name: record.name ?? "",
      statusCode: record.stateCode ?? "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingState(null);
    form.resetFields();
  };

  // ── Table columns ─────────────────────────────────────────────────────
  const columns = [
    {
      title: "S.No", key: "sno", width: 60, fixed: "left", align: "center",
      render: (_, __, index) => (
        <Text style={{ fontSize: 12 }}>
          {(currentPage - 1) * PAGE_SIZE + index + 1}
        </Text>
      ),
    },
    {
      title: "Country", dataIndex: "countryId", key: "countryId", width: 160,
      sorter: (a, b) => (countryMap[a.countryId] || "").localeCompare(countryMap[b.countryId] || ""),
      sortOrder: sortedInfo.columnKey === "countryId" && sortedInfo.order,
      render: (id) => (
        <Tag color="geekblue" icon={<FlagOutlined />} style={{ fontSize: 12 }}>
          {countryMap[id] || "-"}
        </Tag>
      ),
    },
    {
      title: "State Name", dataIndex: "name", key: "name", width: 200,
      sorter: (a, b) => a.name?.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
      render: (name) => (
        <Space size={8}>
          <EnvironmentOutlined style={{ color: "#1890ff" }} />
          <Text strong style={{ fontSize: 13 }}>{name || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "State Code", dataIndex: "statusCode", key: "statusCode", width: 130,
      sorter: (a, b) => (a.stateCode || "").localeCompare(b.stateCode || ""),
      sortOrder: sortedInfo.columnKey === "statusCode" && sortedInfo.order,
      render: (code) => (
        <Tag color="purple" icon={<BarcodeOutlined />}
          style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
          {code ? code.toUpperCase() : "-"}
        </Tag>
      ),
    },
    {
      title: "Created At", dataIndex: "createdAt", key: "createdAt", width: 170,
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      sortOrder: sortedInfo.columnKey === "createdAt" && sortedInfo.order,
      render: (date) => (
        <Text style={{ fontSize: 12, color: "#666" }}>
          {date ? new Date(date).toLocaleString() : "-"}
        </Text>
      ),
    },
    {
      title: "Updated At", dataIndex: "updatedAt", key: "updatedAt", width: 170,
      sorter: (a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0),
      sortOrder: sortedInfo.columnKey === "updatedAt" && sortedInfo.order,
      render: (date) => (
        <Text style={{ fontSize: 12, color: "#666" }}>
          {date ? new Date(date).toLocaleString() : "-"}
        </Text>
      ),
    },
    {
      title: "Actions", key: "actions", width: 90, fixed: "right", align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              style={{ color: "#1890ff" }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />}
              onClick={() => { setStateToDelete(record); setShowDeleteModal(true); }}
              style={{ color: "#ff4d4f" }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const countryCount = new Set(states.map((s) => s.countryId).filter(Boolean)).size;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      backgroundColor: "#f0f2f5", padding: "16px 20px",
      boxSizing: "border-box", overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16, flexShrink: 0,
      }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <EnvironmentOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            State Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Manage states and their country associations
          </Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}
            style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
            Add State
          </Button>
          <Button icon={<ReloadOutlined />}
            onClick={() => { fetchStates(currentPageRef.current); fetchCountries(); }}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
        <Col span={12}>
          <StatCard label="Total States" value={totalRecords}
            color="#1890ff" icon={<EnvironmentOutlined />} />
        </Col>
        <Col span={12}>
          <StatCard label="Countries Covered" value={countryCount}
            color="#52c41a" icon={<FlagOutlined />} />
        </Col>
      </Row>

      {/* Filters */}
      <div style={{
        backgroundColor: "white", borderRadius: 8,
        padding: "12px 16px", marginBottom: 16, flexShrink: 0,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Search by state name or code..."
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              value={searchText}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              value={countryFilter || undefined}
              onChange={handleCountryFilter}
              onClear={() => handleCountryFilter("")}
              style={{ width: "100%" }}
              allowClear
              placeholder="Filter by country"
              showSearch
              optionFilterProp="children"
            >
              {countries.map((c) => (
                <Option key={c.id} value={c.id}>
                  <FlagOutlined style={{ marginRight: 6, color: "#52c41a" }} />
                  {c.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={4} md={8} style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 12, color: "#888" }}>
              {totalRecords} states
            </Text>
          </Col>
        </Row>
      </div>

      {/* Table */}
      <div style={{
        flex: 1, backgroundColor: "white", borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden",
        display: "flex", flexDirection: "column", minHeight: 0,
      }}>
        <div style={{
          padding: "10px 16px", borderBottom: "1px solid #f0f0f0",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexShrink: 0,
        }}>
          <Text strong style={{ fontSize: 13 }}>States List</Text>
          <Badge count={totalRecords} overflowCount={9999}
            style={{ backgroundColor: "#1890ff" }} />
        </div>

        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Table
            columns={columns}
            dataSource={states}
            loading={loading}
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 900 }}
            onChange={(_, __, sorter) => setSortedInfo(sorter)}
            locale={{
              emptyText: (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <EnvironmentOutlined style={{ fontSize: 48, color: "#ccc" }} />
                  <p style={{ color: "#999", marginTop: 16 }}>
                    No states found. Click "Add State" to create one.
                  </p>
                </div>
              ),
            }}
          />
        </div>

        <PaginationBar
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalRecords}
          onChange={handlePageChange}
        />
      </div>


      {/* Add / Edit Modal */}
      <Modal
        title={
          <Space>
            <EnvironmentOutlined style={{ color: "#1890ff" }} />
            <span>{editingState ? "Edit State" : "Add New State"}</span>
          </Space>
        }
        open={showModal}
        onCancel={closeModal}
        footer={null}
        width={500}
        destroyOnClose
      >
        <Divider style={{ margin: "12px 0" }} />
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ padding: "8px 0" }}>

          <Form.Item name="countryId" label="Country"
            rules={[{ required: true, message: "Country is required" }]}>
            <Select placeholder="Select country" size="large"
              showSearch optionFilterProp="children">
              {countries.map((c) => (
                <Option key={c.id} value={c.id}>
                  <FlagOutlined style={{ marginRight: 6, color: "#52c41a" }} />
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="name" label="State Name"
            rules={[{ required: true, message: "State name is required" }]}>
            <Input
              placeholder="Enter state name (e.g., Uttarakhand)"
              size="large"
              prefix={<EnvironmentOutlined style={{ color: "#bbb" }} />}
            />
          </Form.Item>

          <Form.Item name="stateCode" label="State Code"
            rules={[{ required: true, message: "State code is required" }]}>
            <Input
              placeholder="Enter state code (e.g., UK, UP, MH)"
              size="large"
              maxLength={10}
              style={{ textTransform: "uppercase" }}
              prefix={<BarcodeOutlined style={{ color: "#bbb" }} />}
            />
          </Form.Item>

          <div style={{
            background: "#fafafa", padding: 12,
            borderRadius: 6, marginBottom: 16,
          }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              State information will be used for location-based features across the system.
            </Text>
          </div>

          <Divider style={{ margin: "4px 0 12px" }} />
          <Row justify="end">
            <Space>
              <Button onClick={closeModal} size="large">Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting} size="large"
                style={{ background: editingState ? "#1890ff" : "#52c41a" }}>
                {editingState ? "Update State" : "Create State"}
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>Confirm Delete</span>
          </Space>
        }
        open={showDeleteModal}
        onCancel={() => { setShowDeleteModal(false); setStateToDelete(null); }}
        footer={null}
        width={450}
      >
        <Divider style={{ margin: "12px 0" }} />
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <DeleteOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <Title level={5} style={{ marginBottom: 8 }}>
            Are you sure you want to delete this state?
          </Title>
          <Text type="secondary">
            {stateToDelete && (
              <>
                "<strong>{stateToDelete.name}</strong>" (
                {stateToDelete.stateCode || "—"}) will be permanently deleted.
                <br />This action cannot be undone.
              </>
            )}
          </Text>
        </div>
        <Divider style={{ margin: "12px 0" }} />
        <Row justify="end">
          <Space>
            <Button size="large"
              onClick={() => { setShowDeleteModal(false); setStateToDelete(null); }}>
              Cancel
            </Button>
            <Button danger type="primary" size="large"
              loading={submitting} onClick={handleDelete}>
              Yes, Delete
            </Button>
          </Space>
        </Row>
      </Modal>
    </div>
  );
};

export default AddState;