// src/pages/Shads.jsx
import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown, FaPlus } from 'react-icons/fa';
import { CO2API, gasFetch } from '../../config';

const Shads = () => {
  console.log('Shads component rendering');

  const [shads, setShads] = useState([]);
  const [originalShads, setOriginalShads] = useState([]); // Store original data for sorting
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShad, setEditingShad] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    status: true,
    regDate: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [saveLoading, setSaveLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });
  
  const pageSize = 10;

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000); // 3 seconds

      return () => clearTimeout(timer); // Cleanup timer on unmount
    }
  }, [successMessage]);

  // Auto-hide error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch shads data with pagination
  const fetchShads = async (page = 1) => {
    try {
      setLoading(true);
      
      const response = await gasFetch(
        `${CO2API}/api/shads?pageNumber=${page}&pageSize=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Extract the data array from the response
      const shadsData = result.data || [];
      setShads(shadsData);
      setOriginalShads(shadsData); // Store original for sorting
      setTotalRecords(result.totalRecords || 0);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data. Please try again.');
      setShads([]);
      setOriginalShads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShads(1);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      regDate: new Date().toISOString()
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaveLoading(true);
      
      let response;
      
      if (editingShad) {
        // PUT request for editing
        response = await gasFetch(`${CO2API}/api/shads/${editingShad.id}`, {
          method: 'PUT',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
      } else {
        // POST request for adding new
        response = await gasFetch(`${CO2API}/api/shads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${editingShad ? 'update' : 'save'} data`);
      }

      // Refresh the data after successful save/update
      fetchShads(currentPage);
      setOpenDialog(false);
      setEditingShad(null);
      setFormData({ 
        name: '', 
        status: true, 
        regDate: new Date().toISOString() 
      });
      
      // Show success pop-up
      setSuccessMessage(editingShad ? 'Godown updated successfully!' : 'Godown added successfully!');
      setError(null);
      
    } catch (err) {
      console.error('Submit error:', err);
      setError(`Failed to ${editingShad ? 'update' : 'save'}. Please try again.`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (shad) => {
    setEditingShad(shad);
    setFormData({
      name: shad.name,
      status: shad.status,
      regDate: shad.regDate || new Date().toISOString()
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Godown?')) {
      try {
        setLoading(true);
        const response = await gasFetch(`${CO2API}/api/shads/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete');
        }
        
        // Refresh data after delete
        fetchShads(currentPage);
        
        // Show success pop-up
        setSuccessMessage('Godown deleted successfully!');
        
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddNew = () => {
    setEditingShad(null);
    setFormData({ 
      name: '', 
      status: true, 
      regDate: new Date().toISOString() 
    });
    setOpenDialog(true);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  // Sorting functionality
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    
    const sortedData = [...shads].sort((a, b) => {
      if (key === 'id') {
        // For ID, use the index (1,2,3...)
        const indexA = shads.indexOf(a);
        const indexB = shads.indexOf(b);
        return direction === 'ascending' ? indexA - indexB : indexB - indexA;
      }
      
      if (key === 'name') {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        if (nameA < nameB) return direction === 'ascending' ? -1 : 1;
        if (nameA > nameB) return direction === 'ascending' ? 1 : -1;
        return 0;
      }
      
      if (key === 'status') {
        return direction === 'ascending' ? a.status - b.status : b.status - a.status;
      }
      
      if (key === 'regDate') {
        const dateA = new Date(a.regDate);
        const dateB = new Date(b.regDate);
        return direction === 'ascending' ? dateA - dateB : dateB - dateA;
      }
      
      return 0;
    });
    
    setShads(sortedData);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort style={{ fontSize: '12px', opacity: 0.5 }} />;
    }
    return sortConfig.direction === 'ascending' ? 
      <FaSortUp style={{ fontSize: '12px' }} /> : 
      <FaSortDown style={{ fontSize: '12px' }} />;
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  if (loading && shads.length === 0) {
    return (
      <div style={{ 
        padding: 20, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <h2>Godown Management</h2>
        <p>Loading data...</p>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #31D197',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginTop: '20px'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: '2px solid #e0e0e0'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>Godown Management</h1>
        <button
          onClick={handleAddNew}
          style={{
            backgroundColor: '#31D197',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#10B981'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#31D197'}
        >
          <FaPlus /> Add New Godown
        </button>
      </div>

      {/* Success Message Popup */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#4caf50',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>✓</span>
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '15px 25px',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minWidth: '300px',
          maxWidth: '500px'
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c62828',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        color: '#666'
      }}>
        <div>
          Total Records: <strong>{totalRecords}</strong>
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Table */}
      <div style={{ 
        overflowX: 'auto',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          minWidth: '600px'
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #ddd'
            }}>
              <th 
                style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderRight: '1px solid #ddd',
                  fontWeight: 'bold',
                  color: '#333',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => requestSort('id')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ID {getSortIndicator('id')}
                </div>
              </th>
              <th 
                style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderRight: '1px solid #ddd',
                  fontWeight: 'bold',
                  color: '#333',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => requestSort('name')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Name {getSortIndicator('name')}
                </div>
              </th>
              <th 
                style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderRight: '1px solid #ddd',
                  fontWeight: 'bold',
                  color: '#333',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => requestSort('status')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Status {getSortIndicator('status')}
                </div>
              </th>
              <th 
                style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderRight: '1px solid #ddd',
                  fontWeight: 'bold',
                  color: '#333',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => requestSort('regDate')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Registration Date {getSortIndicator('regDate')}
                </div>
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left',
                fontWeight: 'bold',
                color: '#333'
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shads.length > 0 ? (
              shads.map((shad, index) => (
                <tr 
                  key={shad.id} 
                  style={{ 
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={{ 
                    padding: '16px', 
                    borderRight: '1px solid #ddd',
                    color: '#666',
                    fontWeight: '500'
                  }}>
                    {index + 1} {/* Show 1, 2, 3... instead of actual ID */}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    borderRight: '1px solid #ddd',
                    fontWeight: '500'
                  }}>
                    {shad.name}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    borderRight: '1px solid #ddd'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: shad.status ? '#e8f5e9' : '#ffebee',
                      color: shad.status ? '#2e7d32' : '#c62828',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      {shad.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    borderRight: '1px solid #ddd',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    {formatDate(shad.regDate)}
                  </td>
                  <td style={{ 
                    padding: '16px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => handleEdit(shad)}
                        title="Edit"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#1976d2',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#e3f2fd';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(shad.id)}
                        title="Delete"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#f44336',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#ffebee';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan="5" 
                  style={{ 
                    padding: '40px', 
                    textAlign: 'center',
                    color: '#999'
                  }}
                >
                  {error ? (
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>😕</div>
                      <p style={{ fontSize: '18px' }}>Unable to load data</p>
                      <button
                        onClick={() => fetchShads(1)}
                        style={{
                          marginTop: '15px',
                          padding: '10px 20px',
                          backgroundColor: '#31D197',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
                      <p style={{ fontSize: '18px' }}>No Godown found</p>
                      <p style={{ fontSize: '14px', marginTop: '5px' }}>
                        Click the "+ Add New Godown" button to create one
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginTop: '30px',
          gap: '10px'
        }}>
          <button
            onClick={() => fetchShads(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white',
              borderRadius: '4px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              color: currentPage === 1 ? '#999' : '#333'
            }}
          >
            ← Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => fetchShads(pageNum)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  backgroundColor: currentPage === pageNum ? '#31D197' : 'white',
                  color: currentPage === pageNum ? 'white' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                }}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => fetchShads(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              backgroundColor: currentPage === totalPages ? '#f5f5f5' : 'white',
              borderRadius: '4px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              color: currentPage === totalPages ? '#999' : '#333'
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      {openDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '25px',
              color: '#333'
            }}>
              {editingShad ? 'Edit Godown' : 'Add New Godown'}
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontWeight: '500',
                color: '#555'
              }}>
                Name:
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter Godown name"
              />
            </div>
            
            <div style={{ 
              marginBottom: '25px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="checkbox"
                name="status"
                checked={formData.status}
                onChange={handleInputChange}
                style={{ 
                  width: '20px', 
                  height: '20px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
                id="status-checkbox"
              />
              <label 
                htmlFor="status-checkbox"
                style={{ 
                  cursor: 'pointer',
                  color: '#555'
                }}
              >
                Active
              </label>
            </div>
            
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              marginTop: '30px'
            }}>
              <button
                onClick={() => {
                  setOpenDialog(false);
                  setEditingShad(null);
                  setFormData({ 
                    name: '', 
                    status: true, 
                    regDate: new Date().toISOString() 
                  });
                }}
                disabled={saveLoading}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  color: '#333',
                  transition: 'all 0.2s',
                  opacity: saveLoading ? 0.7 : 1
                }}
                onMouseOver={(e) => {
                  if (!saveLoading) {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.borderColor = '#ccc';
                  }
                }}
                onMouseOut={(e) => {
                  if (!saveLoading) {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#ddd';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim() || saveLoading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: !formData.name.trim() || saveLoading ? '#ccc' : '#31D197',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !formData.name.trim() || saveLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'background-color 0.2s',
                  opacity: !formData.name.trim() || saveLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (formData.name.trim() && !saveLoading) {
                    e.target.style.backgroundColor = '#10B981';
                  }
                }}
                onMouseOut={(e) => {
                  if (formData.name.trim() && !saveLoading) {
                    e.target.style.backgroundColor = '#31D197';
                  }
                }}
              >
                {saveLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    {editingShad ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  editingShad ? 'Update' : 'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>


    </div>
  );
};

export default Shads;