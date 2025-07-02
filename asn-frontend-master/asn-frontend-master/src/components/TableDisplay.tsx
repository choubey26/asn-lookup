import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Copy, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface TableDisplayProps {
  operationName: string;
  data: string[];
  rawData: string;
}

type Category = 'received' | 'rewritten' | 'blocked' | 'unknown' | 'no_data';

export const TableDisplay: React.FC<TableDisplayProps> = ({ operationName, data, rawData }) => {
  const [copied, setCopied] = useState<{ [key in Category]?: boolean }>({});
  const { toast } = useToast();

  const categorized: Record<Category, string[]> = useMemo(() => {
    const result: Record<Category, string[]> = {
      received: [],
      rewritten: [],
      blocked: [],
      unknown: [],
      no_data: [],
    };

    data.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('received')) result.received.push(line);
      else if (lower.includes('rewritten')) result.rewritten.push(line);
      else if (lower.includes('blocked')) result.blocked.push(line);
      else if (lower.includes('unknown')) result.unknown.push(line);
      else result.no_data.push(line);
    });

    return result;
  }, [data]);

  const handleDownload = (lines: string[], category?: Category) => {
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = category
      ? `${operationName.replace(/\s+/g, '_')}_${category}_${new Date().toISOString().split('T')[0]}.txt`
      : `${operationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "📥 Download Started",
      description: category ? `Downloaded ${category} data.` : "Downloaded data.",
    });
  };

  const handleCopy = async (lines: string[], category?: Category) => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      if (category) {
        setCopied(prev => ({ ...prev, [category]: true }));
      }
      toast({
        title: "📋 Copied!",
        description: category ? `${category} data copied to clipboard` : "Data copied to clipboard",
      });
      setTimeout(() => {
        if (category) setCopied(prev => ({ ...prev, [category]: false }));
      }, 2000);
    } catch {
      toast({
        title: "❌ Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!data || data.length === 0 || !rawData) {
    return (
      <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600 text-slate-300">
        No data available for this operation.
      </div>
    );
  }

  // Show categorized view only for "Process ASN File"
  if (operationName === "Process ASN File") {
    return (
      <div className="mt-4 space-y-6">
        {(Object.keys(categorized) as Category[]).map(category => (
          <div key={category} className="p-4 border border-slate-600 rounded-lg bg-slate-800/60">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-slate-200 font-semibold capitalize">
                {category} ({categorized[category].length})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(categorized[category], category)}
                  className="text-slate-400 hover:text-green-400"
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(categorized[category], category)}
                  className="text-slate-400 hover:text-white"
                >
                  {copied[category] ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto text-sm text-slate-300">
              {categorized[category].length > 0 ? (
                <pre className="whitespace-pre-wrap">{categorized[category].join('\n')}</pre>
              ) : (
                <div className="text-slate-400 italic">No entries in this category.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: show all data as plain text
  return (
    <div className="mt-4 p-4 bg-slate-900 rounded-lg text-white max-h-60 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold mb-2 text-white">{operationName} Result</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(data)}
            className="text-slate-400 hover:text-green-400"
          >
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(data)}
            className="text-slate-400 hover:text-white"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <pre className="text-sm whitespace-pre-wrap">{rawData}</pre>
    </div>
  );
};
