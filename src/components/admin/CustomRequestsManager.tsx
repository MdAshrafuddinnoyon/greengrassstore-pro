import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, Loader2, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExportButtons } from "./ExportButtons";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CustomRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  title: string;
  description: string;
  requirement_type: string;
  budget: string | null;
  timeline: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const CustomRequestsManager = () => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from("custom_requirements")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    // Real-time subscription for custom requests
    const channel = supabase
      .channel('admin-custom-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_requirements' },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("custom_requirements")
      .update({ status, admin_notes: adminNotes })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
      console.error(error);
    } else {
      toast.success("Status updated successfully");
      fetchRequests();
      setSelectedRequest(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    const { error } = await supabase
      .from("custom_requirements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete request");
    } else {
      toast.success("Request deleted");
      fetchRequests();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} requests?`)) return;
    
    try {
      const { error } = await supabase.from('custom_requirements').delete().in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} requests deleted`);
      setSelectedIds([]);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to delete requests');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('custom_requirements')
        .update({ status })
        .in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} requests updated to ${status}`);
      setSelectedIds([]);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update requests');
    }
  };

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRequests.map(r => r.id));
    }
  };

  const toggleSelectOne = (id: string, event?: React.MouseEvent) => {
    const currentIndex = paginatedRequests.findIndex(r => r.id === id);
    
    // Shift+Click for range selection
    if (event?.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const rangeIds = paginatedRequests.slice(start, end + 1).map(r => r.id);
      setSelectedIds(prev => [...new Set([...prev, ...rangeIds])]);
      return;
    }
    
    // Ctrl/Cmd+Click for toggle
    if (event?.ctrlKey || event?.metaKey) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
      setLastSelectedIndex(currentIndex);
      return;
    }
    
    // Normal click
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
    setLastSelectedIndex(currentIndex);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "in_progress": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Pagination
  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const paginatedRequests = requests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Keyboard shortcuts - must be after paginatedRequests is defined
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' && (e.ctrlKey || e.metaKey) && paginatedRequests.length > 0) {
        e.preventDefault();
        setSelectedIds(paginatedRequests.map(r => r.id));
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
        setLastSelectedIndex(null);
      }
      if (e.key === 'Delete' && selectedIds.length > 0) {
        handleBulkDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedRequests, selectedIds]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Custom Requests
            </CardTitle>
            <CardDescription>Manage customer custom requirements</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="outline" size="sm" onClick={() => fetchRequests()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <ExportButtons 
              data={requests} 
              filename={`custom-requests-${new Date().toISOString().split('T')[0]}`}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('in_progress')}>
              Mark In Progress
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('completed')}>
              Mark Completed
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('rejected')}>
              Reject
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
            <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
              Tip: Ctrl+A select all, Shift+Click range, Escape clear
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No custom requests yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedIds.length === paginatedRequests.length && paginatedRequests.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(request.id)}
                          onCheckedChange={() => toggleSelectOne(request.id)}
                          onClick={(e) => toggleSelectOne(request.id, e as unknown as React.MouseEvent)}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.name}</p>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {request.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.requirement_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setAdminNotes(request.admin_notes || "");
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Request Details</DialogTitle>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Customer</Label>
                                      <p className="font-medium">{selectedRequest.name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Email</Label>
                                      <p className="font-medium">{selectedRequest.email}</p>
                                    </div>
                                    {selectedRequest.phone && (
                                      <div>
                                        <Label className="text-muted-foreground">Phone</Label>
                                        <p className="font-medium">{selectedRequest.phone}</p>
                                      </div>
                                    )}
                                    <div>
                                      <Label className="text-muted-foreground">Type</Label>
                                      <p className="font-medium">{selectedRequest.requirement_type}</p>
                                    </div>
                                    {selectedRequest.budget && (
                                      <div>
                                        <Label className="text-muted-foreground">Budget</Label>
                                        <p className="font-medium">{selectedRequest.budget}</p>
                                      </div>
                                    )}
                                    {selectedRequest.timeline && (
                                      <div>
                                        <Label className="text-muted-foreground">Timeline</Label>
                                        <p className="font-medium">{selectedRequest.timeline}</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <Label className="text-muted-foreground">Title</Label>
                                    <p className="font-medium">{selectedRequest.title}</p>
                                  </div>

                                  <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="notes">Admin Notes</Label>
                                    <Textarea
                                      id="notes"
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add notes about this request..."
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateStatus(selectedRequest.id, "in_progress")}
                                    >
                                      In Progress
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-green-500 hover:bg-green-600"
                                      onClick={() => updateStatus(selectedRequest.id, "completed")}
                                    >
                                      Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => updateStatus(selectedRequest.id, "rejected")}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(request.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, requests.length)} of {requests.length}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
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
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};