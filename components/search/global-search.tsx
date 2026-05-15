'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { searchClientsAndTickets } from '@/app/actions/search';
import { useDebounce } from '@/hooks/use-debounce';

export interface SearchResult {
  result_type: 'client' | 'ticket';
  id: string;
  display_name: string;
  secondary_info: string;
  ticket_stage?: string;
  assigned_employee?: string;
}

interface GlobalSearchProps {
  userRole: string;
}

export function GlobalSearch({ userRole }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    searchClientsAndTickets(debouncedQuery, userRole)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, userRole]);

  const handleSelectResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    
    if (result.result_type === 'client') {
      router.push(`/${userRole === 'admin' ? 'admin' : 'employee'}/clients/${result.id}`);
    } else {
      router.push(`/${userRole === 'admin' ? 'admin' : 'employee'}/tickets/${result.id}`);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search clients and tickets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10 pr-10 bg-background/60 border-border/60 focus:bg-background focus:border-border"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            results.map((result) => (
              <button
                key={`${result.result_type}-${result.id}`}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                onClick={() => handleSelectResult(result)}
              >
                {result.result_type === 'client' ? (
                  <User className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-green-500 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{result.display_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {result.secondary_info}
                  </div>
                </div>
              </button>
            ))
          ) : !isLoading ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}