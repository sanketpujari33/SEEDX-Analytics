/**
 * CSV Loader Component
 * 
 * Handles file input with drag-and-drop support, displays parsing progress,
 * and shows errors/summary on completion.
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parseCSVFile, validateCSVFile } from '../services/csvParser';
import { useLoadTradeData, useSetLastLoadedFile } from '../store';
import type { ParseSummary, ParseError } from '../types';

export const CSVLoader: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ParseSummary | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const loadTradeData = useLoadTradeData();
  const setLastLoadedFile = useSetLastLoadedFile();

  const handleFile = useCallback(async (file: File) => {
    setValidationError(null);
    setErrors([]);
    setSummary(null);

    // Validate file
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      setValidationError(validation.error!);
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      console.log('Starting CSV parse for file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      const result = await parseCSVFile(file, {
        useWorker: false, // Worker mode can cause issues with large files
        chunkSize: 10000, // Process in larger chunks for better performance
        onProgress: (p) => {
          console.log('Parse progress:', p.percentage.toFixed(1), '%', 'Records:', p.recordsParsed);
          setProgress(p.percentage);
        },
      });
      
      console.log('%c[CSV] Parse complete!', 'color: blue; font-weight: bold', 'Valid:', result.records.length, 'Errors:', result.errors.length);
      console.log('[CSV] First record sample:', result.records[0]);

      setSummary(result.summary);
      setErrors(result.errors.slice(0, 10)); // Show first 10 errors

      if (result.records.length > 0) {
        console.log('%c[CSV] Loading records into store...', 'color: blue; font-weight: bold', result.records.length, 'records');
        loadTradeData(result.records);
        setLastLoadedFile(file.name);
      } else {
        setValidationError('No valid records found in CSV file');
      }
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [loadTradeData, setLastLoadedFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearSummary = () => {
    setSummary(null);
    setErrors([]);
    setValidationError(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* File Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop your CSV file here or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supports CSV files of any size
        </p>
      </div>

      {/* Loading Progress */}
      {isLoading && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Parsing CSV...</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-1">Validation Error</h3>
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
          <button onClick={clearSummary} className="text-red-400 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Parse Summary */}
      {summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <h3 className="text-sm font-medium text-gray-900">Parse Complete</h3>
            </div>
            <button onClick={clearSummary} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">File Name</p>
              <p className="text-sm font-medium text-gray-900">{summary.fileName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Parse Time</p>
              <p className="text-sm font-medium text-gray-900">{(summary.parseTime / 1000).toFixed(2)}s</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Records</p>
              <p className="text-sm font-medium text-gray-900">{summary.totalRecords.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Valid Records</p>
              <p className="text-sm font-medium text-green-600">{summary.validRecords.toLocaleString()}</p>
            </div>
            {summary.invalidRecords > 0 && (
              <div>
                <p className="text-xs text-gray-500">Invalid Records</p>
                <p className="text-sm font-medium text-red-600">{summary.invalidRecords.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                First {errors.length} Error{errors.length > 1 ? 's' : ''}:
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {errors.map((error, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    <span className="font-medium">Row {error.row}:</span> {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
