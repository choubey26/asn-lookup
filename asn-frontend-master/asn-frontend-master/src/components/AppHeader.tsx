
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Network, MapPin } from 'lucide-react';

export const AppHeader = () => {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center mb-4">
        <Network className="h-12 w-12 text-blue-400 mr-4 animate-pulse" />
        <h1 className="text-4xl font-bold text-white">India ASN Explorer</h1>
      </div>
      <p className="text-xl text-slate-300 max-w-2xl mx-auto">
        Comprehensive tool for exploring and analyzing Indian Autonomous System Numbers and network infrastructure data
      </p>
      <Badge variant="secondary" className="mt-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
        <MapPin className="h-3 w-3 mr-1" />
        Focused on Indian Internet Infrastructure
      </Badge>
    </div>
  );
};
