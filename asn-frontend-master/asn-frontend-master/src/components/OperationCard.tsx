
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Loader2, Download } from 'lucide-react'; // <-- Add Download here
import { TableDisplay } from './TableDisplay';

interface Operation {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  color: string;
}

interface OperationCardProps {
  operation: Operation;
  loading: { [key: string]: boolean };
  parsedData: { [key: string]: any[] };
  results: { [key: string]: string };
  getStatusIcon: (operationName: string) => React.ReactNode;
  handleOperation: (endpoint: string, operationName: string) => Promise<void>;
}

export const OperationCard: React.FC<OperationCardProps> = ({
  operation,
  loading,
  parsedData,
  results,
  getStatusIcon,
  handleOperation,
}) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200 hover:scale-105 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <div className={`p-2 rounded-lg ${operation.color} mr-3 transition-all duration-200 hover:scale-110`}>
            {operation.icon}
          </div>
          <div className="flex-1">
            {operation.title}
          </div>
          {getStatusIcon(operation.title) && (
            <div className="ml-2">{getStatusIcon(operation.title)}</div>
          )}
        </CardTitle>
        <CardDescription className="text-slate-300">
          {operation.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={() => handleOperation(operation.endpoint, operation.title)}
          disabled={loading[operation.title]}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200 hover:scale-105"
        >
          {loading[operation.title] ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          {loading[operation.title] ? 'Processing...' : 'Execute'}
        </Button>
        {parsedData[operation.title] && (
          <>
            <TableDisplay 
              operationName={operation.title} 
              data={parsedData[operation.title]} 
              rawData={results[operation.title]}
            />
            <Button
              onClick={() => {
                const blob = new Blob([results[operation.title]], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${operation.title.replace(/\s+/g, "_")}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-2 w-full bg-slate-700 hover:bg-slate-600 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Result
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
