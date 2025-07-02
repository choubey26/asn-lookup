import React, { useState } from 'react';
import { Globe, Database, Activity, Download, FileText, Zap } from 'lucide-react';
import { OperationCard } from './OperationCard';

interface Operation {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  color: string;
}

interface OperationsGridProps {
  loading: { [key: string]: boolean };
  parsedData: { [key: string]: any[] };
  results: { [key: string]: string };
  getStatusIcon: (operationName: string) => React.ReactNode;
  handleOperation: (endpoint: string, operationName: string) => Promise<void>;
}

export const OperationsGrid: React.FC<OperationsGridProps> = ({
  loading: externalLoading,
  parsedData: externalParsedData,
  results: externalResults,
  getStatusIcon,
  handleOperation: externalHandleOperation,
}) => {
  // Local state for loading, parsedData, and results
  const [loading, setLoading] = useState<{ [key: string]: boolean }>(externalLoading || {});
  const [parsedData, setParsedData] = useState<{ [key: string]: any[] }>(externalParsedData || {});
  const [results, setResults] = useState<{ [key: string]: string }>(externalResults || {});

  // Modified handleOperation with auto-download
  const handleOperation = async (endpoint: string, operationName: string) => {
    setLoading(prev => ({ ...prev, [operationName]: true }));

    try {
      const res = await fetch(`http://localhost:8080/asn/india${endpoint}`);
      let data: string;

      // Handle JSON or text response for /scraping and /scrap endpoints
      if (endpoint === '/scraping' || endpoint === '/scrap'|| endpoint === '/ip_fetch') {
        const json = await res.json();
        if (Array.isArray(json)) {
          // If array of objects, try to stringify each row, else join as string
          if (json.length > 0 && typeof json[0] === 'object') {
            data = json.map(row =>
              typeof row === 'object' ? JSON.stringify(row) : String(row)
            ).join('\n');
          } else {
            data = json.join('\n');
          }
        } else if (typeof json === 'object') {
          data = JSON.stringify(json, null, 2);
        } else {
          data = String(json);
        }
      } else {
        data = await res.text();
      }

      console.log("Fetched raw data:", data);
      const parsed = data.trim().split('\n');
      console.log("Parsed lines:", parsed);

      setResults(prev => ({ ...prev, [operationName]: data }));
      setParsedData(prev => ({ ...prev, [operationName]: parsed }));

      // Auto download for all relevant operations
      if (
        operationName === "Fetch All Indian ASNs" ||
        operationName === "CAIDA ASN Data" ||
        operationName === "Compare ASN Sources" ||
        operationName === "Scrape ASN Data" ||
        operationName === "Process ASN File" ||
        operationName === "Extract IP Data"
      ) {
        // Use charset=utf-8 for Extract IP Data, otherwise default to text/plain
        const blob =
          operationName === "Extract IP Data"
            ? new Blob([data], { type: 'text/plain;charset=utf-8' })
            : new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${operationName.replace(/\s+/g, "_")}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }

    } catch (err: any) {
      console.error("Fetch error:", err.message);
      setResults(prev => ({ ...prev, [operationName]: err.message }));
      setParsedData(prev => ({ ...prev, [operationName]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, [operationName]: false }));
    }
  };

  const operations: Operation[] = [
    {
      id: 'all-asns',
      title: 'Fetch All Indian ASNs',
      description: 'Retrieve and filter all Autonomous System Numbers registered in India',
      icon: <Globe className="h-5 w-5" />,
      endpoint: '/all',
      color: 'bg-blue-500',
    },
    {
      id: 'caida-asns',
      title: 'CAIDA ASN Data',
      description: 'Fetch Indian ASN data from CAIDA (Center for Applied Internet Data Analysis)',
      icon: <Database className="h-5 w-5" />,
      endpoint: '/caida',
      color: 'bg-green-500',
    },
    {
      id: 'asn-difference',
      title: 'Compare ASN Sources',
      description: 'Find differences between various ASN data sources',
      icon: <Activity className="h-5 w-5" />,
      endpoint: '/difference',
      color: 'bg-yellow-500',
    },
    {
      id: 'scrape-data',
      title: 'Scrape ASN Data',
      description: 'Scrape and collect ASN data from external sources',
      icon: <Download className="h-5 w-5" />,
      endpoint: '/scrap',
      color: 'bg-purple-500',
    },
    {
      id: 'process-asns',
      title: 'Process ASN File',
      description: 'Process ASNs from uploaded file data',
      icon: <FileText className="h-5 w-5" />,
      endpoint: '/scraping',
      color: 'bg-orange-500',
    },
    {
      id: 'extract-ips',
      title: 'Extract IP Data',
      description: 'Extract ASN and IP information from CSV files',
      icon: <Zap className="h-5 w-5" />,
      endpoint: '/ip_fetch',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {operations.map((operation) => (
        <OperationCard
          key={operation.id}
          operation={operation}
          loading={loading}
          parsedData={parsedData}
          results={results}
          getStatusIcon={getStatusIcon}
          handleOperation={handleOperation}
        />
      ))}
    </div>
  );
};
