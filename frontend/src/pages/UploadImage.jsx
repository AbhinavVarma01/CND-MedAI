import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Upload, CheckCircle, XCircle, FileImage } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils/cn";
import LogoSpinner from "../components/LogoSpinner";

const UploadImage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageType, setImageType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Resolve API base URL
  const apiBase = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim())
    ? process.env.REACT_APP_API_URL.trim()
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : '';

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/dicom', 'application/dicom'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.dcm', '.dicom'];
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid medical image file (JPG, PNG, DICOM).",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    toast({
      title: "File Uploaded Successfully",
      description: `${file.name} is ready for analysis.`,
    });
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !imageType) {
      toast({
        title: "Missing Information",
        description: "Please select an image type before analyzing.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileData = await convertFileToBase64(uploadedFile);
      
      const response = await fetch(`${apiBase}/api/analysis/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          fileName: uploadedFile.name,
          fileData,
          fileType: uploadedFile.type,
          imageType,
          fileSize: uploadedFile.size,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisId(data.analysisId);
        toast({
          title: "Analysis Started",
          description: "Your medical image is being analyzed by our AI models...",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: data.message || "Failed to upload image for analysis",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
  <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload Medical Image</h1>
        <p className="text-muted-foreground">
          Upload CT scans, MRI images, EEG signals, or histopathology images for AI analysis.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Select Image</CardTitle>
            <CardDescription>Drag and drop or click to upload</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".jpg,.jpeg,.png,.dcm,.dicom,image/jpeg,image/png,application/dicom"
                onChange={handleFileInput}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer space-y-4 block"
              >
                {uploadedFile ? (
                  <>
                    <CheckCircle className="h-12 w-12 mx-auto text-success" />
                    <div>
                      <p className="text-sm font-medium">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: JPG, PNG, DICOM
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* File Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Image Information</CardTitle>
            <CardDescription>Details about the uploaded file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadedFile ? (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-medium">File Name</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFile.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">File Size</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">File Type</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFile.type || "DICOM Image"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Image Type</p>
                  <Select value={imageType} onValueChange={setImageType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select image type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CT Scan">CT Scan</SelectItem>
                      <SelectItem value="MRI">MRI</SelectItem>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="Histopathology">Histopathology</SelectItem>
                      <SelectItem value="EEG">EEG</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-gradient-primary"
                  onClick={handleAnalyze}
                  disabled={isUploading || !imageType}
                >
                  {isUploading ? (
                    <LogoSpinner
                      inline
                      size={20}
                      ringWidth={3}
                      label="Uploading..."
                      className="mx-auto"
                      labelClassName="text-white font-semibold"
                    />
                  ) : (
                    'Analyze Image'
                  )}
                </Button>
                {analysisId && (
                  <div className="p-3 bg-success/10 border border-success/20 rounded-xl">
                    <p className="text-sm text-success font-medium">
                      Analysis ID: {analysisId}
                    </p>
                    <p className="text-xs text-success/80">
                      Check your history for results
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileImage className="h-12 w-12 mx-auto mb-4" />
                <p>No image uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadImage;