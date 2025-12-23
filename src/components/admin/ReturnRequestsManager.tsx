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
import { Input } from "@/components/ui/input";
import { Eye, Loader2, RefreshCw, Trash2, RotateCcw, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
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

interface ReturnRequest {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  reason: string;
  status: string;
  admin_notes: string | null;
  refund_amount: number | null;
  created_at: string;
}

export const ReturnRequestsManager = () => {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Try to fetch from return_requests table first, fallback to custom_requirements
      let { data, error } = await supabase
        .from("custom_requirements")
        .select("*")
        .or('requirement_type.eq.return_request,requirement_type.eq.refund,requirement_type.eq.return')
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching return requests:", error);
        setRequests([]);
        return;
      }

      // Map custom_requirements to ReturnRequest format
      const mappedRequests: ReturnRequest[] = (data || []).map(req => ({
        id: req.id,
        order_id: req.id,
        order_number: req.title?.replace('Return Request - Order #', '') || 'N/A',
        customer_name: req.name || 'Unknown',
        customer_email: req.email || '',
        customer_phone: req.phone,
        reason: req.description || '',
        status: req.status || 'pending',
        admin_notes: req.admin_notes,
        refund_amount: null,
        created_at: req.created_at
      }));

      if (statusFilter !== "all") {
        setRequests(mappedRequests.filter(r => r.status === statusFilter));
      } else {
        setRequests(mappedRequests);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Real-time subscription
    const channel = supabase
      .channel('admin-return-requests-realtime')
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
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("custom_requirements")
        .update({ 
          status, 
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Status updated successfully");
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this return request?')) return;
    
    try {
      const { error } = await supabase
        .from("custom_requirements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Request deleted");
      fetchRequests();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete request");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} requests?`)) return;
    
    try {
      const { error } = await supabase
        .from('custom_requirements')
        .delete()
        .in('id', selectedIds);
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
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} requests updated to ${status}`);
      setSelectedIds([]);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update requests');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "approved": return "bg-green-500";
      case "processing": return "bg-blue-500";
      case "completed": return "bg-green-600";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "approved": case "completed": return <CheckCircle className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRequests.map(r => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const paginatedRequests = requests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Return/Refund Requests
            </CardTitle>
            <CardDescription>Manage customer return and refund requests</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="outline" size="sm" onClick={() => fetchRequests()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <ExportButtons 
              data={requests} 
              filename={`return-requests-${new Date().toISOString().split('T')[0]}`}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
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
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('approved')}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('completed')}>
              Complete
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('rejected')}>
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No return requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">Customer return requests will appear here</p>
          </div>
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
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
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
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {request.order_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{request.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(request.status)}
                          {request.status}
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
                                  setRefundAmount(request.refund_amount?.toString() || "");
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Return Request Details</DialogTitle>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Order Number</Label>
                                      <p className="font-mono">{selectedRequest.order_number}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Date</Label>
                                      <p>{formatDate(selectedRequest.created_at)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Customer</Label>
                                      <p>{selectedRequest.customer_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Email</Label>
                                      <p>{selectedRequest.customer_email}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-muted-foreground">Return Reason</Label>
                                    <p className="p-3 bg-muted rounded-lg mt-1">{selectedRequest.reason}</p>
                                  </div>

                                  <div>
                                    <Label>Refund Amount (AED)</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        placeholder="Enter refund amount"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Admin Notes</Label>
                                    <Textarea
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add notes about this return..."
                                      rows={3}
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label>Update Status</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => updateStatus(selectedRequest.id, 'approved')}
                                        disabled={updatingStatus}
                                        className="bg-green-50 hover:bg-green-100 text-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => updateStatus(selectedRequest.id, 'rejected')}
                                        disabled={updatingStatus}
                                        className="bg-red-50 hover:bg-red-100 text-red-700"
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Reject
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => updateStatus(selectedRequest.id, 'processing')}
                                        disabled={updatingStatus}
                                      >
                                        Processing
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => updateStatus(selectedRequest.id, 'completed')}
                                        disabled={updatingStatus}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                                      >
                                        Complete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(request.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      page = currentPage - 2 + i;
                      if (page > totalPages) page = totalPages - 4 + i;
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <div className="text-sm text-muted-foreground mt-2 text-center">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, requests.length)} of {requests.length} requests
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
