import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Eye, Download, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";

const UploadHistory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const { user } = useAuth();
  const { toast } = useToast();

  // Resolve API base URL
  const apiBase = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim())
    ? process.env.REACT_APP_API_URL.trim()
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : '';

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(page === 1);
      setRefreshing(page > 1);
      
      const response = await fetch(`${apiBase}/api/analysis/history?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses);
        setPagination(data.pagination);
      } else {
        toast({
          title: "Failed to load history",
          description: "Could not fetch your analysis history",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const getResultBadge = (analysis) => {
    if (analysis.status === 'processing') {
      return <Badge variant="secondary">Processing...</Badge>;
    }
    if (analysis.status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (analysis.status === 'uploaded') {
      return <Badge variant="outline">Uploaded</Badge>;
    }
    
    const diagnosis = analysis.results?.diagnosis || 'Unknown';
    if (diagnosis.toLowerCase().includes('normal')) {
      return <Badge className="bg-success text-success-foreground">Normal</Badge>;
    }
    if (diagnosis.toLowerCase().includes('abnormal')) {
      return <Badge variant="destructive">Abnormal</Badge>;
    }
    return <Badge variant="secondary">{diagnosis}</Badge>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
  <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload History</h1>
        <p className="text-muted-foreground">
          View and manage all your previous medical image analyses.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardContent className="p-6 h-32 flex items-center justify-center text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Uploads</p>
              <p className="text-3xl font-bold">{pagination.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6 h-32 flex items-center justify-center text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-3xl font-bold">
                {analyses.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6 h-32 flex items-center justify-center text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Processing</p>
              <p className="text-3xl font-bold">
                {analyses.filter(a => a.status === 'processing').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>List of recently analyzed medical images</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHistory(pagination.page)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No analyses found. Upload your first medical image to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow key={analysis._id}>
                    <TableCell className="font-medium">
                      {analysis._id.slice(-8)}
                    </TableCell>
                    <TableCell>{analysis.originalName}</TableCell>
                    <TableCell>{analysis.imageType}</TableCell>
                    <TableCell>{getResultBadge(analysis)}</TableCell>
                    <TableCell>
                      {analysis.results?.confidence 
                        ? `${analysis.results.confidence}%` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {formatDate(analysis.createdAt)}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {formatTime(analysis.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {analysis.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadHistory;