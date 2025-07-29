"use client";

import React, { useState, useCallback, useRef } from "react";
import { ccc, useCcc } from "@ckb-ccc/connector-react";
import { createSpore } from "@ckb-ccc/spore";
import { useNotification } from "../../contexts/notification";

interface FileUpload {
  file: File;
  preview: string;
  size: number;
}

interface MintFormData {
  contentType: string;
  content: string;
  clusterId?: string;
  name?: string;
  description?: string;
}

const CONTENT_TYPES = [
  { value: "image/jpeg", label: "JPEG Image" },
  { value: "image/png", label: "PNG Image" },
  { value: "image/gif", label: "GIF Image" },
  { value: "image/webp", label: "WebP Image" },
  { value: "text/plain", label: "Plain Text" },
  { value: "application/json", label: "JSON Data" },
  { value: "application/pdf", label: "PDF Document" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DOBMint() {
  const { signerInfo } = useCcc();
  const { success, error, warning } = useNotification();
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileUpload | null>(null);
  const [formData, setFormData] = useState<MintFormData>({
    contentType: "image/jpeg",
    content: "",
    name: "",
    description: "",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      error("File too large", `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // Validate file type
    const isValidType = CONTENT_TYPES.some(type => type.value === file.type);
    if (!isValidType) {
      error("Invalid file type", "Please select a supported file type");
      return;
    }

    // Create preview for images
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setUploadedFile({
        file,
        preview,
        size: file.size,
      });
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        contentType: file.type,
        name: file.name,
      }));
    };
    reader.readAsDataURL(file);
  }, [error]);

  const handleTextContentChange = useCallback((text: string) => {
    setFormData(prev => ({
      ...prev,
      content: text,
    }));
  }, []);

  const handleFormChange = useCallback((field: keyof MintFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const convertFileToHex = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          const hex = ccc.hexFrom(uint8Array);
          resolve(hex);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const convertTextToHex = useCallback((text: string): string => {
    return ccc.hexFrom(new TextEncoder().encode(text));
  }, []);

  const handleMint = useCallback(async () => {
    if (!signerInfo?.signer) {
      return error("No signer available", "Please connect your wallet first");
    }

    if (!uploadedFile && !formData.content) {
      return error("No content provided", "Please upload a file or enter text content");
    }

    setIsLoading(true);

    try {
      let contentHex: string;
      let contentType: string;

      if (uploadedFile) {
        // Handle file upload
        contentHex = await convertFileToHex(uploadedFile.file);
        contentType = uploadedFile.file.type;
      } else {
        // Handle text content
        contentHex = convertTextToHex(formData.content);
        contentType = formData.contentType;
      }

      // Prepare spore data
      const sporeData = {
        contentType,
        content: contentHex,
        clusterId: formData.clusterId || undefined,
        name: formData.name || undefined,
        description: formData.description || undefined,
      };

      // Create spore
      const { tx, id } = await createSpore({
        signer: signerInfo.signer,
        data: sporeData,
      });

      // Complete and sign transaction
      await tx.completeFeeBy(signerInfo.signer, 1000);
      const txHash =await signerInfo.signer.sendTransaction(tx);

      success(
        "DOB Created Successfully!",
        `Your Digital Object has been minted with ID: ${id},
         tx hash: ${txHash}
	`,
        10000
      );

      // Reset form
      setUploadedFile(null);
      setFormData({
        contentType: "image/jpeg",
        content: "",
        name: "",
        description: "",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create DOB";
      error("Minting Failed", errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [signerInfo?.signer, uploadedFile, formData, convertFileToHex, convertTextToHex, success, error]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Create a mock event object for the file upload handler
      const mockEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(mockEvent);
    }
  }, [handleFileUpload]);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  if (!signerInfo?.signer) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Wallet Not Connected
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-300">
            Please connect your wallet to mint Digital Objects.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Mint Digital Object
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Create a new Digital Object on the CKB network using the Spore protocol
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        {/* Content Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Content Type
          </label>
          <select
            value={formData.contentType}
            onChange={(e) => handleFormChange("contentType", e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {CONTENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Upload File
          </label>
          
          {!uploadedFile ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors cursor-pointer"
            >
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-500">
                  Max file size: {MAX_FILE_SIZE / (1024 * 1024)}MB
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={CONTENT_TYPES.map(t => t.value).join(",")}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {uploadedFile.file.type.startsWith("image/") && (
                    <img
                      src={uploadedFile.preview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {uploadedFile.file.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Text Content Section (when no file uploaded) */}
        {!uploadedFile && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Text Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleTextContentChange(e.target.value)}
              placeholder="Enter your text content here..."
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Name (Optional)
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => handleFormChange("name", e.target.value)}
              placeholder="Enter a name for your DOB"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Cluster ID (Optional)
            </label>
            <input
              type="text"
              value={formData.clusterId || ""}
              onChange={(e) => handleFormChange("clusterId", e.target.value)}
              placeholder="Enter cluster ID"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formData.description || ""}
            onChange={(e) => handleFormChange("description", e.target.value)}
            placeholder="Enter a description for your DOB"
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={isLoading || (!uploadedFile && !formData.content)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 dark:disabled:bg-neutral-600 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>Creating DOB...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Mint Digital Object</span>
            </>
          )}
        </button>

        {/* Info Section */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-1">What is a Digital Object?</div>
            <div className="text-xs">
              A Digital Object (DOB) is a unique, immutable piece of content stored on the CKB network using the Spore protocol. 
              Once minted, it becomes permanently linked to your wallet and can be transferred or used in other applications.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
