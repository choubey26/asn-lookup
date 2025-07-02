import React, { useState } from 'react';
import { Separator } from "@/components/ui/separator";
import { AppHeader } from '../components/AppHeader';
import { IPLookup } from '../components/IPLookup';
import { ASNSearch } from '../components/ASNSearch';
import { OperationsGrid } from '../components/OperationsGrid';
import { useOperations } from '../hooks/useOperations';

const Index = () => {
  const operations = useOperations();

  // State for IPLookup
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [operationStatus, setOperationStatus] = useState<{ [key: string]: 'idle' | 'success' | 'error' }>({});

  // Status icon function
  const getStatusIcon = (operationName: string) => {
    const status = operationStatus[operationName];
    if (status === "success") return <span title="Success">✅</span>;
    if (status === "error") return <span title="Error">❌</span>;
    if (loading[operationName]) return <span title="Loading">⏳</span>;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <AppHeader />

        <IPLookup
          loading={loading}
          setLoading={setLoading}
          operationStatus={operationStatus}
          setOperationStatus={setOperationStatus}
          getStatusIcon={getStatusIcon}
        />

        <Separator className="my-8 bg-slate-700" />

        <div className="mb-8">
          <ASNSearch />
        </div>

        <Separator className="my-8 bg-slate-700" />

        <OperationsGrid {...operations} />

        <div className="text-center text-slate-400 text-sm">
          <p>ASN Explorer - Network Infrastructure Analysis Tool</p>
          <p className="mt-1">Built for analyzing Indian internet infrastructure and autonomous systems</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
