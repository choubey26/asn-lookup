import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Download, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface IPLookupProps {
  loading: { [key: string]: boolean };
  setLoading: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  operationStatus: { [key: string]: 'idle' | 'success' | 'error' };
  setOperationStatus: React.Dispatch<React.SetStateAction<{ [key: string]: 'idle' | 'success' | 'error' }>>;
  getStatusIcon: (operationName: string) => React.ReactNode;
}

export const IPLookup: React.FC<IPLookupProps> = ({
  loading,
  setLoading,
  operationStatus,
  setOperationStatus,
  getStatusIcon,
}) => {
  const [ipAddress, setIpAddress] = useState('');
  const [ipDetails, setIpDetails] = useState<any | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const { toast } = useToast();
  const baseURL = 'http://localhost:8080/asn/india';

  const handleIpLookup = async () => {
    if (!ipAddress.trim()) {
      toast({
        title: "⚠️ Invalid Input",
        description: "Please enter a valid IP address",
        variant: "destructive",
      });
      return;
    }

    setLoading(prev => ({ ...prev, 'ip-lookup': true }));
    setOperationStatus(prev => ({ ...prev, 'ip-lookup': 'idle' }));

    try {
      const response = await fetch(`${baseURL}/${encodeURIComponent(ipAddress.trim())}`);
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();

      setIpDetails(result);
      setShowPopup(true);
      setOperationStatus(prev => ({ ...prev, 'ip-lookup': 'success' }));

      toast({
        title: "✅ IP Lookup Successful",
        description: `Details retrieved for ${ipAddress}`,
      });
    } catch (error) {
      setOperationStatus(prev => ({ ...prev, 'ip-lookup': 'error' }));
      toast({
        title: "❌ IP Lookup Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, 'ip-lookup': false }));
    }
  };

  const handleDownloadJSON = () => {
    if (!ipDetails) return;
    const jsonBlob = new Blob([JSON.stringify(ipDetails, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${ipDetails.ip || 'ip-details'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPopup(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <Card className="mb-8 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Search className="h-5 w-5 mr-2 text-blue-400" />
            IP Address Lookup
            {getStatusIcon('ip-lookup') && <div className="ml-2">{getStatusIcon('ip-lookup')}</div>}
          </CardTitle>
          <CardDescription className="text-slate-300">Get detailed WHOIS information for any IP address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter IP address (e.g., 8.8.8.8)"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleIpLookup()}
            />
            <Button
              onClick={handleIpLookup}
              disabled={loading['ip-lookup']}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading['ip-lookup'] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              {loading['ip-lookup'] ? 'Looking up...' : 'Lookup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPopup && ipDetails && (
        <Popup details={ipDetails} onClose={() => setShowPopup(false)} onDownload={handleDownloadJSON} />
      )}
    </>
  );
};

interface PopupProps {
  details: any;
  onClose: () => void;
  onDownload: () => void;
}

const Popup: React.FC<PopupProps> = ({ details, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-2">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 text-slate-900 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-black focus:outline-none focus:ring"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-semibold mb-2">IP Lookup Details</h2>
        <div className="text-sm max-h-[400px] overflow-auto leading-relaxed space-y-1">
          {renderField("IP", details.ip)}
          {renderField("Type", details.type)}
          {renderField("Continent", `${details.continent} (${details.continent_code})`)}
          {renderField("Country", `${details.country} (${details.country_code})`)}
          {renderField("Region", details.region)}
          {renderField("City", details.city)}
          {renderField("ASN", details.asn)}
          {renderField("Organization", details.org)}
          {renderField("ISP", details.isp)}
          {renderField("Timezone", `${details.timezone} (${details.timezone_name})`)}
          {renderField("Currency", `${details.currency} (${details.currency_symbol})`)}
          {renderField("Latitude", details.latitude)}
          {renderField("Longitude", details.longitude)}
          {details.country_flag && (
            <div className="flex items-center gap-2">
              <strong>Flag:</strong> <img src={details.country_flag} alt="Flag" className="h-4 inline" />
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onDownload} className="bg-green-600 hover:bg-green-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Download JSON
          </Button>
          <Button onClick={onClose} className="bg-gray-300 text-slate-800 hover:bg-gray-400">Close</Button>
        </div>
      </div>
    </div>
  );
};

const renderField = (label: string, value: any) => (
  <p><strong>{label}:</strong> {value !== null && value !== undefined && value !== '' ? value : <span className="text-gray-500 italic">N/A</span>}</p>
);
