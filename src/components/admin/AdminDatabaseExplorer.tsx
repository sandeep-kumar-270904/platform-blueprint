import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminDatabaseExplorer = () => {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editJson, setEditJson] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/collections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections);
      }
    } catch (err) {
      toast.error('Failed to load collections');
    }
  };

  const fetchRecords = async (collection: string, searchQuery: string = '') => {
    setLoading(true);
    setSelectedCollection(collection);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/collections/${collection}?search=${searchQuery}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
      }
    } catch (err) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCollection) {
      fetchRecords(selectedCollection, search);
    }
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setEditJson(JSON.stringify(record, null, 2));
  };

  const saveRecord = async () => {
    if (!selectedCollection || !editingRecord) return;
    try {
      let parsed;
      try {
        parsed = JSON.parse(editJson);
      } catch(e) {
        toast.error('Invalid JSON');
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/collections/${selectedCollection}/${editingRecord._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsed)
      });

      if (res.ok) {
        toast.success('Record updated successfully and logged in Audit Trail');
        setEditingRecord(null);
        fetchRecords(selectedCollection, search);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error during update');
    }
  };

  const deleteRecord = async (id: string) => {
    if (!selectedCollection) return;
    if (!window.confirm(`Are you sure you want to delete this ${selectedCollection} record? This action will be logged.`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/collections/${selectedCollection}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Record deleted');
        fetchRecords(selectedCollection, search);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Delete failed');
      }
    } catch (err) {
      toast.error('Network error during delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Collections Sidebar */}
        <Card className="w-full md:w-64 flex-shrink-0 h-[800px] overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-lg">Collections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {collections.map(c => (
              <Button 
                key={c} 
                variant={selectedCollection === c ? "default" : "ghost"} 
                className="w-full justify-start text-left font-mono text-xs h-8"
                onClick={() => { setSearch(''); fetchRecords(c); }}
              >
                {c}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Data Grid */}
        <Card className="flex-grow h-[800px] flex flex-col">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{selectedCollection ? selectedCollection : 'Select a Collection'}</CardTitle>
                <CardDescription>View, edit, and delete raw database records.</CardDescription>
              </div>
              {selectedCollection && (
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search records..." 
                    className="h-9 rounded-md border px-3 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button type="submit" size="sm">Search</Button>
                </form>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-auto p-0">
            {!selectedCollection ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a collection from the sidebar to browse records.
              </div>
            ) : loading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">
                Loading {selectedCollection} records...
              </div>
            ) : records.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No records found.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-gray-50 sticky top-0 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">ID</th>
                    <th className="px-6 py-3 font-medium">Preview Data</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map(record => (
                    <tr key={record._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-xs">{record._id}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-md truncate">
                          {record.email || record.username || record.title || record.name || record.status || JSON.stringify(record).substring(0, 50)}
                          {record.deleted || record.banned || record.isDeleted ? <Badge variant="destructive" className="ml-2">Deleted</Badge> : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : (record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A')}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(record)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteRecord(record._id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Screen Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <CardHeader className="border-b">
              <CardTitle>Edit {selectedCollection}</CardTitle>
              <CardDescription>ID: {editingRecord._id}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0 bg-slate-900">
              <textarea 
                className="w-full h-full p-4 font-mono text-sm bg-slate-900 text-green-400 focus:outline-none resize-none"
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                spellCheck="false"
              />
            </CardContent>
            <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 rounded-b-xl">
              <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancel</Button>
              <Button onClick={saveRecord}>Save Changes (Logs Audit)</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
