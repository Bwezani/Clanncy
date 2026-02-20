
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/order/${product.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 border-none bg-[#fdfaf3] dark:bg-[#1e1b18] dark:ring-1 dark:ring-white/5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-row items-center gap-4 sm:gap-8">
            <div className="relative w-24 h-24 sm:w-40 sm:h-40 shrink-0 overflow-hidden rounded-xl bg-white/50 dark:bg-white/5">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 96px, 160px"
                data-ai-hint={product.name.toLowerCase()}
              />
            </div>
            <div className="flex-1 text-left space-y-1 sm:space-y-3">
              <h3 className="text-xl sm:text-3xl font-bold font-headline text-[#4a2c1a] dark:text-[#fdfaf3] tracking-tight">
                {product.name}
              </h3>
              <p className="text-sm sm:text-xl text-muted-foreground leading-tight sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                {product.description}
              </p>
              <div className="flex items-center gap-2 pt-1 sm:pt-2 text-[#c46a28] dark:text-[#e68a4d] font-bold text-sm sm:text-lg">
                Order Now
                <ArrowRight className="h-4 w-4 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
