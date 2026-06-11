import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useResources } from '@/hooks/useResources';
import {
  upsertGroup, deleteGroup, upsertEmployee, deleteEmployee,
  upsertResourceType, deleteResourceType, upsertResource, deleteResource,
  addResourceAccess, removeResourceAccess,
} from '@/services/resourceService';

const ResourceAdmin = () => {
  const { groups, employees, types, resources, access, refresh, loading } = useResources();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<any>, ok = 'Đã lưu') => {
    setBusy(true);
    try { const r = await fn(); if (r?.error) throw r.error; toast.success(ok); await refresh(); }
    catch (e: any) { toast.error(e.message || 'Lỗi'); }
    finally { setBusy(false); }
  };

  // form states
  const [newGroup, setNewGroup] = useState('');
  const [newEmp, setNewEmp] = useState({ name: '', display_name: '', group: '' });
  const [newType, setNewType] = useState('');
  const [newRes, setNewRes] = useState({ name: '', type: '' });

  if (loading) return <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline" /></div>;

  return (
    <Tabs defaultValue="types" className="w-full">
      <TabsList className="flex flex-wrap h-auto">
        <TabsTrigger value="types">Resource Types</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
        <TabsTrigger value="groups">Employee Groups</TabsTrigger>
        <TabsTrigger value="employees">Employees</TabsTrigger>
        <TabsTrigger value="access">Access Rules</TabsTrigger>
      </TabsList>

      {/* TYPES */}
      <TabsContent value="types">
        <Card><CardHeader><CardTitle className="text-base">Thêm Resource Type</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="Tên (Nick, Fanpage...)" value={newType} onChange={e => setNewType(e.target.value)} />
            <Button disabled={busy || !newType.trim()} onClick={() => run(async () => { await upsertResourceType({ name: newType.trim() }); setNewType(''); })}><Plus className="w-4 h-4" /></Button>
          </CardContent>
        </Card>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Tên</TableHead><TableHead className="w-24">Active</TableHead><TableHead className="w-24">Order</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
          <TableBody>
            {types.map(t => (
              <TableRow key={t.id}>
                <TableCell><Input defaultValue={t.name} onBlur={e => e.target.value !== t.name && run(() => upsertResourceType({ id: t.id, name: e.target.value }))} /></TableCell>
                <TableCell><Switch checked={t.active} onCheckedChange={v => run(() => upsertResourceType({ id: t.id, active: v }))} /></TableCell>
                <TableCell><Input type="number" defaultValue={t.sort_order} onBlur={e => Number(e.target.value) !== t.sort_order && run(() => upsertResourceType({ id: t.id, sort_order: Number(e.target.value) }))} /></TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => run(() => deleteResourceType(t.id), 'Đã xóa')}><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      {/* RESOURCES */}
      <TabsContent value="resources">
        <Card><CardHeader><CardTitle className="text-base">Thêm Resource</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input placeholder="Tên" value={newRes.name} onChange={e => setNewRes({ ...newRes, name: e.target.value })} />
            <Select value={newRes.type} onValueChange={v => setNewRes({ ...newRes, type: v })}>
              <SelectTrigger><SelectValue placeholder="Resource Type" /></SelectTrigger>
              <SelectContent>{types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={busy || !newRes.name.trim() || !newRes.type} onClick={() => run(async () => { await upsertResource({ name: newRes.name.trim(), resource_type_id: newRes.type }); setNewRes({ name: '', type: '' }); })}><Plus className="w-4 h-4 mr-1" /> Thêm</Button>
          </CardContent>
        </Card>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Tên</TableHead><TableHead>Type</TableHead><TableHead className="w-24">Active</TableHead><TableHead className="w-24">Order</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
          <TableBody>
            {resources.map(r => (
              <TableRow key={r.id}>
                <TableCell><Input defaultValue={r.name} onBlur={e => e.target.value !== r.name && run(() => upsertResource({ id: r.id, name: e.target.value }))} /></TableCell>
                <TableCell>
                  <Select value={r.resource_type_id} onValueChange={v => run(() => upsertResource({ id: r.id, resource_type_id: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Switch checked={r.active} onCheckedChange={v => run(() => upsertResource({ id: r.id, active: v }))} /></TableCell>
                <TableCell><Input type="number" defaultValue={r.sort_order} onBlur={e => Number(e.target.value) !== r.sort_order && run(() => upsertResource({ id: r.id, sort_order: Number(e.target.value) }))} /></TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => run(() => deleteResource(r.id), 'Đã xóa')}><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      {/* GROUPS */}
      <TabsContent value="groups">
        <Card><CardHeader><CardTitle className="text-base">Thêm Group</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="Tên (Sale, Livestream...)" value={newGroup} onChange={e => setNewGroup(e.target.value)} />
            <Button disabled={busy || !newGroup.trim()} onClick={() => run(async () => { await upsertGroup({ name: newGroup.trim() }); setNewGroup(''); })}><Plus className="w-4 h-4" /></Button>
          </CardContent>
        </Card>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Tên</TableHead><TableHead className="w-24">Active</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
          <TableBody>
            {groups.map(g => (
              <TableRow key={g.id}>
                <TableCell><Input defaultValue={g.name} onBlur={e => e.target.value !== g.name && run(() => upsertGroup({ id: g.id, name: e.target.value }))} /></TableCell>
                <TableCell><Switch checked={g.active} onCheckedChange={v => run(() => upsertGroup({ id: g.id, active: v }))} /></TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => run(() => deleteGroup(g.id), 'Đã xóa')}><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      {/* EMPLOYEES */}
      <TabsContent value="employees">
        <Card><CardHeader><CardTitle className="text-base">Thêm Nhân viên</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Input placeholder="Account name (vd: Ms. Nga - Live)" value={newEmp.name} onChange={e => {
              const v = e.target.value;
              const suggested = v.split(/\s+[-–|@/]\s+|\s*[-–|]\s*/)[0].trim();
              setNewEmp(p => ({ ...p, name: v, display_name: p.display_name && p.display_name !== suggested ? p.display_name : suggested }));
            }} />
            <Input placeholder="Display name (vd: Ms. Nga)" value={newEmp.display_name} onChange={e => setNewEmp({ ...newEmp, display_name: e.target.value })} />
            <Select value={newEmp.group} onValueChange={v => setNewEmp({ ...newEmp, group: v })}>
              <SelectTrigger><SelectValue placeholder="Group" /></SelectTrigger>
              <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={busy || !newEmp.name.trim()} onClick={() => run(async () => {
              const dn = newEmp.display_name.trim() || newEmp.name.trim();
              await upsertEmployee({ name: newEmp.name.trim(), display_name: dn, employee_group_id: newEmp.group || null });
              setNewEmp({ name: '', display_name: '', group: '' });
            })}><Plus className="w-4 h-4 mr-1" /> Thêm</Button>
          </CardContent>
        </Card>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Account Name</TableHead><TableHead>Display Name</TableHead><TableHead>Group</TableHead><TableHead className="w-24">Active</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
          <TableBody>
            {employees.map(e => (
              <TableRow key={e.id}>
                <TableCell><Input defaultValue={e.name} onBlur={ev => ev.target.value !== e.name && run(() => upsertEmployee({ id: e.id, name: ev.target.value }))} /></TableCell>
                <TableCell><Input defaultValue={e.display_name ?? e.name} placeholder="Display name" onBlur={ev => ev.target.value !== (e.display_name ?? '') && run(() => upsertEmployee({ id: e.id, display_name: ev.target.value.trim() || e.name }))} /></TableCell>
                <TableCell>
                  <Select value={e.employee_group_id ?? ''} onValueChange={v => run(() => upsertEmployee({ id: e.id, employee_group_id: v || null }))}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Switch checked={e.active} onCheckedChange={v => run(() => upsertEmployee({ id: e.id, active: v }))} /></TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => run(() => deleteEmployee(e.id), 'Đã xóa')}><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      {/* ACCESS */}
      <TabsContent value="access">
        <div className="text-sm text-muted-foreground mb-2">Tick các group được phép dùng resource. Không tick group nào = mở cho tất cả nhân viên.</div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Resource</TableHead>
            {groups.map(g => <TableHead key={g.id} className="text-center">{g.name}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {resources.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                {groups.map(g => {
                  const checked = access.some(a => a.resource_id === r.id && a.employee_group_id === g.id);
                  return (
                    <TableCell key={g.id} className="text-center">
                      <Checkbox checked={checked} onCheckedChange={() => run(() => checked ? removeResourceAccess(r.id, g.id) : addResourceAccess(r.id, g.id))} />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
};

export default ResourceAdmin;
