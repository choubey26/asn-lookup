
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const useOperations = () => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [results, setResults] = useState<{ [key: string]: string }>({});
  const [parsedData, setParsedData] = useState<{ [key: string]: any[] }>({});
  const [operationStatus, setOperationStatus] = useState<{ [key: string]: 'idle' | 'success' | 'error' }>({});
  const { toast } = useToast();

  const baseURL = 'http://localhost:8080/asn/india';

  const parseDataForTable = (data: string, operationName: string) => {
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) return [];

    if (lines[0].includes(',')) {
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      return rows;
    }
    
    return lines.map((line, index) => ({
      'Line': index + 1,
      'Data': line.trim()
    }));
  };

  const handleOperation = async (endpoint: string, operationName: string) => {
    setLoading(prev => ({ ...prev, [operationName]: true }));
    setOperationStatus(prev => ({ ...prev, [operationName]: 'idle' }));
    
    try {
      const response = await fetch(`${baseURL}${endpoint}`);
      const result = await response.text();
      
      if (response.ok) {
        setResults(prev => ({ ...prev, [operationName]: result }));
        const parsed = parseDataForTable(result, operationName);
        setParsedData(prev => ({ ...prev, [operationName]: parsed }));
        setOperationStatus(prev => ({ ...prev, [operationName]: 'success' }));
        toast({
          title: "✅ Operation Successful",
          description: `${operationName} completed successfully`,
        });
      } else {
        throw new Error(result);
      }
    } catch (error) {
      setOperationStatus(prev => ({ ...prev, [operationName]: 'error' }));
      toast({
        title: "❌ Operation Failed",
        description: `Error in ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [operationName]: false }));
    }
  };

  const getStatusIcon = (operationName: string) => {
    const status = operationStatus[operationName];
    if (loading[operationName]) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  return {
    loading,
    setLoading,
    results,
    setResults,
    parsedData,
    setParsedData,
    operationStatus,
    setOperationStatus,
    handleOperation,
    getStatusIcon,
    parseDataForTable,
  };
};
