import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Upload, CheckCircle, FileImage } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils/cn";
import LogoSpinner from "../components/LogoSpinner";

const UploadImage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pipelineResult, setPipelineResult] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Flask backend runs on port 5001
  const flaskBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : 'http://localhost:5001'; // Update if deployed elsewhere

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
    const validTypes = ['image/jpeg', 'image/png', 'text/csv', 'application/vnd.ms-excel'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.csv'];
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid image (JPG, PNG) or CSV file for EEG analysis.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setPipelineResult(null); // Clear previous results
    toast({
      title: "File Uploaded Successfully",
      description: `${file.name} is ready for analysis.`,
    });
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      toast({
        title: "Missing Information",
        description: "Please upload a file before analyzing.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setPipelineResult(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const filename = uploadedFile.name.toLowerCase();
      const isCSV = filename.endsWith('.csv');

      // If CSV, call epilepsy endpoint directly
      if (isCSV) {
        const epilepsyRes = await fetch(`${flaskBase}/epilepsy`, {
          method: 'POST',
          body: formData,
        });
        const epilepsyData = await epilepsyRes.json();
        if (epilepsyRes.ok) {
          setPipelineResult({
            stage: 'Epilepsy Analysis',
            result: epilepsyData.result || epilepsyData.results,
          });
          toast({ title: 'Analysis Complete', description: 'Epilepsy prediction finished.' });
        } else {
          throw new Error(epilepsyData.error || 'Epilepsy analysis failed');
        }
        setIsUploading(false);
        return;
      }

      // Otherwise, run image pipeline: /predict → /classify → /subtype
      // Step 1: Modality check
      const predictRes = await fetch(`${flaskBase}/predict`, {
        method: 'POST',
        body: formData,
      });
      const predictData = await predictRes.json();
      if (!predictRes.ok) {
        throw new Error(predictData.error || 'Modality check failed');
      }
      if (predictData.prediction !== 'Our Modality') {
        setPipelineResult({
          stage: 'Modality Check',
          prediction: predictData.prediction,
          confidence: predictData.confidence,
          message: 'Image is not from our supported modality. Pipeline stopped.',
        });
        toast({ title: 'Not Our Modality', description: 'Uploaded image is not supported.', variant: 'destructive' });
        setIsUploading(false);
        return;
      }

      // Step 2: Classify (Cancer vs Neurological)
      const classifyRes = await fetch(`${flaskBase}/classify`, {
        method: 'POST',
        body: formData,
      });
      const classifyData = await classifyRes.json();
      if (!classifyRes.ok) {
        throw new Error(classifyData.error || 'Classification failed');
      }

      // Step 3: Subtype classification
      const subtypeRes = await fetch(`${flaskBase}/subtype`, {
        method: 'POST',
        body: formData,
      });
      const subtypeData = await subtypeRes.json();
      if (!subtypeRes.ok) {
        throw new Error(subtypeData.error || 'Subtype classification failed');
      }

      // Step 4: Final diagnosis using disease-specific model
      const diagnosisFormData = new FormData();
      diagnosisFormData.append('file', uploadedFile);
      diagnosisFormData.append('subtype', subtypeData.subtype_prediction);
      
      const diagnosisRes = await fetch(`${flaskBase}/diagnose`, {
        method: 'POST',
        body: diagnosisFormData,
      });
      const diagnosisData = await diagnosisRes.json();
      if (!diagnosisRes.ok) {
        throw new Error(diagnosisData.error || 'Final diagnosis failed');
      }

      // All 4 pipelines succeeded
      setPipelineResult({
        stage: 'Complete Pipeline (4 stages)',
        modality: predictData.prediction,
        modalityConfidence: predictData.confidence,
        classification: classifyData.class_label,
        classificationConfidence: classifyData.confidence,
        subtype: subtypeData.subtype_prediction,
        subtypeConfidence: subtypeData.subtype_confidence,
        diagnosis: diagnosisData.diagnosis,
        diagnosisConfidence: diagnosisData.diagnosis_confidence,
      });
      toast({ title: 'Analysis Complete', description: 'All 4 pipeline stages finished successfully.' });

    } catch (error) {
      console.error('Pipeline error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred during analysis',
        variant: 'destructive',
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
          Upload images (JPG, PNG) or EEG CSV files for AI-powered analysis through our multi-stage pipeline.
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
                accept=".jpg,.jpeg,.png,.csv,image/jpeg,image/png,text/csv"
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
                        Supported formats: JPG, PNG, CSV (for EEG)
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
                    {uploadedFile.type || "Unknown"}
                  </p>
                </div>
                <Button
                  className="w-full bg-gradient-primary"
                  onClick={handleAnalyze}
                  disabled={isUploading || !uploadedFile}
                >
                  {isUploading ? (
                    <LogoSpinner
                      inline
                      size={20}
                      ringWidth={3}
                      label="Analyzing..."
                      className="mx-auto"
                      labelClassName="text-white font-semibold"
                    />
                  ) : (
                    'Analyze Image'
                  )}
                </Button>
                {pipelineResult && (
                  <div className="p-4 bg-info/10 border border-info/20 rounded-xl space-y-2">
                    <p className="text-sm font-semibold text-info">Pipeline Results:</p>
                    {pipelineResult.stage && (
                      <p className="text-xs text-info/90">Stage: {pipelineResult.stage}</p>
                    )}
                    {pipelineResult.modality && (
                      <p className="text-xs text-info/90">
                        Modality: {pipelineResult.modality} 
                        {pipelineResult.modalityConfidence != null && ` (${(pipelineResult.modalityConfidence * 100).toFixed(1)}%)`}
                      </p>
                    )}
                    {pipelineResult.classification && (
                      <p className="text-xs text-info/90">
                        Classification: {pipelineResult.classification} ({pipelineResult.classificationConfidence?.toFixed(1)}%)
                      </p>
                    )}
                    {pipelineResult.subtype && (
                      <p className="text-xs text-info/90">
                        Subtype: {pipelineResult.subtype} ({pipelineResult.subtypeConfidence?.toFixed(1)}%)
                      </p>
                    )}
                    {pipelineResult.diagnosis && (
                      <p className="text-xs font-semibold text-info">
                        Final Diagnosis: {pipelineResult.diagnosis} ({pipelineResult.diagnosisConfidence?.toFixed(1)}%)
                      </p>
                    )}
                    {pipelineResult.result && (
                      <p className="text-xs text-info/90">
                        Result: {JSON.stringify(pipelineResult.result)}
                      </p>
                    )}
                    {pipelineResult.message && (
                      <p className="text-xs text-info/80 italic">{pipelineResult.message}</p>
                    )}
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