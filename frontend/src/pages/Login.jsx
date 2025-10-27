import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Brain, User, Mail, Lock, Building, MapPin, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    hospitalName: "",
    area: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, register, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLoginChange = (e) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegisterChange = (e) => {
    setRegisterData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please enter both email and password', 
        variant: 'destructive' 
      });
      return;
    }

    const result = await login(loginData.email, loginData.password);
    
    if (result.success) {
      setLoginData({ email: '', password: '' });
      navigate('/dashboard');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation
    if (!registerData.fullName || !registerData.email || !registerData.password || 
        !registerData.hospitalName || !registerData.area) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all required fields', 
        variant: 'destructive' 
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({ 
        title: 'Password Mismatch', 
        description: 'Passwords do not match', 
        variant: 'destructive' 
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({ 
        title: 'Password Too Short', 
        description: 'Password must be at least 6 characters long', 
        variant: 'destructive' 
      });
      return;
    }

    const result = await register({
      fullName: registerData.fullName,
      email: registerData.email,
      password: registerData.password,
      hospitalName: registerData.hospitalName,
      area: registerData.area,
    });

    if (result.success) {
      setRegisterData({
        fullName: '',
        email: registerData.email,
        password: '',
        confirmPassword: '',
        hospitalName: '',
        area: '',
      });
      toast({
        title: 'Registration Successful',
        description: 'Please switch to the Login tab to sign in',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-6 py-12 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Back to Home Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Button>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent font-display">
              MedAI Assist
            </h1>
          </div>
          <p className="text-gray-600 text-sm">
            Advanced AI-powered medical diagnostics platform
          </p>
        </div>

        {/* Login/Register Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                <TabsTrigger value="login" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <User className="h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <User className="h-4 w-4" />
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="flex items-center gap-2 text-sm font-medium font-body">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        required
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="flex items-center gap-2 text-sm font-medium font-body">
                        <Lock className="h-4 w-4" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          required
                          className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 font-body"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="flex items-center gap-2 text-sm font-medium font-body">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="register-name"
                        name="fullName"
                        type="text"
                        placeholder="Dr. John Smith"
                        value={registerData.fullName}
                        onChange={handleRegisterChange}
                        required
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="flex items-center gap-2 text-sm font-medium font-body">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        required
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="flex items-center gap-2 text-sm font-medium font-body">
                          <Lock className="h-4 w-4" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="register-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 6 characters"
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            required
                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-confirm" className="flex items-center gap-2 text-sm font-medium font-body">
                          <Lock className="h-4 w-4" />
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="register-confirm"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={registerData.confirmPassword}
                            onChange={handleRegisterChange}
                            required
                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-hospital" className="flex items-center gap-2 text-sm font-medium font-body">
                        <Building className="h-4 w-4" />
                        Hospital Name
                      </Label>
                      <Input
                        id="register-hospital"
                        name="hospitalName"
                        type="text"
                        placeholder="General Hospital"
                        value={registerData.hospitalName}
                        onChange={handleRegisterChange}
                        required
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-area" className="flex items-center gap-2 text-sm font-medium font-body">
                        <MapPin className="h-4 w-4" />
                        Area/Location
                      </Label>
                      <Input
                        id="register-area"
                        name="area"
                        type="text"
                        placeholder="New York, NY"
                        value={registerData.area}
                        onChange={handleRegisterChange}
                        required
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 font-body"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                By using MedAI Assist, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:underline">terms of service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:underline">privacy policy</a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
