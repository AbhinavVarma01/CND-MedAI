import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Activity, Upload, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import dashboardPreview from "../assets/dashboard-preview.jpg";
import { useAuth } from "../context/AuthContext";

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalScans: 0,
    completedScans: 0,
    processingScans: 0,
    avgConfidence: 0
  });

  // Resolve API base URL
  const apiBase = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim())
    ? process.env.REACT_APP_API_URL.trim()
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : '';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiBase}/api/analysis/history?limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const analyses = data.analyses;
        
        const completedAnalyses = analyses.filter(a => a.status === 'completed');
        const avgConfidence = completedAnalyses.length > 0 
          ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.results?.confidence || 0), 0) / completedAnalyses.length)
          : 0;

        setStats({
          totalScans: data.pagination.total,
          completedScans: completedAnalyses.length,
          processingScans: analyses.filter(a => a.status === 'processing').length,
          avgConfidence
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const statsData = [
    { label: "Total Scans", value: stats.totalScans.toString(), icon: Upload, color: "text-primary" },
    { label: "Completed", value: stats.completedScans.toString(), icon: Activity, color: "text-secondary" },
    { label: "Processing", value: stats.processingScans.toString(), icon: FileText, color: "text-accent" },
    { label: "Avg. Confidence", value: `${stats.avgConfidence}%`, icon: TrendingUp, color: "text-success" },
  ];

  const recentActivity = [
    { type: "CT Scan", patient: "Patient #4521", result: "Normal", date: "2 hours ago" },
    { type: "MRI Brain", patient: "Patient #4520", result: "Abnormal - Review Required", date: "5 hours ago" },
    { type: "Histopathology", patient: "Patient #4519", result: "Normal", date: "1 day ago" },
  ];

  const getFirstName = () => {
    const name = user?.fullName || user?.full_name || user?.name || "";
    let first = "";
    if (name) {
      first = name.trim().split(" ")[0];
    } else if (user?.email) {
      first = user.email.split("@")[0];
    }
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : "";
  };
  const firstName = getFirstName();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {`Welcome to your dashboard${firstName ? `, ${firstName}` : ""}!`}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your diagnostic analyses today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="border-border hover:shadow-medium transition-shadow">
            <CardContent className="p-6 relative h-32 flex items-center justify-center text-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={cn("h-12 w-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center absolute top-4 right-4", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start analyzing medical images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/dashboard/upload">
              <Button className="w-full justify-start bg-gradient-primary hover:opacity-90" size="lg">
                <Upload className="mr-2 h-5 w-5" />
                Upload New Scan
              </Button>
            </Link>
            <Link to="/dashboard/history">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <FileText className="mr-2 h-5 w-5" />
                View All Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest diagnostic analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">{activity.patient}</p>
                    <p className={cn(
                      "text-xs font-medium",
                      activity.result.includes("Normal") ? "text-success" : "text-destructive"
                    )}>
                      {activity.result}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-border overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 space-y-4">
            <CardHeader className="p-0">
              <CardTitle>AI-Powered Diagnostics</CardTitle>
              <CardDescription>
                Advanced machine learning for accurate disease detection
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="text-sm">Multi-modal image analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="text-sm">Real-time processing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="text-sm">98.5% accuracy rate</span>
              </div>
            </CardContent>
          </div>
          <div className="relative h-64 md:h-auto">
            <img
              src={dashboardPreview}
              alt="AI Dashboard Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Helper function for className concatenation
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default DashboardHome;