import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";   
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback } from "../components/ui/avatar";   
import { Camera, Mail, Building, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import LogoSpinner from "../components/LogoSpinner";

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    hospital_name: "",
    area: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load profile");
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
        toast({ title: "Error", description: err.message || "Failed to load profile", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  const handleInputChange = (e) => {
    setProfile(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          hospital_name: profile.hospital_name,
          area: profile.area,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update profile");
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (err) {
      console.error("Failed to update profile", err);
      toast({ title: "Error", description: err.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LogoSpinner label="Loading profile..." />
      </div>
    );
  }

  return (
  <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card className="border-border lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarFallback className="text-3xl bg-gradient-primary text-primary-foreground">
                  {profile.full_name.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-gradient-primary hover:opacity-90 shadow-medium"
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.hospital_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Dr. John Smith"
                value={profile.full_name}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospital_name">Hospital / Institution</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="hospital_name"
                  name="hospital_name"
                  placeholder="General Hospital"
                  value={profile.hospital_name}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area / Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="area"
                  name="area"
                  placeholder="New York, NY"
                  value={profile.area}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                className="bg-gradient-primary hover:opacity-90" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your MedAI Assist details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Hospital</p>
              <p className="text-lg font-semibold">{profile.hospital_name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="text-lg font-semibold">{profile.area}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;