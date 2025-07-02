import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Loader2, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export const ASNSearch = () => {
  const [asn, setAsn] = useState('');
  const [loading, setLoading] = useState(false);
  const [asnDetails, setAsnDetails] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const baseURL = 'http://localhost:8080/asn/india/asn'; // ✅ Corrected

  const handleSearch = async () => {
    if (!asn.trim()) {
      toast({
        title: "⚠️ Input Required",
        description: "Please enter an ASN number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${baseURL}/${asn.trim()}`);
      const result = await response.json();

      if (response.ok) {
        setAsnDetails(result);
        setDialogOpen(true);
        toast({
          title: "✅ Search Successful",
          description: `Fetched details for ASN ${asn}`,
        });
      } else {
        throw new Error(result?.message || 'Unknown server error');
      }
    } catch (error) {
      toast({
        title: "❌ Search Failed",
        description: `Error fetching ASN ${asn}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setAsnDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!asnDetails) return;
    const blob = new Blob([JSON.stringify(asnDetails, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASN_${asn.trim()}_details.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <div className="p-2 rounded-lg bg-cyan-500 mr-3">
              <Search className="h-5 w-5" />
            </div>
            ASN Details Lookup
          </CardTitle>
          <CardDescription className="text-slate-300">
            Enter an ASN number to fetch its WHOIS details (with download option)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asn-input" className="text-slate-300">ASN Number</Label>
            <div className="flex gap-2">
              <Input
                id="asn-input"
                type="text"
                placeholder="e.g., 45609"
                value={asn}
                onChange={(e) => setAsn(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:bg-slate-700"
                disabled={loading}
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !asn.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white hover:scale-105"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto bg-slate-900 border border-slate-700 text-white p-4">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              ASN {asn} Details
              <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 flex gap-2">
                <Download className="h-4 w-4" /> Download JSON
              </Button>
            </DialogTitle>
          </DialogHeader>

          {asnDetails && (
            <div className="mt-4 space-y-3">
              {/* ✅ Show Holder only if it has a value */}
              {asnDetails.name && asnDetails.name !== 'N/A' && (
                <div><span className="font-semibold text-cyan-400">Holder:</span> {asnDetails.name}</div>
              )}

              <div>
                <span className="font-semibold text-cyan-400">Prefixes:</span>
                {asnDetails.prefixes && asnDetails.prefixes.length > 0 ? (
                  <ul className="mt-1 list-disc list-inside text-sm text-slate-300 space-y-1">
                    {asnDetails.prefixes.map((prefixObj: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-semibold">{prefixObj.prefix}</span>
                        {prefixObj.timelines && prefixObj.timelines.length > 0 && (
                          <div className="text-xs text-slate-400 ml-4">
                            Active: {new Date(prefixObj.timelines[0].starttime).toLocaleString()} → {prefixObj.timelines[0].endtime ? new Date(prefixObj.timelines[0].endtime).toLocaleString() : 'Present'}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-400 text-sm mt-1">No prefixes found for this ASN.</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
