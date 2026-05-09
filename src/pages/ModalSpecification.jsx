// ModalSpecification.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Table, Alert, Row, Col, Typography, Space,
  Button, Select, message, Input, Tooltip, Badge, Tag, Avatar
} from "antd";
import {
  BankOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, PlusOutlined,
  SearchOutlined, ExclamationCircleOutlined, CloseOutlined,
  AppstoreOutlined, DashboardOutlined, SettingOutlined,
  TableOutlined, CodeOutlined, UploadOutlined, FileTextOutlined,
  InboxOutlined, FilePdfOutlined, FileOutlined, PictureOutlined,
  EyeOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const PARAM_CATEGORIES = ['Compute','Cooling','Power','Network','Security','Storage','Safety','Environment'];

const ModalSpecification = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImgPreview, setShowImgPreview] = useState(null);
  // const [previewSpec, setPreviewSpec] = useState(null);
  const [specToDelete, setSpecToDelete] = useState(null);
  const [editingSpec, setEditingSpec] = useState(null);
  const [error, setError] = useState(null);

  const docFileRef   = useRef(null);
  const imgFileRef   = useRef(null);
  const manualImgRef = useRef(null);

  const [companies] = useState([
    { id: 1, name: 'ABC Technologies' },
    { id: 2, name: 'Tech Solutions Inc' },
    { id: 3, name: 'Data Center Inc' },
    { id: 4, name: 'Cloud Solutions Ltd' }
  ]);
  const [deviceCategories] = useState([
    { id: 1, name: 'Networking Equipment' },
    { id: 2, name: 'Servers' },
    { id: 3, name: 'Storage Devices' },
    { id: 4, name: 'Security Systems' },
    { id: 5, name: 'IoT Devices' }
  ]);
  const [deviceTypes] = useState([
    { id: 1,  categoryId: 1, name: 'Router' },
    { id: 2,  categoryId: 1, name: 'Switch' },
    { id: 3,  categoryId: 1, name: 'Firewall' },
    { id: 4,  categoryId: 1, name: 'Access Point' },
    { id: 5,  categoryId: 2, name: 'Rack Server' },
    { id: 6,  categoryId: 2, name: 'Tower Server' },
    { id: 7,  categoryId: 2, name: 'Blade Server' },
    { id: 8,  categoryId: 3, name: 'NAS' },
    { id: 9,  categoryId: 3, name: 'SAN' },
    { id: 10, categoryId: 3, name: 'DAS' },
    { id: 11, categoryId: 4, name: 'CCTV Camera' },
    { id: 12, categoryId: 4, name: 'Access Control' },
    { id: 13, categoryId: 4, name: 'Alarm System' },
    { id: 14, categoryId: 5, name: 'Sensor' },
    { id: 15, categoryId: 5, name: 'Gateway' }
  ]);

  const [modalSpecs, setModalSpecs] = useState([
    { id:1, companyId:1, companyName:'ABC Technologies', deviceCategoryId:1, deviceCategoryName:'Networking Equipment', deviceTypeId:1, deviceTypeName:'Router', modalNo:'RT-AC5300', intro:'High-performance dual-band wireless router designed for enterprise use.', uses:'Suitable for office networking, branch connectivity, and SMB deployments.', features:'MU-MIMO, WPA3, dual-band, QoS, VPN passthrough.', parameters:[{category:'Network',name:'Ports',value:'8 x Gigabit Ethernet'},{category:'Network',name:'Speed',value:'5300 Mbps'},{category:'Power',name:'Power Supply',value:'12V DC'}], images:[], uploadedDoc:null, uploadImages:[], createdDate:'2024-01-15', status:'Active' },
    { id:2, companyId:1, companyName:'BCS Technologies', deviceCategoryId:2, deviceCategoryName:'Servers', deviceTypeId:5, deviceTypeName:'Rack Server', modalNo:'PowerEdge R740', intro:'Dell PowerEdge R740 is a 2-socket, 2U rack server built for complex workloads.', uses:'Data center consolidation, virtualization, and high-performance computing.', features:'3D XPoint-ready storage, GPU support, OpenManage systems management.', parameters:[{category:'Compute',name:'CPU Type',value:'Intel Xeon Gold'},{category:'Compute',name:'Cores',value:'16'},{category:'Storage',name:'HDD',value:'4 x 1.2TB SAS'}], images:[], uploadedDoc:null, uploadImages:[], createdDate:'2024-02-20', status:'Active' },
    { id:3, companyId:2, companyName:'Tech Solutions Inc', deviceCategoryId:1, deviceCategoryName:'Networking Equipment', deviceTypeId:2, deviceTypeName:'Switch', modalNo:'Catalyst 9200', intro:'Cisco Catalyst 9200 Series switches for enterprise access layer.', uses:'Campus LAN, PoE deployments, and wired network aggregation.', features:'PoE+, stacking, Cisco DNA Center integration, encrypted traffic analytics.', parameters:[{category:'Network',name:'Total Ports',value:'24'},{category:'Power',name:'PoE Ports',value:'24'}], images:[], uploadedDoc:null, uploadImages:[], createdDate:'2024-03-10', status:'Inactive' },
    { id:4, companyId:3, companyName:'Data Center Inc', deviceCategoryId:3, deviceCategoryName:'Storage Devices', deviceTypeId:8, deviceTypeName:'NAS', modalNo:'DS1821+', intro:'Synology DiskStation DS1821+ is a scalable 8-bay NAS for business data management.', uses:'File sharing, backup, surveillance storage, and data archiving.', features:'NVMe caching, hot-swappable drives, VMware/Hyper-V ready, dual M.2 slots.', parameters:[{category:'Compute',name:'CPU',value:'AMD Ryzen'},{category:'Storage',name:'Drive Bays',value:'8'},{category:'Storage',name:'Max Capacity',value:'108TB'}], images:[], uploadedDoc:null, uploadImages:[], createdDate:'2024-04-05', status:'Active' }
  ]);

  const emptyForm = { companyId:'', deviceCategoryId:'', deviceTypeId:'', modalNo:'', intro:'', uses:'', features:'', parameters:[], images:[], uploadedDoc:null, uploadImages:[], status:true, inputMode:'manual' };
  const [formData, setFormData] = useState(emptyForm);
  const [newParamCategory, setNewParamCategory] = useState('');
  const [newParamName, setNewParamName]         = useState('');
  const [newParamValue, setNewParamValue]       = useState('');

  const [searchText, setSearchText]       = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter]   = useState('all');

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'deviceCategoryId' ? { deviceTypeId: '' } : {}) }));
  };

  const addParameter = () => {
    if (!newParamCategory || !newParamName || !newParamValue) { message.warning('Please fill all parameter fields'); return; }
    setFormData(prev => ({ ...prev, parameters: [...prev.parameters, { category: newParamCategory, name: newParamName, value: newParamValue }] }));
    setNewParamCategory(''); setNewParamName(''); setNewParamValue('');
  };

  const removeParameter = (index) => {
    setFormData(prev => ({ ...prev, parameters: prev.parameters.filter((_, i) => i !== index) }));
  };

  const handleImageUpload = (e, mode) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const validTypes = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml'];
    const maxSize = 5 * 1024 * 1024;
    const valid = [];
    files.forEach(file => {
      if (!validTypes.includes(file.type)) { message.error(`"${file.name}" is not a valid image type`); return; }
      if (file.size > maxSize) { message.error(`"${file.name}" exceeds 5MB limit`); return; }
      const url = URL.createObjectURL(file);
      valid.push({ name: file.name, size: file.size, type: file.type, url, file });
    });
    if (valid.length) {
      if (mode === 'upload') {
        setFormData(prev => ({ ...prev, uploadImages: [...(prev.uploadImages || []), ...valid] }));
      } else {
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...valid] }));
      }
      message.success(`${valid.length} image(s) added`);
    }
    e.target.value = '';
  };

  const removeImage = (index, mode) => {
    if (mode === 'upload') {
      setFormData(prev => { const imgs = [...(prev.uploadImages||[])]; imgs.splice(index,1); return { ...prev, uploadImages: imgs }; });
    } else {
      setFormData(prev => { const imgs = [...(prev.images||[])]; imgs.splice(index,1); return { ...prev, images: imgs }; });
    }
  };

  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowed.includes(file.type)) { message.error('Only PDF, Word, Excel, or TXT files are allowed'); return; }
    if (file.size > 10*1024*1024) { message.error('File size must be under 10MB'); return; }
    setFormData(prev => ({ ...prev, uploadedDoc: { name: file.name, size: file.size, type: file.type, file } }));
    message.success(`"${file.name}" uploaded`);
    e.target.value = '';
  };

  const removeDoc = () => { setFormData(prev => ({ ...prev, uploadedDoc: null })); };

  const openAddModal = () => {
    setEditingSpec(null);
    setFormData(emptyForm);
    setNewParamCategory(''); setNewParamName(''); setNewParamValue('');
    setShowModal(true);
  };

  const openEditModal = (spec) => {
    setEditingSpec(spec);
    setFormData({ companyId:spec.companyId, deviceCategoryId:spec.deviceCategoryId, deviceTypeId:spec.deviceTypeId, modalNo:spec.modalNo, intro:spec.intro||'', uses:spec.uses||'', features:spec.features||'', parameters:[...spec.parameters], images:[...(spec.images||[])], uploadedDoc:spec.uploadedDoc||null, uploadImages:[...(spec.uploadImages||[])], status:spec.status==='Active', inputMode:spec.uploadedDoc?'upload':'manual' });
    setNewParamCategory(''); setNewParamName(''); setNewParamValue('');
    setShowModal(true);
  };

  const openDeleteModal = (spec) => { setSpecToDelete(spec); setShowDeleteModal(true); };
  const closeModal       = () => setShowModal(false);
  const closeDeleteModal = () => { setShowDeleteModal(false); setSpecToDelete(null); };

  const handleDelete = () => {
    if (specToDelete) { setModalSpecs(modalSpecs.filter(s => s.id !== specToDelete.id)); message.success('Specification deleted!'); closeDeleteModal(); }
  };

  const handleSubmit = () => {
    if (!formData.companyId || !formData.deviceCategoryId || !formData.deviceTypeId || !formData.modalNo) { setError('Please fill all required fields'); return; }
    if (formData.inputMode === 'upload' && !formData.uploadedDoc) { setError('Please upload a specification document'); return; }
    setLoading(true);
    const sc   = companies.find(c => c.id === formData.companyId);
    const scat = deviceCategories.find(c => c.id === formData.deviceCategoryId);
    const sdt  = deviceTypes.find(d => d.id === formData.deviceTypeId);
    setTimeout(() => {
      const payload = { companyId:formData.companyId, companyName:sc?.name||'', deviceCategoryId:formData.deviceCategoryId, deviceCategoryName:scat?.name||'', deviceTypeId:formData.deviceTypeId, deviceTypeName:sdt?.name||'', modalNo:formData.modalNo, intro:formData.intro, uses:formData.uses, features:formData.features, parameters:formData.inputMode==='manual'?formData.parameters:[], images:formData.images||[], uploadedDoc:formData.inputMode==='upload'?formData.uploadedDoc:null, uploadImages:formData.uploadImages||[], status:formData.status?'Active':'Inactive' };
      if (editingSpec) {
        setModalSpecs(modalSpecs.map(s => s.id===editingSpec.id ? { ...s, ...payload } : s));
        message.success('Specification updated!');
      } else {
        setModalSpecs([...modalSpecs, { id:modalSpecs.length+1, ...payload, createdDate:new Date().toISOString().split('T')[0] }]);
        message.success('Specification added!');
      }
      setLoading(false); closeModal();
    }, 500);
  };

  const getFilteredDeviceTypes = () => formData.deviceCategoryId ? deviceTypes.filter(t => t.categoryId === formData.deviceCategoryId) : [];

  // ── Download datasheet as .txt ──
  const handleDownload = (record) => {
    const sep  = '='.repeat(48);
    const sep2 = '-'.repeat(48);
    const lines = [
      sep,
      '  MODAL SPECIFICATION DATASHEET',
      sep,
      '',
      `  Company       : ${record.companyName}`,
      `  Category      : ${record.deviceCategoryName}`,
      `  Device Type   : ${record.deviceTypeName}`,
      `  Modal No      : ${record.modalNo}`,
      `  Status        : ${record.status}`,
      `  Created Date  : ${record.createdDate}`,
      '',
      sep2,
      '  INTRODUCTION',
      sep2,
      `  ${record.intro || '-'}`,
      '',
      sep2,
      '  USES',
      sep2,
      `  ${record.uses || '-'}`,
      '',
      sep2,
      '  FEATURES',
      sep2,
      `  ${record.features || '-'}`,
      '',
      sep2,
      `  PARAMETERS (${record.parameters.length})`,
      sep2,
      ...(record.parameters.length > 0
        ? record.parameters.map(p => `  [${p.category}]  ${p.name.padEnd(22)} : ${p.value}`)
        : ['  No parameters defined']),
      '',
      sep,
      '  (c) ABC Technologies Pvt. Ltd.',
      sep,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${record.modalNo}_datasheet.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Datasheet for "${record.modalNo}" downloaded!`);
  };

  const filteredSpecs = modalSpecs.filter(spec => {
    const s = searchText.toLowerCase();
    const matchSearch = !s
      || spec.companyName.toLowerCase().includes(s)
      || spec.deviceCategoryName.toLowerCase().includes(s)
      || spec.deviceTypeName.toLowerCase().includes(s)
      || spec.modalNo.toLowerCase().includes(s)
      || (spec.intro && spec.intro.toLowerCase().includes(s))
      || spec.parameters.some(p => p.name.toLowerCase().includes(s) || p.value.toLowerCase().includes(s));
    const matchCompany  = companyFilter  === 'all' || spec.companyId         === parseInt(companyFilter);
    const matchCategory = categoryFilter === 'all' || spec.deviceCategoryId  === parseInt(categoryFilter);
    const matchStatus   = statusFilter   === 'all' || spec.status.toLowerCase() === statusFilter;
    return matchSearch && matchCompany && matchCategory && matchStatus;
  });

  const totalSpecs      = modalSpecs.length;
  const activeSpecs     = modalSpecs.filter(s => s.status==='Active').length;
  const inactiveSpecs   = modalSpecs.filter(s => s.status==='Inactive').length;
  const totalParameters = modalSpecs.reduce((sum,s) => sum+s.parameters.length, 0);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    if (!type) return <FileOutlined style={{ fontSize:26, color:'#888' }} />;
    if (type.includes('pdf')) return <FilePdfOutlined style={{ fontSize:26, color:'#ff4d4f' }} />;
    return <FileTextOutlined style={{ fontSize:26, color:'#1890ff' }} />;
  };

  const ImageStrip = ({ images, onRemove, mode }) => {
    if (!images || !images.length) return null;
    return (
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
        {images.map((img, i) => (
          <div key={i} style={{ position:'relative', width:60, height:60, borderRadius:4, overflow:'hidden', border:'1px solid #e0e0e0', flexShrink:0 }}>
            <img src={img.url} alt={img.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0)', display:'flex', alignItems:'center', justifyContent:'center', gap:2, transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(0,0,0,0.45)'}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor='rgba(0,0,0,0)'}>
              <Button type="text" size="small" icon={<EyeOutlined style={{color:'white',fontSize:11}}/>} style={{padding:'0 2px'}} onClick={()=>setShowImgPreview(img.url)} />
              <Button type="text" size="small" icon={<CloseOutlined style={{color:'white',fontSize:11}}/>} style={{padding:'0 2px'}} onClick={()=>onRemove(i, mode)} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ImgUploadRow = ({ refEl, mode }) => (
    <div style={{ marginTop:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <PictureOutlined style={{ color:'#fa8c16', fontSize:13 }} />
        <Text style={{ fontSize:12, fontWeight:500 }}>Images</Text>
        <Button size="small" icon={<UploadOutlined />} style={{ fontSize:11, height:24 }} onClick={() => refEl.current?.click()}>
          Add Images
        </Button>
        <Text type="secondary" style={{ fontSize:11 }}>JPG, PNG, GIF, WebP — max 5MB each</Text>
      </div>
      <input ref={refEl} type="file" style={{ display:'none' }} accept="image/*" multiple onChange={e => handleImageUpload(e, mode)} />
      <ImageStrip images={mode==='upload' ? formData.uploadImages : formData.images} onRemove={removeImage} mode={mode} />
    </div>
  );

  const columns = [
    { title:'ID', dataIndex:'id', key:'id', width:50, sorter:(a,b)=>a.id-b.id },
    {
      title:'Company', dataIndex:'companyName', key:'companyName', width:155,
      render:(text,record)=>(
        <Space size={5}>
          <Avatar style={{backgroundColor:record.status==='Active'?'#1890ff':'#d9d9d9',width:22,height:22,minWidth:22,fontSize:11,lineHeight:'22px'}} icon={<BankOutlined/>}/>
          <Text strong style={{fontSize:12}}>{text}</Text>
        </Space>
      ), sorter:(a,b)=>a.companyName.localeCompare(b.companyName),
    },
    {
      title:'Category', dataIndex:'deviceCategoryName', key:'deviceCategoryName', width:140,
      render:(text)=><Space size={4}><AppstoreOutlined style={{color:'#fa8c16',fontSize:11}}/><Text style={{fontSize:12}}>{text}</Text></Space>,
      sorter:(a,b)=>a.deviceCategoryName.localeCompare(b.deviceCategoryName),
    },
    {
      title:'Device Type', dataIndex:'deviceTypeName', key:'deviceTypeName', width:115,
      render:(text)=><Space size={4}><DashboardOutlined style={{color:'#52c41a',fontSize:11}}/><Text style={{fontSize:12}}>{text}</Text></Space>,
      sorter:(a,b)=>a.deviceTypeName.localeCompare(b.deviceTypeName),
    },
    {
      title:'Modal No', dataIndex:'modalNo', key:'modalNo', width:125,
      render:(text)=><Tag color="purple" icon={<CodeOutlined/>} style={{fontSize:11}}>{text}</Tag>,
      sorter:(a,b)=>a.modalNo.localeCompare(b.modalNo),
    },
    {
      title:'Intro', dataIndex:'intro', key:'intro', width:170,
      render:(text)=>text?(
        <Tooltip title={text}><Text style={{fontSize:11}}>{text.length>55?text.substring(0,55)+'…':text}</Text></Tooltip>
      ):<Text type="secondary" style={{fontSize:11}}>-</Text>,
    },
    {
      title:'Params / Doc', key:'params', width:105,
      render:(_,record)=> record.uploadedDoc?(
        <Space size={4}><FilePdfOutlined style={{color:'#ff4d4f',fontSize:12}}/><Tooltip title={record.uploadedDoc.name}><Text style={{fontSize:11,color:'#ff4d4f'}}>Document</Text></Tooltip></Space>
      ):(
        <Space size={4}><Badge count={record.parameters.length} style={{backgroundColor:'#722ed1',fontSize:10}}/><Text type="secondary" style={{fontSize:11}}>{record.parameters.length} params</Text></Space>
      ),
    },
    {
      title:'Images', key:'images', width:70,
      render:(_,record)=>{
        const imgs = [...(record.images||[]), ...(record.uploadImages||[])];
        return imgs.length ? (
          <Space size={4}><PictureOutlined style={{color:'#fa8c16',fontSize:12}}/><Text style={{fontSize:11}}>{imgs.length}</Text></Space>
        ) : <Text type="secondary" style={{fontSize:11}}>-</Text>;
      }
    },
    {
      title:'Date', dataIndex:'createdDate', key:'createdDate', width:90,
      render:(text)=><Text style={{fontSize:11}}>{text}</Text>,
      sorter:(a,b)=>new Date(a.createdDate)-new Date(b.createdDate),
    },
    {
      title:'Status', dataIndex:'status', key:'status', width:80,
      render:(text)=><Badge status={text==='Active'?'success':'error'} text={<span style={{fontSize:11}}>{text}</span>}/>,
      filters:[{text:'Active',value:'Active'},{text:'Inactive',value:'Inactive'}],
      onFilter:(value,record)=>record.status===value,
    },
    {
      title:'Actions', key:'actions', width:110, fixed:'right',
      render:(_,record)=>(
        <Space size={2}>
          <Tooltip title="Preview Datasheet">
            <Button type="text" size="small" icon={<EyeOutlined/>} onClick={()=>setPreviewSpec(record)} style={{color:'#722ed1',padding:'0 4px'}}/>
          </Tooltip>
          {/* <Tooltip title="Download Datasheet">
            <Button type="text" size="small" icon={<FileTextOutlined/>} onClick={()=>handleDownload(record)} style={{color:'#52c41a',padding:'0 4px'}}/>
          </Tooltip> */}
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>openEditModal(record)} style={{color:'#1890ff',padding:'0 4px'}}/>
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined/>} onClick={()=>openDeleteModal(record)} style={{color:'#ff4d4f',padding:'0 4px'}}/>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // helper to avoid undefined reference before declaration
  const setPreviewSpec = (spec) => _setPreviewSpec(spec);
  const [_previewSpec, _setPreviewSpec] = useState(null);
  // re-alias so JSX uses consistent name
  const previewSpecVal = _previewSpec;

  const backdropStyle = { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000 };
  const taStyle = { width:'100%', border:'1px solid #d9d9d9', borderRadius:6, padding:'6px 10px', fontSize:12, resize:'vertical', fontFamily:'inherit', outline:'none', minHeight:62, boxSizing:'border-box' };

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', backgroundColor:'#f0f2f5', padding:'10px 16px', boxSizing:'border-box', overflow:'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexShrink:0 }}>
        <div>
          <Title level={4} style={{ margin:0, lineHeight:1.3 }}>
            <TableOutlined style={{ marginRight:8, color:'#1890ff' }}/>
            Modal Specification
          </Title>
          <Text type="secondary" style={{ fontSize:12 }}>Manage device modal specifications and parameters</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined/>} onClick={openAddModal} size="small"
            style={{ background:'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border:'none' }}>
            Add Specification
          </Button>
          <Button icon={<ReloadOutlined/>} size="small" onClick={()=>window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {error && <Alert message={error} type="error" showIcon closable onClose={()=>setError(null)} style={{ marginBottom:6, padding:'4px 12px', fontSize:12, flexShrink:0 }}/>}

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom:8, flexShrink:0 }}>
        {[
          { label:'Total Specs',   value:totalSpecs,      color:'#1890ff', icon:<TableOutlined/> },
          { label:'Active',        value:activeSpecs,     color:'#52c41a', icon:<CheckCircleOutlined/> },
          { label:'Inactive',      value:inactiveSpecs,   color:'#ff4d4f', icon:<CloseCircleOutlined/> },
          { label:'Total Params',  value:totalParameters, color:'#722ed1', icon:<SettingOutlined/> },
        ].map(({ label, value, color, icon }) => (
          <Col key={label} span={6}>
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

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 12px', marginBottom:8, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={8} lg={8}>
            <Input
              placeholder="Search by company, category, type, modal no..."
              prefix={<SearchOutlined style={{ color:'#bbb' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear size="small"
            />
          </Col>
          <Col xs={24} sm={8} md={4} lg={4}>
            <Select value={companyFilter} onChange={setCompanyFilter} size="small" style={{ width:'100%' }}>
              <Option value="all">All Companies</Option>
              {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4} lg={4}>
            <Select value={categoryFilter} onChange={setCategoryFilter} size="small" style={{ width:'100%' }}>
              <Option value="all">All Categories</Option>
              {deviceCategories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width:'100%' }}>
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4} lg={4} style={{ textAlign:'right' }}>
            <Text style={{ fontSize:12, color:'#888' }}>Showing {filteredSpecs.length} of {totalSpecs}</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex:1, backgroundColor:'white', borderRadius:6, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
        <div style={{ padding:'7px 14px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <Text strong style={{ fontSize:13 }}>Modal Specifications List</Text>
          <Badge count={filteredSpecs.length} style={{ backgroundColor:'#1890ff' }}/>
        </div>
        <div style={{ flex:1, overflow:'auto', minHeight:0 }}>
          <Table
            columns={columns} dataSource={filteredSpecs} loading={loading}
            bordered={false} rowKey="id" size="small"
            scroll={{ x:1100 }}
            pagination={{ pageSize:8, showSizeChanger:false, showTotal:total=>`${total} specifications`, size:'small', style:{ padding:'5px 14px', margin:0 } }}
            style={{ fontSize:12 }}
            locale={{ emptyText: <div style={{ padding:'12px 0', textAlign:'center', color:'#999', fontSize:13 }}>No data found</div> }}
          />
        </div>
      </div>


      {/* ════════════════ ADD / EDIT MODAL ════════════════ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)', backgroundColor:'white', padding:'20px 24px', borderRadius:10, width:'880px', maxWidth:'96%', maxHeight:'92vh', overflowY:'auto', zIndex:1001, boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ margin:0, color:'#1890ff', fontSize:16 }}>
                {editingSpec ? 'Edit Modal Specification' : 'Add New Modal Specification'}
              </h3>
              <Button type="text" icon={<CloseOutlined/>} onClick={closeModal} style={{ color:'#666' }}/>
            </div>

            {/* Row 1 */}
            <Row gutter={12} style={{ marginBottom:12 }}>
              <Col span={6}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Device Category <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select category" style={{ width:'100%' }} size="small" value={formData.deviceCategoryId||undefined} onChange={v=>handleSelectChange('deviceCategoryId',v)}>
                  {deviceCategories.map(c=><Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Col>
              <Col span={6}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Device Type <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select type" style={{ width:'100%' }} size="small" value={formData.deviceTypeId||undefined} onChange={v=>handleSelectChange('deviceTypeId',v)} disabled={!formData.deviceCategoryId}>
                  {getFilteredDeviceTypes().map(t=><Option key={t.id} value={t.id}>{t.name}</Option>)}
                </Select>
              </Col>
              <Col span={6}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Company <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select company" style={{ width:'100%' }} size="small" value={formData.companyId||undefined} onChange={v=>handleSelectChange('companyId',v)}>
                  {companies.map(c=><Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Col>
              <Col span={6}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Modal No <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Input name="modalNo" value={formData.modalNo} onChange={handleInputChange} placeholder="e.g. RT-AC5300" prefix={<CodeOutlined style={{ color:'#722ed1' }}/>} size="small"/>
              </Col>
            </Row>

            {/* Row 2 */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={8}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Intro</label>
                <textarea name="intro" value={formData.intro} onChange={handleInputChange} placeholder="Brief introduction about this modal..." style={taStyle}/>
              </Col>
              <Col span={8}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Uses</label>
                <textarea name="uses" value={formData.uses} onChange={handleInputChange} placeholder="What is this device used for..." style={taStyle}/>
              </Col>
              <Col span={8}>
                <label style={{ display:'block', marginBottom:4, fontWeight:500, fontSize:12 }}>Features</label>
                <textarea name="features" value={formData.features} onChange={handleInputChange} placeholder="Key features and highlights..." style={taStyle}/>
              </Col>
            </Row>

            {/* Parameters Section */}
            <div style={{ border:'1px solid #e8e8e8', borderRadius:8, marginBottom:14, overflow:'hidden' }}>
              <div style={{ backgroundColor:'#fafafa', padding:'8px 14px', borderBottom:'1px solid #e8e8e8', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Space size={6}>
                  <SettingOutlined style={{ color:'#722ed1', fontSize:13 }}/>
                  <Text strong style={{ fontSize:13 }}>Parameters &amp; Media</Text>
                </Space>
                <Space size={4}>
                  <Button size="small" type={formData.inputMode==='manual'?'primary':'default'} onClick={()=>setFormData(p=>({...p,inputMode:'manual'}))} style={{ fontSize:11, height:26 }} icon={<SettingOutlined/>}>Manual Entry</Button>
                  <Button size="small" type={formData.inputMode==='upload'?'primary':'default'} onClick={()=>setFormData(p=>({...p,inputMode:'upload'}))} style={{ fontSize:11, height:26 }} icon={<UploadOutlined/>}>Upload Document</Button>
                </Space>
              </div>

              <div style={{ padding:'12px 14px' }}>
                {formData.inputMode === 'manual' && (
                  <>
                    <div style={{ backgroundColor:'#f8f9ff', border:'1px solid #e8eeff', borderRadius:6, padding:'10px 12px', marginBottom:10 }}>
                      <Row gutter={10} align="middle">
                        <Col span={6}>
                          <Select placeholder="Category" style={{ width:'100%' }} size="small" value={newParamCategory||undefined} onChange={v=>setNewParamCategory(v)}>
                            {PARAM_CATEGORIES.map(cat=><Option key={cat} value={cat}>{cat}</Option>)}
                          </Select>
                        </Col>
                        <Col span={7}>
                          <Input placeholder="Parameter Name" size="small" value={newParamName} onChange={e=>setNewParamName(e.target.value)}/>
                        </Col>
                        <Col span={8}>
                          <Input placeholder="Parameter Value" size="small" value={newParamValue} onChange={e=>setNewParamValue(e.target.value)} onPressEnter={addParameter}/>
                        </Col>
                        <Col span={3}>
                          <Button type="primary" size="small" icon={<PlusOutlined/>} onClick={addParameter} block style={{ fontSize:11 }}>Add</Button>
                        </Col>
                      </Row>
                    </div>
                    {formData.parameters.length > 0 ? (
                      <Table dataSource={formData.parameters} rowKey={(_,i)=>i} pagination={false} size="small" style={{ fontSize:12, marginBottom:10 }}
                        columns={[
                          { title:'Category', dataIndex:'category', key:'category', width:'27%', render:t=><Tag color="blue" style={{fontSize:11}}>{t}</Tag> },
                          { title:'Parameter Name', dataIndex:'name', key:'name', width:'33%' },
                          { title:'Value', dataIndex:'value', key:'value', width:'30%' },
                          { title:'', key:'action', width:'10%', render:(_,__,index)=><Button type="text" danger size="small" icon={<DeleteOutlined/>} onClick={()=>removeParameter(index)}/> }
                        ]} bordered/>
                    ) : (
                      <div style={{ textAlign:'center', padding:'10px 0', color:'#bbb', fontSize:12, marginBottom:4 }}>No parameters yet — add one above.</div>
                    )}
                    <div style={{ borderTop:'1px dashed #e8e8e8', paddingTop:10 }}>
                      <ImgUploadRow refEl={manualImgRef} mode="manual"/>
                    </div>
                  </>
                )}

                {formData.inputMode === 'upload' && (
                  <div>
                    {!formData.uploadedDoc ? (
                      <div onClick={()=>docFileRef.current?.click()} style={{ border:'2px dashed #d0d7ff', borderRadius:8, padding:'22px 20px', textAlign:'center', cursor:'pointer', backgroundColor:'#f8f9ff', transition:'border-color 0.2s', marginBottom:4 }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor='#1890ff'}
                        onMouseLeave={e=>e.currentTarget.style.borderColor='#d0d7ff'}>
                        <InboxOutlined style={{ fontSize:34, color:'#1890ff', marginBottom:6 }}/>
                        <div style={{ fontSize:14, fontWeight:600, color:'#333', marginBottom:3 }}>Click to upload specification document</div>
                        <div style={{ fontSize:12, color:'#888' }}>PDF, Word (.doc/.docx), Excel (.xls/.xlsx), TXT — max 10MB</div>
                        <Button type="primary" size="small" icon={<UploadOutlined/>} style={{ marginTop:10 }}>Browse Files</Button>
                        <input ref={docFileRef} type="file" style={{ display:'none' }} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleDocUpload}/>
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:12, border:'1px solid #e8e8e8', borderRadius:8, padding:'12px 14px', backgroundColor:'#fafffe', marginBottom:4 }}>
                        {getFileIcon(formData.uploadedDoc.type)}
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:13, color:'#333' }}>{formData.uploadedDoc.name}</div>
                          <div style={{ fontSize:11, color:'#888' }}>{formatFileSize(formData.uploadedDoc.size)}</div>
                        </div>
                        <Space>
                          <Button size="small" icon={<UploadOutlined/>} style={{ fontSize:11 }} onClick={()=>docFileRef.current?.click()}>Replace</Button>
                          <Button size="small" danger icon={<DeleteOutlined/>} style={{ fontSize:11 }} onClick={removeDoc}>Remove</Button>
                        </Space>
                        <input ref={docFileRef} type="file" style={{ display:'none' }} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleDocUpload}/>
                      </div>
                    )}
                    <Text type="secondary" style={{ fontSize:11 }}>💡 Upload a document — no need to manually enter parameters.</Text>
                    <div style={{ borderTop:'1px dashed #e8e8e8', marginTop:10, paddingTop:10 }}>
                      <ImgUploadRow refEl={imgFileRef} mode="upload"/>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status + actions */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', backgroundColor:'#f9f9f9', borderRadius:6 }}>
                <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} style={{ width:14, height:14 }} id="status-check"/>
                <label htmlFor="status-check" style={{ fontWeight:500, cursor:'pointer', fontSize:13 }}>Active Specification</label>
              </div>
              <Space>
                <Button onClick={closeModal}>Cancel</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading} icon={editingSpec?<EditOutlined/>:<PlusOutlined/>}>
                  {loading ? 'Saving...' : (editingSpec ? 'Update Specification' : 'Create Specification')}
                </Button>
              </Space>
            </div>
          </div>
        </>
      )}


      {/* ════════════════ DELETE MODAL ════════════════ */}
      {showDeleteModal && specToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)', backgroundColor:'white', padding:'24px', borderRadius:8, width:'440px', maxWidth:'90%', zIndex:1001, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', textAlign:'center' }}>
            <ExclamationCircleOutlined style={{ fontSize:42, color:'#ff4d4f', marginBottom:10 }}/>
            <h3 style={{ color:'#ff4d4f', marginBottom:6 }}>Delete Specification</h3>
            <p style={{ fontSize:14, marginBottom:10 }}>Are you sure you want to delete this modal specification?</p>
            <div style={{ backgroundColor:'#f5f5f5', padding:12, borderRadius:4, marginBottom:12, textAlign:'left', fontSize:13 }}>
              {[['Company',specToDelete.companyName],['Category',specToDelete.deviceCategoryName],['Type',specToDelete.deviceTypeName],['Modal No',specToDelete.modalNo],['Parameters',specToDelete.parameters.length],['Status',specToDelete.status]].map(([k,v])=><p key={k} style={{ margin:'3px 0' }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color:'#ff7875', fontSize:12, marginBottom:16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined/>}>Delete Specification</Button>
            </Space>
          </div>
        </>
      )}


      {/* ════════════════ PREVIEW DATASHEET MODAL ════════════════ */}
      {previewSpecVal && (
        <>
          <div style={{ ...backdropStyle, zIndex:1100 }} onClick={()=>_setPreviewSpec(null)}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'white', borderRadius:10, width:'640px', maxWidth:'95%', maxHeight:'90vh', overflowY:'auto', zIndex:1101, boxShadow:'0 8px 32px rgba(0,0,0,0.22)' }}>

            {/* Preview Header */}
            <div style={{ background:'linear-gradient(135deg,#1890ff 0%,#096dd9 100%)', padding:'14px 20px', borderRadius:'10px 10px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Space size={8}>
                <FileTextOutlined style={{ color:'white', fontSize:16 }}/>
                <Text strong style={{ color:'white', fontSize:15 }}>Specification Datasheet</Text>
                <Tag color="gold" style={{ fontSize:11 }}>{previewSpecVal.modalNo}</Tag>
              </Space>
              <Space>
                <Button size="small" icon={<FileTextOutlined/>} onClick={()=>handleDownload(previewSpecVal)}
                  style={{ fontSize:11, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.4)', color:'white' }}>
                  Download
                </Button>
                <Button type="text" icon={<CloseOutlined style={{ color:'white' }}/>} onClick={()=>_setPreviewSpec(null)}/>
              </Space>
            </div>

            <div style={{ padding:'18px 22px' }}>

              {/* Identity row */}
              <Row gutter={12} style={{ marginBottom:14 }}>
                {[
                  { label:'Company',     value:previewSpecVal.companyName,        color:'#1890ff' },
                  { label:'Category',    value:previewSpecVal.deviceCategoryName, color:'#fa8c16' },
                  { label:'Device Type', value:previewSpecVal.deviceTypeName,     color:'#52c41a' },
                  { label:'Status',      value:previewSpecVal.status,             color:previewSpecVal.status==='Active'?'#52c41a':'#ff4d4f' },
                ].map(({ label, value, color }) => (
                  <Col span={6} key={label}>
                    <div style={{ backgroundColor:'#f8f9ff', borderRadius:6, padding:'8px 10px', textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'#888', marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:12, fontWeight:700, color }}>{value}</div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Text sections */}
              {[
                { label:'Introduction', value:previewSpecVal.intro,    icon:'📋' },
                { label:'Uses',         value:previewSpecVal.uses,     icon:'🔧' },
                { label:'Features',     value:previewSpecVal.features, icon:'⚡' },
              ].map(({ label, value, icon }) => value ? (
                <div key={label} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#444', marginBottom:4 }}>{icon} {label}</div>
                  <div style={{ backgroundColor:'#fafafa', border:'1px solid #f0f0f0', borderRadius:6, padding:'8px 12px', fontSize:12, color:'#555', lineHeight:1.6 }}>{value}</div>
                </div>
              ) : null)}

              {/* Parameters table */}
              {previewSpecVal.parameters.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#444', marginBottom:6 }}>⚙️ Parameters ({previewSpecVal.parameters.length})</div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ backgroundColor:'#f0f5ff' }}>
                        {['Category','Parameter','Value'].map(h=>(
                          <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontWeight:600, color:'#444', borderBottom:'2px solid #d6e4ff' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewSpecVal.parameters.map((p, i) => (
                        <tr key={i} style={{ backgroundColor: i%2===0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding:'6px 10px', borderBottom:'1px solid #f0f0f0' }}>
                            <Tag color="blue" style={{ fontSize:10, margin:0 }}>{p.category}</Tag>
                          </td>
                          <td style={{ padding:'6px 10px', borderBottom:'1px solid #f0f0f0', fontWeight:500 }}>{p.name}</td>
                          <td style={{ padding:'6px 10px', borderBottom:'1px solid #f0f0f0', color:'#555' }}>{p.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Uploaded doc notice */}
              {previewSpecVal.uploadedDoc && (
                <div style={{ display:'flex', alignItems:'center', gap:10, backgroundColor:'#fff7e6', border:'1px solid #ffd591', borderRadius:6, padding:'8px 12px', marginBottom:12 }}>
                  {getFileIcon(previewSpecVal.uploadedDoc.type)}
                  <div>
                    <div style={{ fontSize:12, fontWeight:600 }}>{previewSpecVal.uploadedDoc.name}</div>
                    <div style={{ fontSize:11, color:'#888' }}>{formatFileSize(previewSpecVal.uploadedDoc.size)}</div>
                  </div>
                </div>
              )}

              {/* Images */}
              {[...(previewSpecVal.images||[]), ...(previewSpecVal.uploadImages||[])].length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#444', marginBottom:6 }}>🖼️ Images</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {[...(previewSpecVal.images||[]), ...(previewSpecVal.uploadImages||[])].map((img,i)=>(
                      <img key={i} src={img.url} alt={img.name} onClick={()=>setShowImgPreview(img.url)}
                        style={{ width:72, height:72, objectFit:'cover', borderRadius:6, border:'1px solid #e0e0e0', cursor:'pointer' }}/>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}


      {/* ════════════════ IMAGE LIGHTBOX ════════════════ */}
      {showImgPreview && (
        <>
          <div style={{ ...backdropStyle, zIndex:1200 }} onClick={()=>setShowImgPreview(null)}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:1201, maxWidth:'90vw', maxHeight:'90vh', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <img src={showImgPreview} alt="preview" style={{ maxWidth:'80vw', maxHeight:'80vh', borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', objectFit:'contain' }}/>
            <Button type="primary" icon={<CloseOutlined/>} style={{ marginTop:12 }} onClick={()=>setShowImgPreview(null)}>Close</Button>
          </div>
        </>
      )}

    </div>
  );
};

export default ModalSpecification;