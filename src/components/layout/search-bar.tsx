"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const placeholderMap: { [key: string]: string } = {
    '/dashboard/invoices': 'Rechercher par client ou ID...',
    '/dashboard/clients': 'Rechercher par nom ou email...',
    '/dashboard/accounting': 'Rechercher par description...',
    '/dashboard/purchase-orders': 'Rechercher par client ou ID...',
    '/dashboard/delivery-notes': 'Rechercher par client ou ID...',
};


export function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const placeholder = Object.keys(placeholderMap).find(key => pathname.startsWith(key));
  const placeholderText = placeholder ? placeholderMap[placeholder] : "Rechercher...";


  return (
    <div className="w-full">
      <form className="ml-auto flex-1 sm:flex-initial">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholderText}
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get('q')?.toString()}
          />
        </div>
      </form>
    </div>
  );
}
